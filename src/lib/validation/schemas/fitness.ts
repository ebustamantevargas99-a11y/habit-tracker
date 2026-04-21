import { z } from "zod";
import { dateSchema, positiveNumber, nonNegativeNumber } from "./common";

const name = z.string().trim().min(1).max(200);
const notes = z.string().trim().max(2000).optional().nullable();

// ─── Weight / Body metrics ────────────────────────────────────────────────────

export const weightCreateSchema = z.object({
  date: dateSchema,
  weight: z.number().finite().positive().max(500),
  bodyFat: z.number().finite().min(0).max(100).optional().nullable(),
  notes,
});

const singleBodyMetricSchema = z.object({
  date: dateSchema.optional(),
  type: z.string().trim().min(1).max(50),
  value: z.number().finite().nonnegative().max(1_000_000),
  unit: z.string().max(20).optional(),
  method: z.string().max(100).optional().nullable(),
});

const groupedBodyMetricSchema = z
  .object({
    date: dateSchema.optional(),
    weight: nonNegativeNumber.optional().nullable(),
    bodyFat: z.number().finite().min(0).max(100).optional().nullable(),
    chest: nonNegativeNumber.optional().nullable(),
    waist: nonNegativeNumber.optional().nullable(),
    hips: nonNegativeNumber.optional().nullable(),
    armLeft: nonNegativeNumber.optional().nullable(),
    armRight: nonNegativeNumber.optional().nullable(),
    thighLeft: nonNegativeNumber.optional().nullable(),
    thighRight: nonNegativeNumber.optional().nullable(),
  })
  .strict();

export const bodyMetricInputSchema = z.union([
  singleBodyMetricSchema,
  groupedBodyMetricSchema,
]);

export const stepsCreateSchema = z.object({
  date: dateSchema,
  steps: z.number().int().nonnegative().max(200000),
});

// ─── Challenges ───────────────────────────────────────────────────────────────

export const challengeCreateSchema = z.object({
  name,
  description: z.string().trim().max(2000).optional().nullable(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional().nullable(),
  targetValue: nonNegativeNumber.optional(),
  currentValue: nonNegativeNumber.optional(),
  unit: z.string().max(50).optional(),
});

export const challengeUpdateSchema = z.object({
  name: name.optional(),
  currentValue: nonNegativeNumber.optional(),
  targetValue: nonNegativeNumber.optional(),
  isCompleted: z.boolean().optional(),
  completedDays: z.array(z.number().int().nonnegative()).max(1000).optional(),
  endDate: dateSchema.optional(),
});

// ─── Personal Records ─────────────────────────────────────────────────────────

export const personalRecordUpsertSchema = z.object({
  exercise: z.string().trim().min(1).max(200),
  oneRM: nonNegativeNumber,
  fiveRM: nonNegativeNumber.optional().nullable(),
  tenRM: nonNegativeNumber.optional().nullable(),
  date: dateSchema.optional(),
  muscleGroup: z.string().max(100).optional(),
});

// ─── Workout / Set — Fitness redesign (2026-04-21) ────────────────────────────

// Set types soportados (alineado con schema Prisma WorkoutSet.setType)
export const setTypeEnum = z.enum([
  "straight",
  "warmup",
  "dropset",
  "restpause",
  "myoreps",
  "cluster",
  "superset",
  "amrap",
  "failure",
]);
export type SetType = z.infer<typeof setTypeEnum>;

// Tempo notation: "3-1-1-2" (ecc-pause-con-pause en segundos). Acepta también "3010".
const tempoSchema = z
  .string()
  .trim()
  .max(20)
  .regex(
    /^(\d+(-\d+){3}|\d{4})$/,
    "Formato de tempo inválido. Usa 3-1-1-2 o 3010",
  )
  .optional()
  .nullable();

const setSchema = z.object({
  weight: z.number().finite().nonnegative().max(2000),
  reps: z.number().int().nonnegative().max(10000),
  rpe: z.number().finite().min(0).max(10).optional().nullable(),
  rir: z.number().int().min(0).max(10).optional().nullable(),
  tempo: tempoSchema,
  setType: setTypeEnum.optional(),
  groupId: z.string().max(50).optional().nullable(),
  isWarmup: z.boolean().optional(),
});

export const workoutCreateSchema = z.object({
  date: dateSchema,
  name,
  duration: z.number().int().nonnegative().max(1440).optional(),
  totalVolume: nonNegativeNumber.optional(),
  trimp: nonNegativeNumber.optional().nullable(),
  prsHit: z.number().int().nonnegative().max(1000).optional(),
  plannedPhaseId: z.string().max(40).optional().nullable(),
  readinessScore: z.number().int().min(0).max(100).optional().nullable(),
  notes,
  exercises: z
    .array(
      z.object({
        exerciseName: z.string().trim().min(1).max(200),
        muscleGroup: z.string().max(100).optional(),
        notes: z.string().max(500).optional().nullable(),
        sets: z.array(setSchema).max(50),
      }),
    )
    .max(50)
    .optional(),
});

export const workoutUpdateSchema = z.object({
  name: name.optional(),
  duration: z.number().int().nonnegative().max(1440).optional(),
  trimp: nonNegativeNumber.optional().nullable(),
  plannedPhaseId: z.string().max(40).optional().nullable(),
  readinessScore: z.number().int().min(0).max(100).optional().nullable(),
  notes,
});

// ─── Exercise library (extended) ──────────────────────────────────────────────

export const primaryMuscleEnum = z.enum([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "core",
  "calves",
  "forearms",
  "traps",
]);
export type PrimaryMuscle = z.infer<typeof primaryMuscleEnum>;

export const equipmentEnum = z.enum([
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "smith",
  "plate",
  "other",
]);

export const difficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);

