import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { findOrCreateExercise, toWorkoutSession } from "@/lib/fitness-utils";
import { awardXP, checkPRHunterBadge } from "@/lib/gamification-utils";
import { parseJson, workoutCreateSchema } from "@/lib/validation";
import { detectAndPersistPRs } from "@/lib/fitness/pr-detection";

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
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10) || 50,
      200,
    );
    const page = Math.max(
      parseInt(searchParams.get("page") ?? "1", 10) || 1,
      1,
    );

    const workouts = await prisma.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: WORKOUT_INCLUDE,
    });

    return NextResponse.json(workouts.map(toWorkoutSession));
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, workoutCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;

    const resolvedExercises = await Promise.all(
      (d.exercises ?? []).map(async (e, idx) => {
        const exercise = await findOrCreateExercise(
          e.exerciseName,
          e.muscleGroup ?? "General",
          userId,
        );
        return { ...e, exerciseId: exercise.id, orderIndex: idx };
      }),
    );

    const workout = await prisma.workout.create({
      data: {
        userId,
        date: d.date,
        name: d.name,
        durationMinutes: d.duration ?? 0,
        totalVolume: d.totalVolume ?? 0,
        trimp: d.trimp ?? null,
        prsHit: 0, // se calcula abajo en detectAndPersistPRs
        readinessScore: d.readinessScore ?? null,
        plannedPhaseId: d.plannedPhaseId ?? null,
        notes: d.notes ?? null,
        completed: true,
        exercises: {
          create: resolvedExercises.map((e) => ({
            exerciseId: e.exerciseId,
            orderIndex: e.orderIndex,
            notes: e.notes ?? null,
            sets: {
              create: e.sets.map((s, i) => ({
                setNumber: i + 1,
                weight: s.weight,
                reps: s.reps,
                rpe: s.rpe ?? null,
                rir: s.rir ?? null,
                tempo: s.tempo ?? null,
                setType: s.setType ?? "straight",
                groupId: s.groupId ?? null,
                isWarmup: s.isWarmup ?? s.setType === "warmup",
              })),
            },
          })),
        },
      },
      include: WORKOUT_INCLUDE,
    });

    // ── PR detection automática ──────────────────────────────────────────────
    // Analiza los sets no-warmup del workout recién creado. Si hay nuevo e1RM
    // mayor al PR anterior, upserts PersonalRecord + crea Milestone de tipo "pr".
    const detectedPRs = await detectAndPersistPRs(prisma, userId, {
      id: workout.id,
      date: workout.date,
      exercises: workout.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        exercise: we.exercise,
        sets: we.sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
          setType: s.setType,
        })),
      })),
    });

    // Sincroniza prsHit del Workout con lo realmente detectado.
    if (detectedPRs.length > 0) {
      await prisma.workout.update({
        where: { id: workout.id },
        data: { prsHit: detectedPRs.length },
      });
    }

    await awardXP(prisma, userId, 15);
    if (detectedPRs.length > 0) {
      await checkPRHunterBadge(prisma, userId);
    }

    const response = {
      ...toWorkoutSession({ ...workout, prsHit: detectedPRs.length }),
      detectedPRs,
    };
    return NextResponse.json(response, { status: 201 });
  });
}
