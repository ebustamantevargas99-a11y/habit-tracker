import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estimate1RM } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function trend(recent: number[], older: number[]): "improving" | "declining" | "stable" {
  const r = avg(recent);
  const o = avg(older);
  if (o === 0) return "stable";
  const change = (r - o) / o;
  if (change > 0.10) return "improving";
  if (change < -0.10) return "declining";
  return "stable";
}

function dateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function dayOfWeekES(dateStr: string): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[new Date(dateStr).getDay()];
}

function topN<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T,
  n = 5
): T[] {
  return [...arr].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n);
}

function countBy<T>(arr: T[], fn: (item: T) => string): { key: string; count: number }[] {
  const map: Record<string, number> = {};
  arr.forEach((item) => {
    const k = fn(item);
    map[k] = (map[k] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function lifeScoreFrom(parts: {
  habits: number;
  fitness: number;
  finance: number;
  wellness: number;
  productivity: number;
}): number {
  return Math.round(
    parts.habits * 0.22 +
    parts.fitness * 0.22 +
    parts.finance * 0.18 +
    parts.wellness * 0.22 +
    parts.productivity * 0.16
  );
}

const LEVELS = [
  "Iniciante", "Aprendiz", "Practicante", "Dedicado", "Comprometido",
  "Experto", "Maestro", "Gran Maestro", "Leyenda", "Inmortal",
];

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 365);
  const format = searchParams.get("format"); // "markdown" | null
  const { from } = dateRange(days);
  const today = new Date().toISOString().split("T")[0];

  // ── Parallel queries ───────────────────────────────────────────────────────

  const [
    user,
    habits,
    habitLogs,
    workouts,
    personalRecords,
    bodyMetrics,
    weightLogs,
    stepsLogs,
    fastingLogs,
    transactions,
    budgets,
    bills,
    subscriptions,
    wishlist,
    moodLogs,
    sleepLogs,
    hydrationLogs,
    medications,
    medicationLogs,
    symptomLogs,
    appointments,
    dailyPlans,
    pomodoroSessions,
    projects,
    okrObjectives,
    gamification,
    badges,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, profile: { select: { timezone: true } } },
    }),
    prisma.habit.findMany({
      where: { userId, isActive: true },
      select: {
        id: true, name: true, category: true, frequency: true, timeOfDay: true,
        streakCurrent: true, streakBest: true, strength: true, createdAt: true,
      },
    }),
    prisma.habitLog.findMany({
      where: { userId, date: { gte: from } },
      select: { habitId: true, date: true, completed: true },
      orderBy: { date: "desc" },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        exercises: {
          include: {
            exercise: { select: { name: true, muscleGroup: true } },
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    }),
    prisma.personalRecord.findMany({
      where: { userId },
      select: { exerciseName: true, weight: true, reps: true, estimated1RM: true, date: true },
      orderBy: { date: "desc" },
    }),
    prisma.bodyMetric.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, type: true, value: true, unit: true },
      orderBy: { date: "desc" },
    }),
    prisma.weightLog.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, weight: true },
      orderBy: { date: "desc" },
    }),
    prisma.stepsLog.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, steps: true },
      orderBy: { date: "desc" },
    }),
    prisma.fastingLog.findMany({
      where: { userId, createdAt: { gte: new Date(from) } },
      select: { startTime: true, endTime: true, targetHours: true, completed: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, description: true, amount: true, type: true, category: true },
      orderBy: { date: "desc" },
    }),
    prisma.budget.findMany({
      where: { userId },
      select: { category: true, limit: true, month: true },
    }),
    prisma.bill.findMany({
      where: { userId },
      select: { name: true, amount: true, dueDate: true, isPaid: true },
    }),
    prisma.subscription.findMany({
      where: { userId, isActive: true },
      select: { name: true, amount: true, billingCycle: true, category: true },
    }),
    prisma.wishlistItem.findMany({
      where: { userId, isPurchased: false },
      select: { name: true, price: true, priority: true, savedAmount: true },
    }),
    prisma.moodLog.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, mood: true, emotions: true, factors: true },
      orderBy: { date: "desc" },
    }),
    prisma.sleepLog.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, quality: true, durationHours: true, bedtime: true, wakeTime: true },
      orderBy: { date: "desc" },
    }),
    prisma.hydrationLog.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, amountMl: true, goalMl: true },
      orderBy: { date: "desc" },
    }),
    prisma.medication.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, brand: true, dosage: true, frequency: true },
    }),
    prisma.medicationLog.findMany({
      where: { userId, date: { gte: from } },
      select: { medicationId: true, date: true, taken: true },
    }),
    prisma.symptomLog.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, symptom: true, intensity: true, duration: true, notes: true },
      orderBy: { date: "desc" },
    }),
    prisma.medicalAppointment.findMany({
      where: { userId },
      select: { doctorName: true, specialty: true, dateTime: true, location: true, reason: true, status: true, result: true },
      orderBy: { dateTime: "asc" },
    }),
    prisma.dailyPlan.findMany({
      where: { userId, date: { gte: from } },
      select: { date: true, rating: true, timeBlocks: { select: { completed: true } } },
    }),
    prisma.pomodoroSession.findMany({
      where: { userId, date: { gte: from }, isWork: true },
      select: { date: true, task: true, duration: true },
    }),
    prisma.project.findMany({
      where: { userId, status: "active" },
      select: { name: true, tasks: { select: { status: true } } },
    }),
    prisma.oKRObjective.findMany({
      where: { userId, isActive: true },
      select: {
        title: true, progress: true,
        keyResults: { select: { title: true, targetValue: true, currentValue: true, unit: true } },
      },
    }),
    prisma.gamification.findUnique({
      where: { userId },
      select: { totalXP: true, currentLevel: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    }),
  ]);

  // ── Second batch: nutrition + organization ─────────────────────────────────
  const [mealLogs, nutritionGoal, lifeAreasList, weeklyReviewsList, notesList] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId, date: { gte: from } },
      include: { items: true },
      orderBy: { date: "desc" },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId } }),
    prisma.lifeArea.findMany({
      where: { userId },
      select: { name: true, emoji: true, score: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { weekStart: "desc" },
      take: 4,
    }),
    prisma.note.findMany({
      where: { userId },
      select: { title: true, category: true, tags: true, isPinned: true, updatedAt: true },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  // ════════════════════════════════════════════════════════
  //  HABITS
  // ════════════════════════════════════════════════════════

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const habitsMapped = habits.map((h) => {
    const logs30 = habitLogs.filter(
      (l) => l.habitId === h.id && l.date >= thirtyDaysAgoStr
    );
    const logs7 = habitLogs.filter(
      (l) => l.habitId === h.id && l.date >= sevenDaysAgoStr
    );
    const completionRate30d =
      logs30.length > 0
        ? Math.round((logs30.filter((l) => l.completed).length / 30) * 100)
        : 0;
    const completionRate7d =
      logs7.length > 0
        ? Math.round((logs7.filter((l) => l.completed).length / 7) * 100)
        : 0;
    const recentLogs = habitLogs
      .filter((l) => l.habitId === h.id)
      .slice(0, 14)
      .map((l) => ({ date: l.date, completed: l.completed }));
    return {
      name: h.name,
      category: h.category,
      frequency: h.frequency,
      timeOfDay: h.timeOfDay,
      streakCurrent: h.streakCurrent,
      streakBest: h.streakBest,
      strength: Math.round(h.strength),
      completionRate30d,
      completionRate7d,
      createdAt: h.createdAt.toISOString().split("T")[0],
      recentLogs,
    };
  });

  // Best/worst day of week
  const completedByDay: Record<string, number[]> = {};
  habitLogs
    .filter((l) => l.completed && l.date >= thirtyDaysAgoStr)
    .forEach((l) => {
      const dow = dayOfWeekES(l.date);
      if (!completedByDay[dow]) completedByDay[dow] = [];
      completedByDay[dow].push(1);
    });
  const allLogs30 = habitLogs.filter((l) => l.date >= thirtyDaysAgoStr);
  const totalByDay: Record<string, number> = {};
  allLogs30.forEach((l) => {
    const dow = dayOfWeekES(l.date);
    totalByDay[dow] = (totalByDay[dow] ?? 0) + 1;
  });
  const rateByDay = Object.entries(totalByDay).map(([dow, total]) => ({
    dow,
    rate: total > 0 ? (completedByDay[dow]?.length ?? 0) / total : 0,
  }));
  const bestDay = rateByDay.sort((a, b) => b.rate - a.rate)[0]?.dow ?? "—";
  const worstDay = rateByDay.sort((a, b) => a.rate - b.rate)[0]?.dow ?? "—";

  const morningLogs = allLogs30.filter((l) => {
    const habit = habits.find((h) => h.id === l.habitId);
    return habit?.timeOfDay === "morning";
  });
  const eveningLogs = allLogs30.filter((l) => {
    const habit = habits.find((h) => h.id === l.habitId);
    return habit?.timeOfDay === "evening";
  });
  const morningRate =
    morningLogs.length > 0
      ? Math.round(
          (morningLogs.filter((l) => l.completed).length / morningLogs.length) * 100
        )
      : 0;
  const eveningRate =
    eveningLogs.length > 0
      ? Math.round(
          (eveningLogs.filter((l) => l.completed).length / eveningLogs.length) * 100
        )
      : 0;

  const completionsLast7 = habitLogs
    .filter((l) => l.completed && l.date >= sevenDaysAgoStr)
    .map((l) => l.completed ? 1 : 0) as number[];
  const completionsPrev7 = habitLogs
    .filter((l) => l.completed && l.date >= fourteenDaysAgoStr && l.date < sevenDaysAgoStr)
    .map(() => 1) as number[];
  const habitsTrend = trend(completionsLast7, completionsPrev7);

  const avgCompletionRate =
    habitsMapped.length > 0
      ? Math.round(
          habitsMapped.reduce((s, h) => s + h.completionRate30d, 0) / habitsMapped.length
        )
      : 0;
  const totalCompletionsThisMonth = habitLogs.filter(
    (l) => l.completed && l.date >= thirtyDaysAgoStr
  ).length;

  const habitsSection = {
    summary: {
      totalActive: habits.length,
      averageCompletionRate: avgCompletionRate,
      averageStrength: habitsMapped.length > 0
        ? Math.round(habitsMapped.reduce((s, h) => s + h.strength, 0) / habitsMapped.length)
        : 0,
      longestActiveStreak: habits.reduce((max, h) => Math.max(max, h.streakCurrent), 0),
      totalCompletionsThisMonth,
    },
    habits: habitsMapped,
    insights: {
      bestDay,
      worstDay,
      morningVsEveningRate: { morning: morningRate, evening: eveningRate },
      trendsDirection: habitsTrend,
    },
  };

  // ════════════════════════════════════════════════════════
  //  FITNESS
  // ════════════════════════════════════════════════════════

  const thisMonth = today.substring(0, 7);
  const lastMonth = (() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  })();

  const workoutsThisMonth = workouts.filter((w) => w.date.startsWith(thisMonth));
  const workoutsLastMonth = workouts.filter((w) => w.date.startsWith(lastMonth));
  const totalVolumeLast30d = workouts.reduce((s, w) => s + w.totalVolume, 0);

  // Most trained muscle group
  const muscleCount: Record<string, number> = {};
  workouts.forEach((w) =>
    w.exercises.forEach((e) => {
      const mg = e.exercise.muscleGroup;
      muscleCount[mg] = (muscleCount[mg] ?? 0) + 1;
    })
  );
  const mostTrainedMuscleGroup =
    Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const recentWorkouts = workouts.slice(0, 10).map((w) => ({
    date: w.date,
    name: w.name,
    durationMinutes: w.durationMinutes,
    totalVolume: Math.round(w.totalVolume),
    exercises: w.exercises.map((e) => {
      const bestSet = e.sets.reduce(
        (best, s) => (s.weight * s.reps > best.weight * best.reps ? s : best),
        { weight: 0, reps: 0 } as { weight: number; reps: number }
      );
      return {
        name: e.exercise.name,
        muscleGroup: e.exercise.muscleGroup,
        sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps, ...(s.rpe ? { rpe: s.rpe } : {}) })),
        estimated1RM: estimate1RM(bestSet.weight, bestSet.reps),
      };
    }),
  }));

  const stepsLast7 = stepsLogs
    .filter((s) => s.date >= sevenDaysAgoStr)
    .map((s) => s.steps);
  const stepsAverage7d = Math.round(avg(stepsLast7));
  const stepsAverage30d = Math.round(avg(stepsLogs.map((s) => s.steps)));

  const latestWeight =
    weightLogs.length > 0
      ? { value: weightLogs[0].weight, date: weightLogs[0].date, unit: "kg" }
      : null;

  const weightTrend30d = weightLogs
    .slice(0, 30)
    .reverse()
    .map((w) => ({ date: w.date, value: w.weight }));

  const latestBodyFat = (() => {
    const bfMetric = bodyMetrics.find((m) => m.type === "bodyFat");
    return bfMetric ? { value: bfMetric.value, date: bfMetric.date } : null;
  })();

  const completedFasting = fastingLogs.filter((f) => f.completed);
  const currentFastingStreak = (() => {
    let streak = 0;
    const sortedFasting = fastingLogs
      .filter((f) => f.completed)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    for (let i = 0; i < sortedFasting.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const logDate = new Date(sortedFasting[i].startTime).toISOString().split("T")[0];
      if (logDate === expected.toISOString().split("T")[0]) streak++;
      else break;
    }
    return streak;
  })();

  const avgFastingDuration =
    completedFasting.length > 0
      ? Math.round(
          avg(
            completedFasting.map((f) => {
              if (!f.endTime) return f.targetHours;
              return (
                (new Date(f.endTime).getTime() - new Date(f.startTime).getTime()) /
                3600000
              );
            })
          )
        )
      : 0;

  const fitnessSection = {
    summary: {
      totalWorkoutsThisMonth: workoutsThisMonth.length,
      totalWorkoutsLastMonth: workoutsLastMonth.length,
      averageWorkoutsPerWeek: Math.round((workouts.length / (days / 7)) * 10) / 10,
      totalVolumeLast30d: Math.round(totalVolumeLast30d),
      prsHitThisMonth: workoutsThisMonth.reduce((s, w) => s + w.prsHit, 0),
      mostTrainedMuscleGroup,
    },
    recentWorkouts,
    personalRecords: personalRecords.map((pr) => ({
      exercise: pr.exerciseName,
      weight: pr.weight,
      reps: pr.reps,
      estimated1RM: pr.estimated1RM,
      achievedAt: pr.date,
    })),
    bodyMetrics: {
      latestWeight,
      weightTrend30d,
      latestBodyFat,
      stepsAverage7d,
      stepsAverage30d,
    },
    fasting: {
      totalCompletedThisMonth: completedFasting.filter((f) =>
        new Date(f.startTime).toISOString().substring(0, 7) === thisMonth
      ).length,
      averageDuration: avgFastingDuration,
      currentStreak: currentFastingStreak,
    },
  };

  // ════════════════════════════════════════════════════════
  //  FINANCE
  // ════════════════════════════════════════════════════════

  const txThisMonth = transactions.filter((t) => t.date.startsWith(thisMonth));
  const txLastMonth = transactions.filter((t) => t.date.startsWith(lastMonth));

  const incomeThisMonth = txThisMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expensesThisMonth = txThisMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const incomeLastMonth = txLastMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expensesLastMonth = txLastMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const netSavings = incomeThisMonth - expensesThisMonth;
  const savingsRate =
    incomeThisMonth > 0 ? Math.round((netSavings / incomeThisMonth) * 100) : 0;
  const prevNet = incomeLastMonth - expensesLastMonth;
  const momChange =
    prevNet !== 0
      ? Math.round(((netSavings - prevNet) / Math.abs(prevNet)) * 100)
      : 0;

  const expByCategory: Record<string, number> = {};
  txThisMonth
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expByCategory[t.category] = (expByCategory[t.category] ?? 0) + t.amount;
    });

  const currentMonthBudgets = budgets.filter((b) => b.month === thisMonth);
  const budgetStatus = currentMonthBudgets.map((b) => {
    const spent = expByCategory[b.category] ?? 0;
    return {
      category: b.category,
      limit: Math.round(b.limit),
      spent: Math.round(spent),
      remaining: Math.round(Math.max(0, b.limit - spent)),
      percentUsed: Math.round((spent / b.limit) * 100),
    };
  });

  const topExpenseCategories = Object.entries(expByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => {
      const budget = currentMonthBudgets.find((b) => b.category === category);
      return {
        category,
        amount: Math.round(amount),
        percentOfTotal:
          expensesThisMonth > 0 ? Math.round((amount / expensesThisMonth) * 100) : 0,
        budgetLimit: budget ? Math.round(budget.limit) : null,
        budgetUsedPercent: budget
          ? Math.round((amount / budget.limit) * 100)
          : null,
      };
    });

  const totalMonthlyRecurring =
    bills.filter((b) => !b.isPaid).reduce((s, b) => s + b.amount, 0) +
    subscriptions
      .filter((s) => s.billingCycle === "monthly")
      .reduce((s, sub) => s + sub.amount, 0);

  const financeSection = {
    summary: {
      totalIncomeThisMonth: Math.round(incomeThisMonth),
      totalExpensesThisMonth: Math.round(expensesThisMonth),
      netSavingsThisMonth: Math.round(netSavings),
      savingsRate,
      totalIncomeLastMonth: Math.round(incomeLastMonth),
      totalExpensesLastMonth: Math.round(expensesLastMonth),
      monthOverMonthChange: momChange,
    },
    topExpenseCategories,
    budgetStatus,
    recurringExpenses: {
      bills: bills.map((b) => ({
        name: b.name,
        amount: Math.round(b.amount),
        dueDate: b.dueDate,
        isPaid: b.isPaid,
      })),
      subscriptions: subscriptions.map((s) => ({
        name: s.name,
        amount: Math.round(s.amount),
        billingCycle: s.billingCycle,
        category: s.category,
      })),
      totalMonthlyRecurring: Math.round(totalMonthlyRecurring),
    },
    wishlist: {
      items: wishlist.map((w) => ({
        name: w.name,
        price: w.price,
        priority: w.priority,
        savedAmount: w.savedAmount,
        progressPercent:
          w.price > 0 ? Math.round((w.savedAmount / w.price) * 100) : 0,
      })),
      totalNeeded: Math.round(wishlist.reduce((s, w) => s + w.price, 0)),
      totalSaved: Math.round(wishlist.reduce((s, w) => s + w.savedAmount, 0)),
    },
    recentTransactions: transactions.slice(0, 20).map((t) => ({
      date: t.date,
      description: t.description,
      amount: Math.round(t.amount),
      type: t.type as "income" | "expense",
      category: t.category,
    })),
  };

  // ════════════════════════════════════════════════════════
  //  WELLNESS
  // ════════════════════════════════════════════════════════

  const moodLast7 = moodLogs.filter((m) => m.date >= sevenDaysAgoStr).map((m) => m.mood);
  const moodPrev7 = moodLogs
    .filter((m) => m.date >= fourteenDaysAgoStr && m.date < sevenDaysAgoStr)
    .map((m) => m.mood);
  const moodLast30 = moodLogs.filter((m) => m.date >= thirtyDaysAgoStr).map((m) => m.mood);

  const allEmotions = moodLogs.flatMap((m) => m.emotions);
  const allFactors = moodLogs.flatMap((m) => m.factors);
  const topEmotions = countBy(allEmotions, (e) => e)
    .slice(0, 5)
    .map(({ key, count }) => ({ emotion: key, count }));
  const topFactors = countBy(allFactors, (f) => f)
    .slice(0, 5)
    .map(({ key, count }) => ({ factor: key, count }));

  const sleepLast7 = sleepLogs.filter((s) => s.date >= sevenDaysAgoStr);
  const sleepPrev7 = sleepLogs.filter(
    (s) => s.date >= fourteenDaysAgoStr && s.date < sevenDaysAgoStr
  );
  const sleepLast30 = sleepLogs.filter((s) => s.date >= thirtyDaysAgoStr);

  const avgSleepDuration7d = avg(sleepLast7.map((s) => s.durationHours));
  const avgSleepDuration30d = avg(sleepLast30.map((s) => s.durationHours));

  const avgBedtime = (() => {
    if (sleepLast7.length === 0) return "—";
    const times = sleepLast7.map((s) => {
      const [h, m] = s.bedtime.split(":").map(Number);
      return h * 60 + (m || 0);
    });
    const meanMin = Math.round(avg(times));
    return `${String(Math.floor(meanMin / 60)).padStart(2, "0")}:${String(meanMin % 60).padStart(2, "0")}`;
  })();

  const avgWakeTime = (() => {
    if (sleepLast7.length === 0) return "—";
    const times = sleepLast7.map((s) => {
      const [h, m] = s.wakeTime.split(":").map(Number);
      return h * 60 + (m || 0);
    });
    const meanMin = Math.round(avg(times));
    return `${String(Math.floor(meanMin / 60)).padStart(2, "0")}:${String(meanMin % 60).padStart(2, "0")}`;
  })();

  const hydrationGoalMet = hydrationLogs.filter(
    (h) => h.goalMl > 0 && h.amountMl >= h.goalMl
  ).length;
  const hydrationGoalRate =
    hydrationLogs.length > 0
      ? Math.round((hydrationGoalMet / hydrationLogs.length) * 100)
      : 0;
  const avgGlasses7d =
    hydrationLogs.filter((h) => h.date >= sevenDaysAgoStr).length > 0
      ? Math.round(
          avg(
            hydrationLogs
              .filter((h) => h.date >= sevenDaysAgoStr)
              .map((h) => Math.round(h.amountMl / 250))
          )
        )
      : 0;

  const medAdherence = medications.map((med) => {
    const logs30 = medicationLogs.filter(
      (l) => l.medicationId === med.id && l.date >= thirtyDaysAgoStr
    );
    const takenCount = logs30.filter((l) => l.taken).length;
    const rate = logs30.length > 0 ? Math.round((takenCount / logs30.length) * 100) : 0;
    return {
      name: med.name,
      brand: med.brand ?? null,
      dose: med.dosage ?? null,
      frequency: med.frequency,
      adherenceRate30d: rate,
    };
  });
  const overallAdherence =
    medAdherence.length > 0
      ? Math.round(avg(medAdherence.map((m) => m.adherenceRate30d)))
      : 100;

  const symptomMap: Record<string, { count: number; totalIntensity: number }> = {};
  symptomLogs.forEach((s) => {
    if (!symptomMap[s.symptom]) symptomMap[s.symptom] = { count: 0, totalIntensity: 0 };
    symptomMap[s.symptom].count++;
    symptomMap[s.symptom].totalIntensity += s.intensity;
  });
  const topSymptoms = Object.entries(symptomMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([symptom, data]) => ({
      symptom,
      occurrences: data.count,
      averageIntensity: Math.round(data.totalIntensity / data.count),
    }));

  const symptomCountLast7 = symptomLogs.filter((s) => s.date >= sevenDaysAgoStr).length;
  const symptomCountPrev7 = symptomLogs.filter(
    (s) => s.date >= fourteenDaysAgoStr && s.date < sevenDaysAgoStr
  ).length;
  const symptomTrend: "increasing" | "decreasing" | "stable" =
    symptomCountLast7 > symptomCountPrev7 * 1.1
      ? "increasing"
      : symptomCountLast7 < symptomCountPrev7 * 0.9
      ? "decreasing"
      : "stable";

  const nowISO = new Date().toISOString();
  const upcomingAppts = appointments.filter(
    (a) => a.status !== "completed" && a.dateTime >= nowISO
  );
  const pastAppts = appointments.filter(
    (a) => a.status === "completed" || a.dateTime < nowISO
  ).slice(0, 5);

  const wellnessSection = {
    mood: {
      averageMood7d: avg(moodLast7),
      averageMood30d: avg(moodLast30),
      moodTrend: trend(moodLast7, moodPrev7),
      topEmotions,
      topFactors,
      recentLogs: moodLogs.slice(0, 14).map((m) => ({
        date: m.date,
        mood: m.mood,
        emotions: m.emotions,
        factors: m.factors,
      })),
    },
    sleep: {
      averageQuality7d: avg(sleepLast7.map((s) => s.quality)),
      averageQuality30d: avg(sleepLast30.map((s) => s.quality)),
      averageDuration7d: avgSleepDuration7d,
      averageDuration30d: avgSleepDuration30d,
      averageBedtime: avgBedtime,
      averageWakeTime: avgWakeTime,
      sleepTrend: trend(
        sleepLast7.map((s) => s.quality),
        sleepPrev7.map((s) => s.quality)
      ),
      recentLogs: sleepLogs.slice(0, 14).map((s) => ({
        date: s.date,
        quality: s.quality,
        duration: s.durationHours,
        bedtime: s.bedtime,
        wakeTime: s.wakeTime,
      })),
    },
    hydration: {
      averageGlasses7d: avgGlasses7d,
      goalCompletionRate30d: hydrationGoalRate,
      recentLogs: hydrationLogs.slice(0, 14).map((h) => ({
        date: h.date,
        glasses: Math.round(h.amountMl / 250),
        goal: Math.round(h.goalMl / 250),
      })),
    },
    medications: {
      active: medAdherence,
      overallAdherence30d: overallAdherence,
    },
    symptoms: {
      recentSymptoms: symptomLogs.slice(0, 14).map((s) => ({
        date: s.date,
        symptom: s.symptom,
        intensity: s.intensity,
        duration: s.duration ?? null,
        notes: s.notes ?? null,
      })),
      topSymptoms,
      symptomTrend,
    },
    appointments: {
      upcoming: upcomingAppts.slice(0, 5).map((a) => ({
        doctorName: a.doctorName,
        specialty: a.specialty,
        dateTime: a.dateTime,
        location: a.location ?? null,
        reason: a.reason ?? null,
      })),
      recentCompleted: pastAppts.map((a) => ({
        doctorName: a.doctorName,
        specialty: a.specialty,
        date: a.dateTime.substring(0, 10),
        result: a.result ?? null,
      })),
    },
  };

  // ════════════════════════════════════════════════════════
  //  PRODUCTIVITY
  // ════════════════════════════════════════════════════════

  const plannedDays = dailyPlans.length;
  const ratings = dailyPlans.filter((p) => p.rating !== null).map((p) => p.rating as number);
  const totalBlocks = dailyPlans.reduce((s, p) => s + p.timeBlocks.length, 0);
  const completedBlocks = dailyPlans.reduce(
    (s, p) => s + p.timeBlocks.filter((b) => b.completed).length,
    0
  );

  const pomoByTask: Record<string, { sessions: number; minutes: number }> = {};
  pomodoroSessions.forEach((p) => {
    const key = p.task ?? "Sin categoría";
    if (!pomoByTask[key]) pomoByTask[key] = { sessions: 0, minutes: 0 };
    pomoByTask[key].sessions++;
    pomoByTask[key].minutes += p.duration;
  });
  const topPomoCategories = Object.entries(pomoByTask)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .slice(0, 5)
    .map(([category, data]) => ({ category, ...data }));

  const productivitySection = {
    planner: {
      daysPlannedThisMonth: plannedDays,
      averageDayRating: ratings.length > 0 ? avg(ratings) : null,
      completedTimeBlocks30d: completedBlocks,
      totalTimeBlocks30d: totalBlocks,
      completionRate:
        totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0,
    },
    pomodoro: {
      totalSessionsThisMonth: pomodoroSessions.length,
      totalMinutesThisMonth: pomodoroSessions.reduce((s, p) => s + p.duration, 0),
      averageSessionsPerDay:
        Math.round((pomodoroSessions.length / (days || 1)) * 10) / 10,
      topCategories: topPomoCategories,
    },
    projects: {
      active: projects.map((p) => {
        const tasks = p.tasks;
        const done = tasks.filter((t) => t.status === "done").length;
        const inProgress = tasks.filter((t) => t.status === "in_progress" || t.status === "inProgress").length;
        const todo = tasks.filter((t) => t.status === "todo").length;
        return {
          name: p.name,
          totalTasks: tasks.length,
          completedTasks: done,
          progressPercent:
            tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
          tasksByStatus: { todo, inProgress, done },
        };
      }),
    },
    okr: {
      objectives: okrObjectives.map((o) => ({
        title: o.title,
        progress: Math.round(o.progress),
        keyResults: o.keyResults.map((kr) => ({
          title: kr.title,
          target: kr.targetValue,
          current: kr.currentValue,
          unit: kr.unit ?? null,
          progressPercent:
            kr.targetValue > 0
              ? Math.round((kr.currentValue / kr.targetValue) * 100)
              : 0,
        })),
      })),
    },
  };

  // ════════════════════════════════════════════════════════
  //  GAMIFICATION
  // ════════════════════════════════════════════════════════

  const level = gamification?.currentLevel ?? 1;
  const totalXP = gamification?.totalXP ?? 0;
  const xpForLevel = level * 100;
  const xpProgress = Math.min(Math.round((totalXP % xpForLevel) / xpForLevel * 100), 100);
  const levelName = LEVELS[Math.min(level - 1, LEVELS.length - 1)];

  const gamificationSection = {
    level,
    levelName,
    totalXP,
    xpProgress,
    badges: badges.map((b) => b.badgeId),
  };

  // ════════════════════════════════════════════════════════
  //  NUTRITION
  // ════════════════════════════════════════════════════════

  // Daily totals per date
  const nutritionByDate: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  for (const meal of mealLogs) {
    if (!nutritionByDate[meal.date]) nutritionByDate[meal.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of meal.items) {
      nutritionByDate[meal.date].calories += item.calories;
      nutritionByDate[meal.date].protein += item.protein;
      nutritionByDate[meal.date].carbs += item.carbs;
      nutritionByDate[meal.date].fat += item.fat;
    }
  }

  const loggedDays = Object.values(nutritionByDate);
  const loggedDayCount = loggedDays.filter((d) => d.calories > 0).length || 1;

  const avgNutritionCalories = Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDayCount);
  const avgNutritionProtein = Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDayCount);
  const avgNutritionCarbs = Math.round(loggedDays.reduce((s, d) => s + d.carbs, 0) / loggedDayCount);
  const avgNutritionFat = Math.round(loggedDays.reduce((s, d) => s + d.fat, 0) / loggedDayCount);

  // Macro distribution
  const totalCalFromMacros = avgNutritionProtein * 4 + avgNutritionCarbs * 4 + avgNutritionFat * 9;
  const macroPct = totalCalFromMacros > 0 ? {
    protein: Math.round((avgNutritionProtein * 4 / totalCalFromMacros) * 100),
    carbs: Math.round((avgNutritionCarbs * 4 / totalCalFromMacros) * 100),
    fat: Math.round((avgNutritionFat * 9 / totalCalFromMacros) * 100),
  } : { protein: 0, carbs: 0, fat: 0 };

  // Goal adherence
  const goalAdherence = nutritionGoal && avgNutritionCalories > 0 ? {
    calories: Math.round((avgNutritionCalories / nutritionGoal.calories) * 100),
    protein: Math.round((avgNutritionProtein / nutritionGoal.protein) * 100),
  } : null;

  // Meal type distribution
  const mealTypeCount: Record<string, number> = {};
  for (const m of mealLogs) {
    mealTypeCount[m.mealType] = (mealTypeCount[m.mealType] ?? 0) + 1;
  }

  const nutritionSection = {
    summary: {
      daysLogged: loggedDayCount,
      averageCalories: avgNutritionCalories,
      averageProtein: avgNutritionProtein,
      averageCarbs: avgNutritionCarbs,
      averageFat: avgNutritionFat,
      macroDistributionPct: macroPct,
    },
    goal: nutritionGoal ? {
      calories: nutritionGoal.calories,
      protein: nutritionGoal.protein,
      carbs: nutritionGoal.carbs,
      fat: nutritionGoal.fat,
    } : null,
    goalAdherence,
    mealTypeDistribution: mealTypeCount,
    dailyLogs: Object.entries(nutritionByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 14)
      .map(([date, totals]) => ({
        date,
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      })),
  };

  // ════════════════════════════════════════════════════════
  //  ORGANIZATION
  // ════════════════════════════════════════════════════════

  const avgLifeScore =
    lifeAreasList.length > 0
      ? Math.round((lifeAreasList.reduce((s, a) => s + a.score, 0) / lifeAreasList.length) * 10) / 10
      : 0;

  const gapAreas = lifeAreasList.filter((a) => a.score <= 4).map((a) => `${a.emoji} ${a.name} (${a.score}/10)`);
  const strongAreas = lifeAreasList.filter((a) => a.score >= 8).map((a) => `${a.emoji} ${a.name} (${a.score}/10)`);

  const noteCategoryCount: Record<string, number> = {};
  for (const n of notesList) {
    noteCategoryCount[n.category] = (noteCategoryCount[n.category] ?? 0) + 1;
  }

  const avgReviewRating =
    weeklyReviewsList.length > 0
      ? Math.round((weeklyReviewsList.reduce((s, r) => s + r.overallRating, 0) / weeklyReviewsList.length) * 10) / 10
      : null;

  const organizationSection = {
    notes: {
      total: notesList.length,
      pinned: notesList.filter((n) => n.isPinned).length,
      byCategory: noteCategoryCount,
    },
    lifeAreas: {
      areas: lifeAreasList,
      averageScore: avgLifeScore,
      gapAreas,
      strongAreas,
    },
    weeklyReviews: {
      lastFour: weeklyReviewsList.map((r) => ({
        weekStart: r.weekStart,
        overallRating: r.overallRating,
        energyLevel: r.energyLevel,
        productivityScore: r.productivityScore,
        winsCount: r.wins.length,
        challengesCount: r.challenges.length,
      })),
      averageOverallRating: avgReviewRating,
    },
  };

  // ════════════════════════════════════════════════════════
  //  CROSS-MODULE INSIGHTS
  // ════════════════════════════════════════════════════════

  // Build date index for cross correlations
  const allDates = Array.from(
    new Set([
      ...moodLogs.map((m) => m.date),
      ...sleepLogs.map((s) => s.date),
      ...habitLogs.map((h) => h.date),
      ...workouts.map((w) => w.date),
    ])
  )
    .filter((d) => d >= from)
    .sort()
    .slice(-30);

  const habitCountByDate: Record<string, { completed: number; total: number }> = {};
  habitLogs.forEach((l) => {
    if (!habitCountByDate[l.date]) habitCountByDate[l.date] = { completed: 0, total: 0 };
    habitCountByDate[l.date].total++;
    if (l.completed) habitCountByDate[l.date].completed++;
  });

  const sleepVsProductivity = allDates.map((date) => {
    const sleep = sleepLogs.find((s) => s.date === date);
    const mood = moodLogs.find((m) => m.date === date);
    const habits = habitCountByDate[date] ?? { completed: 0, total: 0 };
    return {
      date,
      sleepQuality: sleep?.quality ?? null,
      sleepDuration: sleep?.durationHours ?? null,
      habitsCompleted: habits.completed,
      habitTotal: habits.total,
      moodScore: mood?.mood ?? null,
    };
  });

  const exerciseVsMood = allDates.map((date) => {
    const workout = workouts.find((w) => w.date === date);
    const mood = moodLogs.find((m) => m.date === date);
    const sleep = sleepLogs.find((s) => s.date === date);
    return {
      date,
      workedOut: !!workout,
      totalVolume: workout ? Math.round(workout.totalVolume) : 0,
      moodScore: mood?.mood ?? null,
      sleepQuality: sleep?.quality ?? null,
    };
  });

  // Life Score
  const habitsScore = Math.min(avgCompletionRate, 100);
  const fitnessScore = Math.min(
    Math.round(((workouts.length / (days / 7)) / 4) * 100),
    100
  );
  const financeScore = Math.max(0, Math.min(50 + savingsRate, 100));
  const wellnessScore = Math.round(
    (avg(moodLast30) / 10) * 40 +
    (avg(sleepLast30.map((s) => s.quality)) / 10) * 40 +
    (hydrationGoalRate / 100) * 20
  );
  const productivityScore = Math.min(
    productivitySection.planner.completionRate * 0.5 +
    Math.min(pomodoroSessions.length * 2, 50),
    100
  );

  const lifeScoreBreakdown = {
    habits: Math.round(habitsScore),
    fitness: Math.round(fitnessScore),
    finance: Math.round(financeScore),
    wellness: Math.round(wellnessScore),
    productivity: Math.round(productivityScore),
  };
  const overallLifeScore = lifeScoreFrom(lifeScoreBreakdown);

  // Nutrition vs Fitness correlation
  const nutritionVsFitness = allDates.map((date) => {
    const workout = workouts.find((w) => w.date === date);
    const nutrition = nutritionByDate[date];
    return {
      date,
      workedOut: !!workout,
      workoutVolume: workout ? Math.round(workout.totalVolume) : 0,
      caloriesConsumed: nutrition ? Math.round(nutrition.calories) : null,
      proteinConsumed: nutrition ? Math.round(nutrition.protein) : null,
    };
  });

  const crossModuleInsights = {
    sleepVsProductivity,
    exerciseVsMood,
    nutritionVsFitness,
    lifeScore: {
      overall: overallLifeScore,
      breakdown: lifeScoreBreakdown,
    },
  };

  // ════════════════════════════════════════════════════════
  //  ASSEMBLE PACKAGE
  // ════════════════════════════════════════════════════════

  const pkg = {
    meta: {
      generatedAt: new Date().toISOString(),
      userId,
      timezone: user?.profile?.timezone ?? "America/Mexico_City",
      periodDays: days,
      appVersion: "1.0.0",
      exportFormat: "ai-context-v1",
    },
    habits: habitsSection,
    fitness: fitnessSection,
    finance: financeSection,
    wellness: wellnessSection,
    productivity: productivitySection,
    nutrition: nutritionSection,
    organization: organizationSection,
    gamification: gamificationSection,
    crossModuleInsights,
  };

  // ════════════════════════════════════════════════════════
  //  MARKDOWN FORMAT
  // ════════════════════════════════════════════════════════

  if (format === "markdown") {
    const userName = user?.name ?? "Usuario";
    const { overall, breakdown } = crossModuleInsights.lifeScore;
    const { habits: hs, fitness: fs, finance: fn, wellness: ws, productivity: ps, nutrition: ns, organization: os } = pkg;

    const workoutMoodsWithEx = exerciseVsMood.filter((d) => d.workedOut && d.moodScore !== null);
    const workoutMoodsWithout = exerciseVsMood.filter((d) => !d.workedOut && d.moodScore !== null);
    const avgMoodWithWorkout = avg(workoutMoodsWithEx.map((d) => d.moodScore as number));
    const avgMoodWithoutWorkout = avg(workoutMoodsWithout.map((d) => d.moodScore as number));
    const goodSleepDays = sleepVsProductivity.filter(
      (d) => (d.sleepDuration ?? 0) >= 7 && d.habitTotal > 0
    );
    const badSleepDays = sleepVsProductivity.filter(
      (d) => (d.sleepDuration ?? 0) > 0 && (d.sleepDuration ?? 0) < 7 && d.habitTotal > 0
    );
    const goodSleepHabitRate =
      goodSleepDays.length > 0
        ? Math.round(
            (goodSleepDays.reduce(
              (s, d) => s + d.habitsCompleted / d.habitTotal,
              0
            ) /
              goodSleepDays.length) *
              100
          )
        : 0;
    const badSleepHabitRate =
      badSleepDays.length > 0
        ? Math.round(
            (badSleepDays.reduce(
              (s, d) => s + d.habitsCompleted / d.habitTotal,
              0
            ) /
              badSleepDays.length) *
              100
          )
        : 0;

    const md = `# Resumen Ejecutivo — ${userName}
## Generado: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
## Período: últimos ${days} días

---

### 🎯 Life Score: ${overall}/100
- Hábitos: ${breakdown.habits}/100
- Fitness: ${breakdown.fitness}/100
- Finanzas: ${breakdown.finance}/100
- Bienestar: ${breakdown.wellness}/100
- Productividad: ${breakdown.productivity}/100

---

### 📊 Hábitos
- Hábitos activos: ${hs.summary.totalActive}
- Tasa de completado (30d): ${hs.summary.averageCompletionRate}%
- Fuerza promedio: ${hs.summary.averageStrength}/100
- Racha más larga activa: ${hs.summary.longestActiveStreak} días
- Completados este mes: ${hs.summary.totalCompletionsThisMonth}
- Mejor día: ${hs.insights.bestDay} | Peor día: ${hs.insights.worstDay}
- Mañana vs Noche: ${hs.insights.morningVsEveningRate.morning}% vs ${hs.insights.morningVsEveningRate.evening}%
- Tendencia: ${hs.insights.trendsDirection === "improving" ? "↑ Mejorando" : hs.insights.trendsDirection === "declining" ? "↓ Declinando" : "→ Estable"}

Hábitos:
${hs.habits.map((h) => `- ${h.name} (${h.category}): ${h.completionRate30d}% completado, racha ${h.streakCurrent}d`).join("\n")}

---

### 💪 Fitness
- Entrenamientos este mes: ${fs.summary.totalWorkoutsThisMonth} (mes anterior: ${fs.summary.totalWorkoutsLastMonth})
- Promedio por semana: ${fs.summary.averageWorkoutsPerWeek}
- Volumen total (${days}d): ${fs.summary.totalVolumeLast30d.toLocaleString()} kg
- PRs este mes: ${fs.summary.prsHitThisMonth}
- Grupo más entrenado: ${fs.summary.mostTrainedMuscleGroup}
- Peso actual: ${fs.bodyMetrics.latestWeight?.value ?? "—"} kg
- Pasos promedio (7d): ${fs.bodyMetrics.stepsAverage7d.toLocaleString()}
- Ayunos completados este mes: ${fs.fasting.totalCompletedThisMonth} (duración media: ${fs.fasting.averageDuration}h)

Récords Personales:
${fs.personalRecords.slice(0, 8).map((pr) => `- ${pr.exercise}: ${pr.weight}kg × ${pr.reps} reps → 1RM est. ${pr.estimated1RM}kg`).join("\n")}

---

### 💰 Finanzas
- Ingresos del mes: S/. ${fn.summary.totalIncomeThisMonth.toLocaleString()}
- Gastos del mes: S/. ${fn.summary.totalExpensesThisMonth.toLocaleString()}
- Ahorro neto: S/. ${fn.summary.netSavingsThisMonth.toLocaleString()} (${fn.summary.savingsRate}% tasa de ahorro)
- Cambio mes anterior: ${fn.summary.monthOverMonthChange > 0 ? "+" : ""}${fn.summary.monthOverMonthChange}%
- Gastos recurrentes: S/. ${fn.recurringExpenses.totalMonthlyRecurring.toLocaleString()}/mes

Top categorías de gasto:
${fn.topExpenseCategories.map((c) => `- ${c.category}: S/. ${c.amount.toLocaleString()} (${c.percentOfTotal}% del total${c.budgetUsedPercent !== null ? `, ${c.budgetUsedPercent}% del presupuesto` : ""})`).join("\n")}

Presupuesto:
${fn.budgetStatus.map((b) => `- ${b.category}: S/. ${b.spent}/${b.limit} (${b.percentUsed}%)`).join("\n") || "Sin presupuestos configurados"}

---

### 🧠 Bienestar
- Ánimo promedio (7d): ${ws.mood.averageMood7d}/10 | (30d): ${ws.mood.averageMood30d}/10
- Tendencia ánimo: ${ws.mood.moodTrend === "improving" ? "↑ Mejorando" : ws.mood.moodTrend === "declining" ? "↓ Declinando" : "→ Estable"}
- Emociones frecuentes: ${ws.mood.topEmotions.map((e) => e.emotion).join(", ") || "—"}
- Sueño promedio: ${ws.sleep.averageDuration7d}h/noche, calidad ${ws.sleep.averageQuality7d}/10
- Hora de dormir: ${ws.sleep.averageBedtime} | Despertar: ${ws.sleep.averageWakeTime}
- Tendencia sueño: ${ws.sleep.sleepTrend === "improving" ? "↑ Mejorando" : ws.sleep.sleepTrend === "declining" ? "↓ Declinando" : "→ Estable"}
- Hidratación: ${ws.hydration.averageGlasses7d} vasos/día, meta cumplida ${ws.hydration.goalCompletionRate30d}% del tiempo
- Adherencia medicamentos: ${ws.medications.overallAdherence30d}%
- Síntomas frecuentes: ${ws.symptoms.topSymptoms.map((s) => `${s.symptom} (×${s.occurrences})`).join(", ") || "Ninguno registrado"}
- Tendencia síntomas: ${ws.symptoms.symptomTrend === "increasing" ? "↑ Aumentando" : ws.symptoms.symptomTrend === "decreasing" ? "↓ Disminuyendo" : "→ Estable"}

Próximas citas médicas:
${ws.appointments.upcoming.map((a) => `- ${a.doctorName} (${a.specialty}): ${a.dateTime.substring(0, 10)}${a.reason ? ` — ${a.reason}` : ""}`).join("\n") || "Sin citas próximas"}

---

### ⚡ Productividad
- Días planificados: ${ps.planner.daysPlannedThisMonth}
- Calificación promedio del día: ${ps.planner.averageDayRating ?? "—"}/10
- Bloques completados: ${ps.planner.completedTimeBlocks30d}/${ps.planner.totalTimeBlocks30d} (${ps.planner.completionRate}%)
- Pomodoros completados: ${ps.pomodoro.totalSessionsThisMonth} (${ps.pomodoro.totalMinutesThisMonth} min)
- Proyectos activos: ${ps.projects.active.length}

Progreso de proyectos:
${ps.projects.active.map((p) => `- ${p.name}: ${p.completedTasks}/${p.totalTasks} tareas (${p.progressPercent}%)`).join("\n") || "Sin proyectos activos"}

OKRs:
${ps.okr.objectives.map((o) => `- ${o.title}: ${o.progress}%\n${o.keyResults.map((kr) => `  · ${kr.title}: ${kr.current}/${kr.target}${kr.unit ? " " + kr.unit : ""} (${kr.progressPercent}%)`).join("\n")}`).join("\n") || "Sin OKRs activos"}

---

### 🥗 Nutrición
- Días registrados: ${ns.summary.daysLogged}
- Calorías promedio: ${ns.summary.averageCalories} kcal/día${ns.goal ? ` (meta: ${ns.goal.calories} kcal, ${ns.goalAdherence?.calories ?? 0}%)` : ""}
- Proteína promedio: ${ns.summary.averageProtein}g/día${ns.goal ? ` (meta: ${ns.goal.protein}g, ${ns.goalAdherence?.protein ?? 0}%)` : ""}
- Carbohidratos promedio: ${ns.summary.averageCarbs}g/día
- Grasa promedio: ${ns.summary.averageFat}g/día
- Distribución macros: P ${ns.summary.macroDistributionPct.protein}% · C ${ns.summary.macroDistributionPct.carbs}% · G ${ns.summary.macroDistributionPct.fat}%

---

### 📋 Organización
- Notas totales: ${os.notes.total} (${os.notes.pinned} fijadas)
- Categorías de notas: ${Object.entries(os.notes.byCategory).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}
- Puntuación promedio Rueda de la Vida: ${os.lifeAreas.averageScore}/10
- Áreas fuertes (≥8): ${os.lifeAreas.strongAreas.join(", ") || "—"}
- Áreas de atención (≤4): ${os.lifeAreas.gapAreas.join(", ") || "—"}
${os.weeklyReviews.averageOverallRating !== null ? `- Rating promedio revisión semanal: ${os.weeklyReviews.averageOverallRating}/10` : ""}

Rueda de la Vida:
${os.lifeAreas.areas.map((a) => `- ${a.emoji} ${a.name}: ${a.score}/10`).join("\n") || "Sin áreas configuradas"}

---

### 🔗 Correlaciones Detectadas
${goodSleepDays.length > 0 || badSleepDays.length > 0 ? `- Días con buen sueño (≥7h): hábitos completados ${goodSleepHabitRate}% vs ${badSleepHabitRate}% con sueño insuficiente` : "- Sin suficientes datos de sueño para correlaciones"}
${workoutMoodsWithEx.length > 0 || workoutMoodsWithout.length > 0 ? `- Días con ejercicio: ánimo promedio ${avgMoodWithWorkout}/10 vs ${avgMoodWithoutWorkout}/10 sin ejercicio` : "- Sin suficientes datos de ejercicio para correlaciones"}

---
*Generado por Habit Tracker AI Context Engine v1 · Período: ${days} días*
`;

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="mi-vida-resumen-${today}.md"`,
      },
    });
  }

  // JSON response
  return NextResponse.json(pkg, {
    headers: {
      "Content-Disposition": `attachment; filename="mi-vida-ai-context-${today}.json"`,
    },
  });
}
