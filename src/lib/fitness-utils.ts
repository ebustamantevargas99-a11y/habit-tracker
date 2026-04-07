import { prisma } from "@/lib/prisma";

/**
 * Find an exercise by name (global first, then user's custom).
 * Creates a user-custom exercise if none found.
 */
export async function findOrCreateExercise(
  name: string,
  muscleGroup: string,
  userId: string
) {
  // 1. Look for a global (shared) exercise
  const global = await prisma.exercise.findFirst({
    where: { name, userId: null },
  });
  if (global) return global;

  // 2. Look for user's own custom exercise
  const custom = await prisma.exercise.findFirst({
    where: { name, userId },
  });
  if (custom) return custom;

  // 3. Create it as a custom exercise
  return prisma.exercise.create({
    data: { name, muscleGroup, category: "compound", isCustom: true, userId },
  });
}

/**
 * Transform a Prisma workout (with nested exercises/sets) into the
 * flat WorkoutSession shape the frontend store expects.
 */
export function toWorkoutSession(w: {
  id: string;
  date: string;
  name: string;
  durationMinutes: number;
  totalVolume: number;
  prsHit: number;
  exercises: Array<{
    id: string;
    notes: string | null;
    exercise: { name: string; muscleGroup: string };
    sets: Array<{ setNumber: number; weight: number; reps: number; rpe: number | null; isPR: boolean }>;
  }>;
}) {
  return {
    id: w.id,
    date: w.date,
    name: w.name,
    duration: w.durationMinutes,
    totalVolume: w.totalVolume,
    prsHit: w.prsHit,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      exerciseName: e.exercise.name,
      muscleGroup: e.exercise.muscleGroup,
      notes: e.notes ?? "",
      sets: e.sets
        .sort((a, b) => a.setNumber - b.setNumber)
        .map(({ weight, reps, rpe }) => ({ weight, reps, ...(rpe !== null && { rpe }) })),
    })),
  };
}
