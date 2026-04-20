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

export const nutritionGoalUpsertSchema = z.object({
  calories: nonNegativeNumber.optional(),
  protein: nonNegativeNumber.optional(),
  carbs: nonNegativeNumber.optional(),
  fat: nonNegativeNumber.optional(),
  fiber: nonNegativeNumber.optional(),
  waterMl: z.number().int().nonnegative().max(100000).optional(),
  mealsPerDay: z.number().int().nonnegative().max(20).optional(),
});
