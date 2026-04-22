import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/user/rewind?month=2026-04
// Devuelve agregados del mes para la página /rewind
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");

    const now = new Date();
    const [year, month] = monthParam
      ? monthParam.split("-").map((n) => parseInt(n, 10))
      : [now.getUTCFullYear(), now.getUTCMonth() + 1];

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Mes inválido (YYYY-MM)" }, { status: 400 });
    }

    const startISO = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? [year + 1, 1] : [year, month + 1];
    const endISO = `${nextMonth[0]}-${String(nextMonth[1]).padStart(2, "0")}-01`;

    const [
      habitLogs,
      workouts,
      mealLogs,
      readingSessions,
      booksFinished,
      lifeScoreSnapshots,
    ] = await Promise.all([
      prisma.habitLog.findMany({
        where: { userId, date: { gte: startISO, lt: endISO } },
        include: { habit: { select: { id: true, name: true, icon: true } } },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: startISO, lt: endISO } },
        select: {
          id: true,
          date: true,
          name: true,
          completed: true,
          durationMinutes: true,
          totalVolume: true,
          prsHit: true,
        },
      }),
      prisma.mealLog.findMany({
        where: { userId, date: { gte: startISO, lt: endISO } },
        include: { items: { select: { calories: true } } },
      }),
      prisma.readingSession.findMany({
        where: { userId, date: { gte: startISO, lt: endISO } },
        select: { date: true, pagesRead: true, minutes: true, bookId: true },
      }),
      prisma.book.count({
        where: {
          userId,
          status: "finished",
          finishedAt: { gte: startISO, lt: endISO },
        },
      }),
      prisma.lifeScoreSnapshot.findMany({
        where: { userId, date: { gte: startISO, lt: endISO } },
        select: { date: true, overall: true },
        orderBy: { date: "asc" },
      }),
    ]);

    // ── Agregados ────────────────────────────────────────────────────────────
    const habitsCompleted = habitLogs.filter((l) => l.completed).length;
    const habitCompletionRate =
      habitLogs.length > 0 ? (habitsCompleted / habitLogs.length) * 100 : 0;

    // Hábito estrella (más completions este mes)
    const habitCompletions: Record<string, { name: string; icon: string | null; count: number }> = {};
    for (const l of habitLogs) {
      if (!l.completed) continue;
      if (!habitCompletions[l.habitId]) {
        habitCompletions[l.habitId] = {
          name: l.habit.name,
          icon: l.habit.icon,
          count: 0,
        };
      }
      habitCompletions[l.habitId].count++;
    }
    const topHabits = Object.values(habitCompletions)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const workoutsCompleted = workouts.filter((w) => w.completed).length;
    const workoutDays = new Set(workouts.filter((w) => w.completed).map((w) => w.date)).size;
    const totalVolume = workouts.reduce((s, w) => s + (w.totalVolume ?? 0), 0);
    const totalPRs = workouts.reduce((s, w) => s + (w.prsHit ?? 0), 0);
    const totalMinutesGym = workouts.reduce((s, w) => s + (w.durationMinutes ?? 0), 0);

    const daysWithMeals = new Set(mealLogs.map((m) => m.date)).size;
    const totalCalories = mealLogs.reduce(
      (s, m) => s + m.items.reduce((ss, it) => ss + it.calories, 0),
      0
    );

    const pagesRead = readingSessions.reduce((s, r) => s + r.pagesRead, 0);
    const readingMinutes = readingSessions.reduce((s, r) => s + (r.minutes ?? 0), 0);

    const avgLifeScore = lifeScoreSnapshots.length
      ? Math.round(
          lifeScoreSnapshots.reduce((s, x) => s + x.overall, 0) /
            lifeScoreSnapshots.length
        )
      : null;

    return NextResponse.json({
      month: `${year}-${String(month).padStart(2, "0")}`,
      startISO,
      endISO,
      habits: {
        totalLogs: habitLogs.length,
        completed: habitsCompleted,
        completionRate: Math.round(habitCompletionRate),
        top: topHabits,
      },
      fitness: {
        workoutsCompleted,
        workoutDays,
        totalVolume: Math.round(totalVolume),
        totalMinutes: totalMinutesGym,
        totalPRs,
      },
      nutrition: {
        daysWithMeals,
        totalMeals: mealLogs.length,
        totalCalories: Math.round(totalCalories),
      },
      reading: {
        booksFinished,
        pagesRead,
        minutes: readingMinutes,
      },
      lifeScore: {
        avg: avgLifeScore,
        snapshots: lifeScoreSnapshots,
      },
    });
  });
}
