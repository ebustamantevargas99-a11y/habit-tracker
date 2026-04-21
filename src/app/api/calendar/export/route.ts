import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { generateICal } from "@/lib/calendar/ical";

// GET /api/calendar/export?from=YYYY-MM-DD&to=YYYY-MM-DD
// Descarga .ics compatible con Google Calendar / Apple Calendar / Outlook
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: { userId: string; startAt?: { gte?: Date; lte?: Date } } = { userId };
    if (from || to) {
      where.startAt = {};
      if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.startAt.gte = new Date(`${from}T00:00:00Z`);
      if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.startAt.lte = new Date(`${to}T23:59:59Z`);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: "asc" },
      take: 1000,
    });

    const ics = generateICal(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startAt: e.startAt,
        endAt: e.endAt,
        allDay: e.allDay,
        location: e.location,
        recurrence: e.recurrence,
        recurrenceEnd: e.recurrenceEnd,
      })),
      "Ultimate TRACKER"
    );

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="ultimate-tracker-${new Date()
          .toISOString()
          .slice(0, 10)}.ics"`,
      },
    });
  });
}
