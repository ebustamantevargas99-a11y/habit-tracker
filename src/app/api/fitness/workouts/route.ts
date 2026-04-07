import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateExercise, toWorkoutSession } from "@/lib/fitness-utils";
import { awardXP, checkPRHunterBadge } from "@/lib/gamification-utils";

const WORKOUT_INCLUDE = {
  exercises: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      exercise: { select: { name: true, muscleGroup: true } },
      sets: { orderBy: { setNumber: "asc" as const } },
    },
  },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const page = parseInt(searchParams.get("page") ?? "1");

  const workouts = await prisma.workout.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: WORKOUT_INCLUDE,
  });

  return NextResponse.json(workouts.map(toWorkoutSession));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { date, name, duration, totalVolume, prsHit, exercises, notes } = body;

  if (!date || !name) {
    return NextResponse.json({ error: "date y name son requeridos" }, { status: 400 });
  }

  // Resolve exercise IDs before creating the workout
  const resolvedExercises = await Promise.all(
    (exercises ?? []).map(async (e: {
      exerciseName: string;
      muscleGroup: string;
      notes?: string;
      sets: Array<{ weight: number; reps: number; rpe?: number }>;
    }, idx: number) => {
      const exercise = await findOrCreateExercise(
        e.exerciseName,
        e.muscleGroup ?? "General",
        session.user.id!
      );
      return { ...e, exerciseId: exercise.id, orderIndex: idx };
    })
  );

  const workout = await prisma.workout.create({
    data: {
      userId: session.user.id,
      date,
      name,
      durationMinutes: duration ?? 0,
      totalVolume: totalVolume ?? 0,
      prsHit: prsHit ?? 0,
      notes: notes ?? null,
      completed: true,
      exercises: {
        create: resolvedExercises.map((e) => ({
          exerciseId: e.exerciseId,
          orderIndex: e.orderIndex,
          notes: e.notes ?? null,
          sets: {
            create: e.sets.map(
              (s: { weight: number; reps: number; rpe?: number }, i: number) => ({
                setNumber: i + 1,
                weight: s.weight,
                reps: s.reps,
                rpe: s.rpe ?? null,
              })
            ),
          },
        })),
      },
    },
    include: WORKOUT_INCLUDE,
  });

  // Award XP for logging a workout and check PR hunter badge
  await awardXP(prisma, session.user.id, 15);
  if ((prsHit ?? 0) > 0) {
    await checkPRHunterBadge(prisma, session.user.id);
  }

  return NextResponse.json(toWorkoutSession(workout), { status: 201 });
}
