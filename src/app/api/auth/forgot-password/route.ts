import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail, passwordResetEmail, appUrl } from "@/lib/email";
import { logSecurityEvent, getClientIp, getUserAgent } from "@/lib/security-log";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().max(255).toLowerCase(),
});

// Importante: SIEMPRE respondemos 200 aunque el email no exista.
// Esto previene enumeration de cuentas.
const GENERIC_RESPONSE = {
  message:
    "Si existe una cuenta con ese email, te enviaremos un enlace de restablecimiento.",
};

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, rateLimits.passwordReset);
  if (limited) return limited;

  const parsed = await parseJson(req, schema);
  if (!parsed.ok) return parsed.response;

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    await logSecurityEvent({
      eventType: "password_reset_requested",
      userId: user?.id ?? null,
      email,
      request: req,
      metadata: { userExists: Boolean(user) },
    });

    if (user) {
      const token = await createPasswordResetToken(
        user.id,
        getClientIp(req),
        getUserAgent(req)
      );
      const resetUrl = appUrl(`/reset-password?token=${token}`);
      const emailData = passwordResetEmail(user.name, resetUrl);
      await sendEmail({ ...emailData, to: user.email });
    }
  } catch (e) {
    logger.error("forgot-password:failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    // aún así respondemos 200 para no leakear info
  }

  return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
