import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, emergencyShareSchema } from "@/lib/validation";

// Genera un token público de 24h para compartir la tarjeta de emergencia
export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, emergencyShareSchema);
    if (!parsed.ok) return parsed.response;
    const hours = parsed.data.hours ?? 24;

    const card = await prisma.emergencyCard.findUnique({ where: { userId } });
    if (!card) {
      return NextResponse.json(
        { error: "Primero crea tu tarjeta de emergencia" },
        { status: 400 }
      );
    }

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

    const updated = await prisma.emergencyCard.update({
      where: { userId },
      data: { shareToken: token, shareExpiresAt: expiresAt },
    });

    return NextResponse.json({
      token: updated.shareToken,
      url: `/emergency/${updated.shareToken}`,
      expiresAt: updated.shareExpiresAt,
    });
  });
}

// DELETE revoca el token
export async function DELETE(_req: NextRequest) {
  return withAuth(async (userId) => {
    await prisma.emergencyCard.update({
      where: { userId },
      data: { shareToken: null, shareExpiresAt: null },
    });
    return new NextResponse(null, { status: 204 });
  });
}
