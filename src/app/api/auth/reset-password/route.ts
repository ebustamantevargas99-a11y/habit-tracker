import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { sendEmail, securityAlertEmail } from "@/lib/email";
import { logSecurityEvent, getClientIp } from "@/lib/security-log";
import { logger } from "@/lib/logger";
import { z } from "zod";

const BCRYPT_ROUNDS = 13;

const schema = z.object({
  token: z.string().min(10).max(100),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(100)
    .regex(/[a-z]/, "Debe incluir minúscula")
    .regex(/[A-Z]/, "Debe incluir mayúscula")
    .regex(/[0-9]/, "Debe incluir número"),
});

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, rateLimits.passwordReset);
  if (limited) return limited;

  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  const { token, password } = parsed.data;

  const result = await consumePasswordResetToken(token);
  if ("error" in result) {
    await logSecurityEvent({
      eventType: "suspicious_activity",
      request: req,
      metadata: { context: "reset-password", error: result.error },
    });
    const messages: Record<string, string> = {
      invalid: "Token inválido",
      expired: "El enlace ha caducado. Solicita uno nuevo.",
      used: "Este enlace ya fue usado. Solicita uno nuevo.",
    };
    return NextResponse.json(
      { error: messages[result.error] ?? "Error de token" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date();

    // Marcar passwordChangedAt e invalidar fallos previos
    const user = await prisma.user.update({
      where: { id: result.userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true, email: true, name: true },
    });

    // Invalidar todas las sesiones activas (forzar re-login)
    await prisma.session.deleteMany({ where: { userId: user.id } });

    await logSecurityEvent({
      eventType: "password_reset_completed",
      userId: user.id,
      email: user.email,
      request: req,
    });

    // Enviar email de notificación (defense in depth — si alguien resetea sin tu permiso, te enteras)
    void sendEmail({
      ...securityAlertEmail(
        user.name,
        "Contraseña restablecida",
        getClientIp(req) ?? undefined
      ),
      to: user.email,
    });

    return NextResponse.json({
      message: "Contraseña actualizada. Inicia sesión con tu nueva contraseña.",
    });
  } catch (e) {
    logger.error("reset-password:failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
