/**
 * Volumen fraccional por grupo muscular.
 *
 * Cada ejercicio se resuelve a una lista de CONTRIBUCIONES { músculo, fracción }.
 * Fracciones basadas en evidencia (método fraccional de Schoenfeld):
 *   1.0  = motor primario (trabajo directo)
 *   0.5  = sinergista fuerte
 *   0.25 = asistente / estabilizador menor
 * Así un compuesto (press banca) aporta 1.0 a pecho, 0.5 a hombro y 0.5 a
 * tríceps; un aislado (curl) aporta 1.0 solo a su músculo.
 *
 * Es la base de datos de ejercicios → volumen. Se amplía por lotes; lo que no
 * está curado cae en reglas por palabra clave (1.0 primario / 0.5 sinergista).
 *
 * Slugs en inglés para casar con VOLUME_LANDMARKS de calculations.ts.
 */

export interface MuscleContribution {
  muscle: string;
  fraction: number;
}

export interface MuscleAttribution {
  primary: string;
  secondaries: string[];
}

export const MUSCLE_ORDER = [
  "chest",
  "lats", "traps", "lower_back",
  "delt_ant", "delt_lat", "delt_post",
  "biceps", "triceps",
  "quads", "hamstrings", "glutes",
  "core", "calves",
] as const;

