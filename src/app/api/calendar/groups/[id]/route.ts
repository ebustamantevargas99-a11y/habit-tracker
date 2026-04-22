import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, calendarGroupUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.calendarGroup.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    const parsed = await parseJson(req, calendarGroupUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const updated = await prisma.calendarGroup.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.color !== undefined ? { color: d.color } : {}),
        ...(d.icon !== undefined ? { icon: d.icon } : {}),
        ...(d.visible !== undefined ? { visible: d.visible } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.calendarGroup.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }
    // onDelete: SetNull en CalendarEvent.groupId → los eventos sobreviven sin grupo
    await prisma.calendarGroup.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
