import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseJson, registerSchema } from "@/lib/validation";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { createEmailVerificationToken } from "@/lib/password-reset";
import { sendEmail, emailVerificationEmail, appUrl } from "@/lib/email";
import { logSecurityEvent } from "@/lib/security-log";
import { logger } from "@/lib/logger";

const BCRYPT_ROUNDS = 13;

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, rateLimits.register);
  if (limited) return limited;

  try {
    const parsed = await parseJson(req, registerSchema);
    if (!parsed.ok) return parsed.response;

    // Bot protection: honeypot + time-to-fill
    if (parsed.data.website && parsed.data.website.length > 0) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        email: parsed.data.email,
        request: req,
        metadata: { context: "register_honeypot" },
      });
      // Respuesta idéntica a la exitosa para no revelar el trap
      return NextResponse.json({ id: "pending" }, { status: 201 });
    }
    if (
      typeof parsed.data.formFilledIn === "number" &&
      parsed.data.formFilledIn < 1500
    ) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        email: parsed.data.email,
        request: req,
        metadata: { context: "register_too_fast", ms: parsed.data.formFilledIn },
      });
      return NextResponse.json({ id: "pending" }, { status: 201 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        email,
        request: req,
        metadata: { context: "register_duplicate" },
      });
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        passwordHash,
        passwordChangedAt: new Date(),
        profile: { create: {} },
        gamification: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });

    await logSecurityEvent({
      eventType: "register",
      userId: user.id,
      email: user.email,
      request: req,
    });

    // Email de verificación (best effort — no bloquea el registro si falla)
    try {
      const token = await createEmailVerificationToken(user.id);
      const verifyUrl = appUrl(`/api/auth/verify-email?token=${token}`);
      void sendEmail({
        ...emailVerificationEmail(user.name, verifyUrl),
        to: user.email,
      });
      await logSecurityEvent({
        eventType: "email_verification_sent",
        userId: user.id,
        email: user.email,
      });
    } catch (e) {
      logger.warn("register:email-verify-failed", {
        userId: user.id,
        error: e instanceof Error ? e.message : "unknown",
      });
    }

    logger.info("register:success", { userId: user.id });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error("register:failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
