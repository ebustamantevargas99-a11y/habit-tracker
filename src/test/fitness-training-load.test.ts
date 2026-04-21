import { describe, it, expect } from "vitest";
import {
  trimpFoster,
  trimpBanister,
  trimpFromGymWorkout,
  trimpFromCardioSession,
  computeAtlCtlTsb,
  classifyForm,
  computeReadiness,
} from "@/lib/fitness/training-load";

describe("TRIMP Foster", () => {
  it("60 min × RPE 8 = 480 AU", () => {
    expect(trimpFoster(60, 8)).toBe(480);
  });
  it("ceros devuelven 0", () => {
    expect(trimpFoster(0, 8)).toBe(0);
    expect(trimpFoster(60, 0)).toBe(0);
  });
});

describe("TRIMP Banister", () => {
  it("60 min a 150 bpm (resting 60, max 190, male) produce TRIMP razonable", () => {
    const t = trimpBanister(60, 150, 60, 190, "male");
    // ratio (150-60)/(190-60) ≈ 0.69; 60*0.69*0.64*e^(1.92*0.69) ≈ 99+
    expect(t).toBeGreaterThan(80);
    expect(t).toBeLessThan(150);
  });
  it("sexo femenino usa k menor → TRIMP menor a igual esfuerzo", () => {
    const male = trimpBanister(60, 150, 60, 190, "male");
    const female = trimpBanister(60, 150, 60, 190, "female");
    expect(female).toBeLessThan(male);
  });
  it("HR avg < resting da 0", () => {
    // Acotamos el ratio en [0,1] así no da valores negativos
    const t = trimpBanister(60, 50, 60, 190, "male");
    expect(t).toBe(0);
  });
});

describe("TRIMP from gym workout", () => {
  it("usa RPE promedio cuando está disponible", () => {
    const t = trimpFromGymWorkout({
      durationMin: 60,
      sets: [
        { weight: 100, reps: 5, rpe: 7 },
        { weight: 105, reps: 5, rpe: 8 },
        { weight: 110, reps: 5, rpe: 9 },
      ],
    });
    // avgRpe = 8 → 60 * 8 = 480
    expect(t).toBe(480);
  });

  it("ignora warmups", () => {
    const t = trimpFromGymWorkout({
      durationMin: 60,
      sets: [
        { weight: 40, reps: 10, rpe: 3, isWarmup: true },
        { weight: 100, reps: 5, rpe: 9 },
      ],
    });
    // avgRpe = 9 (solo working) → 540
    expect(t).toBe(540);
  });

  it("fallback a RPE 7 si no hay RPE registrado", () => {
    const t = trimpFromGymWorkout({
      durationMin: 60,
      sets: [{ weight: 100, reps: 5 }],
    });
    expect(t).toBe(60 * 7);
  });

  it("sesión vacía o corta devuelve 0", () => {
    expect(trimpFromGymWorkout({ durationMin: 0, sets: [] })).toBe(0);
    expect(trimpFromGymWorkout({ durationMin: 60, sets: [] })).toBe(0);
  });
});

describe("TRIMP from cardio session", () => {
  it("prefiere HR-based cuando todos los datos están", () => {
    const t = trimpFromCardioSession({
      durationSec: 3600,
      avgHr: 150,
      restingHr: 60,
      maxHr: 190,
      sex: "male",
    });
    expect(t).toBeGreaterThan(80);
  });

  it("fallback a Foster con RPE", () => {
    const t = trimpFromCardioSession({
      durationSec: 3600,
      perceivedExertion: 7,
    });
    expect(t).toBe(60 * 7);
  });

  it("sin HR ni RPE, estimación moderada", () => {
    const t = trimpFromCardioSession({ durationSec: 3600 });
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(600);
  });
});

