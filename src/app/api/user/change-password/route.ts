import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { checkPwnedPassword } from "@/lib/password-strength";
import { sendEmail, securityAlertEmail } from "@/lib/email";
import { logSecurityEvent, getClientIp } from "@/lib/security-log";
import { logger } from "@/lib/logger";
import { z } from "zod";

const BCRYPT_ROUNDS = 13;

const schema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z
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

  return withAuth(async (userId) => {
    const parsed = await parseJson(req, schema);
    if (!parsed.ok) return parsed.response;

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "La nueva contraseña debe ser diferente a la actual" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true, name: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        userId,
        email: user.email,
        request: req,
        metadata: { context: "change_password_wrong_current" },
      });
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 403 }
      );
    }

    // HIBP check — rechaza passwords en breaches conocidos
    const pwned = await checkPwnedPassword(newPassword);
    if (pwned.breached === true) {
      return NextResponse.json(
        {
          error: `Esta contraseña aparece en ${pwned.count?.toLocaleString() ?? "varios"} filtraciones conocidas. Usa otra.`,
        },
        { status: 400 }
      );
    }

    try {
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      const now = new Date();

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash, passwordChangedAt: now },
      });

      // Invalidar sesiones DB (las JWT se auto-invalidan por iat vs passwordChangedAt)
      await prisma.session.deleteMany({ where: { userId } });

      await logSecurityEvent({
        eventType: "password_changed",
        userId,
        email: user.email,
        request: req,
      });

      void sendEmail({
        ...securityAlertEmail(
          user.name,
          "Contraseña cambiada",
          getClientIp(req) ?? undefined
        ),
        to: user.email,
      });

      return NextResponse.json({
        message: "Contraseña actualizada. Todas tus sesiones fueron cerradas.",
      });
    } catch (e) {
      logger.error("change-password:failed", {
        error: e instanceof Error ? e.message : "unknown",
      });
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  });
}
