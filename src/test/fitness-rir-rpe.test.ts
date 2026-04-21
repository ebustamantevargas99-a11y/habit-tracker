import { describe, it, expect } from "vitest";
import {
  rpeToRir,
  rirToRpe,
  rpeToPercent1RM,
  estimate1RMFromRpe,
  weightForTargetRpe,
} from "@/lib/fitness/rir-rpe";

describe("rpe ↔ rir basic", () => {
  it("RPE 10 = RIR 0 (failure)", () => {
    expect(rpeToRir(10)).toBe(0);
  });
  it("RPE 8 = RIR 2", () => {
    expect(rpeToRir(8)).toBe(2);
  });
  it("RPE 6 = RIR 4", () => {
    expect(rpeToRir(6)).toBe(4);
  });
  it("rirToRpe inverse roundtrip", () => {
    for (const rpe of [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]) {
      expect(rirToRpe(rpeToRir(rpe))).toBe(rpe);
    }
  });
  it("clamps out of range", () => {
    expect(rpeToRir(-3)).toBe(10);
    expect(rpeToRir(15)).toBe(0);
  });
});

describe("rpeToPercent1RM chart lookup", () => {
  it("1 rep a RPE 10 = 100% del 1RM", () => {
    expect(rpeToPercent1RM(1, 10)).toBe(1.0);
  });

  it("5 reps a RPE 8 ≈ 84% del 1RM", () => {
    const pct = rpeToPercent1RM(5, 8);
    expect(pct).not.toBeNull();
    expect(pct!).toBeGreaterThan(0.82);
    expect(pct!).toBeLessThan(0.86);
  });

  it("8 reps a RPE 8 ≈ 78.7%", () => {
    const pct = rpeToPercent1RM(8, 8);
    expect(pct).not.toBeNull();
    expect(pct!).toBeGreaterThan(0.77);
    expect(pct!).toBeLessThan(0.80);
  });

  it("RPE 5 (warmup) está fuera de rango y devuelve null", () => {
    expect(rpeToPercent1RM(5, 5)).toBeNull();
  });

  it("reps altas (11-12) siguen en la tabla", () => {
    const pct = rpeToPercent1RM(12, 8);
    expect(pct).not.toBeNull();
    expect(pct!).toBeGreaterThan(0.7);
    expect(pct!).toBeLessThan(0.75);
  });

  it("reps > 12 clamp a la fila 12", () => {
    const a = rpeToPercent1RM(12, 8);
    const b = rpeToPercent1RM(20, 8);
    expect(a).toBe(b);
  });

  it("el % sube con RPE (misma reps, más RPE = mayor %)", () => {
    const r6 = rpeToPercent1RM(5, 6)!;
    const r8 = rpeToPercent1RM(5, 8)!;
    const r10 = rpeToPercent1RM(5, 10)!;
    expect(r6).toBeLessThan(r8);
    expect(r8).toBeLessThan(r10);
  });

  it("el % baja con reps (más reps = menor %)", () => {
    const r3 = rpeToPercent1RM(3, 8)!;
    const r8 = rpeToPercent1RM(8, 8)!;
    expect(r3).toBeGreaterThan(r8);
  });
});

describe("estimate1RMFromRpe", () => {
  it("100 kg × 5 reps a RPE 8 → 1RM estimado ~119 kg", () => {
    const est = estimate1RMFromRpe(100, 5, 8);
    expect(est).not.toBeNull();
    expect(est!).toBeGreaterThan(115);
    expect(est!).toBeLessThan(125);
  });

  it("peso 0 devuelve 0 o algo cercano", () => {
    const est = estimate1RMFromRpe(0, 5, 8);
    expect(est).toBe(0);
  });

  it("RPE fuera de rango devuelve null", () => {
    expect(estimate1RMFromRpe(100, 5, 5)).toBeNull();
  });
});

describe("weightForTargetRpe — programación", () => {
  it("1RM 100kg, target 5 reps @ RPE 8 → ~84 kg", () => {
    const w = weightForTargetRpe(100, 5, 8);
    expect(w).not.toBeNull();
    expect(w!).toBeGreaterThan(82);
    expect(w!).toBeLessThan(86);
    // redondeo a 0.5
    expect(w! * 2).toBe(Math.round(w! * 2));
  });

  it("1RM 150kg, target 3 reps @ RPE 9 → ~137.5 kg", () => {
    const w = weightForTargetRpe(150, 3, 9);
    expect(w).not.toBeNull();
    expect(w!).toBeGreaterThan(135);
    expect(w!).toBeLessThan(140);
  });

  it("1RM 0 devuelve null", () => {
    expect(weightForTargetRpe(0, 5, 8)).toBeNull();
  });

  it("RPE 11 devuelve null", () => {
    expect(weightForTargetRpe(100, 5, 11)).toBeNull();
  });

  it("estimate1RM → weightForTargetRpe es casi identity", () => {
    // Si hiciste 100×5 @ RPE 8, el weightForTargetRpe(est1RM, 5, 8) ≈ 100
    const est = estimate1RMFromRpe(100, 5, 8);
    const back = weightForTargetRpe(est!, 5, 8);
    expect(back).toBeCloseTo(100, 0); // ±0.5 kg por redondeo
  });
});
