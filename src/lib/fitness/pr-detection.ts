/**
 * PR detection — dado un workout recién guardado, identifica nuevos Personal
 * Records por ejercicio y los persiste.
 *
 * Criterios:
 *   - Para cada ejercicio del workout, calcula e1RM del mejor set
 *     (prefiere RPE-based, fallback Epley).
 *   - Compara contra el PR existente (si existe).
 *   - Si el nuevo e1RM supera al anterior → nuevo PR.
 *   - Crea Milestone de tipo "pr" para celebrar.
 *
 * Diseño: una sola transacción Prisma para atomicidad — si algo falla,
 * nada se persiste.
 */

import type { PrismaClient } from "@prisma/client";
import { estimate1RMFromRpe } from "./rir-rpe";

export interface DetectedPR {
  exerciseId: string;
  exerciseName: string;
  oldOneRM: number | null;
  newOneRM: number;
  delta: number;
  /** Peso del set que disparó el PR (útil para celebración) */
  triggerWeight: number;
  triggerReps: number;
  triggerRpe: number | null;
}

export interface WorkoutForPrDetection {
  id: string;
  date: string;
  exercises: Array<{
    exerciseId: string;
    exercise: { name: string; muscleGroup: string };
    sets: Array<{
      weight: number;
      reps: number;
      rpe: number | null;
      isWarmup: boolean;
      setType: string;
    }>;
  }>;
}

function epley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Calcula e1RM de un set — prefiere RPE-based cuando hay RPE ≥ 6.
 */
export function estimateSetOneRM(
  weight: number,
  reps: number,
  rpe: number | null,
): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (rpe != null && rpe >= 6 && rpe <= 10) {
    const rpeEst = estimate1RMFromRpe(weight, reps, rpe);
    if (rpeEst != null && rpeEst > 0) return rpeEst;
  }
  return epley(weight, reps);
}

/**
 * Analiza un workout y detecta PRs. Persiste cambios (PersonalRecord upsert +
 * Milestone create). Devuelve la lista de PRs detectados.
 */
export async function detectAndPersistPRs(
  prisma: PrismaClient,
  userId: string,
  workout: WorkoutForPrDetection,
): Promise<DetectedPR[]> {
  const detected: DetectedPR[] = [];

  for (const we of workout.exercises) {
    // Encuentra el mejor set (no-warmup) por e1RM
    let bestSetOneRM = 0;
    let bestSet: { weight: number; reps: number; rpe: number | null } | null = null;
    for (const s of we.sets) {
      if (s.isWarmup || s.setType === "warmup") continue;
      const e1RM = estimateSetOneRM(s.weight, s.reps, s.rpe);
      if (e1RM > bestSetOneRM) {
        bestSetOneRM = e1RM;
        bestSet = { weight: s.weight, reps: s.reps, rpe: s.rpe };
      }
    }
    if (!bestSet || bestSetOneRM <= 0) continue;

    // Ya existe PR para este exercise?
    const existing = await prisma.personalRecord.findFirst({
      where: { userId, exerciseId: we.exerciseId },
      orderBy: { createdAt: "desc" },
    });

    const oldOneRM = existing?.oneRM ?? existing?.estimated1RM ?? null;

    // Umbral: nuevo e1RM debe superar al anterior por al menos 0.5 kg.
    // (Evita "flicker PRs" por redondeos o variaciones minúsculas.)
    if (oldOneRM != null && bestSetOneRM <= oldOneRM + 0.5) continue;

    const roundedNew = Math.round(bestSetOneRM * 10) / 10;

    // Persiste nuevo PR (o actualiza).
    if (existing) {
      await prisma.personalRecord.update({
        where: { id: existing.id },
        data: {
          weight: bestSet.weight,
          reps: bestSet.reps,
          estimated1RM: roundedNew,
          oneRM: roundedNew,
          date: workout.date,
        },
      });
    } else {
      await prisma.personalRecord.create({
        data: {
          userId,
          exerciseId: we.exerciseId,
          exerciseName: we.exercise.name,
          weight: bestSet.weight,
          reps: bestSet.reps,
          estimated1RM: roundedNew,
          oneRM: roundedNew,
          date: workout.date,
        },
      });
    }

    // Milestone automático
    const deltaText =
      oldOneRM != null
        ? `+${(roundedNew - oldOneRM).toFixed(1)} kg`
        : "primer PR";
    await prisma.milestone.create({
      data: {
        userId,
        date: workout.date,
        type: "pr",
        title: `PR ${we.exercise.name}: ${roundedNew} kg (e1RM)`,
        description:
          `${bestSet.weight} kg × ${bestSet.reps}` +
          (bestSet.rpe != null ? ` @ RPE ${bestSet.rpe}` : "") +
          ` — ${deltaText}`,
        icon: "🏆",
        metadata: {
          exerciseId: we.exerciseId,
          exerciseName: we.exercise.name,
          oldOneRM,
          newOneRM: roundedNew,
          triggerWeight: bestSet.weight,
          triggerReps: bestSet.reps,
          triggerRpe: bestSet.rpe,
        },
      },
    });

    detected.push({
      exerciseId: we.exerciseId,
      exerciseName: we.exercise.name,
      oldOneRM,
      newOneRM: roundedNew,
      delta: oldOneRM != null ? roundedNew - oldOneRM : roundedNew,
      triggerWeight: bestSet.weight,
      triggerReps: bestSet.reps,
      triggerRpe: bestSet.rpe,
    });
  }

  return detected;
}
