/**
 * Biblioteca de programas de entrenamiento clásicos — templates de la
 * comunidad + literatura (Wendler, Rippetoe, Kubik, etc.).
 *
 * Los templates son data inmutable (no viven en DB). Cuando el user
 * "usa uno", se crea un TrainingProgram basado en este template con sus
 * phases pre-configuradas.
 *
 * Estructura:
 *   - phases: mesociclos (accumulation / intensification / realization / deload)
 *   - schedule: [{dayOfWeek, templateName, exercises:[{name,sets,repRange,targetRpe}]}]
 */

import type { SetType } from "@/lib/validation";

export interface TemplateExercise {
  name: string;
  sets: number;
  repRange: [number, number];
  targetRpe?: number;
  notes?: string;
  setType?: SetType;
}

export interface TemplateDay {
  dayOfWeek: number; // 0=Dom, 1=Lun, …, 6=Sáb
  templateName: string;
  exercises: TemplateExercise[];
}

export interface TemplatePhase {
  name: "accumulation" | "intensification" | "realization" | "deload";
  weekStart: number;
  weekEnd: number;
  targetRpeMin?: number;
  targetRpeMax?: number;
  targetSetsPerMuscle?: number;
  notes?: string;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  author: string;
  description: string;
  type: "linear" | "dup" | "block" | "conjugate" | "custom";
  goal: "hypertrophy" | "strength" | "power" | "endurance" | "general";
  difficulty: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  daysPerWeek: number;
  phases: TemplatePhase[];
  schedule: TemplateDay[];
  highlights: string[];
}

// ─── Push / Pull / Legs 6 días ───────────────────────────────────────────────