export const exerciseCreateSchema = z.object({
  name,
  muscleGroup: z.string().trim().min(1).max(100),
  primaryMuscle: primaryMuscleEnum.optional(),
  secondaryMuscles: z.array(primaryMuscleEnum).max(6).optional(),
  category: z.string().trim().min(1).max(100),
  equipment: z.string().max(60).optional().nullable(),
  equipmentList: z.array(equipmentEnum).max(4).optional(),
  difficulty: difficultyEnum.optional(),
  description: z.string().max(2000).optional().nullable(),
  formTips: z.array(z.string().max(200)).max(10).optional(),
  commonMistakes: z.array(z.string().max(200)).max(10).optional(),
  alternatives: z.array(z.string().max(40)).max(10).optional(),
  isCustom: z.boolean().optional(),
});

export const exerciseUpdateSchema = exerciseCreateSchema.partial();

// ─── TrainingProgram + ProgramPhase (Fase 9 — periodización) ──────────────────

export const programTypeEnum = z.enum([
  "linear",
  "dup",
  "block",
  "conjugate",
  "custom",
]);

export const programGoalEnum = z.enum([
  "hypertrophy",
  "strength",
  "power",
  "endurance",
  "general",
]);

export const programPhaseNameEnum = z.enum([
  "accumulation",
  "intensification",
  "realization",
  "deload",
  "custom",
]);

export const programScheduleDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),                  // 0 = Dom … 6 = Sáb
  templateName: z.string().trim().min(1).max(80),             // "Push", "Pull", "Legs"
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        sets: z.number().int().min(1).max(20),
        repRange: z.tuple([z.number().int().min(1), z.number().int().min(1).max(100)]),
        targetRpe: z.number().min(0).max(10).optional(),
        notes: z.string().max(200).optional(),
      }),
    )
    .max(40),
});

export const trainingProgramCreateSchema = z.object({
  name,
  description: z.string().max(2000).optional().nullable(),
  type: programTypeEnum.optional(),
  goal: programGoalEnum.optional(),
  durationWeeks: z.number().int().min(1).max(104),            // 1 semana a 2 años
  startDate: dateSchema,
  endDate: dateSchema.optional().nullable(),
  active: z.boolean().optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  schedule: z.array(programScheduleDaySchema).max(7).optional(),
});

export const trainingProgramUpdateSchema = trainingProgramCreateSchema
  .partial()
  .extend({
    active: z.boolean().optional(),
  });

