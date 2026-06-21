/**
 * Progresión de carga por ejercicio (progressive overload).
 *
 * Toma el historial de sesiones y, por cada ejercicio, calcula la serie de
 * "peso tope" por día entrenado y lo compara con ventanas temporales
 * (1/2/3 semanas y 1 mes atrás) + el peso inicial. Es la base del dashboard
 * de Resumen: "¿cuánto subí en press banca desde que empecé / la semana pasada?".
 *
 * Pure module (sin estado, sin "use client") → testeable y reusable.
 */

import { todayLocal, shiftDaysLocal } from "@/lib/date/local";

export interface ProgressPoint {
  date: string; // YYYY-MM-DD
  topWeight: number; // peso más alto levantado ese día (reps ≥ 1)
  reps: number; // reps en la serie de peso tope
  est1RM: number; // 1RM estimado (Epley) más alto del día
}

export interface ExerciseProgress {
  exercise: string;
  muscleGroup: string;
  sessions: number; // nº de días distintos entrenados
  points: ProgressPoint[]; // cronológico ascendente
  current: ProgressPoint;
  start: ProgressPoint;
  refs: {
    w1: ProgressPoint | null; // ~7 días atrás
    w2: ProgressPoint | null; // ~14 días atrás
    w3: ProgressPoint | null; // ~21 días atrás
    m1: ProgressPoint | null; // ~30 días atrás
  };
  gain: number; // current.topWeight − start.topWeight (kg)
  gainPct: number; // gain / start.topWeight * 100
}

interface WorkoutSetInput {
  weight: number;
  reps: number;
  rpe?: number | null;
}
interface ExerciseInput {
  exerciseName: string;
  muscleGroup?: string;
  sets?: WorkoutSetInput[];
}
export interface WorkoutInput {
  date: string;
  exercises?: ExerciseInput[];
}

function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** El punto más reciente con fecha ≤ cutoff (las fechas ISO comparan como string). */
function asOf(points: ProgressPoint[], cutoff: string): ProgressPoint | null {
  let found: ProgressPoint | null = null;
  for (const p of points) {
    if (p.date <= cutoff) found = p;
    else break;
  }
  return found;
}

export function computeExerciseProgress(
  workouts: WorkoutInput[],
  tz?: string | null,
): ExerciseProgress[] {
  const today = todayLocal(tz);
  const byEx = new Map<
    string,
    { muscleGroup: string; byDate: Map<string, ProgressPoint> }
  >();

  for (const w of workouts) {
    for (const ex of w.exercises ?? []) {
      const name = ex.exerciseName?.trim();
      if (!name) continue;
      let entry = byEx.get(name);
      if (!entry) {
        entry = { muscleGroup: ex.muscleGroup ?? "", byDate: new Map() };
        byEx.set(name, entry);
      }
      if (!entry.muscleGroup && ex.muscleGroup) entry.muscleGroup = ex.muscleGroup;

      let dayTopWeight = 0;
      let dayReps = 0;
      let dayBest1RM = 0;
      for (const s of ex.sets ?? []) {
        if (!(s.weight > 0) || !(s.reps > 0)) continue;
        if (s.weight > dayTopWeight) {
          dayTopWeight = s.weight;
          dayReps = s.reps;
        }
        const e = epley(s.weight, s.reps);
        if (e > dayBest1RM) dayBest1RM = e;
      }
      if (dayTopWeight <= 0) continue;

      const prev = entry.byDate.get(w.date);
      // Si hay varias sesiones el mismo día, nos quedamos con la más pesada.
      if (!prev || dayTopWeight > prev.topWeight) {
        entry.byDate.set(w.date, {
          date: w.date,
          topWeight: dayTopWeight,
          reps: dayReps,
          est1RM: Math.round(dayBest1RM * 10) / 10,
        });
      }
    }
  }

  const cut1 = shiftDaysLocal(-7, today, tz);
  const cut2 = shiftDaysLocal(-14, today, tz);
  const cut3 = shiftDaysLocal(-21, today, tz);
  const cutM = shiftDaysLocal(-30, today, tz);

  const result: ExerciseProgress[] = [];
  for (const [exercise, entry] of Array.from(byEx.entries())) {
    const points = Array.from(entry.byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    if (points.length === 0) continue;
    const current = points[points.length - 1];
    const start = points[0];
    const gain = Math.round((current.topWeight - start.topWeight) * 10) / 10;
    const gainPct =
      start.topWeight > 0 ? Math.round((gain / start.topWeight) * 1000) / 10 : 0;
    result.push({
      exercise,
      muscleGroup: entry.muscleGroup,
      sessions: points.length,
      points,
      current,
      start,
      refs: {
        w1: asOf(points, cut1),
        w2: asOf(points, cut2),
        w3: asOf(points, cut3),
        m1: asOf(points, cutM),
      },
      gain,
      gainPct,
    });
  }

  result.sort(
    (a, b) =>
      b.sessions - a.sessions || b.current.topWeight - a.current.topWeight,
  );
  return result;
}
