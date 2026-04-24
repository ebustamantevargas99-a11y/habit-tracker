import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/user/year-review?year=2026
// Devuelve agregación completa del año para análisis con IA personal.
// El frontend luego formatea esto en un prompt exportable.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "year inválido" }, { status: 400 });
    }

    const startISO = `${year}-01-01`;
    const endISO = `${year}-12-31`;
    const startDate = new Date(`${startISO}T00:00:00Z`);
    const endDate = new Date(`${endISO}T23:59:59Z`);

    const [
      events,
      workouts,
      exercises,
      meals,
      habits,
      habitLogs,
      booksFinished,
      readingSessions,
      fastings,
      focusSessions,
      milestones,
      lifeScoreSnapshots,
      bodyMetrics,
    ] = await Promise.all([
      prisma.calendarEvent.count({
        where: { userId, startAt: { gte: startDate, lte: endDate } },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: startISO, lte: endISO } },
        select: {
          date: true,
          completed: true,
          durationMinutes: true,
          totalVolume: true,
          prsHit: true,
          name: true,
        },
      }),
      prisma.personalRecord.findMany({ where: { userId } }),
      prisma.mealLog.findMany({
        where: { userId, date: { gte: startISO, lte: endISO } },
        include: { items: { select: { calories: true, protein: true } } },
      }),
      prisma.habit.findMany({
        where: { userId },
        select: { id: true, name: true, icon: true, streakBest: true },
      }),
      prisma.habitLog.findMany({
        where: { userId, date: { gte: startISO, lte: endISO } },
        select: { habitId: true, date: true, completed: true },
      }),
      prisma.book.findMany({
        where: {
          userId,
          status: "finished",
          finishedAt: { gte: startISO, lte: endISO },
        },
        select: { title: true, author: true, rating: true, finishedAt: true, totalPages: true },
      }),
      prisma.readingSession.findMany({
        where: { userId, date: { gte: startISO, lte: endISO } },
        select: { pagesRead: true, minutes: true },
      }),
      prisma.fastingSession.findMany({
        where: { userId, startedAt: { gte: startDate, lte: endDate } },
        select: { targetHours: true, endedAt: true, startedAt: true },
      }),
      prisma.focusSession.findMany({
        where: { userId, startedAt: { gte: startDate, lte: endDate } },
        select: { actualMinutes: true, plannedMinutes: true, task: true, rating: true },
      }),
      prisma.milestone.findMany({
        where: { userId, date: { gte: startISO, lte: endISO } },
        select: { date: true, type: true, title: true, icon: true },
        orderBy: { date: "asc" },
      }),
      prisma.lifeScoreSnapshot.findMany({
        where: { userId, date: { gte: startISO, lte: endISO } },
        select: { date: true, overall: true },
        orderBy: { date: "asc" },
      }),
      prisma.bodyMetric.findMany({
        where: { userId, date: { gte: startISO, lte: endISO }, type: "weight" },
        orderBy: { date: "asc" },
        select: { date: true, value: true },
      }),
    ]);

    // Agregaciones
    const workoutsCompleted = workouts.filter((w) => w.completed).length;
    const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);
    const totalPRs = workouts.reduce((s, w) => s + w.prsHit, 0);
    const gymMinutes = workouts.reduce((s, w) => s + w.durationMinutes, 0);
    const habitMap = new Map(habits.map((h) => [h.id, h]));
    const habitStats = habits.map((h) => {
      const logs = habitLogs.filter((l) => l.habitId === h.id);
      const completed = logs.filter((l) => l.completed).length;
      return {
        name: h.name,
        icon: h.icon,
        completed,
        total: logs.length,
        rate: logs.length ? Math.round((completed / logs.length) * 100) : 0,
        bestStreak: h.streakBest,
      };
    });
    const topHabits = habitStats
      .filter((h) => h.total > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);

    const avgLifeScore = lifeScoreSnapshots.length
      ? Math.round(
          lifeScoreSnapshots.reduce((s, x) => s + x.overall, 0) /
            lifeScoreSnapshots.length
        )
      : null;

    const totalCalories = meals.reduce(
      (s, m) => s + m.items.reduce((ss, i) => ss + i.calories, 0),
      0
    );
    const totalProtein = meals.reduce(
      (s, m) => s + m.items.reduce((ss, i) => ss + i.protein, 0),
      0
    );

    const pagesRead = readingSessions.reduce((s, r) => s + r.pagesRead, 0);
    const readingMinutes = readingSessions.reduce((s, r) => s + (r.minutes ?? 0), 0);
    const fastingHours = fastings
      .filter((f) => f.endedAt)
      .reduce(
        (s, f) => s + (new Date(f.endedAt!).getTime() - new Date(f.startedAt).getTime()) / 3600000,
        0
      );
    const focusMinutes = focusSessions.reduce(
      (s, f) => s + (f.actualMinutes ?? 0),
      0
    );

    // Peso inicial y final (si hay metrics). BodyMetric usa {type:"weight", value}.
    const weightStart = bodyMetrics[0]?.value ?? null;
    const weightEnd = bodyMetrics[bodyMetrics.length - 1]?.value ?? null;

    return NextResponse.json({
      year,
      calendar: {
        totalEvents: events,
      },
      fitness: {
        workoutsCompleted,
        gymMinutes,
        totalVolume: Math.round(totalVolume),
        totalPRs,
        currentPRs: exercises.map((e) => ({
          exercise: e.exerciseName,
          oneRM: e.estimated1RM,
          date: e.date,
        })),
        weightStart,
        weightEnd,
        weightDelta: weightStart && weightEnd ? +(weightEnd - weightStart).toFixed(1) : null,
      },
      nutrition: {
        mealsLogged: meals.length,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        avgDailyCalories: meals.length
          ? Math.round(totalCalories / new Set(meals.map((m) => m.date)).size)
          : 0,
      },
      habits: {
        totalHabits: habits.length,
        totalCompletions: habitLogs.filter((l) => l.completed).length,
        overallRate: habitLogs.length
          ? Math.round((habitLogs.filter((l) => l.completed).length / habitLogs.length) * 100)
          : 0,
        top: topHabits,
      },
      reading: {
        booksFinished: booksFinished.length,
        books: booksFinished,
        pagesRead,
        readingMinutes,
      },
      fasting: {
        sessions: fastings.length,
        totalHours: Math.round(fastingHours),
      },
      focus: {
        sessions: focusSessions.length,
        totalMinutes: focusMinutes,
      },
      milestones: milestones.slice(0, 30),
      lifeScore: {
        avgOverall: avgLifeScore,
        snapshotCount: lifeScoreSnapshots.length,
        timeline: lifeScoreSnapshots,
      },
    });
  });
}
