import { z } from "zod";

// ─── Meal templates ──────────────────────────────────────────────────────────

const mealTemplateItemSchema = z.object({
  foodItemId: z.string().min(1).max(64),
  quantity: z.number().min(0).max(100000),
  unit: z.string().max(20).optional(),
});

export const mealTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional().nullable(),
  items: z.array(mealTemplateItemSchema).min(1).max(50),
});

export const mealTemplateUseSchema = z.object({
  mealLogId: z.string().min(1).max(64),
});

// ─── Recipes ─────────────────────────────────────────────────────────────────

const recipeItemSchema = z.object({
  foodItemId: z.string().min(1).max(64),
  quantity: z.number().min(0).max(100000),
  unit: z.string().max(20).optional(),
});

export const recipeCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  servings: z.number().int().min(1).max(100).optional(),
  items: z.array(recipeItemSchema).min(1).max(50),
});

export const recipeUpdateSchema = recipeCreateSchema.partial();

// ─── Meal photo ──────────────────────────────────────────────────────────────

export const mealPhotoSchema = z.object({
  photoData: z
    .string()
    .min(1)
    .max(2_000_000) // ~2MB base64
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Formato inválido"),
});

// ─── Barcode ─────────────────────────────────────────────────────────────────

export const barcodeSchema = z.object({
  barcode: z.string().trim().min(8).max(20).regex(/^\d+$/, "Solo dígitos"),
});
