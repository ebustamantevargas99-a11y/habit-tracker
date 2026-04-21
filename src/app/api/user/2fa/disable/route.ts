import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { verifyToken, consumeBackupCode } from "@/lib/two-factor";
import { logSecurityEvent, getClientIp } from "@/lib/security-log";
import { sendEmail, securityAlertEmail } from "@/lib/email";
import { z } from "zod";

// Acepta password + (código TOTP O código de respaldo) para desactivar.
const schema = z.object({
  password: z.string().min(1).max(100),
  token: z.string().min(1).max(20),
});

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, schema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        email: true,
        name: true,
      },
    });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA no está activo" }, { status: 400 });
    }

    const pwOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!pwOk) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        userId,
        email: user.email,
        request: req,
        metadata: { context: "2fa_disable_wrong_password" },
      });
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });
    }

    // Verificar token TOTP o backup code
    const tokenInput = parsed.data.token;
    let valid = false;

    if (/^\d{6}$/.test(tokenInput.replace(/\s/g, ""))) {
      valid = user.twoFactorSecret
        ? verifyToken(tokenInput, user.twoFactorSecret)
        : false;
    } else {
      const result = consumeBackupCode(tokenInput, user.twoFactorBackupCodes);
      valid = result.matched;
    }

    if (!valid) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        userId,
        email: user.email,
        request: req,
        metadata: { context: "2fa_disable_wrong_token" },
      });
      return NextResponse.json(
        { error: "Código TOTP o de respaldo inválido" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    await logSecurityEvent({
      eventType: "2fa_disabled",
      userId,
      email: user.email,
      request: req,
    });

    void sendEmail({
      ...securityAlertEmail(
        user.name,
        "Autenticación de dos factores DESACTIVADA",
        getClientIp(req) ?? undefined
      ),
      to: user.email,
    });

    return NextResponse.json({ message: "2FA desactivado." });
  });
}
