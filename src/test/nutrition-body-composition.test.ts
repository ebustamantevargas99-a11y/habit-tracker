import { describe, it, expect } from "vitest";
import {
  classifyBodyFat,
  bodyFatLabel,
  classifyVisceralFat,
  deriveMissingFields,
  navyTapeMale,
  navyTapeFemale,
  analyzeProgress,
  ffmi,
  classifyFFMI,
  type BodyCompositionPoint,
} from "@/lib/nutrition/body-composition";

describe("classifyBodyFat", () => {
  it("hombre 10% = athletes", () => {
    expect(classifyBodyFat(10, "male")).toBe("athletes");
  });
  it("hombre 18% = fitness — boundary de average", () => {
    // 18 cae en average según thresholds
    expect(classifyBodyFat(18, "male")).toBe("average");
  });
  it("hombre 15% = fitness", () => {
    expect(classifyBodyFat(15, "male")).toBe("fitness");
  });
  it("hombre 30% = obese", () => {
    expect(classifyBodyFat(30, "male")).toBe("obese");
  });
  it("mujer 20% = athletes", () => {
    expect(classifyBodyFat(20, "female")).toBe("athletes");
  });
  it("mujer 35% = obese", () => {
    expect(classifyBodyFat(35, "female")).toBe("obese");
  });
});

describe("bodyFatLabel", () => {
  it("devuelve label + color", () => {
    const r = bodyFatLabel(15, "male");
    expect(r.label).toBe("Fitness");
    expect(r.color).toBe("success");
  });
});

describe("classifyVisceralFat", () => {
  it("nivel 5 = healthy", () => {
    expect(classifyVisceralFat(5)).toBe("healthy");
  });
  it("nivel 12 = elevated", () => {
    expect(classifyVisceralFat(12)).toBe("elevated");
  });
  it("nivel 20 = high", () => {
    expect(classifyVisceralFat(20)).toBe("high");
  });
});

describe("deriveMissingFields", () => {
  it("peso + % grasa → calcula LBM y fatMass", () => {
    const r = deriveMissingFields({
      date: "2026-04-22",
      weightKg: 80,
      bodyFatPercent: 15,
    });
    expect(r.fatMassKg).toBe(12);
    expect(r.leanMassKg).toBe(68);
  });
  it("peso + LBM → calcula % grasa y fatMass", () => {
    const r = deriveMissingFields({
      date: "2026-04-22",
      weightKg: 80,
      leanMassKg: 68,
    });
    expect(r.fatMassKg).toBe(12);
    expect(r.bodyFatPercent).toBe(15);
  });
  it("no sobreescribe valores explícitos", () => {
    const r = deriveMissingFields({
      date: "2026-04-22",
      weightKg: 80,
      bodyFatPercent: 15,
      leanMassKg: 70, // el user dice 70 aunque matemáticamente daría 68
      fatMassKg: 10,
    });
    expect(r.leanMassKg).toBe(70);
    expect(r.fatMassKg).toBe(10);
  });
  it("data incompleta no deriva nada", () => {
    const r = deriveMissingFields({ date: "2026-04-22", weightKg: 80 });
    expect(r.leanMassKg).toBeUndefined();
    expect(r.fatMassKg).toBeUndefined();
  });
});

describe("Navy tape", () => {
  it("hombre 90cm cintura, 38cm cuello, 180cm altura → % grasa razonable", () => {
    const bf = navyTapeMale(90, 38, 180);
    expect(bf).not.toBeNull();
    expect(bf!).toBeGreaterThan(10);
    expect(bf!).toBeLessThan(25);
  });
  it("hombre cuello ≥ cintura devuelve null", () => {
    expect(navyTapeMale(40, 40, 180)).toBeNull();
  });
  it("mujer 75 cintura + 95 cadera + 33 cuello + 165 altura", () => {
    const bf = navyTapeFemale(75, 95, 33, 165);
    expect(bf).not.toBeNull();
    expect(bf!).toBeGreaterThan(15);
    expect(bf!).toBeLessThan(35);
  });
});