export const MUSCLE_LABEL_ES: Record<string, string> = {
  chest: "Pecho",
  lats: "Dorsales",
  traps: "Trapecios",
  lower_back: "Lumbar",
  delt_ant: "Deltoide anterior",
  delt_lat: "Deltoide lateral",
  delt_post: "Deltoide posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Cuádriceps",
  hamstrings: "Isquios",
  glutes: "Glúteos",
  core: "Core",
  calves: "Gemelos",
  // Aliases legacy para datos existentes — no aparecen en UI
  back: "Espalda",
  shoulders: "Hombros",
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Mapea un muscleGroup en español (de sesiones registradas) → slug fino. */
export function spanishMuscleToSlug(muscleEs: string): string | null {
  const m = norm(muscleEs);
  if (m.includes("pecho") || m.includes("chest")) return "chest";
  // Espalda fina: primero los específicos, luego genéricos → lats como fallback
  if (m.includes("trapecio") || (m.includes("trap") && !m.includes("pec"))) return "traps";
  if (m.includes("lumbar") || m.includes("lower back") || m.includes("erector")) return "lower_back";
  if (m.includes("dorsal") || (m.includes("lat") && !m.includes("lateral"))) return "lats";
  if (m.includes("espalda") || m.includes("back")) return "lats";
  // Deltoides: primero los específicos, luego genérico → delt_lat como fallback
  if (m.includes("anterior") || m.includes("front delt")) return "delt_ant";
  if (m.includes("posterior") || m.includes("rear delt")) return "delt_post";
  if (m.includes("hombro") || m.includes("deltoid") || m.includes("shoulder")) return "delt_lat";
  if (m.includes("bicep")) return "biceps";
  if (m.includes("tricep")) return "triceps";
  if (m.includes("cuadricep") || m.includes("quad")) return "quads";
  if (m.includes("isquio") || m.includes("femoral") || m.includes("hamstring")) return "hamstrings";
  if (m.includes("gluteo") || m.includes("glute")) return "glutes";
  if (m.includes("core") || m.includes("abdom") || m.includes("oblicuo")) return "core";
  if (m.includes("pantorr") || m.includes("gemelo") || m.includes("calve") || m.includes("calf")) return "calves";
  return null;
}

// Helpers para construir contribuciones legibles.
const C = (muscle: string, fraction: number): MuscleContribution => ({ muscle, fraction });

// Reglas ordenadas por especificidad: la primera que matchea gana.
// Fracciones Schoenfeld: 1.0 motor primario · 0.5 sinergista fuerte · 0.25 asistente menor.
// Slugs finos: lats/traps/lower_back para espalda; delt_ant/delt_lat/delt_post para hombros.
const RULES: { keys: string[]; c: MuscleContribution[] }[] = [
  // ── Deltoide posterior (aislado) ─────────────────────────────────────────────
  { keys: ["reverse pec deck", "pec deck inverso", "peck deck inverso", "contractor inverso", "deltoide posterior"],
    c: [C("delt_post", 1), C("traps", 0.25)] },
  // "face pull" y pájaros: posterior + trapecios medios
  { keys: ["face pull", "pajaro", "reverse fly", "pull apart"],
    c: [C("delt_post", 1), C("traps", 0.5)] },
  // ── Remo al mentón: deltoide lateral primario ────────────────────────────────
  { keys: ["remo al menton", "upright row", "jalon al menton", "remo vertical"],
    c: [C("delt_lat", 1), C("traps", 0.5), C("biceps", 0.25)] },
  // ── Espalda especiales ───────────────────────────────────────────────────────
  { keys: ["pullover"],
    c: [C("lats", 1), C("chest", 0.25)] },
  // ── Press de hombro: delt_ant primario, delt_lat secundario ─────────────────
  // El OHP/press militar recluta principalmente el deltoide anterior; el lateral
  // trabaja como estabilizador fuerte. El Arnold añade rotación pero la carga
  // principal sigue siendo anterior.
  { keys: ["press militar", "press de hombro", "overhead", "ohp", "militar", "arnold", "press pike", "handstand"],
    c: [C("delt_ant", 1), C("delt_lat", 0.5), C("triceps", 0.5)] },
  // ── Press de pecho ───────────────────────────────────────────────────────────
  // Todos los press de pecho reclutan delt_ant (no lateral): la cabeza anterior
  // participa en aducción horizontal, la lateral no.
  { keys: ["press banca agarre cerrado", "agarre cerrado", "close grip", "press cerrado"],
    c: [C("triceps", 1), C("chest", 0.5), C("delt_ant", 0.25)] },
  { keys: ["press inclinad", "incline"],
    c: [C("chest", 1), C("delt_ant", 0.5), C("triceps", 0.5)] },
  { keys: ["press banca", "bench", "press de pecho", "press con barra", "press mancuern", "press plano", "press declinad"],
    c: [C("chest", 1), C("delt_ant", 0.5), C("triceps", 0.5)] },
  { keys: ["fondo", "dip"],
    c: [C("chest", 1), C("triceps", 0.5), C("delt_ant", 0.25)] },
  // Flexiones: igual que press de pecho (chest + delt_ant + triceps)
  { keys: ["flexion", "push-up", "push up", "lagartija", "pushup", "flexiones"],
    c: [C("chest", 1), C("delt_ant", 0.5), C("triceps", 0.5)] },
  // Pike push-up: más hombro que pecho por el ángulo de inclinación
  { keys: ["pike push", "flexion en pica", "push up pika", "pica"],
    c: [C("delt_ant", 1), C("triceps", 0.5)] },
  { keys: ["apertura", "pec deck", "contractor", "peck deck", "cruce de polea", "crossover", "fly", "pec fly"],
    c: [C("chest", 1)] },
  // ── Cadena posterior (hinge) ─────────────────────────────────────────────────
  { keys: ["peso muerto rumano", "rumano", "rdl", "buenos dias", "good morning"],
    c: [C("hamstrings", 1), C("glutes", 0.5), C("lower_back", 0.25)] },
  { keys: ["curl femoral", "femoral", "leg curl", "curl de pierna", "curl tumbado", "curl sentado", "nordic"],
    c: [C("hamstrings", 1)] },
  { keys: ["peso muerto sumo", "sumo"],
    c: [C("glutes", 1), C("quads", 0.5), C("hamstrings", 0.5), C("lower_back", 0.5)] },
  // Peso muerto convencional: espalda baja primaria, isquios/glúteos secundarios,
  // trapecios estabilizan la barra bajo tensión.
  { keys: ["peso muerto", "deadlift"],
    c: [C("lower_back", 1), C("hamstrings", 0.5), C("glutes", 0.5), C("traps", 0.25)] },
  { keys: ["hip thrust", "empuje de cadera", "puente de gluteo", "glute bridge", "kettlebell swing", "swing"],
    c: [C("glutes", 1), C("hamstrings", 0.5)] },
  // Hiperextensión: espalda baja primaria, glúteos sinergistas fuertes
  { keys: ["hiperextension", "back extension", "extension de espalda", "extensiones de espalda", "superman", "reverse hyper", "hiperextension reversa"],
    c: [C("lower_back", 1), C("glutes", 0.5)] },
  { keys: ["gluteo", "glute", "patada de gluteo", "kickback", "abduccion", "donkey kick", "patada trasera", "clamshell", "almeja", "fire hydrant", "hip abduction"],
    c: [C("glutes", 1)] },
  // ── Cuádriceps (sentadilla: isquios NO cuentan, Schoenfeld 2019) ─────────────
  { keys: ["sentadilla", "squat", "hack"],
    c: [C("quads", 1), C("glutes", 0.5)] },
  { keys: ["prensa", "leg press"],
    c: [C("quads", 1), C("glutes", 0.5)] },
  { keys: ["zancada", "lunge", "bulgara", "desplante", "split squat", "step up", "subida al cajon"],
    c: [C("quads", 1), C("glutes", 0.5)] },
  { keys: ["extension de cuadricep", "extension cuadricep", "leg extension", "cuadricep", "quad", "sissy"],
    c: [C("quads", 1)] },
  // Saltos y pliométricos: cuádriceps + glúteos (potencia del tren inferior)
  { keys: ["salto", "jump", "box jump", "box step", "plyometric", "pliometrico", "burpee"],
    c: [C("quads", 1), C("glutes", 0.5)] },
  // ── Pantorrilla ──────────────────────────────────────────────────────────────
  { keys: ["gemelo", "pantorrilla", "calf", "soleo", "elevacion de talon"],
    c: [C("calves", 1)] },
  // ── Trapecios aislados ───────────────────────────────────────────────────────
  { keys: ["encogimiento", "shrug"],
    c: [C("traps", 1)] },
  // Farmer's carry: trapecios soportan la carga + core estabiliza
  { keys: ["farmer", "granjero", "carry", "caminata del granjero"],
    c: [C("traps", 1), C("core", 0.25)] },
  // YTW / Y-T-W raises: deltoide posterior + trapecios
  { keys: ["ytw", "y-t-w", "y raise", "t raise", "w raise", "yty"],
    c: [C("delt_post", 1), C("traps", 0.5)] },
  // Jalón recto de pie: dorsal en máximo estiramiento (aislado)
  { keys: ["jalon de pie", "jalon recto", "straight arm", "tiron recto", "tirón recto"],
    c: [C("lats", 1)] },
  // ── Espalda: jalones y dominadas (dorsales primarios) ────────────────────────
  { keys: ["dominada", "pull up", "pull-up", "chin up", "chin-up", "muscle up", "jalon", "pulldown", "pull down"],
    c: [C("lats", 1), C("biceps", 0.5)] },
  // Remos horizontales: dorsales + trapecios medios
  { keys: ["remo", "row", "pendlay"],
    c: [C("lats", 1), C("traps", 0.5), C("biceps", 0.25)] },
  // ── Deltoides aislados ───────────────────────────────────────────────────────
  { keys: ["elevacion frontal", "front raise"],
    c: [C("delt_ant", 1)] },
  { keys: ["elevacion lateral", "lateral raise", "elevaciones laterales", "lateral"],
    c: [C("delt_lat", 1)] },
  // ── Brazos aislados ──────────────────────────────────────────────────────────
  { keys: ["curl martillo", "hammer"],
    c: [C("biceps", 1)] },
  { keys: ["curl", "bicep"],
    c: [C("biceps", 1)] },
  { keys: ["extension de tricep", "triceps", "tricep", "press frances", "frances", "pushdown", "jalon de tricep", "patada de tricep", "copa", "skullcrusher", "rompecraneos"],
    c: [C("triceps", 1)] },
  // ── Core ─────────────────────────────────────────────────────────────────────
  { keys: ["plancha", "plank", "abdom", "crunch", "oblicuo", "rueda abdominal", "elevacion de pierna", "russian twist", "giro ruso", "woodchop", "lenador", "pallof", "hollow", "core", "dragon flag", "dead bug", "bird dog", "toes to bar", "l-sit", "bear crawl"],
    c: [C("core", 1)] },
  // ── Levantamientos olímpicos y full body ─────────────────────────────────────
  // Trapecios dominantes en el tirón; cuádriceps y glúteos generan la potencia.
  { keys: ["clean", "power clean", "hang clean", "arranque", "snatch", "envion", "clean and jerk"],
    c: [C("traps", 1), C("quads", 0.5), C("glutes", 0.5)] },
  // Thruster: combinación de press de hombro + sentadilla
  { keys: ["thruster"],
    c: [C("delt_ant", 1), C("quads", 1), C("triceps", 0.5), C("glutes", 0.5)] },
  // Landmine press: ángulo oblicuo → más delt_ant que pecho plano, menos que OHP
  { keys: ["landmine"],
    c: [C("delt_ant", 1), C("chest", 0.5), C("triceps", 0.25)] },
  // Turkish get-up: full body pero con énfasis en core + glúteos + hombro
  { keys: ["turkish get-up", "get up", "turkish"],
    c: [C("core", 1), C("delt_ant", 0.5), C("glutes", 0.5)] },
  // Sled push/pull: tren inferior potencia
  { keys: ["trineo", "sled push", "sled pull", "empuje de trineo"],
    c: [C("quads", 1), C("glutes", 0.5)] },
  // ── Genéricos (último recurso por palabra clave) ─────────────────────────────
  { keys: ["press"],
    c: [C("chest", 1), C("delt_ant", 0.5), C("triceps", 0.5)] },
  { keys: ["espalda", "back"],
    c: [C("lats", 1), C("biceps", 0.5)] },
  { keys: ["pecho", "chest"],
    c: [C("chest", 1), C("delt_ant", 0.5), C("triceps", 0.5)] },
  { keys: ["hombro", "shoulder", "deltoide"],
    c: [C("delt_lat", 1)] },
  { keys: ["pierna", "leg", "tren inferior"],
    c: [C("quads", 1), C("glutes", 0.5)] },
];

/**
 * Contribuciones { músculo, fracción } de un ejercicio por nombre. Si no matchea
 * ninguna regla, usa el muscleGroup registrado como primario (1.0). null si no
 * se puede categorizar.
 */
export function resolveExerciseContributions(
  name: string,
  fallbackMuscleGroup?: string | null,
): MuscleContribution[] | null {
  const n = norm(name);
  if (n) {
    for (const rule of RULES) {
      if (rule.keys.some((k) => n.includes(k))) return rule.c;
    }
  }
  if (fallbackMuscleGroup) {
    const slug = spanishMuscleToSlug(fallbackMuscleGroup);
    if (slug) return [C(slug, 1)];
  }
  return null;
}

/**
 * Versión compacta { primary, secondaries } (para el logger). Primary = mayor
 * fracción; el resto son secundarios.
 */
export function resolveExerciseMuscles(
  name: string,
  fallbackMuscleGroup?: string | null,
): MuscleAttribution | null {
  const c = resolveExerciseContributions(name, fallbackMuscleGroup);
  if (!c || c.length === 0) return null;
  const sorted = [...c].sort((a, b) => b.fraction - a.fraction);
  return {
    primary: sorted[0].muscle,
    secondaries: sorted.slice(1).map((x) => x.muscle),
  };
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

function addContributions(
  out: Record<string, number>,
  contributions: MuscleContribution[],
  sets: number,
) {
  for (const { muscle, fraction } of contributions) {
    out[muscle] = (out[muscle] ?? 0) + sets * fraction;
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
      const c = resolveExerciseContributions(name);
      if (!c) {
        uncategorized.add(name);
        continue;
      }
      addContributions(byMuscle, c, ex.sets);
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
      const c = resolveExerciseContributions(ex.exerciseName, ex.muscleGroup);
      if (!c) {
        uncategorized.add(ex.exerciseName);
        continue;
      }
      addContributions(byMuscle, c, eff);
    }
  }
  return { byMuscle, uncategorized: Array.from(uncategorized) };
}

/** Redondea a 0.5 para mostrar (evita "13.999"). */
export function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}