const PPL_6: ProgramTemplate = {
  id: "ppl-6day-hypertrophy",
  name: "Push / Pull / Legs (6 días)",
  author: "Estándar de hipertrofia moderna",
  description:
    "Split clásico de 6 días agrupando empuje, tirón y piernas. Alta frecuencia (2×/semana por grupo), ideal para hipertrofia intermedia-avanzada.",
  type: "linear",
  goal: "hypertrophy",
  difficulty: "intermediate",
  durationWeeks: 12,
  daysPerWeek: 6,
  phases: [
    { name: "accumulation",   weekStart: 1,  weekEnd: 6,  targetRpeMin: 7, targetRpeMax: 8,  targetSetsPerMuscle: 14 },
    { name: "intensification", weekStart: 7,  weekEnd: 10, targetRpeMin: 8, targetRpeMax: 9,  targetSetsPerMuscle: 12 },
    { name: "realization",    weekStart: 11, weekEnd: 11, targetRpeMin: 9, targetRpeMax: 10, targetSetsPerMuscle: 8 },
    { name: "deload",         weekStart: 12, weekEnd: 12, targetRpeMin: 5, targetRpeMax: 6,  targetSetsPerMuscle: 6 },
  ],
  schedule: [
    {
      dayOfWeek: 1,
      templateName: "Push A",
      exercises: [
        { name: "Press Banca",        sets: 4, repRange: [5, 8],  targetRpe: 8 },
        { name: "Press Militar",      sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Press Inclinado DB", sets: 3, repRange: [8, 12], targetRpe: 8 },
        { name: "Elevaciones Laterales", sets: 4, repRange: [12, 15], targetRpe: 9 },
        { name: "Tríceps Cuerda",     sets: 3, repRange: [10, 15], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 2,
      templateName: "Pull A",
      exercises: [
        { name: "Dominadas",          sets: 4, repRange: [5, 10], targetRpe: 8 },
        { name: "Peso Muerto",        sets: 3, repRange: [3, 5],  targetRpe: 8 },
        { name: "Remo con Barra",     sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Jalón al Pecho",     sets: 3, repRange: [10, 12], targetRpe: 8 },
        { name: "Curl Bíceps",        sets: 3, repRange: [10, 12], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 3,
      templateName: "Legs A",
      exercises: [
        { name: "Sentadilla",         sets: 4, repRange: [5, 8],  targetRpe: 8 },
        { name: "Peso Muerto Rumano", sets: 3, repRange: [8, 10], targetRpe: 8 },
        { name: "Prensa",             sets: 3, repRange: [10, 12], targetRpe: 8 },
        { name: "Curl Femoral",       sets: 3, repRange: [10, 12], targetRpe: 9 },
        { name: "Gemelos de Pie",     sets: 4, repRange: [12, 15], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 4,
      templateName: "Push B",
      exercises: [
        { name: "Press Militar",      sets: 4, repRange: [5, 8],  targetRpe: 8 },
        { name: "Press Banca",        sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Aperturas DB",       sets: 3, repRange: [10, 12], targetRpe: 8 },
        { name: "Elevaciones Laterales", sets: 4, repRange: [12, 15], targetRpe: 9 },
        { name: "Fondos en Paralelas", sets: 3, repRange: [8, 12], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 5,
      templateName: "Pull B",
      exercises: [
        { name: "Remo con Barra",     sets: 4, repRange: [5, 8],  targetRpe: 8 },
        { name: "Dominadas",          sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Remo Unilateral DB", sets: 3, repRange: [8, 12], targetRpe: 8 },
        { name: "Face Pulls",         sets: 4, repRange: [12, 15], targetRpe: 9 },
        { name: "Curl Martillo",      sets: 3, repRange: [10, 12], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 6,
      templateName: "Legs B",
      exercises: [
        { name: "Peso Muerto",        sets: 4, repRange: [3, 6],  targetRpe: 8 },
        { name: "Sentadilla Frontal", sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Zancadas",           sets: 3, repRange: [10, 12], targetRpe: 8 },
        { name: "Extensión de Cuádriceps", sets: 3, repRange: [12, 15], targetRpe: 9 },
        { name: "Gemelos Sentado",    sets: 4, repRange: [15, 20], targetRpe: 9 },
      ],
    },
  ],
  highlights: [
    "Frecuencia 2×/semana por grupo muscular",
    "Progresión por microciclos con RPE escalando 7→10",
    "Deload obligatorio semana 12",
    "Volumen alineado con MEV→MAV (Renaissance Periodization)",
  ],
};

// ─── 5/3/1 Boring But Big (Wendler) ──────────────────────────────────────────

const BBB_531: ProgramTemplate = {
  id: "531-boring-but-big",
  name: "5/3/1 Boring But Big",
  author: "Jim Wendler",
  description:
    "Método de Jim Wendler. 4 días/semana, cada uno centrado en un gran lift (squat/bench/deadlift/OHP) al 85-95% de un 1RM entrenable, + trabajo accesorio volumétrico 5×10.",
  type: "linear",
  goal: "strength",
  difficulty: "intermediate",
  durationWeeks: 12,
  daysPerWeek: 4,
  phases: [
    { name: "accumulation", weekStart: 1, weekEnd: 3, targetRpeMin: 7, targetRpeMax: 8, notes: "Ciclo 1 (3/5/1 sets)" },
    { name: "deload",       weekStart: 4, weekEnd: 4, targetRpeMin: 5, targetRpeMax: 6 },
    { name: "accumulation", weekStart: 5, weekEnd: 7, targetRpeMin: 7, targetRpeMax: 8, notes: "Ciclo 2" },
    { name: "deload",       weekStart: 8, weekEnd: 8, targetRpeMin: 5, targetRpeMax: 6 },
    { name: "intensification", weekStart: 9, weekEnd: 11, targetRpeMin: 8, targetRpeMax: 9 },
    { name: "deload",       weekStart: 12, weekEnd: 12, targetRpeMin: 5, targetRpeMax: 6 },
  ],
  schedule: [
    {
      dayOfWeek: 1,
      templateName: "Día de Press Militar",
      exercises: [
        { name: "Press Militar",     sets: 3, repRange: [3, 5],  targetRpe: 9, notes: "5/3/1 main" },
        { name: "Press Militar BBB", sets: 5, repRange: [10, 10], targetRpe: 7, notes: "50-70% 1RM" },
        { name: "Dominadas",         sets: 5, repRange: [5, 10], targetRpe: 8 },
        { name: "Curl Bíceps",       sets: 3, repRange: [10, 15], targetRpe: 8 },
      ],
    },
    {
      dayOfWeek: 2,
      templateName: "Día de Peso Muerto",
      exercises: [
        { name: "Peso Muerto",       sets: 3, repRange: [3, 5],  targetRpe: 9, notes: "5/3/1 main" },
        { name: "Peso Muerto BBB",   sets: 5, repRange: [10, 10], targetRpe: 7, notes: "50-70% 1RM" },
        { name: "Hip Thrust",        sets: 3, repRange: [8, 12], targetRpe: 8 },
        { name: "Core (plank/ab wheel)", sets: 3, repRange: [10, 20], targetRpe: 7 },
      ],
    },
    {
      dayOfWeek: 4,
      templateName: "Día de Press Banca",
      exercises: [
        { name: "Press Banca",       sets: 3, repRange: [3, 5],  targetRpe: 9, notes: "5/3/1 main" },
        { name: "Press Banca BBB",   sets: 5, repRange: [10, 10], targetRpe: 7 },
        { name: "Remo con Barra",    sets: 5, repRange: [8, 10], targetRpe: 8 },
        { name: "Tríceps",           sets: 3, repRange: [12, 15], targetRpe: 8 },
      ],
    },
    {
      dayOfWeek: 5,
      templateName: "Día de Sentadilla",
      exercises: [
        { name: "Sentadilla",        sets: 3, repRange: [3, 5],  targetRpe: 9, notes: "5/3/1 main" },
        { name: "Sentadilla BBB",    sets: 5, repRange: [10, 10], targetRpe: 7 },
        { name: "Peso Muerto Rumano", sets: 3, repRange: [8, 10], targetRpe: 8 },
        { name: "Gemelos",           sets: 4, repRange: [15, 20], targetRpe: 9 },
      ],
    },
  ],
  highlights: [
    "Basado en 1RM entrenable (90% del 1RM real)",
    "Progresión lineal conservadora: +2.5kg upper / +5kg lower por ciclo",
    "BBB = 5×10 al 50-70% mismo día que el main lift",
    "Deload cada 4 semanas — no negociable",
  ],
};

// ─── Upper / Lower 4 días ────────────────────────────────────────────────────

const UPPER_LOWER_4: ProgramTemplate = {
  id: "upper-lower-4day",
  name: "Upper / Lower (4 días)",
  author: "Split clásico de frecuencia alta",
  description:
    "Alternando upper body y lower body, 4 días a la semana. Frecuencia 2×/semana por zona. Balance ideal hipertrofia + fuerza.",
  type: "linear",
  goal: "general",
  difficulty: "beginner",
  durationWeeks: 8,
  daysPerWeek: 4,
  phases: [
    { name: "accumulation", weekStart: 1, weekEnd: 4, targetRpeMin: 7, targetRpeMax: 8,  targetSetsPerMuscle: 12 },
    { name: "intensification", weekStart: 5, weekEnd: 7, targetRpeMin: 8, targetRpeMax: 9, targetSetsPerMuscle: 14 },
    { name: "deload", weekStart: 8, weekEnd: 8, targetRpeMin: 5, targetRpeMax: 6, targetSetsPerMuscle: 6 },
  ],
  schedule: [
    {
      dayOfWeek: 1,
      templateName: "Upper A (fuerza)",
      exercises: [
        { name: "Press Banca",       sets: 4, repRange: [5, 8],  targetRpe: 8 },
        { name: "Remo con Barra",    sets: 4, repRange: [6, 10], targetRpe: 8 },
        { name: "Press Militar",     sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Dominadas",         sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Curl Bíceps",       sets: 3, repRange: [10, 12], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 2,
      templateName: "Lower A (fuerza)",
      exercises: [
        { name: "Sentadilla",        sets: 4, repRange: [5, 8],  targetRpe: 8 },
        { name: "Peso Muerto Rumano", sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Prensa",            sets: 3, repRange: [10, 12], targetRpe: 8 },
        { name: "Curl Femoral",      sets: 3, repRange: [10, 12], targetRpe: 9 },
        { name: "Gemelos",           sets: 4, repRange: [12, 15], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 4,
      templateName: "Upper B (hipertrofia)",
      exercises: [
        { name: "Press Inclinado DB", sets: 4, repRange: [8, 12], targetRpe: 8 },
        { name: "Jalón al Pecho",     sets: 4, repRange: [10, 12], targetRpe: 8 },
        { name: "Aperturas DB",       sets: 3, repRange: [12, 15], targetRpe: 9 },
        { name: "Face Pulls",         sets: 3, repRange: [12, 15], targetRpe: 9 },
        { name: "Tríceps Cuerda",     sets: 3, repRange: [10, 15], targetRpe: 9 },
      ],
    },
    {
      dayOfWeek: 5,
      templateName: "Lower B (hipertrofia)",
      exercises: [
        { name: "Peso Muerto",       sets: 3, repRange: [3, 5],  targetRpe: 8 },
        { name: "Sentadilla Frontal", sets: 3, repRange: [6, 10], targetRpe: 8 },
        { name: "Zancadas",          sets: 3, repRange: [10, 12], targetRpe: 8 },
        { name: "Extensión Cuádriceps", sets: 3, repRange: [12, 15], targetRpe: 9 },
        { name: "Hip Thrust",        sets: 3, repRange: [10, 12], targetRpe: 8 },
      ],
    },
  ],
  highlights: [
    "Ideal principiantes/intermedios — alta simpleza",
    "Frecuencia 2x/semana por zona = hipertrofia óptima",
    "Equilibrio push/pull/piernas sin sobrecarga",
    "2 ciclos antes de deload",
  ],
};

// ─── StrongLifts 5x5 ─────────────────────────────────────────────────────────

const STRONGLIFTS_5X5: ProgramTemplate = {
  id: "stronglifts-5x5",
  name: "StrongLifts 5×5",
  author: "Mehdi (basado en Rippetoe/Starr)",
  description:
    "Programa clásico para principiantes absolutos. Solo 5 lifts compuestos, 5 series × 5 reps, progresión lineal +2.5kg cada sesión exitosa.",
  type: "linear",
  goal: "strength",
  difficulty: "beginner",
  durationWeeks: 12,
  daysPerWeek: 3,
  phases: [
    { name: "accumulation", weekStart: 1, weekEnd: 8,  targetRpeMin: 7, targetRpeMax: 9, notes: "Añade peso cada sesión" },
    { name: "intensification", weekStart: 9, weekEnd: 11, targetRpeMin: 8, targetRpeMax: 10, notes: "Deload cuando stallés" },
    { name: "deload", weekStart: 12, weekEnd: 12, targetRpeMin: 5, targetRpeMax: 6 },
  ],
  schedule: [
    {
      dayOfWeek: 1,
      templateName: "Entrenamiento A",
      exercises: [
        { name: "Sentadilla",    sets: 5, repRange: [5, 5], targetRpe: 8 },
        { name: "Press Banca",   sets: 5, repRange: [5, 5], targetRpe: 8 },
        { name: "Remo con Barra", sets: 5, repRange: [5, 5], targetRpe: 8 },
      ],
    },
    {
      dayOfWeek: 3,
      templateName: "Entrenamiento B",
      exercises: [
        { name: "Sentadilla",    sets: 5, repRange: [5, 5], targetRpe: 8 },
        { name: "Press Militar", sets: 5, repRange: [5, 5], targetRpe: 8 },
        { name: "Peso Muerto",   sets: 1, repRange: [5, 5], targetRpe: 8, notes: "solo 1 set pesado" },
      ],
    },
    {
      dayOfWeek: 5,
      templateName: "Entrenamiento A",
      exercises: [
        { name: "Sentadilla",    sets: 5, repRange: [5, 5], targetRpe: 8 },
        { name: "Press Banca",   sets: 5, repRange: [5, 5], targetRpe: 8 },
        { name: "Remo con Barra", sets: 5, repRange: [5, 5], targetRpe: 8 },
      ],
    },
  ],
  highlights: [
    "Programación más simple del mundo",
    "+2.5kg cada sesión exitosa (+1.25kg press)",
    "Ideal primeros 6-12 meses de entrenamiento",
    "Cuando stallés 3 veces seguidas → deload -10% y rearranca",
  ],
};

// ─── nSuns 5/3/1 LP ──────────────────────────────────────────────────────────

const NSUNS: ProgramTemplate = {
  id: "nsuns-531-lp",
  name: "nSuns 5/3/1 LP",
  author: "nSuns (reddit /r/fitness)",
  description:
    "Variante de Wendler con progresión más agresiva — más sets pesados del main lift y progresión lineal por sesión. Alta fatiga, alto ROI. Requiere recuperación óptima.",
  type: "linear",
  goal: "strength",
  difficulty: "advanced",
  durationWeeks: 8,
  daysPerWeek: 4,
  phases: [
    { name: "accumulation", weekStart: 1, weekEnd: 3, targetRpeMin: 7, targetRpeMax: 9 },
    { name: "intensification", weekStart: 4, weekEnd: 6, targetRpeMin: 8, targetRpeMax: 10 },
    { name: "realization", weekStart: 7, weekEnd: 7, targetRpeMin: 9, targetRpeMax: 10, notes: "Intenta nuevos PRs" },
    { name: "deload", weekStart: 8, weekEnd: 8, targetRpeMin: 5, targetRpeMax: 6 },
  ],
  schedule: [
    {
      dayOfWeek: 1,
      templateName: "Press Banca + Militar",
      exercises: [
        { name: "Press Banca",       sets: 8, repRange: [3, 8],  targetRpe: 9, notes: "progresión piramidal" },
        { name: "Press Militar",     sets: 6, repRange: [4, 8],  targetRpe: 8, notes: "T2 accesorio" },
      ],
    },
    {
      dayOfWeek: 2,
      templateName: "Sentadilla + Peso Muerto",
      exercises: [
        { name: "Sentadilla",        sets: 8, repRange: [3, 8],  targetRpe: 9 },
        { name: "Peso Muerto Sumo",  sets: 6, repRange: [3, 5],  targetRpe: 8 },
      ],
    },
    {
      dayOfWeek: 4,
      templateName: "Press Militar + Inclinado",
      exercises: [
        { name: "Press Militar",     sets: 8, repRange: [3, 6],  targetRpe: 9 },
        { name: "Press Inclinado",   sets: 6, repRange: [5, 8],  targetRpe: 8 },
      ],
    },
    {
      dayOfWeek: 5,
      templateName: "Peso Muerto + Sentadilla Frontal",
      exercises: [
        { name: "Peso Muerto",       sets: 8, repRange: [1, 5],  targetRpe: 9 },
        { name: "Sentadilla Frontal", sets: 6, repRange: [5, 8], targetRpe: 8 },
      ],
    },
  ],
  highlights: [
    "Volumen altísimo (8 sets main + 6 sets T2)",
    "Progresión +2.5kg upper / +5kg lower POR SESIÓN cuando haces AMRAP+1",
    "AMRAP en última serie guía la progresión",
    "Solo para intermedios+ con recuperación buena",
  ],
};

// ─── Exporta la biblioteca ───────────────────────────────────────────────────

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  PPL_6,
  BBB_531,
  UPPER_LOWER_4,
  STRONGLIFTS_5X5,
  NSUNS,
];

export function getTemplateById(id: string): ProgramTemplate | undefined {
  return PROGRAM_TEMPLATES.find((t) => t.id === id);
}
