import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, focusSessionEndSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.focusSession.findFirst({
      where: { id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    const parsed = await parseJson(req, focusSessionEndSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const actualMinutes =
      d.actualMinutes ??
      Math.round((Date.now() - new Date(existing.startedAt).getTime()) / 60000);

    const updated = await prisma.focusSession.update({
      where: { id },
      data: {
        endedAt: new Date(),
        actualMinutes,
        interruptions: d.interruptions ?? existing.interruptions,
        rating: d.rating ?? existing.rating,
        notes: d.notes ?? existing.notes,
      },
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
    const existing = await prisma.focusSession.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.focusSession.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
