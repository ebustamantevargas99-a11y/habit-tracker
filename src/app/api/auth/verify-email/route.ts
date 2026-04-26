import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeEmailVerificationToken } from "@/lib/password-reset";
import { logSecurityEvent } from "@/lib/security-log";
import { logger } from "@/lib/logger";
import { appUrl } from "@/lib/app-url";

// GET /api/auth/verify-email?token=XXX — verifica email desde link en email
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(appUrl("/login?error=missing_token"));
  }

  const result = await consumeEmailVerificationToken(token);
  if ("error" in result) {
    return NextResponse.redirect(appUrl(`/login?error=verify_${result.error}`));
  }

  try {
    const user = await prisma.user.update({
      where: { id: result.userId },
      data: { emailVerified: new Date() },
      select: { id: true, email: true },
    });

    await logSecurityEvent({
      eventType: "email_verified",
      userId: user.id,
      email: user.email,
      request: req,
    });

    return NextResponse.redirect(appUrl("/login?verified=1"));
  } catch (e) {
    logger.error("verify-email:failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.redirect(appUrl("/login?error=verify_failed"));
  }
}
