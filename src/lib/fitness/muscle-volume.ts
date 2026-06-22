/**
 * Volumen fraccional por grupo muscular.
 *
 * Vincula los ejercicios (de la rutina y de las sesiones registradas) con los
 * músculos que entrenan, para poder comparar VOLUMEN PLANIFICADO (rutina) vs
 * VOLUMEN HECHO (sesiones) contra los landmarks MEV/MAV/MRV.
 *
 * Conteo fraccional (elección del usuario): un ejercicio suma 1.0 serie a su
 * músculo principal y 0.5 a cada secundario. Así un compuesto (press banca)
 * aporta a pecho + hombro + tríceps, no solo a pecho.
 *
 * Slugs en inglés para casar con VOLUME_LANDMARKS de calculations.ts.
 */

export interface MuscleAttribution {
  primary: string;
  secondaries: string[];
}

const SECONDARY_WEIGHT = 0.5;

export const MUSCLE_ORDER = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "core", "calves",
] as const;

export const MUSCLE_LABEL_ES: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Cuádriceps",
  hamstrings: "Isquios",
  glutes: "Glúteos",
  core: "Core",
  calves: "Gemelos",
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Mapea un muscleGroup en español (de sesiones registradas) → slug inglés. */
export function spanishMuscleToSlug(muscleEs: string): string | null {
  const m = norm(muscleEs);
  if (m.includes("pecho") || m.includes("chest")) return "chest";
  if (m.includes("espalda") || m.includes("dorsal") || m.includes("back") || m.includes("lat")) return "back";
  if (m.includes("hombro") || m.includes("deltoid") || m.includes("shoulder")) return "shoulders";
  if (m.includes("bicep")) return "biceps";
  if (m.includes("tricep")) return "triceps";
  if (m.includes("cuadricep") || m.includes("quad")) return "quads";
  if (m.includes("isquio") || m.includes("femoral") || m.includes("hamstring")) return "hamstrings";
  if (m.includes("gluteo") || m.includes("glute")) return "glutes";
  if (m.includes("core") || m.includes("abdom") || m.includes("oblicuo")) return "core";
  if (m.includes("pantorr") || m.includes("gemelo") || m.includes("calve") || m.includes("calf")) return "calves";
  return null;
}

// Reglas ordenadas por especificidad: la primera que matchea gana.
const RULES: { keys: string[]; m: MuscleAttribution }[] = [
  // Deltoide posterior — debe ir ANTES que "pec deck" (apertura) para no caer en pecho.
  { keys: ["reverse pec deck", "pec deck inverso", "peck deck inverso", "contractor inverso", "deltoide posterior"], m: { primary: "shoulders", secondaries: ["back"] } },
  { keys: ["pullover"], m: { primary: "back", secondaries: ["chest"] } },
  { keys: ["press militar", "press de hombro", "overhead", "ohp", "militar", "arnold"], m: { primary: "shoulders", secondaries: ["triceps"] } },
  { keys: ["press inclinad", "incline"], m: { primary: "chest", secondaries: ["shoulders", "triceps"] } },
  { keys: ["press banca", "bench", "press de pecho", "press con barra", "press mancuern", "press plano"], m: { primary: "chest", secondaries: ["shoulders", "triceps"] } },
  { keys: ["fondo", "dip"], m: { primary: "chest", secondaries: ["triceps", "shoulders"] } },
  { keys: ["apertura", "pec deck", "contractor", "peck deck", "cruce de polea"], m: { primary: "chest", secondaries: [] } },
  { keys: ["peso muerto rumano", "rumano", "rdl", "buenos dias", "good morning"], m: { primary: "hamstrings", secondaries: ["glutes", "back"] } },
  { keys: ["curl femoral", "femoral", "leg curl", "curl de pierna", "curl tumbado", "curl sentado"], m: { primary: "hamstrings", secondaries: [] } },
  { keys: ["peso muerto", "deadlift"], m: { primary: "back", secondaries: ["hamstrings", "glutes"] } },
  { keys: ["hip thrust", "empuje de cadera", "gluteo", "glute", "patada de gluteo", "puente"], m: { primary: "glutes", secondaries: ["hamstrings"] } },
  { keys: ["sentadilla", "squat", "hack"], m: { primary: "quads", secondaries: ["glutes", "hamstrings"] } },
  { keys: ["prensa", "leg press"], m: { primary: "quads", secondaries: ["glutes"] } },
  { keys: ["zancada", "lunge", "bulgara", "desplante", "split squat"], m: { primary: "quads", secondaries: ["glutes", "hamstrings"] } },
  { keys: ["extension de cuadricep", "extension cuadricep", "leg extension", "cuadricep", "quad"], m: { primary: "quads", secondaries: [] } },
  { keys: ["gemelo", "pantorrilla", "calf", "soleo", "elevacion de talon"], m: { primary: "calves", secondaries: [] } },
  { keys: ["dominada", "pull up", "pull-up", "jalon", "pulldown", "pull down", "remo", "row"], m: { primary: "back", secondaries: ["biceps"] } },
  { keys: ["face pull", "pajaro", "reverse fly", "deltoide posterior", "pull apart"], m: { primary: "shoulders", secondaries: ["back"] } },
  { keys: ["elevacion lateral", "lateral raise", "elevaciones laterales", "lateral"], m: { primary: "shoulders", secondaries: [] } },
  { keys: ["curl martillo", "hammer"], m: { primary: "biceps", secondaries: [] } },
  { keys: ["curl", "bicep"], m: { primary: "biceps", secondaries: [] } },
  { keys: ["extension de tricep", "triceps", "tricep", "press frances", "frances", "pushdown", "jalon de tricep", "patada de tricep", "copa"], m: { primary: "triceps", secondaries: [] } },
  { keys: ["plancha", "plank", "abdom", "crunch", "oblicuo", "rueda abdominal", "elevacion de pierna", "russian twist", "woodchop", "lenador", "pallof", "core"], m: { primary: "core", secondaries: [] } },
  { keys: ["press"], m: { primary: "chest", secondaries: ["shoulders", "triceps"] } },
  { keys: ["espalda", "back"], m: { primary: "back", secondaries: ["biceps"] } },
  { keys: ["pecho", "chest"], m: { primary: "chest", secondaries: ["shoulders", "triceps"] } },
  { keys: ["hombro", "shoulder", "deltoide"], m: { primary: "shoulders", secondaries: ["triceps"] } },
  { keys: ["pierna", "leg", "tren inferior"], m: { primary: "quads", secondaries: ["glutes", "hamstrings"] } },
];

