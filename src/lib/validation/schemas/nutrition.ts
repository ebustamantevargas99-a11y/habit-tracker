import { z } from "zod";
import { dateSchema, nonNegativeNumber } from "./common";

const name = z.string().trim().min(1).max(200);

export const foodCreateSchema = z.object({
  name,
  brand: z.string().trim().max(200).optional().nullable(),
  servingSize: nonNegativeNumber.optional(),
  servingUnit: z.string().max(50).optional(),
  calories: nonNegativeNumber,
  protein: nonNegativeNumber.optional(),
  carbs: nonNegativeNumber.optional(),
  fat: nonNegativeNumber.optional(),
  fiber: nonNegativeNumber.optional(),
  sugar: nonNegativeNumber.optional(),
  sodium: nonNegativeNumber.optional(),
});

export const mealCreateSchema = z.object({
  date: dateSchema.optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().trim().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const mealItemCreateSchema = z.object({
  foodItemId: z.string().min(1).max(64),
  quantity: nonNegativeNumber.optional(),
  unit: z.string().max(50).optional(),
});

export const goalTypeEnum = z.enum(["cut", "maintain", "bulk", "recomp"]);
export const activityLevelEnum = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const nutritionGoalUpsertSchema = z.object({
  calories: nonNegativeNumber.optional(),
  protein: nonNegativeNumber.optional(),
  carbs: nonNegativeNumber.optional(),
  fat: nonNegativeNumber.optional(),
  fiber: nonNegativeNumber.optional(),
  waterMl: z.number().int().nonnegative().max(100000).optional(),
  mealsPerDay: z.number().int().nonnegative().max(20).optional(),

  // Objetivo de peso y metabolismo
  goalType: goalTypeEnum.optional().nullable(),
  targetWeightKg: z.number().min(20).max(500).optional().nullable(),
  startWeightKg: z.number().min(20).max(500).optional().nullable(),
  startDate: dateSchema.optional().nullable(),
  targetDate: dateSchema.optional().nullable(),
  weeklyRateKg: z.number().min(-3).max(3).optional().nullable(),
  bmrKcal: z.number().int().min(0).max(10_000).optional().nullable(),
  tdeeKcal: z.number().int().min(0).max(15_000).optional().nullable(),
  activityFactor: z.number().min(1).max(2.5).optional().nullable(),

  // Targets de composición
  targetBodyFatPercent: z.number().min(3).max(60).optional().nullable(),
  targetLeanMassKg: z.number().min(20).max(200).optional().nullable(),
});

// ─── Body Composition (bioimpedancia / DEXA / Navy / etc.) ────────────────────

export const bodyCompositionMethodEnumNutrition = z.enum([
  "dexa",
  "bia",
  "caliper",
  "navy_tape",
  "photo_estimate",
  "scale",
]);

export const bodyCompositionCreateSchema = z.object({
  date: dateSchema,
  weightKg: z.number().min(20).max(500).optional().nullable(),
  bodyFatPercent: z.number().min(3).max(70).optional().nullable(),
  leanMassKg: z.number().min(10).max(300).optional().nullable(),
  fatMassKg: z.number().min(0).max(200).optional().nullable(),
  waterPercent: z.number().min(20).max(80).optional().nullable(),
  visceralFat: z.number().min(0).max(60).optional().nullable(),
  boneMassKg: z.number().min(0).max(10).optional().nullable(),
  bmr: z.number().int().min(600).max(6000).optional().nullable(),
  method: bodyCompositionMethodEnumNutrition.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const bodyCompositionUpdateSchema = bodyCompositionCreateSchema.partial();
