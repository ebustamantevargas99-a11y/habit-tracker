/**
 * Totales nutricionales de una receta.
 *
 * Dado el array de ingredientes de una Recipe (cada uno con su FoodItem y
 * quantity), devuelve:
 *   - totales de todos los nutrientes extendidos (macros + minerales +
 *     vitaminas + otros)
 *   - por porción (dividiendo entre `servings`)
 *
 * Todos los nutrientes en FoodItem están expresados POR su servingSize.
 * Si el user añade 200g de pollo y el foodItem dice "100g = 165 kcal",
 * la receta aporta 165 * (200/100) = 330 kcal.
 *
 * Unidades mixtas (g vs ml vs piece) se tratan como 1:1 — no intentamos
 * conversión. Si el user mezcla unidades, los totales pueden ser imprecisos
 * pero consistentes con cómo cualquier app de nutrición lo maneja.
 */

import type { FoodItem } from "@/stores/nutrition-store";

export interface RecipeItemInput {
  quantity: number;
  unit?: string | null;
  foodItem: FoodItem;
}

// Conjunto de nutrientes que puede aportar un FoodItem
const NUT_KEYS = [
  "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
  "saturatedFat", "transFat", "monoFat", "polyFat", "omega3", "omega6",
  "cholesterol", "addedSugar",
  "potassium", "calcium", "iron", "magnesium", "zinc", "phosphorus",
  "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK",
  "thiamin", "riboflavin", "niacin", "vitaminB6", "folate", "vitaminB12",
  "caffeine", "alcohol", "water",
] as const;

export type NutrientKey = (typeof NUT_KEYS)[number];

export type RecipeTotals = Partial<Record<NutrientKey, number>>;

export function computeRecipeTotals(
  items: readonly RecipeItemInput[],
): RecipeTotals {
  const out: RecipeTotals = {};
  for (const it of items) {
    const base = it.foodItem.servingSize;
    if (
      !Number.isFinite(base) ||
      base <= 0 ||
      !Number.isFinite(it.quantity)
    ) {
      continue;
    }
    const factor = it.quantity / base;
    for (const k of NUT_KEYS) {
      const raw = it.foodItem[k];
      if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
      out[k] = (out[k] ?? 0) + raw * factor;
    }
  }
  // Redondeo final (evita ruido tipo 249.99999)
  for (const k of NUT_KEYS) {
    if (out[k] != null) out[k] = Math.round(out[k]! * 100) / 100;
  }
  return out;
}

export function perServing(
  totals: RecipeTotals,
  servings: number,
): RecipeTotals {
  const n = Math.max(1, servings);
  const out: RecipeTotals = {};
  for (const [k, v] of Object.entries(totals)) {
    if (typeof v === "number") out[k as NutrientKey] = Math.round((v / n) * 100) / 100;
  }
  return out;
}

export function totalGrams(items: readonly RecipeItemInput[]): number {
  return Math.round(items.reduce((s, i) => s + (i.quantity || 0), 0));
}
