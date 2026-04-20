// Cálculos de fitness para Ultimate TRACKER
// Todas las funciones son puras (fácil de testear) y usan unidades métricas internamente.

export type SetInput = {
  weight: number; // kg
  reps: number;
  rpe?: number | null;
};

export type WorkoutSetWithExercise = SetInput & {
  muscleGroup: string;
};

/**
 * 1RM estimado — Fórmula Epley (la más usada)
 * Rango válido: reps 1-12, para reps mayores la fórmula pierde precisión.
 * Returns kg.
 */
export function oneRMEpley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * 1RM estimado — Brzycki (alternativa, más conservadora)
 */
export function oneRMBrzycki(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0 || reps >= 37) return 0;
  if (reps === 1) return weight;
  return Math.round((weight * 36) / (37 - reps) * 10) / 10;
}

/**
 * Promedio entre ambas fórmulas para estimación más robusta.
 */
export function oneRMEstimate(weight: number, reps: number): number {
  const epley = oneRMEpley(weight, reps);
  const brzycki = oneRMBrzycki(weight, reps);
  if (!epley || !brzycki) return Math.max(epley, brzycki);
  return Math.round(((epley + brzycki) / 2) * 10) / 10;
}

/**
 * Mejor set de una lista usando 1RM estimado. Util para detectar PR.
 */
export function bestSet(sets: SetInput[]): SetInput | null {
  if (!sets.length) return null;
  let best = sets[0];
  let bestE1RM = oneRMEstimate(best.weight, best.reps);
  for (const s of sets.slice(1)) {
    const e = oneRMEstimate(s.weight, s.reps);
    if (e > bestE1RM) {
      best = s;
      bestE1RM = e;
    }
  }
  return best;
}

/**
 * Volumen de un set = weight × reps (kg totales).
 */
export function setVolume(set: SetInput): number {
  return set.weight * set.reps;
}

/**
 * Volumen semanal por grupo muscular.
 * Recibe todos los sets de la semana y agrega por muscleGroup.
 */
export function weeklyVolumeByMuscle(
  sets: WorkoutSetWithExercise[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sets) {
    const v = setVolume(s);
    out[s.muscleGroup] = (out[s.muscleGroup] ?? 0) + v;
  }
  return out;
}

/**
 * Series efectivas por grupo muscular (cuenta series con RPE ≥ 6 o reps ≥ 3).
 * Esta es la métrica más relevante para hipertrofia.
 */
export function effectiveSetsByMuscle(
  sets: WorkoutSetWithExercise[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sets) {
    const isEffective = s.reps >= 3 && (s.rpe == null || s.rpe >= 6);
    if (!isEffective) continue;
    out[s.muscleGroup] = (out[s.muscleGroup] ?? 0) + 1;
  }
  return out;
}

// ── Volume Landmarks ──────────────────────────────────────────────────────────
// MEV = Minimum Effective Volume (mínimo para progresar)
// MAV = Maximum Adaptive Volume (rango óptimo)
// MRV = Maximum Recoverable Volume (punto antes de sobreentrenar)
// Basado en recomendaciones de Mike Israetel / Renaissance Periodization.

export const VOLUME_LANDMARKS: Record<
  string,
  { mv: number; mev: number; mavLow: number; mavHigh: number; mrv: number }
> = {
  chest: { mv: 6, mev: 8, mavLow: 12, mavHigh: 20, mrv: 22 },
  back: { mv: 6, mev: 8, mavLow: 14, mavHigh: 22, mrv: 25 },
  shoulders: { mv: 6, mev: 8, mavLow: 16, mavHigh: 22, mrv: 26 },
  biceps: { mv: 4, mev: 6, mavLow: 14, mavHigh: 20, mrv: 22 },
  triceps: { mv: 4, mev: 6, mavLow: 10, mavHigh: 16, mrv: 18 },
  quads: { mv: 6, mev: 8, mavLow: 12, mavHigh: 18, mrv: 20 },
  hamstrings: { mv: 4, mev: 6, mavLow: 10, mavHigh: 16, mrv: 18 },
  glutes: { mv: 4, mev: 6, mavLow: 12, mavHigh: 16, mrv: 20 },
  core: { mv: 0, mev: 4, mavLow: 8, mavHigh: 12, mrv: 16 },
  calves: { mv: 6, mev: 8, mavLow: 12, mavHigh: 16, mrv: 20 },
};

