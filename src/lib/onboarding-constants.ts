// Constantes compartidas entre la página de onboarding, settings y lógica de módulos.
// No hardcodear strings de módulos o intereses fuera de aquí — referir siempre.

// Módulos wellness (mood/sleep/hydration/medications) fueron eliminados en
// 2026-04. Hidratación vive ahora en nutrición. Medicamentos/suplementos se
// loggean como alimentos custom. Sleep y mood quedaron descontinuados.
export type ModuleKey =
  | "home"
  | "habits"
  | "tasks"
  | "settings"
  | "fitness"
  | "nutrition"
  | "fasting"
  | "finance"
  | "projects"
  | "planner"
  | "meditation"
  | "reading"
  | "menstrualCycle"
  | "pregnancy"
  | "organization"
  | "gamification"
  | "journal";

export type InterestKey =
  | "training"
  | "nutrition"
  | "mindfulness"
  | "finance"
  | "productivity"
  | "study"
  | "reading"
  | "fasting"
  | "menstrualCycle"
  | "pregnancy"
  | "none";

export type BiologicalSex =
  | "male"
  | "female"
  | "intersex"
  | "prefer_not_say";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export type Units = "metric" | "imperial";

// Módulos que TODOS los usuarios tienen siempre activos
export const CORE_MODULES: ModuleKey[] = [
  "home",
  "habits",
  "tasks",
  "settings",
  "gamification",
];

// Módulo → se auto-activa si alguno de estos intereses está marcado
export const MODULE_ACTIVATION: Record<
  Exclude<ModuleKey, (typeof CORE_MODULES)[number]>,
  InterestKey[]
> = {
  fitness: ["training"],
  nutrition: ["nutrition"],
  fasting: ["fasting"],
  finance: ["finance"],
  projects: ["productivity"],
  planner: ["productivity", "study"],
  meditation: ["mindfulness"],
  reading: ["reading"],
  menstrualCycle: ["menstrualCycle"],
  pregnancy: ["pregnancy"],
  organization: [],
  journal: ["mindfulness"],
};

// Módulos con restricción por sexo biológico
export const SEX_GATED_MODULES: Partial<Record<ModuleKey, BiologicalSex[]>> = {
  menstrualCycle: ["female"],
  pregnancy: ["female"],
};

export const INTEREST_LABELS: Record<InterestKey, { label: string; emoji: string; description: string }> = {
  training: {
    label: "Entrenamiento / Gimnasio",
    emoji: "💪",
    description: "Series, reps, PRs, volumen, proyecciones",
  },
  nutrition: {
    label: "Nutrición",
    emoji: "🍎",
    description: "Macros, calorías, recipes, log de comidas",
  },
  mindfulness: {
    label: "Mindfulness / Meditación",
    emoji: "🧘",
    description: "Sesiones, journal guiado, respiración",
  },
  finance: {
    label: "Finanzas",
    emoji: "💰",
    description: "Transacciones, presupuestos, metas de ahorro",
  },
  productivity: {
    label: "Productividad / Trabajo",
    emoji: "🎯",
    description: "Tareas, proyectos, pomodoro, deep work",
  },
  study: {
    label: "Estudio / Aprendizaje",
    emoji: "📚",
    description: "Planner académico, técnicas de estudio",
  },
  reading: {
    label: "Lectura",
    emoji: "📖",
    description: "Tracker de libros, notas de lectura",
  },
  fasting: {
    label: "Ayuno intermitente",
    emoji: "⏰",
    description: "Ventanas de ayuno, histórico, objetivos",
  },
  menstrualCycle: {
    label: "Ciclo menstrual",
    emoji: "🌙",
    description: "Ciclo, síntomas, energía, fertilidad",
  },
  pregnancy: {
    label: "Embarazo / Lactancia",
    emoji: "🤰",
    description: "Seguimiento de embarazo o lactancia",
  },
  none: {
    label: "Ninguno específico",
    emoji: "🌱",
    description: "Empezar con módulos básicos y decidir después",
  },
};

export const BIOLOGICAL_SEX_LABELS: Record<BiologicalSex, string> = {
  male: "Masculino",
  female: "Femenino",
  intersex: "Intersexual",
  prefer_not_say: "Prefiero no decir",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: "Sedentario", description: "Poco o nada de ejercicio" },
  light: { label: "Ligero", description: "Ejercicio 1-3 días por semana" },
  moderate: { label: "Moderado", description: "Ejercicio 3-5 días por semana" },
  active: { label: "Activo", description: "Ejercicio 6-7 días por semana" },
  very_active: { label: "Muy activo", description: "Ejercicio intenso diario o físico en el trabajo" },
};

export const FITNESS_LEVEL_LABELS: Record<FitnessLevel, { label: string; description: string }> = {
  beginner: { label: "Principiante", description: "0-6 meses entrenando con constancia" },
  intermediate: { label: "Intermedio", description: "6 meses - 3 años" },
  advanced: { label: "Avanzado", description: "3+ años, técnica sólida, PRs competitivos" },
};

/**
 * Deriva la lista de módulos activos dado el perfil del usuario.
 * - Siempre incluye CORE_MODULES
 * - Para cada módulo condicional: se activa si al menos 1 interés marcado lo requiere
 * - Respeta gates por sexo biológico
 */
export function deriveEnabledModules(input: {
  interests: InterestKey[];
  biologicalSex?: BiologicalSex | null;
}): ModuleKey[] {
  const modules = new Set<ModuleKey>(CORE_MODULES);
  const interestSet = new Set(input.interests);

  for (const [mod, requiredInterests] of Object.entries(MODULE_ACTIVATION) as [
    ModuleKey,
    InterestKey[],
  ][]) {
    const sexGate = SEX_GATED_MODULES[mod];
    if (sexGate && (!input.biologicalSex || !sexGate.includes(input.biologicalSex))) {
      continue;
    }
    if (requiredInterests.length === 0) continue;
    if (requiredInterests.some((i) => interestSet.has(i))) {
      modules.add(mod);
    }
  }

  return Array.from(modules);
}
