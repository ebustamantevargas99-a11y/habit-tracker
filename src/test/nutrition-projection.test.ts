import { describe, it, expect } from "vitest";
import {
  computeWeightTrend,
  eta,
  etaDate,
  adherenceRatio,
  movingAverage,
  type WeightPoint,
} from "@/lib/nutrition/weight-projection";

function makePoints(...values: [string, number][]): WeightPoint[] {
  return values.map(([date, weightKg]) => ({ date, weightKg }));
}

describe("computeWeightTrend", () => {
  it("pérdida lineal clara: -1kg en 7 días → slope -0.143 kg/día", () => {
    const trend = computeWeightTrend(
      makePoints(
        ["2026-01-01", 80],
        ["2026-01-04", 79.5],
        ["2026-01-08", 79],
      ),
    );
    expect(trend).not.toBeNull();
    expect(trend!.weeklyRateKg).toBeLessThan(0);
    expect(trend!.weeklyRateKg).toBeGreaterThan(-1.2);
    expect(trend!.r2).toBeGreaterThan(0.95);
  });

  it("ganancia lineal: +0.5kg/semana", () => {
    const trend = computeWeightTrend(
      makePoints(
        ["2026-01-01", 70],
        ["2026-01-08", 70.5],
        ["2026-01-15", 71],
        ["2026-01-22", 71.5],
      ),
    );
    expect(trend!.weeklyRateKg).toBeCloseTo(0.5, 1);
    expect(trend!.r2).toBeGreaterThan(0.95);
  });

  it("solo un punto devuelve null", () => {
    const t = computeWeightTrend(makePoints(["2026-01-01", 80]));
    expect(t).toBeNull();
  });

  it("puntos idénticos en fecha = slope 0 indef, devuelve null", () => {
    const t = computeWeightTrend(
      makePoints(["2026-01-01", 80], ["2026-01-01", 81]),
    );
    expect(t).toBeNull();
  });

  it("data ruidosa — r2 bajo", () => {
    const t = computeWeightTrend(
      makePoints(
        ["2026-01-01", 80],
        ["2026-01-02", 82],
        ["2026-01-03", 79],
        ["2026-01-04", 81],
        ["2026-01-05", 80.5],
      ),
    );
    expect(t!.r2).toBeLessThan(0.6);
  });
});

describe("eta", () => {
  it("actual 80, target 75, bajando 0.1 kg/día → 50 días", () => {
    expect(eta({
      currentWeightKg: 80,
      targetWeightKg: 75,
      slopeKgPerDay: -0.1,
    })).toBe(50);
  });
  it("tendencia contraria a meta devuelve null (user quiere bajar, pero sube)", () => {
    expect(eta({
      currentWeightKg: 80,
      targetWeightKg: 75,
      slopeKgPerDay: 0.05,
    })).toBeNull();
  });
  it("slope 0 (estancado) devuelve null", () => {
    expect(eta({ currentWeightKg: 80, targetWeightKg: 75, slopeKgPerDay: 0 })).toBeNull();
  });
  it("ya en meta devuelve 0", () => {
    expect(eta({
      currentWeightKg: 75,
      targetWeightKg: 75,
      slopeKgPerDay: -0.05,
    })).toBe(0);
  });
});

describe("etaDate", () => {
  it("devuelve YYYY-MM-DD correcto", () => {
    const d = etaDate({
      currentWeightKg: 80,
      targetWeightKg: 75,
      slopeKgPerDay: -0.1,
      fromDate: "2026-01-01",
    });
    // 50 días desde 2026-01-01 = 2026-02-20
    expect(d).toBe("2026-02-20");
  });
  it("tendencia contraria devuelve null", () => {
    const d = etaDate({
      currentWeightKg: 80,
      targetWeightKg: 75,
      slopeKgPerDay: 0.05,
    });
    expect(d).toBeNull();
  });
});

describe("adherenceRatio", () => {
  it("plan -0.5, actual -0.5 → 1.0", () => {
    expect(adherenceRatio({ plannedWeeklyKg: -0.5, actualWeeklyKg: -0.5 })).toBe(1);
  });
  it("plan -0.5, actual -0.25 → 0.5 (mitad de lo planeado)", () => {
    expect(adherenceRatio({ plannedWeeklyKg: -0.5, actualWeeklyKg: -0.25 })).toBe(0.5);
  });
  it("plan -0.5, actual +0.2 (va en contra) → negativo", () => {
    const r = adherenceRatio({ plannedWeeklyKg: -0.5, actualWeeklyKg: 0.2 });
    expect(r).toBeLessThan(0);
  });
  it("plan 0 devuelve null", () => {
    expect(adherenceRatio({ plannedWeeklyKg: 0, actualWeeklyKg: -0.3 })).toBeNull();
  });
});

describe("movingAverage", () => {
  it("suaviza fluctuaciones", () => {
    const raw = makePoints(
      ["2026-01-01", 80],
      ["2026-01-02", 82],
      ["2026-01-03", 78],
      ["2026-01-04", 80],
    );
    const smoothed = movingAverage(raw, 3);
    expect(smoothed.length).toBe(4);
    // El 3er punto es promedio de 80,82,78 = 80
    expect(smoothed[2].weightKg).toBe(80);
  });

  it("lista vacía devuelve vacío", () => {
    expect(movingAverage([], 7)).toEqual([]);
  });
});
