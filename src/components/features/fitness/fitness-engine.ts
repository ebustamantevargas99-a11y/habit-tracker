/**
 * Fitness Engine — shared types, constants, and pure calculation functions
 * used across all fitness tab components.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanExercise {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
}

export interface EnginePlanDay {
  day: string;
  type: 'Push' | 'Pull' | 'Legs' | 'Rest';
  exercises: PlanExercise[];
}

export interface EngineSet {
  id: string;
  weight: number;
  reps: number;
  rpe: number;
}

export interface EngineExercise {
  id: number;
  name: string;
  muscleGroup: string;
  lastWeight: number;
  lastReps: number;
  pr: number;
  sets: EngineSet[];
  repMin: number;
  repMax: number;
  lastWeekReps: number[];
}

export interface LivePR {
  exercise: string;
  oneRM: number;
  fiveRM: number;
  tenRM: number;
  date: string;
  prevOneRM: number;
  isNewPR: boolean;
}

export interface TonelagePoint {
  week: string;
  volume: number;
}

// ─── Engine Functions ─────────────────────────────────────────────────────────

/** Epley formula: estimate 1RM from weight × reps */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Epley inverse: estimate weight for N reps from 1RM */
export function epleyNRM(oneRM: number, n: number): number {
  if (n <= 0 || oneRM <= 0) return 0;
  if (n === 1) return oneRM;
  return Math.round((oneRM / (1 + n / 30)) * 10) / 10;
}

/** Compute fractional volume per muscle group for the current session */
export function computeFractionalVolume(exercises: EngineExercise[]): Record<string, number> {
  const vol: Record<string, number> = {};
  for (const ex of exercises) {
    const activeSets = ex.sets.filter(s => s.weight > 0 && s.reps > 0).length;
    if (activeSets === 0) continue;
    const impact = EXERCISE_IMPACT[ex.name] ?? { [ex.muscleGroup]: 1.0 };
    for (const [muscle, fraction] of Object.entries(impact)) {
      vol[muscle] = (vol[muscle] ?? 0) + activeSets * (fraction as number);
    }
  }
  return Object.fromEntries(Object.entries(vol).map(([k, v]) => [k, Math.round(v * 10) / 10]));
}

/** Double progression suggestion for next session */
export function getProgressionSuggestion(
  lastWeight: number,
  lastWeekReps: number[],
  repMin: number,
  repMax: number,
): { weight: number; reps: number; label: string } {
  if (lastWeekReps.length === 0) {
    return { weight: lastWeight, reps: repMin, label: `Objetivo inicial: ${repMin}-${repMax} reps` };
  }
  const allHitTop = lastWeekReps.every(r => r >= repMax);
  if (allHitTop) {
    return { weight: lastWeight + 2.5, reps: repMin, label: `↑ Subir a ${lastWeight + 2.5} kg · ${repMin} reps` };
  }
  const worstSet = Math.min(...lastWeekReps);
  const targetReps = Math.min(worstSet + 1, repMax);
  return { weight: lastWeight, reps: targetReps, label: `Objetivo: ${lastWeight} kg × ${targetReps} reps` };
}

// ─── Exercise Impact Map ──────────────────────────────────────────────────────

export const EXERCISE_IMPACT: Record<string, Partial<Record<string, number>>> = {
  'Press Banca':        { Pecho: 1.0, Tríceps: 0.5, Hombros: 0.3 },
  'Press Inclinado':    { Pecho: 1.0, Tríceps: 0.4, Hombros: 0.3 },
  'Press Militar':      { Hombros: 1.0, Tríceps: 0.5, Core: 0.2 },
  'Fondos':             { Tríceps: 1.0, Pecho: 0.5 },
  'Extensión Tríceps':  { Tríceps: 1.0 },
  'Peso Muerto':        { Espalda: 1.0, Isquiotibiales: 0.7, Glúteos: 0.5, Core: 0.3, Bíceps: 0.2 },
  'Remo':               { Espalda: 1.0, Bíceps: 0.5 },
  'Dominadas':          { Espalda: 1.0, Bíceps: 0.7 },
  'Curl Bíceps':        { Bíceps: 1.0 },
  'Curl Martillo':      { Bíceps: 1.0 },
  'Sentadilla':         { Cuádriceps: 1.0, Glúteos: 0.7, Isquiotibiales: 0.3, Core: 0.2 },
  'Leg Press':          { Cuádriceps: 0.8, Glúteos: 0.6 },
  'Sentadilla Búlgara': { Cuádriceps: 0.8, Glúteos: 0.9, Isquiotibiales: 0.5 },
  'Extensión':          { Cuádriceps: 1.0 },
  'Curl Femoral':       { Isquiotibiales: 1.0 },
  'Hip Thrust':         { Glúteos: 1.0, Isquiotibiales: 0.5 },
};

// ─── Sample / Default Data ────────────────────────────────────────────────────

export const SAMPLE_EXERCISES = [
  { id: 1, name: 'Press Banca',  muscleGroup: 'Pecho',      lastWeight: 80,  lastReps: 8,  pr: 90,  repMin: 8,  repMax: 12, lastWeekReps: [10, 9, 8, 8]    },
  { id: 2, name: 'Sentadilla',   muscleGroup: 'Cuádriceps', lastWeight: 100, lastReps: 6,  pr: 120, repMin: 6,  repMax: 10, lastWeekReps: [8, 7, 7, 6]     },
  { id: 3, name: 'Peso Muerto',  muscleGroup: 'Espalda',    lastWeight: 120, lastReps: 5,  pr: 140, repMin: 5,  repMax: 8,  lastWeekReps: [6, 5, 5]        },
  { id: 4, name: 'Curl Bíceps',  muscleGroup: 'Bíceps',     lastWeight: 14,  lastReps: 12, pr: 16,  repMin: 10, repMax: 15, lastWeekReps: [12, 12, 12, 12] },
];

