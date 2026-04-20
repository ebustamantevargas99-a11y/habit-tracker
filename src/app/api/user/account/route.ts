import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { z } from "zod";

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(100),
  confirm: z.literal("DELETE"),
});

// DELETE /api/user/account — GDPR right to erasure
// Requires password confirmation. Cascade delete removes all user data.
export async function DELETE(req: NextRequest) {
  const limited = await checkRateLimit(req, rateLimits.accountDelete);
  if (limited) return limited;

  return withAuth(async (userId) => {
    const parsed = await parseJson(req, deleteAccountSchema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Usuario inválido" },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        userId,
        email: user.email,
        request: req,
        metadata: { context: "delete_account_wrong_password" },
      });
      logger.warn("delete-account:wrong-password", { userId });
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 403 }
      );
    }

    // Log ANTES del delete (cascade borra los SecurityEvent del user)
    await logSecurityEvent({
      eventType: "account_deleted",
      userId: null, // ya no va a existir
      email: user.email,
      request: req,
      metadata: { deletedUserId: userId },
    });

    await prisma.user.delete({ where: { id: userId } });

    logger.info("delete-account:success", { userId });

    return NextResponse.json(
      { success: true, message: "Cuenta eliminada permanentemente" },
      { status: 200 }
    );
  });
}
