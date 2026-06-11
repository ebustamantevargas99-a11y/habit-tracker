import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { suggestNextWeight, bestEstimated1RM, weightForTargetRpe } from "@/lib/fitness/progression";
import { EXERCISES_SEED } from "@/lib/fitness/exercises-seed";

/**
 * GET /api/fitness/progression/suggest?exerciseId=xxx&repMin=5&repMax=8&targetRpe=8
 *
 * Lee las últimas 8 sesiones del ejercicio y devuelve sugerencia de próximo
 * peso + reps usando smart progression.
 *
 * Params:
 *   - exerciseId  (required)  id del Exercise
 *   - repMin      optional    default 5
 *   - repMax      optional    default 8
 *   - targetRpe   optional    default 8
 */

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    const exerciseId = url.searchParams.get("exerciseId");
    if (!exerciseId) {
      return NextResponse.json(
        { error: "exerciseId requerido" },
        { status: 400 },
      );
    }

    const repMin = Math.max(1, Number(url.searchParams.get("repMin")) || 5);
    const repMax = Math.max(repMin, Number(url.searchParams.get("repMax")) || 8);
    const targetRpe = Math.max(6, Math.min(10, Number(url.searchParams.get("targetRpe")) || 8));

    // El catálogo entrega ids "seed:<slug>" para ejercicios del seed que aún
    // no se materializaron en DB. Los resolvemos: si ya existe un Exercise
    // con ese nombre (porque el user lo usó antes) usamos su id real; si no,
    // devolvemos una sugerencia vacía (aún sin historial) en vez de 404.
    let resolvedId = exerciseId;
    let exercise: { id: string; name: string; muscleGroup: string; primaryMuscle: string | null } | null = null;

    if (exerciseId.startsWith("seed:")) {
      const slug = exerciseId.slice(5);
      const seed = EXERCISES_SEED.find((e) => e.slug === slug);
      if (!seed) {
        return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
      }
      const real = await prisma.exercise.findFirst({
        where: { name: seed.name, OR: [{ userId }, { userId: null }] },
        select: { id: true, name: true, muscleGroup: true, primaryMuscle: true },
      });
      if (real) {
        resolvedId = real.id;
        exercise = real;
      } else {
        // Sin materializar → sin historial. Sugerencia vacía y limpia.
        return NextResponse.json({
          exercise: { id: exerciseId, name: seed.name, muscleGroup: seed.muscleGroup, primaryMuscle: null },
          historyCount: 0,
          estimated1RM: null,
          suggestion: suggestNextWeight([], { repRange: [repMin, repMax], targetRpe }),
          alternativeFromRpe: null,
          params: { repMin, repMax, targetRpe },
        });
      }
    } else {
      // Ownership: el Exercise puede ser global (userId=null) o propio del user.
      exercise = await prisma.exercise.findFirst({
        where: { id: exerciseId, OR: [{ userId }, { userId: null }] },
        select: { id: true, name: true, muscleGroup: true, primaryMuscle: true },
      });
      if (!exercise) {
        return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
      }
    }

    // Últimas 8 sesiones del ejercicio para este user.
    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        exercises: { some: { exerciseId: resolvedId } },
      },
      include: {
        exercises: {
          where: { exerciseId: resolvedId },
          include: { sets: true },
        },
      },
      orderBy: { date: "desc" },
      take: 8,
    });

    // Aplana a HistorySet[]
    const history = workouts.flatMap((w) =>
      w.exercises.flatMap((we) =>
        we.sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          date: w.date,
          isWarmup: s.isWarmup,
          setType: s.setType,
        })),
      ),
    );

    const suggestion = suggestNextWeight(history, {
      repRange: [repMin, repMax],
      targetRpe,
    });

    const estimated1RM = bestEstimated1RM(history);

    // Sugerencia secundaria: si conocemos 1RM + target RPE, calculamos peso ideal
    // para esa combinación reps/RPE — útil como referencia alternativa.
    const alternativeFromRpe =
      estimated1RM !== null
        ? weightForTargetRpe(estimated1RM, repMin, targetRpe)
        : null;

    return NextResponse.json({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        primaryMuscle: exercise.primaryMuscle,
      },
      historyCount: workouts.length,
      estimated1RM,
      suggestion,
      alternativeFromRpe,
      params: { repMin, repMax, targetRpe },
    });
  });
}
