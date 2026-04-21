import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/user/2fa/status — indica si 2FA está activo y cuántos backup codes quedan
export async function GET() {
  return withAuth(async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
    });
    return NextResponse.json({
      enabled: user?.twoFactorEnabled ?? false,
      backupCodesRemaining: user?.twoFactorBackupCodes?.length ?? 0,
    });
  });
}
