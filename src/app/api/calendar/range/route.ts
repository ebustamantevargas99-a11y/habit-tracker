import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/range?from=YYYY-MM-DD&to=YYYY-MM-DD
// Devuelve eventos custom + workouts + meals agrupados por día
// Útil para vistas Semana/Mes donde cada día muestra un resumen
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ error: "from/to inválidos" }, { status: 400 });
    }

    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T23:59:59Z`);

    const [events, workouts, meals, habitLogs, milestones] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: { userId, startAt: { gte: fromDate, lte: toDate } },
        orderBy: { startAt: "asc" },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: {
          id: true,
          date: true,
          name: true,
          completed: true,
          durationMinutes: true,
          prsHit: true,
        },
      }),
      prisma.mealLog.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: { id: true, date: true, mealType: true },
      }),
      prisma.habitLog.findMany({
        where: { userId, date: { gte: from, lte: to } },
        select: { date: true, completed: true },
      }),
      prisma.milestone.findMany({
        where: { userId, date: { gte: from, lte: to } },
      }),
    ]);

    // Densidad por día (para heatmap)
    const density: Record<string, number> = {};
    for (const e of events) {
      const d = e.startAt.toISOString().split("T")[0];
      density[d] = (density[d] ?? 0) + 1;
    }
    for (const w of workouts) density[w.date] = (density[w.date] ?? 0) + 1;
    for (const m of meals) density[m.date] = (density[m.date] ?? 0) + 1;
    for (const l of habitLogs) {
      if (l.completed) density[l.date] = (density[l.date] ?? 0) + 0.3;
    }

    return NextResponse.json({
      events,
      workouts,
      meals,
      habitLogs,
      milestones,
      density,
    });
  });
}