describe("computeAtlCtlTsb", () => {
  it("días sin carga → atl y ctl bajan a 0", () => {
    const from = "2026-01-01";
    const to = "2026-02-15";
    const series = computeAtlCtlTsb({}, from, to);
    expect(series.length).toBeGreaterThan(40);
    const last = series[series.length - 1];
    expect(last.atl).toBe(0);
    expect(last.ctl).toBe(0);
    expect(last.tsb).toBe(0);
  });

  it("pulso único: ATL sube más rápido que CTL", () => {
    const trimps: Record<string, number> = { "2026-01-01": 500 };
    const series = computeAtlCtlTsb(trimps, "2026-01-01", "2026-01-08");
    expect(series[0].atl).toBeGreaterThan(series[0].ctl);
    // Después de 7 días, ATL empieza a caer más que CTL
    const day7 = series[7];
    expect(day7.atl).toBeLessThan(series[0].atl);
  });

  it("carga sostenida — ATL llega al plateau más rápido que CTL", () => {
    // 60 días a 500 TRIMP/día. τ=7 converge ~35d, τ=42 no converge en 60d.
    const trimps: Record<string, number> = {};
    const start = new Date("2026-01-01T00:00:00Z");
    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      trimps[d.toISOString().split("T")[0]] = 500;
    }
    const series = computeAtlCtlTsb(trimps, "2026-01-01", "2026-03-01");
    const last = series[series.length - 1];

    // ATL ≈ 500 (ya saturado con τ=7 tras 60d)
    expect(last.atl).toBeGreaterThan(480);
    // CTL aún subiendo (τ=42 necesita más tiempo para converger)
    expect(last.ctl).toBeGreaterThan(300);
    expect(last.ctl).toBeLessThan(last.atl);
    // TSB muy negativo — CTL queda debajo mientras ATL ya convergió
    expect(last.tsb).toBeLessThan(0);
  });

  it("carga sostenida muy larga (300d) — ATL y CTL convergen", () => {
    const trimps: Record<string, number> = {};
    const start = new Date("2026-01-01T00:00:00Z");
    for (let i = 0; i < 300; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      trimps[d.toISOString().split("T")[0]] = 500;
    }
    const series = computeAtlCtlTsb(trimps, "2026-01-01", "2026-10-27");
    const last = series[series.length - 1];
    // A 300d ambos EWMA están saturados → TSB ~ 0
    expect(Math.abs(last.tsb)).toBeLessThan(5);
  });

  it("taper: después de reducir, TSB se vuelve positivo (fresco)", () => {
    const trimps: Record<string, number> = {};
    const start = new Date("2026-01-01T00:00:00Z");
    // 30 días de carga alta
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      trimps[d.toISOString().split("T")[0]] = 600;
    }
    // Luego 10 días de descanso
    const series = computeAtlCtlTsb(trimps, "2026-01-01", "2026-02-10");
    const last = series[series.length - 1];
    expect(last.tsb).toBeGreaterThan(0); // fresco
  });
});

describe("classifyForm", () => {
  it("TSB -25 → overreaching", () => {
    expect(classifyForm(-25).status).toBe("overreaching");
  });
  it("TSB -15 → loaded", () => {
    expect(classifyForm(-15).status).toBe("loaded");
  });
  it("TSB -5 → productive", () => {
    expect(classifyForm(-5).status).toBe("productive");
  });
  it("TSB 3 → neutral", () => {
    expect(classifyForm(3).status).toBe("neutral");
  });
  it("TSB 10 → fresh", () => {
    expect(classifyForm(10).status).toBe("fresh");
  });
  it("TSB 20 → detraining", () => {
    expect(classifyForm(20).status).toBe("detraining");
  });
});

describe("computeReadiness", () => {
  it("todos los sliders altos → go_hard", () => {
    const r = computeReadiness({
      sleepQuality: 9,
      soreness: 1,
      stress: 2,
      mood: 9,
      energy: 9,
      motivation: 10,
    });
    expect(r.recommendation).toBe("go_hard");
    expect(r.score).toBeGreaterThan(85);
  });

  it("todos los sliders bajos → rest", () => {
    const r = computeReadiness({
      sleepQuality: 2,
      soreness: 9,
      stress: 9,
      mood: 3,
      energy: 2,
      motivation: 2,
    });
    expect(r.recommendation).toBe("rest");
    expect(r.score).toBeLessThan(40);
  });

  it("mixed → moderate or light", () => {
    const r = computeReadiness({
      sleepQuality: 7,
      soreness: 5,
      stress: 5,
      mood: 7,
      energy: 6,
      motivation: 8,
    });
    expect(["moderate", "light"]).toContain(r.recommendation);
  });

  it("sleepHours < 6 penaliza el score", () => {
    const low = computeReadiness({
      sleepQuality: 7,
      sleepHours: 4,
      soreness: 3,
      mood: 7,
      energy: 7,
      motivation: 7,
    });
    const normal = computeReadiness({
      sleepQuality: 7,
      sleepHours: 8,
      soreness: 3,
      mood: 7,
      energy: 7,
      motivation: 7,
    });
    expect(low.score).toBeLessThan(normal.score);
  });

  it("sin data devuelve score neutral", () => {
    const r = computeReadiness({});
    expect(r.score).toBeGreaterThan(30);
    expect(r.score).toBeLessThan(70);
  });
});