export const programPhaseCreateSchema = z.object({
  programId: z.string().min(1).max(40),
  name: programPhaseNameEnum,
  weekStart: z.number().int().min(1).max(104),
  weekEnd: z.number().int().min(1).max(104),
  targetRpeMin: z.number().min(0).max(10).optional(),
  targetRpeMax: z.number().min(0).max(10).optional(),
  targetSetsPerMuscle: z.number().int().min(0).max(80).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const programPhaseUpdateSchema = programPhaseCreateSchema.omit({ programId: true }).partial();

// ─── ReadinessCheck (chequeo diario) ──────────────────────────────────────────

export const readinessRecommendationEnum = z.enum([
  "go_hard",
  "moderate",
  "light",
  "rest",
]);

export const readinessCheckUpsertSchema = z.object({
  date: dateSchema,
  restingHr: z.number().int().min(20).max(200).optional().nullable(),
  hrv: z.number().int().min(0).max(400).optional().nullable(),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
  sleepQuality: z.number().int().min(1).max(10).optional().nullable(),
  soreness: z.number().int().min(1).max(10).optional().nullable(),
  stress: z.number().int().min(1).max(10).optional().nullable(),
  mood: z.number().int().min(1).max(10).optional().nullable(),
  energy: z.number().int().min(1).max(10).optional().nullable(),
  motivation: z.number().int().min(1).max(10).optional().nullable(),
  score: z.number().int().min(0).max(100).optional().nullable(),
  recommendation: readinessRecommendationEnum.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ─── CardioSession + Shoe (Fase 9 — running / cardio) ─────────────────────────

export const cardioActivityEnum = z.enum([
  "run",
  "bike",
  "swim",
  "row",
  "walk",
  "elliptical",
  "hike",
  "other",
]);

const cardioSplitSchema = z.object({
  km: z.number().min(0).max(1000),
  paceSec: z.number().min(0).max(100_000),
  hr: z.number().int().min(0).max(240).optional(),
});

const cardioZonesSchema = z
  .object({
    z1: z.number().int().min(0).max(86_400).optional(),
    z2: z.number().int().min(0).max(86_400).optional(),
    z3: z.number().int().min(0).max(86_400).optional(),
    z4: z.number().int().min(0).max(86_400).optional(),
    z5: z.number().int().min(0).max(86_400).optional(),
  })
  .strict();

export const cardioSessionCreateSchema = z.object({
  date: dateSchema,
  startedAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endedAt: z.string().datetime({ offset: true }).or(z.string().min(1)).optional().nullable(),
  activityType: cardioActivityEnum.optional(),
  distanceKm: z.number().min(0).max(500).optional().nullable(),
  durationSec: z.number().int().min(0).max(86_400),
  avgPaceSecPerKm: z.number().min(0).max(100_000).optional().nullable(),
  avgHr: z.number().int().min(0).max(240).optional().nullable(),
  maxHr: z.number().int().min(0).max(240).optional().nullable(),
  elevationGainM: z.number().min(0).max(15_000).optional().nullable(),
  caloriesBurned: z.number().min(0).max(20_000).optional().nullable(),
  perceivedExertion: z.number().int().min(1).max(10).optional().nullable(),
  zones: cardioZonesSchema.optional().nullable(),
  splits: z.array(cardioSplitSchema).max(500).optional().nullable(),
  shoeId: z.string().max(40).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const cardioSessionUpdateSchema = cardioSessionCreateSchema.partial();

export const shoeCreateSchema = z.object({
  name,
  brand: z.string().max(80).optional().nullable(),
  model: z.string().max(80).optional().nullable(),
  purchaseDate: dateSchema.optional().nullable(),
  currentKm: z.number().min(0).max(5000).optional(),
  maxKm: z.number().min(50).max(5000).optional(),
  retired: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const shoeUpdateSchema = shoeCreateSchema.partial();

// ─── BodyComposition ──────────────────────────────────────────────────────────

export const bodyCompositionMethodEnum = z.enum([
  "dexa",
  "bia",
  "caliper",
  "navy_tape",
  "photo_estimate",
  "scale",
]);

export const bodyCompositionUpsertSchema = z.object({
  date: dateSchema,
  weightKg: z.number().min(20).max(500).optional().nullable(),
  bodyFatPercent: z.number().min(0).max(80).optional().nullable(),
  leanMassKg: z.number().min(0).max(300).optional().nullable(),
  fatMassKg: z.number().min(0).max(300).optional().nullable(),
  waterPercent: z.number().min(0).max(100).optional().nullable(),
  visceralFat: z.number().min(0).max(60).optional().nullable(),
  boneMassKg: z.number().min(0).max(20).optional().nullable(),
  bmr: z.number().int().min(200).max(10_000).optional().nullable(),
  method: bodyCompositionMethodEnum.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
