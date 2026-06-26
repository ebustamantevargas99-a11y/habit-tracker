import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateApiKey(): string {
  return "ut_" + randomBytes(24).toString("hex");
}

// GET — devuelve la API key actual (sin exponer la key completa si no existe)
export async function GET() {
  return withAuth(async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apiKey: true },
    });
    return NextResponse.json({ hasKey: Boolean(user?.apiKey) });
  });
}

// POST — genera (o regenera) la API key
export async function POST() {
  return withAuth(async (userId) => {
    const apiKey = generateApiKey();
    await prisma.user.update({
      where: { id: userId },
      data: { apiKey },
    });
    return NextResponse.json({ apiKey });
  });
}

// DELETE — revoca la API key
export async function DELETE() {
  return withAuth(async (userId) => {
    await prisma.user.update({
      where: { id: userId },
      data: { apiKey: null },
    });
    return NextResponse.json({ ok: true });
  });
}