export const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Core', 'Pantorrillas',
];

export const REST_TIMER_PRESETS = [30, 60, 90, 120, 180] as const;

export const EXERCISE_NAMES = [
  'Press Banca', 'Press Inclinado', 'Press Militar', 'Fondos', 'Extensión Tríceps',
  'Peso Muerto', 'Remo', 'Dominadas', 'Curl Bíceps', 'Curl Martillo',
  'Sentadilla', 'Leg Press', 'Sentadilla Búlgara', 'Extensión', 'Curl Femoral', 'Hip Thrust',
];

export const WEEKLY_PLAN_DEFAULT: EnginePlanDay[] = [
  { day: 'Lunes',     type: 'Push', exercises: [{ name: 'Press Banca',       sets: 4, repMin: 8,  repMax: 12 }, { name: 'Press Militar',   sets: 3, repMin: 8,  repMax: 12 }] },
  { day: 'Martes',    type: 'Pull', exercises: [{ name: 'Peso Muerto',        sets: 4, repMin: 5,  repMax: 8  }, { name: 'Remo',            sets: 3, repMin: 8,  repMax: 12 }] },
  { day: 'Miércoles', type: 'Legs', exercises: [{ name: 'Sentadilla',         sets: 4, repMin: 6,  repMax: 10 }, { name: 'Leg Press',       sets: 3, repMin: 10, repMax: 15 }] },
  { day: 'Jueves',    type: 'Push', exercises: [{ name: 'Press Inclinado',    sets: 4, repMin: 8,  repMax: 12 }, { name: 'Fondos',          sets: 3, repMin: 10, repMax: 15 }] },
  { day: 'Viernes',   type: 'Pull', exercises: [{ name: 'Dominadas',          sets: 4, repMin: 6,  repMax: 10 }, { name: 'Curl Bíceps',     sets: 3, repMin: 10, repMax: 15 }] },
  { day: 'Sábado',    type: 'Legs', exercises: [{ name: 'Sentadilla Búlgara', sets: 4, repMin: 8,  repMax: 12 }, { name: 'Extensión',       sets: 3, repMin: 12, repMax: 15 }] },
  { day: 'Domingo',   type: 'Rest', exercises: [] },
];

/** Base accumulated weekly volume (simulates historical DB data) */
export const BASE_WEEKLY_VOLUME: Record<string, number> = {
  Pecho: 8, Espalda: 10, Hombros: 6, Bíceps: 6, Tríceps: 6,
  Cuádriceps: 8, Isquiotibiales: 6, Glúteos: 6, Core: 4, Pantorrillas: 4,
};

/** Initial PRs (seeded before any active session) */
export const INITIAL_PRS: LivePR[] = [
  { exercise: 'Press Banca', oneRM: 95,  fiveRM: epleyNRM(95, 5),  tenRM: epleyNRM(95, 10),  date: '2026-03-10', prevOneRM: 90,  isNewPR: false },
  { exercise: 'Sentadilla',  oneRM: 130, fiveRM: epleyNRM(130, 5), tenRM: epleyNRM(130, 10), date: '2026-03-15', prevOneRM: 120, isNewPR: false },
  { exercise: 'Peso Muerto', oneRM: 150, fiveRM: epleyNRM(150, 5), tenRM: epleyNRM(150, 10), date: '2026-03-08', prevOneRM: 145, isNewPR: false },
  { exercise: 'Curl Bíceps', oneRM: 18,  fiveRM: epleyNRM(18, 5),  tenRM: epleyNRM(18, 10),  date: '2026-03-12', prevOneRM: 16,  isNewPR: false },
];

/** Simulated tonelage history — last 8 weeks */
export const INITIAL_TONELAGE: Record<string, TonelagePoint[]> = {
  'Press Banca': [{ week: 'S1', volume: 5600 }, { week: 'S2', volume: 5880 }, { week: 'S3', volume: 6160 }, { week: 'S4', volume: 6000 }, { week: 'S5', volume: 6400 }, { week: 'S6', volume: 6720 }, { week: 'S7', volume: 7040 }, { week: 'S8', volume: 7200 }],
  'Sentadilla':  [{ week: 'S1', volume: 8000 }, { week: 'S2', volume: 8400 }, { week: 'S3', volume: 8800 }, { week: 'S4', volume: 8600 }, { week: 'S5', volume: 9000 }, { week: 'S6', volume: 9600 }, { week: 'S7', volume: 9800 }, { week: 'S8', volume: 10200 }],
  'Peso Muerto': [{ week: 'S1', volume: 9600 }, { week: 'S2', volume: 10200 }, { week: 'S3', volume: 10400 }, { week: 'S4', volume: 10800 }, { week: 'S5', volume: 11200 }, { week: 'S6', volume: 11600 }, { week: 'S7', volume: 12000 }, { week: 'S8', volume: 12400 }],
  'Curl Bíceps': [{ week: 'S1', volume: 840 }, { week: 'S2', volume: 900 }, { week: 'S3', volume: 960 }, { week: 'S4', volume: 980 }, { week: 'S5', volume: 1020 }, { week: 'S6', volume: 1080 }, { week: 'S7', volume: 1120 }, { week: 'S8', volume: 1176 }],
};

/** Build default session exercises (used on first load and after finishing a session) */
export function makeDefaultExercises(): EngineExercise[] {
  return SAMPLE_EXERCISES.map((ex) => ({
    ...ex,
    sets: [{ id: String(Date.now() + ex.id), weight: ex.lastWeight, reps: ex.lastReps, rpe: 7 }],
  }));
}
