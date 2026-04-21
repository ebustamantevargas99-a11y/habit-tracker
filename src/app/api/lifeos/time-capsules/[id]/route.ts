import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// POST = marcar como abierta (solo si ya unlocked)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const capsule = await prisma.timeCapsule.findFirst({ where: { id, userId } });
    if (!capsule) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    if (capsule.unlockAt > new Date()) {
      return NextResponse.json(
        { error: "Aún no es la fecha de apertura" },
        { status: 400 }
      );
    }
    const updated = await prisma.timeCapsule.update({
      where: { id },
      data: { opened: true, openedAt: new Date() },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.timeCapsule.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.timeCapsule.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
