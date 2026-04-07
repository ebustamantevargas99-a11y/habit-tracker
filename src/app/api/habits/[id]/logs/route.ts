import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recalculateStreak } from "@/lib/habit-utils";
import { awardXP, checkFirstStepBadge, checkStreakBadges } from "@/lib/gamification-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "90");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: params.id,
      userId: session.user.id,
      date: { gte: cutoffStr },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: params.id, userId: session.user.id, isActive: true },
  });

  if (!habit) {
    return NextResponse.json({ error: "Hábito no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const date: string = body.date ?? new Date().toISOString().split("T")[0];
  const completed: boolean = body.completed ?? true;

  // Upsert the log
  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: params.id, date } },
    create: {
      habitId: params.id,
      userId: session.user.id,
      date,
      completed,
    },
    update: { completed },
  });

  // Recalculate and persist streaks
  const { streakCurrent, streakBest } = await recalculateStreak(
    params.id,
    habit.targetDays
  );

  const bestStreak = Math.max(streakBest, habit.streakBest);

  const updatedHabit = await prisma.habit.update({
    where: { id: params.id },
    data: { streakCurrent, streakBest: bestStreak },
  });

  // Award XP and check badges when marking a habit as completed
  if (completed) {
    await awardXP(prisma, session.user.id, 5);
    await checkFirstStepBadge(prisma, session.user.id);
    await checkStreakBadges(prisma, session.user.id, streakCurrent);
  }

  return NextResponse.json({ log, habit: updatedHabit });
}
