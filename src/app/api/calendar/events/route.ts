import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, calendarEventCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: { userId: string; startAt?: { gte?: Date; lte?: Date } } = { userId };
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: "asc" },
      take: 500,
    });
    return NextResponse.json(events);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, calendarEventCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

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
        recurrence: d.recurrence ?? null,
        recurrenceEnd: d.recurrenceEnd ? new Date(d.recurrenceEnd) : null,
        reminderMinutes: d.reminderMinutes ?? null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  });
}
