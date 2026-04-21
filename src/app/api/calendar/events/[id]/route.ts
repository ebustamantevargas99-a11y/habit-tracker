import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, calendarEventUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, calendarEventUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...("title" in d ? { title: d.title } : {}),
        ...("description" in d ? { description: d.description ?? null } : {}),
        ...("startAt" in d ? { startAt: new Date(d.startAt!) } : {}),
        ...("endAt" in d ? { endAt: d.endAt ? new Date(d.endAt) : null } : {}),
        ...("allDay" in d ? { allDay: d.allDay } : {}),
        ...("type" in d ? { type: d.type } : {}),
        ...("category" in d ? { category: d.category ?? null } : {}),
        ...("color" in d ? { color: d.color ?? null } : {}),
        ...("icon" in d ? { icon: d.icon ?? null } : {}),
        ...("location" in d ? { location: d.location ?? null } : {}),
        ...("recurrence" in d ? { recurrence: d.recurrence ?? null } : {}),
        ...("recurrenceEnd" in d
          ? { recurrenceEnd: d.recurrenceEnd ? new Date(d.recurrenceEnd) : null }
          : {}),
        ...("reminderMinutes" in d ? { reminderMinutes: d.reminderMinutes ?? null } : {}),
        ...("completed" in d ? { completed: d.completed } : {}),
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
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.calendarEvent.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
