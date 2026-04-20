import { describe, it, expect } from "vitest";
import {
  oneRMEpley,
  oneRMBrzycki,
  oneRMEstimate,
  bestSet,
  setVolume,
  weeklyVolumeByMuscle,
  effectiveSetsByMuscle,
  volumeZone,
  suggestNextWeight,
  projectFutureE1RM,
  bmi,
  bmrMifflin,
  tdee,
} from "@/lib/fitness/calculations";

describe("1RM estimates", () => {
  it("Epley: 1 rep returns same weight", () => {
    expect(oneRMEpley(100, 1)).toBe(100);
  });

  it("Epley: 5 reps of 100kg ≈ 116.7kg", () => {
    expect(oneRMEpley(100, 5)).toBeCloseTo(116.7, 1);
  });

  it("Brzycki: 1 rep returns same weight", () => {
    expect(oneRMBrzycki(100, 1)).toBe(100);
  });

  it("Brzycki: returns 0 for 37+ reps (invalid range)", () => {
    expect(oneRMBrzycki(50, 37)).toBe(0);
  });

  it("oneRMEstimate averages Epley+Brzycki", () => {
    const avg = oneRMEstimate(100, 5);
    expect(avg).toBeGreaterThan(113);
    expect(avg).toBeLessThan(118);
  });

  it("returns 0 for invalid input", () => {
    expect(oneRMEpley(0, 5)).toBe(0);
    expect(oneRMEpley(100, 0)).toBe(0);
  });
});

describe("best set", () => {
  it("selects set with highest estimated 1RM", () => {
    const sets = [
      { weight: 80, reps: 5 },
      { weight: 100, reps: 3 },
      { weight: 90, reps: 4 },
    ];
    const b = bestSet(sets);
    expect(b).toEqual({ weight: 100, reps: 3 });
  });

  it("returns null for empty input", () => {
    expect(bestSet([])).toBeNull();
  });
});

describe("volume calculations", () => {
  it("setVolume: weight × reps", () => {
    expect(setVolume({ weight: 100, reps: 5 })).toBe(500);
  });

  it("weeklyVolumeByMuscle aggregates per muscle", () => {
    const sets = [
      { weight: 80, reps: 5, muscleGroup: "chest" },
      { weight: 100, reps: 3, muscleGroup: "chest" },
      { weight: 50, reps: 10, muscleGroup: "back" },
    ];
    const vol = weeklyVolumeByMuscle(sets);
    expect(vol.chest).toBe(80 * 5 + 100 * 3);
    expect(vol.back).toBe(500);
  });

  it("effectiveSetsByMuscle filters low-effort sets", () => {
    const sets = [
      { weight: 80, reps: 5, rpe: 8, muscleGroup: "chest" },
      { weight: 80, reps: 2, rpe: 7, muscleGroup: "chest" }, // <3 reps, skip
      { weight: 80, reps: 5, rpe: 5, muscleGroup: "chest" }, // rpe <6, skip
      { weight: 80, reps: 5, rpe: null, muscleGroup: "back" }, // null rpe, count
    ];
    const eff = effectiveSetsByMuscle(sets);
    expect(eff.chest).toBe(1);
    expect(eff.back).toBe(1);
  });
});

describe("volume zones", () => {
  it("under MV for chest <6 sets", () => {
    expect(volumeZone("chest", 4)).toBe("under_mv");
  });

  it("between MV and MEV for chest 6-7 sets", () => {
    expect(volumeZone("chest", 7)).toBe("between_mv_mev");
  });

  it("optimal zone for chest 12-20 sets", () => {
    expect(volumeZone("chest", 15)).toBe("optimal");
  });

  it("approaching MRV", () => {
    expect(volumeZone("chest", 21)).toBe("approaching_mrv");
  });

  it("over MRV", () => {
    expect(volumeZone("chest", 25)).toBe("over_mrv");
  });
});

describe("progressive overload", () => {
  it("reduces weight when failed reps", () => {
    const r = suggestNextWeight({
      lastWeight: 100,
      lastRepsCompleted: 3,
      targetReps: 5,
    });
    expect(r.weight).toBeLessThan(100);
    expect(r.reason).toContain("Falló");
  });

  it("holds weight when RPE is 9+", () => {
    const r = suggestNextWeight({
      lastWeight: 100,
      lastRepsCompleted: 5,
      targetReps: 5,
      lastRPE: 9,
    });
    expect(r.weight).toBe(100);
  });

  it("increases weight when RPE is low", () => {
    const r = suggestNextWeight({
      lastWeight: 100,
      lastRepsCompleted: 5,
      targetReps: 5,
      lastRPE: 7,
      isLowerBody: false,
    });
    expect(r.weight).toBe(102.5);
  });

  it("lower body gets bigger jump", () => {
    const r = suggestNextWeight({
      lastWeight: 100,
      lastRepsCompleted: 5,
      targetReps: 5,
      lastRPE: 7,
      isLowerBody: true,
    });
    expect(r.weight).toBe(105);
  });
});

describe("projections", () => {
  it("linear projection works with 2 points", () => {
    const history = [
      { week: 0, e1RM: 100 },
      { week: 4, e1RM: 108 },
    ];
    const p = projectFutureE1RM(history, 4);
    expect(p).toBe(116);
  });

  it("returns null with insufficient data", () => {
    expect(projectFutureE1RM([{ week: 0, e1RM: 100 }], 4)).toBeNull();
    expect(projectFutureE1RM([], 4)).toBeNull();
  });
});

describe("body metrics", () => {
  it("BMI basics", () => {
    expect(bmi(70, 170)).toBeCloseTo(24.2, 1);
    expect(bmi(0, 170)).toBe(0);
  });

  it("BMR Mifflin male", () => {
    const b = bmrMifflin({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      biologicalSex: "male",
    });
    expect(b).toBeGreaterThan(1700);
    expect(b).toBeLessThan(1900);
  });

  it("BMR Mifflin female (lower due to offset)", () => {
    const male = bmrMifflin({
      weightKg: 70,
      heightCm: 170,
      ageYears: 30,
      biologicalSex: "male",
    });
    const female = bmrMifflin({
      weightKg: 70,
      heightCm: 170,
      ageYears: 30,
      biologicalSex: "female",
    });
    expect(female).toBeLessThan(male);
    expect(male - female).toBe(166);
  });

  it("TDEE applies activity multiplier", () => {
    const t = tdee(1600, "moderate");
    expect(t).toBe(Math.round(1600 * 1.55));
  });
});
