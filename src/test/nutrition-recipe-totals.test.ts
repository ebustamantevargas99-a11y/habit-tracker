import { describe, it, expect } from "vitest";
import {
  computeRecipeTotals,
  perServing,
  totalGrams,
} from "@/lib/nutrition/recipe-totals";
import type { FoodItem } from "@/stores/nutrition-store";

function mk(partial: Partial<FoodItem>): FoodItem {
  return {
    id: "f1",
    name: "test",
    brand: null,
    servingSize: 100,
    servingUnit: "g",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    isCustom: true,
    ...partial,
  };
}

describe("computeRecipeTotals", () => {
  it("suma nutrientes escalados por cantidad vs servingSize", () => {
    const chicken = mk({
      id: "ch",
      name: "pollo",
      servingSize: 100,
      calories: 165,
      protein: 31,
      fat: 3.6,
    });
    const rice = mk({
      id: "ri",
      name: "arroz",
      servingSize: 100,
      calories: 130,
      carbs: 28,
    });
    const totals = computeRecipeTotals([
      { quantity: 200, foodItem: chicken }, // 2× pollo
      { quantity: 150, foodItem: rice },    // 1.5× arroz
    ]);
    expect(totals.calories).toBe(165 * 2 + 130 * 1.5); // 330 + 195 = 525
    expect(totals.protein).toBe(31 * 2); // 62
    expect(totals.carbs).toBe(28 * 1.5); // 42
    expect(totals.fat).toBe(Math.round(3.6 * 2 * 100) / 100); // 7.2
  });

  it("ignora nutrientes null/undefined sin romper", () => {
    const f = mk({
      servingSize: 100,
      calories: 100,
      potassium: undefined,
      vitaminC: null,
    });
    const totals = computeRecipeTotals([{ quantity: 50, foodItem: f }]);
    expect(totals.calories).toBe(50);
    expect(totals.potassium).toBeUndefined();
    expect(totals.vitaminC).toBeUndefined();
  });

  it("servingSize 0 o quantity NaN → ignora item", () => {
    const broken = mk({ servingSize: 0, calories: 999 });
    const ok = mk({ id: "ok", servingSize: 100, calories: 100 });
    const totals = computeRecipeTotals([
      { quantity: 10, foodItem: broken },
      { quantity: Number.NaN, foodItem: ok },
      { quantity: 100, foodItem: ok },
    ]);
    expect(totals.calories).toBe(100);
  });

  it("acumula vitaminas y minerales también", () => {
    const milk = mk({
      servingSize: 100,
      calories: 42,
      calcium: 113,
      vitaminD: 1.3,
    });
    const totals = computeRecipeTotals([{ quantity: 250, foodItem: milk }]);
    // 2.5× 113 = 282.5, 2.5× 1.3 = 3.25
    expect(totals.calcium).toBe(282.5);
    expect(totals.vitaminD).toBe(3.25);
  });
});

describe("perServing", () => {
  it("divide totales entre servings", () => {
    const totals = { calories: 800, protein: 60, calcium: 200 };
    expect(perServing(totals, 4)).toEqual({
      calories: 200,
      protein: 15,
      calcium: 50,
    });
  });
  it("servings < 1 usa 1", () => {
    expect(perServing({ calories: 100 }, 0).calories).toBe(100);
  });
});

describe("totalGrams", () => {
  it("suma cantidades", () => {
    const f = mk({});
    expect(
      totalGrams([
        { quantity: 100, foodItem: f },
        { quantity: 50.5, foodItem: f },
      ]),
    ).toBe(151);
  });
});
