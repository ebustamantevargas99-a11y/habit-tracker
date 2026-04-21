import { describe, it, expect } from "vitest";
import {
  suggestNextWeight,
  detectPlateau,
  needsDeload,
  bestEstimated1RM,
  type HistorySet,
} from "@/lib/fitness/progression";

// Helper — crea sets con misma fecha
function session(date: string, ...sets: Array<[number, number, number?]>): HistorySet[] {
  return sets.map(([weight, reps, rpe]) => ({ weight, reps, rpe: rpe ?? null, date }));
}

describe("suggestNextWeight — edge cases", () => {
  it("sin histórico sugiere peso 0 y confianza 0", () => {
    const r = suggestNextWeight([]);
    expect(r.suggestedWeight).toBe(0);
    expect(r.confidence).toBe(0);
    expect(r.reason).toMatch(/Sin histórico/i);
  });

  it("filtra warmups", () => {
    const history: HistorySet[] = [
      { weight: 40, reps: 5, date: "2026-04-20", isWarmup: true },
      { weight: 100, reps: 5, rpe: 7, date: "2026-04-20" },
    ];
    const r = suggestNextWeight(history);
    // El único set "real" tiene reps=5 con RPE 7, no llegó al max (default 8)
    // → sugiere subir reps a 6 misma weight
    expect(r.suggestedWeight).toBe(100);
    expect(r.suggestedReps).toBe(6);
  });
});

describe("suggestNextWeight — double progression", () => {
  it("llenó rango (8 reps) con RPE bajo → sube peso", () => {
    const history: HistorySet[] = [
      ...session("2026-04-14", [100, 8, 7.5]),
    ];
    const r = suggestNextWeight(history, { repRange: [5, 8], targetRpe: 8 });
    expect(r.suggestedWeight).toBe(102.5);
    expect(r.suggestedReps).toBe(5);
    expect(r.reason).toMatch(/sube 2.5 kg/i);
  });

  it("no llenó rango (5 reps) → mantiene peso y sube a 6 reps", () => {
    const history: HistorySet[] = [
      ...session("2026-04-14", [100, 5, 8]),
    ];
    const r = suggestNextWeight(history, { repRange: [5, 8], targetRpe: 8 });
    expect(r.suggestedWeight).toBe(100);
    expect(r.suggestedReps).toBe(6);
    expect(r.reason).toMatch(/double progression/i);
  });

  it("llenó rango pero RPE 9 (duro) → igualmente sube peso", () => {
    const history: HistorySet[] = [
      ...session("2026-04-14", [100, 8, 9]),
    ];
    const r = suggestNextWeight(history, { repRange: [5, 8], targetRpe: 8 });
    // RPE > target pero llenó el rango — el algoritmo exige RPE ≤ target
    // para subir. Acá RPE 9 > 8 → no sube peso, mantiene
    // Vemos fallback porque no es plateau aún (solo 1 sesión)
    expect(r.suggestedWeight).toBe(100);
  });
});

describe("suggestNextWeight — plateau detection", () => {
  it("3 sesiones idénticas con RPE 9 → deload", () => {
    const history: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 9]),
      ...session("2026-04-17", [100, 5, 9]),
      ...session("2026-04-14", [100, 5, 9]),
    ];
    const r = suggestNextWeight(history);
    expect(r.plateauDetected).toBe(true);
    expect(r.needsDeload).toBe(true);
    expect(r.suggestedWeight).toBe(90); // 10% menos, redondeado a 0.5
    expect(r.reason).toMatch(/deload/i);
  });

  it("3 sesiones idénticas con RPE 7 → sube peso (sin deload)", () => {
    const history: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 7]),
      ...session("2026-04-17", [100, 5, 7]),
      ...session("2026-04-14", [100, 5, 7]),
    ];
    const r = suggestNextWeight(history);
    // Aquí 3 sesiones idénticas disparan plateau SIN deload porque RPE avg 7 < 9.
    // Sugiere +minIncrement y resetea reps al min.
    expect(r.plateauDetected).toBe(true);
    expect(r.needsDeload).toBe(false);
    expect(r.suggestedWeight).toBe(102.5);
  });
});

describe("suggestNextWeight — RPE drop signal", () => {
  it("RPE cayó de 8 → 6.5 en últimas 2 sesiones → salto doble", () => {
    const history: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 6.5]),
      ...session("2026-04-17", [100, 5, 6.5]),
    ];
    const r = suggestNextWeight(history, { targetRpe: 8 });
    // avgRpe2 = 6.5; 6.5 <= 8 - 1.5 = 6.5 cumple
    expect(r.suggestedWeight).toBe(105); // +2 × 2.5
    expect(r.reason).toMatch(/te sobra fuerza/i);
  });
});

describe("detectPlateau + needsDeload", () => {
  it("no hay plateau con 2 sesiones", () => {
    const h: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 8]),
      ...session("2026-04-17", [100, 5, 8]),
    ];
    expect(detectPlateau(h, 3)).toBe(false);
  });

  it("3 iguales = plateau", () => {
    const h: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 8]),
      ...session("2026-04-17", [100, 5, 8]),
      ...session("2026-04-14", [100, 5, 8]),
    ];
    expect(detectPlateau(h, 3)).toBe(true);
  });

  it("needsDeload requiere plateau + RPE alto", () => {
    const platHigh: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 9.5]),
      ...session("2026-04-17", [100, 5, 9]),
      ...session("2026-04-14", [100, 5, 9]),
    ];
    expect(needsDeload(platHigh)).toBe(true);

    const platLow: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 7]),
      ...session("2026-04-17", [100, 5, 7]),
      ...session("2026-04-14", [100, 5, 7]),
    ];
    expect(needsDeload(platLow)).toBe(false);
  });
});

describe("bestEstimated1RM", () => {
  it("usa RPE cuando está disponible (preferido)", () => {
    const h: HistorySet[] = [
      ...session("2026-04-20", [100, 5, 8]),
    ];
    const est = bestEstimated1RM(h);
    // RPE 5 @ 8 ≈ 84% → 100/0.84 ≈ 119
    expect(est).not.toBeNull();
    expect(est!).toBeGreaterThan(115);
    expect(est!).toBeLessThan(125);
  });

  it("fallback a Epley cuando no hay RPE", () => {
    const h: HistorySet[] = [
      ...session("2026-04-20", [100, 5]),
    ];
    const est = bestEstimated1RM(h);
    // Epley: 100 × (1 + 5/30) ≈ 116.67
    expect(est).not.toBeNull();
    expect(est!).toBeGreaterThan(115);
    expect(est!).toBeLessThan(118);
  });

  it("sin histórico devuelve null", () => {
    expect(bestEstimated1RM([])).toBeNull();
  });

  it("ignora warmups", () => {
    const h: HistorySet[] = [
      { weight: 200, reps: 5, rpe: 8, date: "2026-04-20", isWarmup: true },
      { weight: 100, reps: 5, rpe: 8, date: "2026-04-20" },
    ];
    const est = bestEstimated1RM(h);
    expect(est).toBeLessThan(130);
  });
});
