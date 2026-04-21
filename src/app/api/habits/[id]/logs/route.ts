import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  recalculateStreak,
  crossedMilestone,
  ROOTED_THRESHOLD,
} from "@/lib/habit-utils";
import {
  awardXP,
  checkFirstStepBadge,
  checkStreakBadges,
} from "@/lib/gamification-utils";
import { parseJson, habitLogCreateSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const habit = await prisma.habit.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!habit)
      return NextResponse.json(
        { error: "Hábito no encontrado" },
        { status: 404 }
      );

    const { searchParams } = new URL(req.url);
    const days = Math.min(
      parseInt(searchParams.get("days") ?? "90", 10) || 90,
      730
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: params.id,
        userId,
        date: { gte: cutoffStr },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(logs);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const habit = await prisma.habit.findFirst({
      where: { id: params.id, userId, isActive: true },
    });
    if (!habit)
      return NextResponse.json(
        { error: "Hábito no encontrado" },
        { status: 404 }
      );

    const parsed = await parseJson(req, habitLogCreateSchema);
    if (!parsed.ok) return parsed.response;

    const date = parsed.data.date ?? new Date().toISOString().split("T")[0];
    const completed = parsed.data.completed ?? true;
    const previousStreak = habit.streakCurrent;

    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: params.id, date } },
      create: { habitId: params.id, userId, date, completed },
      update: { completed },
    });

    const streakResult = await recalculateStreak(params.id, habit.targetDays, {
      estimatedMinutes: habit.estimatedMinutes,
      currentRootedAt: habit.rootedAt,
    });

    const bestStreak = Math.max(streakResult.streakBest, habit.streakBest);

    const updatedHabit = await prisma.habit.update({
      where: { id: params.id },
      data: {
        streakCurrent: streakResult.streakCurrent,
        streakBest: bestStreak,
        phase: streakResult.phase,
        rootedAt: streakResult.rootedAtFirst,
        rootedStreak: streakResult.rootedStreak,
        graceDaysAvailable: streakResult.graceDaysAvailable,
        graceWeekStart: streakResult.graceWeekStart,
        lastCompletedDate: streakResult.lastCompletedDate,
      },
    });

    // ── Milestones automáticos ────────────────────────────────────────
    const milestone = completed
      ? crossedMilestone(previousStreak, streakResult.streakCurrent)
      : null;
    let createdMilestone: { id: string; title: string } | null = null;
    if (milestone !== null) {
      const titleMap: Record<number, string> = {
        7: `Primer hito: 7 días de ${habit.name}`,
        21: `Formándose: 21 días de ${habit.name}`,
        66: `Fortaleciéndose: 66 días de ${habit.name}`,
        [ROOTED_THRESHOLD]: `🏆 ¡${habit.name} arraigado!`,
        100: `100 días arraigados: ${habit.name}`,
        365: `1 año consecutivo: ${habit.name}`,
        500: `500 días consecutivos: ${habit.name}`,
        1000: `1,000 días consecutivos: ${habit.name}`,
      };
      try {
        const m = await prisma.milestone.create({
          data: {
            userId,
            date,
            type: milestone === ROOTED_THRESHOLD ? "habit_rooted" : "habit_streak",
            title: titleMap[milestone] ?? `${milestone} días de ${habit.name}`,
            icon:
              milestone === ROOTED_THRESHOLD
                ? "👑"
                : habit.icon ?? "🔥",
            metadata: {
              habitId: habit.id,
              streak: milestone,
            } as unknown as object,
          },
        });
        createdMilestone = { id: m.id, title: m.title };
      } catch (e) {
        console.error("[habit-log] milestone create failed:", e);
      }
    }

    if (completed) {
      await awardXP(prisma, userId, 5);
      await checkFirstStepBadge(prisma, userId);
      await checkStreakBadges(prisma, userId, streakResult.streakCurrent);
    }

    return NextResponse.json({
      log,
      habit: updatedHabit,
      streak: streakResult,
      milestone: createdMilestone,
    });
  });
}
