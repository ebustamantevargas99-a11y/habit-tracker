import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { expandRecurrence } from "@/lib/calendar/recurrence";

// GET /api/calendar/range?from=YYYY-MM-DD&to=YYYY-MM-DD
// Devuelve eventos custom + workouts + meals agrupados por día.
// Los eventos recurrentes se expanden server-side: una serie con
// RRULE="FREQ=WEEKLY;BYDAY=MO,TH" produce una fila por cada lunes
// y jueves dentro del rango. Cada ocurrencia comparte `id` con el
// seed, así que el cliente usa `${id}-${startAt}` como React key.
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

    const [rawEvents, workouts, meals, habitLogs, milestones] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          userId,
          OR: [
            // (a) No recurrente: su seed cae en el rango
            { recurrence: null, startAt: { gte: fromDate, lte: toDate } },
            // (b) Recurrente: seed antes del fin del rango y recurrenceEnd
            //     null o después del inicio del rango (la serie aún está viva).
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

    // Expandir recurrencias en instancias concretas dentro del rango.
    // Tope de seguridad: cada serie está limitada a 100 ocurrencias
    // internamente por expandRecurrence(). `originalStartAt` guarda el
    // startAt del seed — el cliente lo usa para editar la serie sin
    // mover accidentalmente la fecha base al clickear una ocurrencia.
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

    // Densidad por día (para heatmap) — usa el array expandido para
    // que los días con eventos recurrentes se marquen correctamente.
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
