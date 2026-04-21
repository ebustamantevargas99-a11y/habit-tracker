import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/day/[date] — agregación completa del día cross-módulo
// Devuelve todos los "bloques" que el calendario debe mostrar:
// - Eventos propios (CalendarEvent)
// - Workout del día (si existe y está planeado/completado)
// - Meals del día con hora (breakfast, lunch, dinner, snack)
// - Focus sessions del día
// - Meditation sessions del día
// - Fasting window (si hay una activa que cruza el día)
// - Habits del día (chips)
// - Cycle info (fase actual)
// - Morning/Evening ritual
// - Top priorities + rating + notes del DailyPlan legado

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  return withAuth(async (userId) => {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date debe ser YYYY-MM-DD" }, { status: 400 });
    }

    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const [
      events,
      dailyPlan,
      workouts,
      meals,
      focusSessions,
      meditations,
      activeFasting,
      habits,
      habitLogs,
      cycle,
      morningRitual,
      eveningRitual,
    ] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          userId,
          startAt: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { startAt: "asc" },
      }),
      prisma.dailyPlan.findUnique({
        where: { userId_date: { userId, date } },
        include: { timeBlocks: { orderBy: { startTime: "asc" } } },
      }),
      prisma.workout.findMany({
        where: { userId, date },
      }),
      prisma.mealLog.findMany({
        where: { userId, date },
        include: { items: { select: { calories: true, protein: true } } },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          startedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.meditationSession.findMany({
        where: { userId, date },
      }),
      prisma.fastingSession.findFirst({
        where: {
          userId,
          OR: [
            { endedAt: null, startedAt: { lte: dayEnd } },
            { startedAt: { lte: dayEnd }, endedAt: { gte: dayStart } },
          ],
        },
        orderBy: { startedAt: "desc" },
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          icon: true,
          frequency: true,
          targetDays: true,
          streakCurrent: true,
        },
      }),
      prisma.habitLog.findMany({
        where: { userId, date },
      }),
      prisma.menstrualCycle.findFirst({
        where: { userId, startDate: { lte: date } },
        orderBy: { startDate: "desc" },
      }),
      prisma.morningRitual.findUnique({
        where: { userId_date: { userId, date } },
      }),
      prisma.eveningRitual.findUnique({
        where: { userId_date: { userId, date } },
      }),
    ]);

    // Filtrar hábitos del día según frecuencia/targetDays
    const dayOfWeek = new Date(date + "T12:00:00Z").getUTCDay(); // 0=domingo
    const todayHabits = habits.filter((h) => {
      if (h.frequency === "daily") return true;
      if (h.frequency === "weekly" && h.targetDays?.includes(dayOfWeek)) return true;
      return false;
    });

    const completedHabitIds = new Set(
      habitLogs.filter((l) => l.completed).map((l) => l.habitId)
    );

    // Calcular fase del ciclo si aplica
    let cyclePhase: { name: string; emoji: string; day: number } | null = null;
    if (cycle) {
      const dayOfCycle = Math.floor(
        (new Date(date + "T00:00:00Z").getTime() -
          new Date(cycle.startDate + "T00:00:00Z").getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;
      if (dayOfCycle >= 1 && dayOfCycle <= 35) {
        const phase =
          dayOfCycle <= 5
            ? { name: "Menstrual", emoji: "🌑" }
            : dayOfCycle <= 13
            ? { name: "Folicular", emoji: "🌓" }
            : dayOfCycle <= 16
            ? { name: "Ovulatoria", emoji: "🌕" }
            : { name: "Lútea", emoji: "🌘" };
        cyclePhase = { ...phase, day: dayOfCycle };
      }
    }

    return NextResponse.json({
      date,
      events,
      dailyPlan: dailyPlan
        ? {
            topPriorities: dailyPlan.topPriorities,
            rating: dailyPlan.rating,
            notes: dailyPlan.notes,
            timeBlocks: dailyPlan.timeBlocks,
          }
        : { topPriorities: [], rating: null, notes: null, timeBlocks: [] },
      agenda: {
        workouts: workouts.map((w) => ({
          id: w.id,
          type: "workout",
          title: w.name,
          durationMinutes: w.durationMinutes,
          completed: w.completed,
          totalVolume: w.totalVolume,
          prsHit: w.prsHit,
        })),
        meals: meals.map((m) => {
          const totalCal = m.items.reduce((s, it) => s + it.calories, 0);
          return {
            id: m.id,
            type: "meal",
            mealType: m.mealType,
            itemCount: m.items.length,
            calories: Math.round(totalCal),
          };
        }),
        focus: focusSessions.map((f) => ({
          id: f.id,
          type: "focus",
          task: f.task,
          startedAt: f.startedAt,
          endedAt: f.endedAt,
          plannedMinutes: f.plannedMinutes,
          actualMinutes: f.actualMinutes,
          active: f.endedAt === null,
        })),
        meditations: meditations.map((m) => ({
          id: m.id,
          type: "meditation",
          durationMinutes: m.durationMinutes,
          meditationType: m.type,
        })),
        fasting: activeFasting
          ? {
              id: activeFasting.id,
              type: "fasting",
              startedAt: activeFasting.startedAt,
              endedAt: activeFasting.endedAt,
              targetHours: activeFasting.targetHours,
              protocol: activeFasting.protocol,
              active: activeFasting.endedAt === null,
            }
          : null,
        habits: todayHabits.map((h) => ({
          id: h.id,
          type: "habit",
          name: h.name,
          icon: h.icon,
          streak: h.streakCurrent,
          completed: completedHabitIds.has(h.id),
        })),
        cycle: cyclePhase,
        rituals: {
          morning: morningRitual
            ? {
                completed:
                  morningRitual.hydration || morningRitual.meditation ||
                  Boolean(morningRitual.intention) ||
                  morningRitual.gratitude.length > 0,
                energy: morningRitual.energy,
              }
            : null,
          evening: eveningRitual
            ? {
                completed:
                  Boolean(eveningRitual.reflection) ||
                  eveningRitual.gratitude.length > 0 ||
                  eveningRitual.tomorrowTop3.length > 0,
              }
            : null,
        },
      },
    });
  });
}
