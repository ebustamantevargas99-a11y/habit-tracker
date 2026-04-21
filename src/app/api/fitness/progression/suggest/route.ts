import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { suggestNextWeight, bestEstimated1RM, weightForTargetRpe } from "@/lib/fitness/progression";

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

    // Ownership: el Exercise puede ser global (userId=null) o propio del user.
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [{ userId }, { userId: null }],
      },
      select: { id: true, name: true, muscleGroup: true, primaryMuscle: true },
    });
    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
    }

    // Últimas 8 sesiones del ejercicio para este user.
    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        exercises: { some: { exerciseId } },
      },
      include: {
        exercises: {
          where: { exerciseId },
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