export type VolumeZone = "under_mv" | "between_mv_mev" | "optimal" | "approaching_mrv" | "over_mrv";

/**
 * Clasifica el volumen semanal de un músculo en zonas.
 */
export function volumeZone(muscle: string, effectiveSets: number): VolumeZone {
  const l = VOLUME_LANDMARKS[muscle];
  if (!l) return "optimal";
  if (effectiveSets < l.mv) return "under_mv";
  if (effectiveSets < l.mev) return "between_mv_mev";
  if (effectiveSets <= l.mavHigh) return "optimal";
  if (effectiveSets <= l.mrv) return "approaching_mrv";
  return "over_mrv";
}

// ── Progressive Overload ──────────────────────────────────────────────────────

/**
 * Sugiere el próximo peso a cargar basado en la última sesión.
 * Regla simple:
 *  - Si completó todas las reps objetivo con RPE < 8 → subir 2.5kg (upper) o 5kg (lower)
 *  - Si RPE >= 9 → mantener
 *  - Si falló reps → bajar 5%
 */
export function suggestNextWeight(params: {
  lastWeight: number;
  lastRepsCompleted: number;
  targetReps: number;
  lastRPE?: number | null;
  isLowerBody?: boolean;
}): { weight: number; reason: string } {
  const { lastWeight, lastRepsCompleted, targetReps, lastRPE, isLowerBody } = params;
  const increment = isLowerBody ? 5 : 2.5;

  if (lastRepsCompleted < targetReps) {
    return {
      weight: Math.round(lastWeight * 0.95 * 2) / 2,
      reason: "Falló reps objetivo. Baja 5% y recupera técnica.",
    };
  }

  if (lastRPE != null && lastRPE >= 9) {
    return { weight: lastWeight, reason: "RPE alto, mantén peso esta semana." };
  }

  if (lastRPE != null && lastRPE <= 7) {
    return {
      weight: lastWeight + increment,
      reason: "Te sobró trabajo. Sube peso en la próxima sesión.",
    };
  }

  return {
    weight: lastWeight + increment / 2,
    reason: "Progresa gradualmente.",
  };
}

// ── Projections ───────────────────────────────────────────────────────────────

/**
 * Proyecta el peso esperado en X semanas dado un progreso histórico lineal.
 * historical: [{ week: 0, e1RM: 60 }, { week: 4, e1RM: 68 }, …]
 * Usa regresión lineal simple.
 */
export function projectFutureE1RM(
  historical: { week: number; e1RM: number }[],
  weeksAhead: number
): number | null {
  if (historical.length < 2) return null;
  const n = historical.length;
  const sumX = historical.reduce((s, h) => s + h.week, 0);
  const sumY = historical.reduce((s, h) => s + h.e1RM, 0);
  const sumXY = historical.reduce((s, h) => s + h.week * h.e1RM, 0);
  const sumXX = historical.reduce((s, h) => s + h.week * h.week, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const lastWeek = Math.max(...historical.map((h) => h.week));
  const targetWeek = lastWeek + weeksAhead;
  return Math.round((slope * targetWeek + intercept) * 10) / 10;
}

// ── Bodyweight metrics ────────────────────────────────────────────────────────

/**
 * BMI — solo referencia, no define salud real. kg / m².
 */
export function bmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

/**
 * Tasa metabólica basal — Mifflin-St Jeor (más preciso que Harris-Benedict).
 * Returns kcal/día.
 */
export function bmrMifflin(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  biologicalSex: "male" | "female";
}): number {
  const { weightKg, heightCm, ageYears, biologicalSex } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const adjustment = biologicalSex === "male" ? 5 : -161;
  return Math.round(base + adjustment);
}

/**
 * TDEE — Total Daily Energy Expenditure.
 * Multiplicador por nivel de actividad.
 */
export function tdee(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const mult = multipliers[activityLevel] ?? 1.55;
  return Math.round(bmr * mult);
}
