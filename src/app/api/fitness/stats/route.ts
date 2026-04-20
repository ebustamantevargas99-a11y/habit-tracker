import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withAuth(async (userId) => {

  // Start of current week (Monday)
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const [totalWorkouts, currentWeekWorkouts, weekWorkouts] = await Promise.all([
    prisma.workout.count({ where: { userId: userId } }),
    prisma.workout.count({
      where: { userId: userId, date: { gte: weekStartStr } },
    }),
    prisma.workout.findMany({
      where: { userId: userId, date: { gte: weekStartStr } },
      include: {
        exercises: {
          include: {
            exercise: { select: { muscleGroup: true } },
            sets: { select: { setNumber: true } },
          },
        },
      },
    }),
  ]);

  // Compute weeklyVolume: muscle group → number of sets
  const weeklyVolume: Record<string, number> = {};
  for (const workout of weekWorkouts) {
    for (const ex of workout.exercises) {
      const mg = ex.exercise.muscleGroup;
      weeklyVolume[mg] = (weeklyVolume[mg] ?? 0) + ex.sets.length;
    }
  }

  return NextResponse.json({ totalWorkouts, currentWeekWorkouts, weeklyVolume });
});
}
