import { prisma } from "@/lib/prisma";
import type { PromptContext } from "./build-prompt";
import type { ExportScope } from "./types";

type BuildArgs = {
  userId: string;
  scope: ExportScope;
  from: Date;
  to: Date;
  style: PromptContext["style"];
  customQuestion?: string;
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function calculateAge(birthDate: Date | null | undefined): number | undefined {
  if (!birthDate) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export async function gatherPromptContext(args: BuildArgs): Promise<PromptContext> {
  const { userId, scope, from, to, style, customQuestion } = args;
  const fromStr = toDateStr(from);
  const toStr = toDateStr(to);
  const days = daysBetween(from, to);
  const isDaily = scope === "daily" || days === 1;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      profile: {
        select: {
          birthDate: true,
          biologicalSex: true,
          gender: true,
          heightCm: true,
          weightKg: true,
          activityLevel: true,
          fitnessLevel: true,
          primaryGoals: true,
          interests: true,
          units: true,
          timezone: true,
        },
      },
    },
  });

  const profile = {
    name: user?.name ?? "Usuario",
    ageYears: calculateAge(user?.profile?.birthDate),
    biologicalSex: user?.profile?.biologicalSex ?? null,
    gender: user?.profile?.gender ?? null,
    heightCm: user?.profile?.heightCm ?? null,
    weightKg: user?.profile?.weightKg ?? null,
    activityLevel: user?.profile?.activityLevel ?? null,
    fitnessLevel: user?.profile?.fitnessLevel ?? null,
    primaryGoals: user?.profile?.primaryGoals ?? [],
    interests: user?.profile?.interests ?? [],
    units: user?.profile?.units ?? "metric",
    timezone: user?.profile?.timezone ?? undefined,
  };

  const ctx: PromptContext = {
    profile,
    scope,
    style,
    range: { from: fromStr, to: toStr, days },
    customQuestion,
  };

  if (isDaily) {
    ctx.today = await gatherDaySnapshot(userId, toStr);
  } else {
    ctx.aggregates = await gatherAggregates(userId, fromStr, toStr);
    ctx.today = await gatherDaySnapshot(userId, toStr);
  }

  return ctx;
}

async function gatherDaySnapshot(userId: string, date: string): Promise<PromptContext["today"]> {
  const [habits, habitLogs, meals, workout, tasks, pomodoros, txs] =
    await Promise.all([
      prisma.habit.findMany({
        where: { userId, isActive: true },
        select: { id: true, name: true, streakCurrent: true },
      }),
      prisma.habitLog.findMany({ where: { userId, date } }),
      prisma.mealLog.findMany({
        where: { userId, date },
        include: { items: true },
      }),
      prisma.workout.findFirst({
        where: { userId, date },
        include: { exercises: { include: { sets: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.projectTask.findMany({
        where: { project: { userId }, dueDate: date },
        select: { status: true },
      }),
      prisma.pomodoroSession.findMany({
        where: { userId, date, isWork: true },
        select: { id: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date },
        select: { amount: true, type: true },
      }),
    ]);

  const logsByHabit = new Map(habitLogs.map((l) => [l.habitId, l]));
  const habitsCompleted = habits.map((h) => ({
    name: h.name,
    streak: h.streakCurrent,
    completed: Boolean(logsByHabit.get(h.id)?.completed),
  }));

  const nutrition = meals.length
    ? meals.reduce(
        (acc, meal) => {
          for (const it of meal.items) {
            acc.calories += it.calories;
            acc.protein += it.protein;
            acc.carbs += it.carbs;
            acc.fat += it.fat;
          }
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, meals: meals.length }
      )
    : null;

  const finance = txs.length
    ? txs.reduce(
        (acc, t) => {
          if (t.type === "income") acc.income += t.amount;
          else acc.expenses += t.amount;
          acc.netChange = acc.income - acc.expenses;
          return acc;
        },
        { income: 0, expenses: 0, netChange: 0 }
      )
    : null;

  return {
    date,
    habitsCompleted,
    nutrition,
    workout: workout
      ? {
          name: workout.name,
          durationMinutes: workout.durationMinutes,
          volume: workout.totalVolume,
          prsHit: workout.prsHit,
          exercises: workout.exercises.length,
        }
      : null,
    tasksCompleted: tasks.filter((t) => t.status === "done").length,
    tasksTotal: tasks.length,
    pomodoros: pomodoros.length,
    finance,
  };
}

async function gatherAggregates(
  userId: string,
  from: string,
  to: string
): Promise<PromptContext["aggregates"]> {
  const [habits, habitLogs, workouts, meals, txs] = await Promise.all([
    prisma.habit.findMany({ where: { userId, isActive: true }, select: { id: true, name: true } }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { habitId: true, completed: true, date: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { totalVolume: true, prsHit: true },
    }),
    prisma.mealLog.findMany({
      where: { userId, date: { gte: from, lte: to } },
      include: { items: { select: { calories: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { amount: true, type: true },
    }),
  ]);

  const logsByHabit = new Map<string, { total: number; done: number }>();
  for (const h of habits) logsByHabit.set(h.id, { total: 0, done: 0 });
  for (const l of habitLogs) {
    const bucket = logsByHabit.get(l.habitId);
    if (!bucket) continue;
    bucket.total += 1;
    if (l.completed) bucket.done += 1;
  }

  let bestHabit: { name: string; pct: number } | undefined;
  let worstHabit: { name: string; pct: number } | undefined;
  let totalCompletion = 0;
  let habitsCounted = 0;
  for (const h of habits) {
    const bucket = logsByHabit.get(h.id);
    if (!bucket || bucket.total === 0) continue;
    const pct = bucket.done / bucket.total;
    totalCompletion += pct;
    habitsCounted++;
    if (!bestHabit || pct > bestHabit.pct) bestHabit = { name: h.name, pct };
    if (!worstHabit || pct < worstHabit.pct) worstHabit = { name: h.name, pct };
  }

  const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);
  const totalPRs = workouts.reduce((s, w) => s + w.prsHit, 0);

  const totalCals = meals.reduce(
    (s, m) => s + m.items.reduce((ss, i) => ss + i.calories, 0),
    0
  );
  const daysWithMeals = new Set(meals.map((m) => m.date)).size;
  const caloriesAverage =
    daysWithMeals > 0 ? totalCals / daysWithMeals : undefined;

  const netIncome = txs.reduce(
    (s, t) => s + (t.type === "income" ? t.amount : -t.amount),
    0
  );

  const daysActive = new Set([
    ...habitLogs.map((l) => l.date),
    ...meals.map((m) => m.date),
  ]).size;

  return {
    daysActive,
    habitAverageCompletion: habitsCounted > 0 ? totalCompletion / habitsCounted : 0,
    bestHabit,
    worstHabit,
    workoutsCount: workouts.length,
    totalVolumeKg: totalVolume || undefined,
    caloriesAverage,
    netIncome: txs.length ? netIncome : undefined,
    newPRs: totalPRs || undefined,
  };
}
