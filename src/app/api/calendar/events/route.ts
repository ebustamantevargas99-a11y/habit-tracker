import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, calendarEventCreateSchema } from "@/lib/validation";
import { expandRecurrence } from "@/lib/calendar/recurrence";

// GET /api/calendar/events — lista plana de eventos en un rango.
// Si se pasa `from`/`to` (ISO completos), los recurrentes se expanden en
// ese rango. El reminder scheduler depende de esto para que las
// notificaciones salten en cada ocurrencia, no sólo en el seed.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // Si no se pasa rango, devolvemos tal cual (comportamiento legado).
    if (!fromDate || !toDate) {
      const events = await prisma.calendarEvent.findMany({
        where: { userId },
        orderBy: { startAt: "asc" },
        take: 500,
      });
      return NextResponse.json(events);
    }

    const rawEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          { recurrence: null, startAt: { gte: fromDate, lte: toDate } },
          {
            AND: [
              { recurrence: { not: null } },
              { startAt: { lte: toDate } },
              {
                OR: [
                  { recurrenceEnd: null },
                  { recurrenceEnd: { gte: fromDate } },
                ],
              },
            ],
          },
        ],
      },
      orderBy: { startAt: "asc" },
      take: 500,
    });

    const events: Array<(typeof rawEvents)[number] & { originalStartAt?: Date }> = [];
    for (const ev of rawEvents) {
      if (!ev.recurrence) {
        events.push(ev);
        continue;
      }
      const occs = expandRecurrence(
        ev.startAt,
        ev.endAt,
        ev.recurrence,
        fromDate,
        toDate,
        ev.recurrenceEnd,
      );
      for (const occ of occs) {
        events.push({
          ...ev,
          startAt: occ.startAt,
          endAt: occ.endAt,
          originalStartAt: ev.startAt,
        });
      }
    }
    events.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    return NextResponse.json(events);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, calendarEventCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Ownership del grupo (si viene)
    if (d.groupId) {
      const grp = await prisma.calendarGroup.findFirst({
        where: { id: d.groupId, userId },
        select: { id: true },
      });
      if (!grp) {
        return NextResponse.json(
          { error: "Grupo de calendario no encontrado" },
          { status: 404 },
        );
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: d.title,
        description: d.description ?? null,
        startAt: new Date(d.startAt),
        endAt: d.endAt ? new Date(d.endAt) : null,
        allDay: d.allDay ?? false,
        type: d.type ?? "custom",
        category: d.category ?? null,
        color: d.color ?? null,
        icon: d.icon ?? null,
        location: d.location ?? null,
        groupId: d.groupId ?? null,
        recurrence: d.recurrence ?? null,
        recurrenceEnd: d.recurrenceEnd ? new Date(d.recurrenceEnd) : null,
        reminderMinutes: d.reminderMinutes ?? null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  });
}
