/**
 * Mesociclo y progresión de volumen (anti-estancamiento).
 *
 * Modelo Israetel/RP: el bloque arranca cerca del MEV y se añade ~1 serie por
 * músculo por semana hacia el MAV/MRV; al llegar al tope (o tras N semanas) →
 * descarga. Estas funciones calculan en qué semana del mesociclo estás, cuál
 * es el objetivo de series de esta semana, y la tendencia de volumen semanal.
 *
 * Funciones puras (today inyectable) → testeables.
 */

import { VOLUME_LANDMARKS } from "./calculations";
import { resolveExerciseMuscles } from "./muscle-volume";
import { todayLocal, shiftDaysLocal, parseLocalDateStr } from "@/lib/date/local";

/** Semana del mesociclo (1-indexed) desde la fecha de inicio de la rutina. */
export function mesocycleWeek(startDate: string, today: string = todayLocal()): number {
  const start = parseLocalDateStr(startDate).getTime();
  const now = parseLocalDateStr(today).getTime();
  if (!isFinite(start) || !isFinite(now)) return 1;
  const days = Math.floor((now - start) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

/**
 * Series objetivo de un músculo para la semana N del mesociclo.
 * Semana 1 = MEV, +1 serie por semana, tope en MRV.
 */
export function recommendedSetsForWeek(mev: number, mrv: number, week: number): number {
  return Math.min(mrv, mev + Math.max(0, week - 1));
}

export type ProgAction = "raise_to_mev" | "add_set" | "hold" | "deload";

export interface ProgressionSuggestion {
  slug: string;
  current: number; // series planificadas actuales (redondeadas)
  target: number; // series objetivo de esta semana
  action: ProgAction;
}

/**
 * Sugerencia de progresión para un músculo dado su volumen planificado actual
 * y la semana del mesociclo. Devuelve null si el músculo no está programado.
 */
export function suggestProgression(
  slug: string,
  currentPlan: number,
  week: number,
): ProgressionSuggestion | null {
  const l = VOLUME_LANDMARKS[slug];
  if (!l || currentPlan <= 0) return null;
  const current = Math.round(currentPlan * 2) / 2;

  if (currentPlan < l.mev)
    return { slug, current, target: l.mev, action: "raise_to_mev" };
  if (currentPlan >= l.mrv)
    return { slug, current, target: l.mrv, action: "deload" };

  const target = recommendedSetsForWeek(l.mev, l.mrv, week);
  if (currentPlan < target) return { slug, current, target, action: "add_set" };
  return { slug, current, target, action: "hold" };
}

// ─── Tendencia de volumen semanal ─────────────────────────────────────────────

interface LoggedSet {
  weight: number;
  reps: number;
  rpe?: number | null;
}
interface LoggedExercise {
  exerciseName: string;
  muscleGroup?: string;
  sets?: LoggedSet[];
}
interface LoggedWorkout {
  date: string;
  exercises?: LoggedExercise[];
}

export interface WeekVolumePoint {
  label: string; // MM-DD del inicio de la ventana de 7 días
  totalSets: number; // series efectivas fraccionales totales (todo el cuerpo)
}

function isEffective(s: LoggedSet): boolean {
  return s.reps >= 3 && (s.rpe == null || s.rpe >= 6);
}

/**
 * Series efectivas fraccionales totales por semana (ventanas de 7 días hacia
 * atrás desde hoy), en orden cronológico. Sirve para ver si el volumen sube
 * semana a semana (progresión) o se estanca.
 */
export function weeklyVolumeHistory(
  workouts: LoggedWorkout[],
  weeksBack = 6,
  today: string = todayLocal(),
): WeekVolumePoint[] {
  const buckets = new Array<number>(weeksBack).fill(0);
  const nowMs = parseLocalDateStr(today).getTime();

  for (const w of workouts ?? []) {
    const daysAgo = Math.floor((nowMs - parseLocalDateStr(w.date).getTime()) / 86_400_000);
    if (daysAgo < 0) continue;
    const idx = Math.floor(daysAgo / 7);
    if (idx >= weeksBack) continue;
    for (const ex of w.exercises ?? []) {
      const eff = (ex.sets ?? []).filter(isEffective).length;
      if (eff === 0) continue;
      const m = resolveExerciseMuscles(ex.exerciseName, ex.muscleGroup);
      if (!m) continue;
      const fractionalPerSet = 1 + m.secondaries.length * 0.5;
      buckets[idx] += eff * fractionalPerSet;
    }
  }

  const points: WeekVolumePoint[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const startStr = shiftDaysLocal(-(7 * i + 6), today);
    points.push({ label: startStr.slice(5), totalSets: Math.round(buckets[i] * 2) / 2 });
  }
  return points;
}