/**
 * Resuelve los músculos de un ejercicio por su nombre. Si no matchea ninguna
 * regla, intenta con el muscleGroup registrado (de la sesión) como principal.
 * Devuelve null si no se puede categorizar.
 */
export function resolveExerciseMuscles(
  name: string,
  fallbackMuscleGroup?: string | null,
): MuscleAttribution | null {
  const n = norm(name);
  if (n) {
    for (const rule of RULES) {
      if (rule.keys.some((k) => n.includes(k))) return rule.m;
    }
  }
  if (fallbackMuscleGroup) {
    const slug = spanishMuscleToSlug(fallbackMuscleGroup);
    if (slug) return { primary: slug, secondaries: [] };
  }
  return null;
}

// ─── Cálculo de volumen ───────────────────────────────────────────────────────

interface ScheduleExercise {
  name: string;
  sets: number;
}
interface ScheduleDay {
  exercises?: ScheduleExercise[];
}

export interface VolumeResult {
  byMuscle: Record<string, number>;
  uncategorized: string[];
}

function addAttribution(out: Record<string, number>, m: MuscleAttribution, sets: number) {
  out[m.primary] = (out[m.primary] ?? 0) + sets;
  for (const sec of m.secondaries) {
    out[sec] = (out[sec] ?? 0) + sets * SECONDARY_WEIGHT;
  }
}

/** Volumen planificado (series/semana fraccionales) desde el schedule de la rutina. */
export function plannedVolumeByMuscle(schedule: ScheduleDay[]): VolumeResult {
  const byMuscle: Record<string, number> = {};
  const uncategorized = new Set<string>();
  for (const day of schedule ?? []) {
    for (const ex of day.exercises ?? []) {
      const name = ex.name?.trim();
      if (!name || !(ex.sets > 0)) continue;
      const m = resolveExerciseMuscles(name);
      if (!m) {
        uncategorized.add(name);
        continue;
      }
      addAttribution(byMuscle, m, ex.sets);
    }
  }
  return { byMuscle, uncategorized: Array.from(uncategorized) };
}

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

/** Una serie cuenta como "efectiva" si está cerca del fallo (reps ≥ 3, RPE ≥ 6 o sin dato). */
function isEffective(s: LoggedSet): boolean {
  return s.reps >= 3 && (s.rpe == null || s.rpe >= 6);
}

/** Volumen hecho (series efectivas fraccionales) desde sesiones con date ≥ sinceStr. */
export function doneVolumeByMuscle(
  workouts: LoggedWorkout[],
  sinceStr: string,
): VolumeResult {
  const byMuscle: Record<string, number> = {};
  const uncategorized = new Set<string>();
  for (const w of workouts ?? []) {
    if (w.date < sinceStr) continue;
    for (const ex of w.exercises ?? []) {
      const eff = (ex.sets ?? []).filter(isEffective).length;
      if (eff === 0) continue;
      const m = resolveExerciseMuscles(ex.exerciseName, ex.muscleGroup);
      if (!m) {
        uncategorized.add(ex.exerciseName);
        continue;
      }
      addAttribution(byMuscle, m, eff);
    }
  }
  return { byMuscle, uncategorized: Array.from(uncategorized) };
}

/** Redondea a 0.5 para mostrar (evita "13.999"). */
export function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
