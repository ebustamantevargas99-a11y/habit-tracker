import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { verifyToken, generateBackupCodes } from "@/lib/two-factor";
import { logSecurityEvent } from "@/lib/security-log";
import { sendEmail, securityAlertEmail } from "@/lib/email";
import { getClientIp } from "@/lib/security-log";
import { z } from "zod";

const schema = z.object({
  token: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
});

// POST /api/user/2fa/enable — confirma 2FA con un código válido
export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, schema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Primero ejecuta setup para obtener el QR." },
        { status: 400 }
      );
    }
    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA ya estaba activado." }, { status: 400 });
    }

    if (!verifyToken(parsed.data.token, user.twoFactorSecret)) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        userId,
        email: user.email,
        request: req,
        metadata: { context: "2fa_enable_wrong_token" },
      });
      return NextResponse.json(
        { error: "Código inválido. Verifica la hora de tu dispositivo." },
        { status: 400 }
      );
    }

    const backup = generateBackupCodes(10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: backup.hashes,
      },
    });

    await logSecurityEvent({
      eventType: "2fa_enabled",
      userId,
      email: user.email,
      request: req,
    });

    void sendEmail({
      ...securityAlertEmail(
        user.name,
        "Autenticación de dos factores activada",
        getClientIp(req) ?? undefined
      ),
      to: user.email,
    });

    return NextResponse.json({
      message: "2FA activada. Guarda tus códigos de respaldo en lugar seguro.",
      backupCodes: backup.plain, // se muestran UNA sola vez al user
    });
  });
}