describe("analyzeProgress", () => {
  function mk(date: string, w: number, bf?: number): BodyCompositionPoint {
    const base: BodyCompositionPoint = {
      date,
      weightKg: w,
      bodyFatPercent: bf ?? null,
      leanMassKg: null,
      fatMassKg: null,
    };
    if (bf != null) {
      base.fatMassKg = Math.round(w * (bf / 100) * 100) / 100;
      base.leanMassKg = Math.round(w * (1 - bf / 100) * 100) / 100;
    }
    return base;
  }

  it("recomp: peso estable, +músculo −grasa", () => {
    const a = mk("2026-01-01", 80, 20); // 64 LBM, 16 FM
    const b = mk("2026-02-01", 80, 17); // 66.4 LBM, 13.6 FM
    const r = analyzeProgress(a, b);
    expect(r.pattern).toBe("recomp");
  });

  it("hipertrofia: +peso, mayor parte LBM", () => {
    const a = mk("2026-01-01", 70, 15); // 59.5 LBM
    const b = mk("2026-03-01", 74, 15); // 62.9 LBM
    const r = analyzeProgress(a, b);
    expect(r.pattern).toBe("hypertrophy");
    expect(r.weightDeltaKg).toBe(4);
  });

  it("cut: bajas peso, mayor parte grasa", () => {
    const a = mk("2026-01-01", 85, 25); // 21.25 FM
    const b = mk("2026-03-01", 80, 20); // 16 FM
    const r = analyzeProgress(a, b);
    expect(r.pattern).toBe("fat_loss");
    expect(r.weightDeltaKg).toBe(-5);
  });

  it("bajas peso pero mayormente músculo = muscle_loss warning", () => {
    const a = mk("2026-01-01", 80, 15); // 68 LBM, 12 FM
    const b = mk("2026-02-01", 77, 14); // 66.22 LBM, 10.78 FM
    const r = analyzeProgress(a, b);
    // Peso bajó 3, LBM bajó ~1.78, FM bajó ~1.22
    // Regla: fatΔ (-1.22) < leanΔ (-1.78) → fat_loss?
    // Actually el código: if (fatΔ < leanΔ) pattern = "fat_loss"
    // fatΔ = -1.22, leanΔ = -1.78. fatΔ > leanΔ porque -1.22 > -1.78.
    // → entra en else: muscle_loss
    expect(r.pattern).toBe("muscle_loss");
  });

  it("datos insuficientes", () => {
    const a = mk("2026-01-01", 80);
    const b: BodyCompositionPoint = { date: "2026-02-01", weightKg: null, bodyFatPercent: null, leanMassKg: null, fatMassKg: null };
    const r = analyzeProgress(a, b);
    expect(r.pattern).toBe("insufficient");
  });

  it("peso estable y sin datos LBM = stable", () => {
    const a = mk("2026-01-01", 80);
    const b = mk("2026-02-01", 80.3);
    const r = analyzeProgress(a, b);
    expect(r.pattern).toBe("stable");
  });
});

describe("FFMI", () => {
  it("70kg LBM, 180cm altura → ~21.6", () => {
    const r = ffmi(70, 180);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(21);
    expect(r!).toBeLessThan(22.5);
  });

  it("classifyFFMI hombre 21 = above_average (boundary)", () => {
    expect(classifyFFMI(21, "male")).toBe("above_average");
  });
  it("classifyFFMI hombre 22 = excellent (≥22 entra en excellent)", () => {
    expect(classifyFFMI(22, "male")).toBe("excellent");
  });
  it("classifyFFMI hombre 26 = suspicious (fuera de natural)", () => {
    expect(classifyFFMI(26, "male")).toBe("suspicious");
  });
  it("mujer 18 = above_average", () => {
    expect(classifyFFMI(18, "female")).toBe("above_average");
  });
});
