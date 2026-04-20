import { z } from "zod";
import { dateSchema, positiveNumber, nonNegativeNumber } from "./common";

const name = z.string().trim().min(1).max(200);
const notes = z.string().trim().max(2000).optional().nullable();

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

export const fastingCreateSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().optional().nullable(),
  targetHours: z.number().int().positive().max(72).optional().nullable(),
  completed: z.boolean().optional(),
  notes,
});

export const fastingUpdateSchema = z.object({
  endTime: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  notes,
});

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

export const personalRecordUpsertSchema = z.object({
  exercise: z.string().trim().min(1).max(200),
  oneRM: nonNegativeNumber,
  fiveRM: nonNegativeNumber.optional().nullable(),
  tenRM: nonNegativeNumber.optional().nullable(),
  date: dateSchema.optional(),
  muscleGroup: z.string().max(100).optional(),
});

const setSchema = z.object({
  weight: z.number().finite().nonnegative().max(2000),
  reps: z.number().int().nonnegative().max(10000),
  rpe: z.number().finite().min(0).max(10).optional().nullable(),
});

export const workoutCreateSchema = z.object({
  date: dateSchema,
  name,
  duration: z.number().int().nonnegative().max(1440).optional(),
  totalVolume: nonNegativeNumber.optional(),
  prsHit: z.number().int().nonnegative().max(1000).optional(),
  notes,
  exercises: z
    .array(
      z.object({
        exerciseName: z.string().trim().min(1).max(200),
        muscleGroup: z.string().max(100).optional(),
        notes: z.string().max(500).optional().nullable(),
        sets: z.array(setSchema).max(50),
      })
    )
    .max(50)
    .optional(),
});

export const workoutUpdateSchema = z.object({
  name: name.optional(),
  duration: z.number().int().nonnegative().max(1440).optional(),
  notes,
});
