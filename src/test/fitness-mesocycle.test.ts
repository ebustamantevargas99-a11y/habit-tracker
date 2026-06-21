import { describe, it, expect } from "vitest";
import {
  mesocycleWeek,
  recommendedSetsForWeek,
  suggestProgression,
  weeklyVolumeHistory,
} from "@/lib/fitness/mesocycle";

describe("mesocycleWeek", () => {
  it("cuenta semanas desde el inicio (1-indexed)", () => {
    expect(mesocycleWeek("2026-06-21", "2026-06-21")).toBe(1);
    expect(mesocycleWeek("2026-06-15", "2026-06-21")).toBe(1); // 6 días → semana 1
    expect(mesocycleWeek("2026-06-14", "2026-06-21")).toBe(2); // 7 días → semana 2
    expect(mesocycleWeek("2026-06-01", "2026-06-21")).toBe(3); // 20 días → semana 3
  });
});

describe("recommendedSetsForWeek", () => {
  it("arranca en MEV y suma 1 serie por semana, tope MRV", () => {
    expect(recommendedSetsForWeek(8, 22, 1)).toBe(8);
    expect(recommendedSetsForWeek(8, 22, 3)).toBe(10);
    expect(recommendedSetsForWeek(8, 22, 100)).toBe(22);
  });
});

describe("suggestProgression", () => {
  it("plan bajo MEV → subir a MEV", () => {
    const s = suggestProgression("chest", 5, 3);
    expect(s?.action).toBe("raise_to_mev");
    expect(s?.target).toBe(8);
  });
  it("plan por debajo del objetivo de la semana → add_set", () => {
    expect(suggestProgression("chest", 9, 3)?.action).toBe("add_set"); // objetivo semana 3 = 10
  });
  it("plan en el objetivo → hold", () => {
    expect(suggestProgression("chest", 10, 3)?.action).toBe("hold");
  });
  it("plan en MRV → deload", () => {
    expect(suggestProgression("chest", 22, 5)?.action).toBe("deload");
  });
  it("sin programar (0) → null", () => {
    expect(suggestProgression("chest", 0, 2)).toBeNull();
  });
});

describe("weeklyVolumeHistory", () => {
  it("agrupa series efectivas fraccionales por ventana semanal, cronológico", () => {
    const workouts = [
      {
        date: "2026-06-20", // 1 día atrás → bucket 0 (semana actual)
        exercises: [
          { exerciseName: "Press banca", muscleGroup: "Pecho", sets: [
            { weight: 80, reps: 8, rpe: 8 },
            { weight: 80, reps: 8, rpe: 8 },
          ] },
        ],
      },
      {
        date: "2026-06-10", // 11 días atrás → bucket 1
        exercises: [
          { exerciseName: "Curl bíceps", muscleGroup: "Bíceps", sets: [{ weight: 15, reps: 12, rpe: 8 }] },
        ],
      },
    ];
    const pts = weeklyVolumeHistory(workouts, 4, "2026-06-21");
    expect(pts).toHaveLength(4);
    // Press banca: 2 efectivas × (1 + 2 secundarios×0.5 = 2) = 4 en la semana más reciente (último punto)
    expect(pts[pts.length - 1].totalSets).toBe(4);
    // Curl bíceps: 1 efectiva × 1 (sin secundarios) = 1 en la semana anterior
    expect(pts[pts.length - 2].totalSets).toBe(1);
  });
});
