import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { recalculateStreak } from "@/lib/habit-utils";
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

    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: params.id, date } },
      create: { habitId: params.id, userId, date, completed },
      update: { completed },
    });

    const gamification = await prisma.gamification.findFirst({
      where: { userId },
      select: { streakInsuranceDays: true },
    });
    const insurance = gamification?.streakInsuranceDays ?? 0;

    const { streakCurrent, streakBest } = await recalculateStreak(
      params.id,
      habit.targetDays,
      insurance
    );

    const bestStreak = Math.max(streakBest, habit.streakBest);

    const updatedHabit = await prisma.habit.update({
      where: { id: params.id },
      data: { streakCurrent, streakBest: bestStreak },
    });

    if (completed) {
      await awardXP(prisma, userId, 5);
      await checkFirstStepBadge(prisma, userId);
      await checkStreakBadges(prisma, userId, streakCurrent);
    }

    return NextResponse.json({ log, habit: updatedHabit });
  });
}
