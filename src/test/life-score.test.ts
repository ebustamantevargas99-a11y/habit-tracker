import { describe, it, expect } from "vitest";
import { __testing } from "@/lib/scoring/life-score";

const { clamp, daysBackISO, hasModule, DEFAULT_WEIGHTS } = __testing;

describe("life-score · clamp", () => {
  it("no modifica valores en rango", () => {
    expect(clamp(50)).toBe(50);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it("topa en 100 y piso 0 por default", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-20)).toBe(0);
  });

  it("respeta min/max custom", () => {
    expect(clamp(5, 10, 20)).toBe(10);
    expect(clamp(25, 10, 20)).toBe(20);
    expect(clamp(15, 10, 20)).toBe(15);
  });
});

describe("life-score · daysBackISO", () => {
  it("retorna N strings ISO, el primero es el día pasado", () => {
    const d = new Date("2026-04-20T12:00:00Z");
    const dates = daysBackISO(d, 7);
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2026-04-20");
    expect(dates[6]).toBe("2026-04-14");
  });

  it("funciona con 1 día", () => {
    const d = new Date("2026-01-15T00:00:00Z");
    expect(daysBackISO(d, 1)).toEqual(["2026-01-15"]);
  });

  it("atraviesa cambio de mes correctamente", () => {
    const d = new Date("2026-03-02T00:00:00Z");
    const dates = daysBackISO(d, 4);
    expect(dates).toEqual(["2026-03-02", "2026-03-01", "2026-02-28", "2026-02-27"]);
  });
});

describe("life-score · hasModule", () => {
  it("habits siempre por nombre directo", () => {
    expect(hasModule(["habits"], "habits")).toBe(true);
    expect(hasModule(["fitness"], "habits")).toBe(false);
  });

  it("productivity matchea con tasks/projects/planner", () => {
    expect(hasModule(["planner"], "productivity")).toBe(true);
    expect(hasModule(["tasks"], "productivity")).toBe(true);
    expect(hasModule(["projects"], "productivity")).toBe(true);
  });
});

describe("life-score · pesos por default", () => {
  it("todas las dimensiones tienen peso >= 0.5", () => {
    for (const dim of Object.keys(DEFAULT_WEIGHTS) as (keyof typeof DEFAULT_WEIGHTS)[]) {
      expect(DEFAULT_WEIGHTS[dim]).toBeGreaterThanOrEqual(0.5);
    }
  });

  it("habits pesa 1.0 (core)", () => {
    expect(DEFAULT_WEIGHTS.habits).toBe(1.0);
  });

  it("la suma total es razonable (3-5)", () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThanOrEqual(2.5);
    expect(sum).toBeLessThanOrEqual(5);
  });
});
