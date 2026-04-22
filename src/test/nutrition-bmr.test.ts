import { describe, it, expect } from "vitest";
import {
  mifflinStJeorBMR,
  katchMcArdleBMR,
  tdee,
  targetCaloriesForGoal,
  distributeMacros,
  classifyWeeklyRate,
} from "@/lib/nutrition/bmr-tdee";

describe("Mifflin-St Jeor BMR", () => {
  it("hombre 30 años 80kg 180cm → ~1780 kcal", () => {
    const bmr = mifflinStJeorBMR({ sex: "male", weightKg: 80, heightCm: 180, age: 30 });
    expect(bmr).toBeGreaterThan(1750);
    expect(bmr).toBeLessThan(1820);
  });
  it("mujer 25 años 60kg 165cm → ~1345 kcal", () => {
    const bmr = mifflinStJeorBMR({ sex: "female", weightKg: 60, heightCm: 165, age: 25 });
    expect(bmr).toBeGreaterThan(1320);
    expect(bmr).toBeLessThan(1370);
  });
  it("inputs inválidos devuelven 0", () => {
    expect(mifflinStJeorBMR({ sex: "male", weightKg: 0, heightCm: 180, age: 30 })).toBe(0);
    expect(mifflinStJeorBMR({ sex: "male", weightKg: 80, heightCm: 180, age: -5 })).toBe(0);
  });
});

describe("Katch-McArdle BMR", () => {
  it("80kg con 15% grasa → LBM 68kg → ~1839 kcal", () => {
    const bmr = katchMcArdleBMR({ weightKg: 80, bodyFatPercent: 15 });
    expect(bmr).toBeGreaterThan(1800);
    expect(bmr).toBeLessThan(1880);
  });
  it("valores fuera de rango", () => {
    expect(katchMcArdleBMR({ weightKg: 80, bodyFatPercent: 95 })).toBe(0);
    expect(katchMcArdleBMR({ weightKg: -5, bodyFatPercent: 15 })).toBe(0);
  });
});

describe("TDEE", () => {
  it("BMR 1800 × sedentary = 2160", () => {
    expect(tdee(1800, "sedentary")).toBe(2160);
  });
  it("BMR 1800 × very_active = 3420", () => {
    expect(tdee(1800, "very_active")).toBe(3420);
  });
  it("BMR 0 devuelve 0", () => {
    expect(tdee(0, "moderate")).toBe(0);
  });
});

describe("targetCaloriesForGoal", () => {
  it("maintain devuelve TDEE sin cambio", () => {
    expect(targetCaloriesForGoal(2500, "maintain")).toBe(2500);
  });
  it("cut default: TDEE - 500", () => {
    expect(targetCaloriesForGoal(2500, "cut")).toBe(2000);
  });
  it("bulk default: TDEE + 300", () => {
    expect(targetCaloriesForGoal(2500, "bulk")).toBe(2800);
  });
  it("cut con rate explícito: -0.5kg/semana = -550 kcal/día", () => {
    // 0.5 kg × 7700 kcal = 3850 / 7 = 550
    const r = targetCaloriesForGoal(2500, "cut", -0.5);
    expect(r).toBe(2500 - 550);
  });
  it("cut agresivo no baja de 1200 kcal", () => {
    expect(targetCaloriesForGoal(1400, "cut", -2)).toBeGreaterThanOrEqual(1200);
  });
  it("bulk con rate +0.25 kg/semana", () => {
    // 0.25 × 7700 = 1925 / 7 = 275
    const r = targetCaloriesForGoal(2500, "bulk", 0.25);
    expect(r).toBe(2775);
  });
});

describe("distributeMacros", () => {
  it("2000 kcal + 70kg + maintain → P ≈ 140g, F ≈ 63g, C resto", () => {
    const { proteinG, fatG, carbsG } = distributeMacros({
      calories: 2000, weightKg: 70, goal: "maintain",
    });
    expect(proteinG).toBe(140); // 70 × 2.0
    expect(fatG).toBe(63);      // 70 × 0.9
    // Kcal: 140×4 + 63×9 = 560 + 567 = 1127; carbs = (2000-1127)/4 ≈ 218
    expect(carbsG).toBeGreaterThan(200);
    expect(carbsG).toBeLessThan(230);
  });
  it("cut sube proteína a 2.2 g/kg", () => {
    const { proteinG } = distributeMacros({
      calories: 1800, weightKg: 80, goal: "cut",
    });
    expect(proteinG).toBe(176); // 80 × 2.2
  });
  it("bulk baja proteína a 1.8 g/kg (balance con carbs)", () => {
    const { proteinG } = distributeMacros({
      calories: 3000, weightKg: 80, goal: "bulk",
    });
    expect(proteinG).toBe(144);
  });
  it("calories 0 devuelve zeros", () => {
    const r = distributeMacros({ calories: 0, weightKg: 70, goal: "maintain" });
    expect(r).toEqual({ proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

describe("classifyWeeklyRate", () => {
  it("-1 kg/semana en 80kg = aggressive (>1%)", () => {
    expect(classifyWeeklyRate(-1, 80)).toBe("aggressive");
  });
  it("-0.5 kg/semana en 80kg (0.625%) = moderate", () => {
    expect(classifyWeeklyRate(-0.5, 80)).toBe("moderate");
  });
  it("-0.25 kg/semana en 80kg (0.31%) = conservative", () => {
    expect(classifyWeeklyRate(-0.25, 80)).toBe("conservative");
  });
  it("+0.1 kg/semana en 80kg (0.125%) = very_slow", () => {
    expect(classifyWeeklyRate(0.1, 80)).toBe("very_slow");
  });
  it("peso inválido", () => {
    expect(classifyWeeklyRate(-0.5, 0)).toBe("invalid");
  });
});
