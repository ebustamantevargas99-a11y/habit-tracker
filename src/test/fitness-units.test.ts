import { describe, it, expect } from "vitest";
import {
  kgToLb,
  lbToKg,
  kmToMi,
  miToKm,
  cmToIn,
  inToCm,
  formatWeight,
  formatDistance,
  formatPace,
  formatHeight,
  formatDuration,
  normalizeWeightToKg,
  normalizeDistanceToKm,
  normalizeHeightToCm,
  weightUnitLabel,
  distanceUnitLabel,
  heightUnitLabel,
} from "@/lib/fitness/units";

describe("fitness/units — raw conversions", () => {
  it("kgToLb y lbToKg son inversos (roundtrip)", () => {
    for (const kg of [1, 50, 80, 100, 150]) {
      const roundtrip = lbToKg(kgToLb(kg));
      expect(roundtrip).toBeCloseTo(kg, 6);
    }
  });

  it("100 kg ≈ 220.46 lb", () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
  });

  it("kmToMi y miToKm son inversos", () => {
    for (const km of [1, 5, 10, 42.195]) {
      expect(miToKm(kmToMi(km))).toBeCloseTo(km, 6);
    }
  });

  it("1 mile ≈ 1.609 km", () => {
    expect(miToKm(1)).toBeCloseTo(1.609, 2);
  });

  it("cmToIn y inToCm son inversos", () => {
    for (const cm of [10, 50, 175, 200]) {
      expect(inToCm(cmToIn(cm))).toBeCloseTo(cm, 6);
    }
  });
});

describe("fitness/units — display helpers", () => {
  it('formatWeight métrico usa "kg"', () => {
    expect(formatWeight(80, "metric")).toBe("80 kg");
  });

  it('formatWeight imperial convierte y usa "lb"', () => {
    const out = formatWeight(100, "imperial");
    expect(out).toMatch(/lb/);
    expect(out).toMatch(/220/); // 100kg = 220.46 lb
  });

  it("formatWeight con null devuelve em-dash", () => {
    expect(formatWeight(null, "metric")).toBe("—");
    expect(formatWeight(undefined, "imperial")).toBe("—");
    expect(formatWeight(NaN, "metric")).toBe("—");
  });

  it("formatWeight respeta decimals=0", () => {
    expect(formatWeight(80.4, "metric", { decimals: 0 })).toBe("80 kg");
  });

  it("formatWeight quita .0 al final", () => {
    expect(formatWeight(80, "metric", { decimals: 2 })).toBe("80 kg");
  });

  it("formatDistance métrico muestra km con 2 decimales", () => {
    expect(formatDistance(5.5, "metric")).toBe("5.5 km");
  });

  it("formatDistance imperial convierte a mi", () => {
    const out = formatDistance(10, "imperial");
    expect(out).toMatch(/mi/);
    expect(out).toMatch(/6\.21/); // 10km ≈ 6.21 mi
  });

  it('formatPace métrico: 300 sec/km → "5:00/km"', () => {
    expect(formatPace(300, "metric")).toBe("5:00/km");
  });

  it("formatPace imperial convierte a sec/mi", () => {
    const out = formatPace(300, "imperial");
    expect(out).toMatch(/\/mi$/);
    // 300 s/km ÷ 0.621 ≈ 483 s/mi → 8:03 /mi
    expect(out).toMatch(/^8:0[23]\/mi$/);
  });

  it("formatPace con 0 devuelve em-dash", () => {
    expect(formatPace(0, "metric")).toBe("—");
  });

  it("formatHeight métrico redondea a cm", () => {
    expect(formatHeight(175.4, "metric")).toBe("175 cm");
  });

  it("formatHeight imperial usa pies'pulgadas\"", () => {
    const out = formatHeight(175, "imperial");
    expect(out).toMatch(/^5'\d+"$/);
  });

  it('formatDuration < 1h usa "mm:ss"', () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(599)).toBe("9:59");
  });

  it('formatDuration ≥ 1h usa "h:mm:ss"', () => {
    expect(formatDuration(3_700)).toBe("1:01:40");
  });

  it("formatDuration con null devuelve em-dash", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(-1)).toBe("—");
  });
});

describe("fitness/units — input normalizers (UI → DB)", () => {
  it("normalizeWeightToKg: métrico es identity", () => {
    expect(normalizeWeightToKg(80, "metric")).toBe(80);
  });

  it("normalizeWeightToKg: imperial convierte lb → kg", () => {
    expect(normalizeWeightToKg(220.462, "imperial")).toBeCloseTo(100, 2);
  });

  it("normalizeDistanceToKm: imperial convierte mi → km", () => {
    expect(normalizeDistanceToKm(1, "imperial")).toBeCloseTo(1.609, 2);
  });

  it("normalizeHeightToCm: imperial convierte in → cm", () => {
    expect(normalizeHeightToCm(69, "imperial")).toBeCloseTo(175.26, 1);
  });

  it("DB invariant: roundtrip UI → DB → UI preserva valor (dentro de tolerancia)", () => {
    // User input 100 lb → DB en kg → UI display en lb nuevamente
    const dbKg = normalizeWeightToKg(100, "imperial");
    expect(dbKg).toBeCloseTo(45.36, 1);
    const displayed = formatWeight(dbKg, "imperial", { includeUnit: false });
    expect(Number(displayed)).toBeCloseTo(100, 1);
  });
});

describe("fitness/units — unit labels", () => {
  it("labels coinciden con preferencia", () => {
    expect(weightUnitLabel("metric")).toBe("kg");
    expect(weightUnitLabel("imperial")).toBe("lb");
    expect(distanceUnitLabel("metric")).toBe("km");
    expect(distanceUnitLabel("imperial")).toBe("mi");
    expect(heightUnitLabel("metric")).toBe("cm");
    expect(heightUnitLabel("imperial")).toBe("in");
  });
});
