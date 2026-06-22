import { describe, it, expect } from "vitest";
import {
  resolveExerciseMuscles,
  plannedVolumeByMuscle,
  doneVolumeByMuscle,
  roundHalf,
} from "@/lib/fitness/muscle-volume";

describe("resolveExerciseMuscles", () => {
  it("press banca → pecho + secundarios hombro/tríceps", () => {
    const m = resolveExerciseMuscles("Press banca");
    expect(m?.primary).toBe("chest");
    expect(m?.secondaries).toEqual(expect.arrayContaining(["shoulders", "triceps"]));
  });

  it("press militar → hombros (no pecho), antes que la regla genérica de 'press'", () => {
    expect(resolveExerciseMuscles("Press militar")?.primary).toBe("shoulders");
  });

  it("curl de bíceps → bíceps, sin secundarios", () => {
    const m = resolveExerciseMuscles("Curl de bíceps");
    expect(m?.primary).toBe("biceps");
    expect(m?.secondaries).toEqual([]);
  });

  it("peso muerto rumano → isquios (no espalda como el peso muerto normal)", () => {
    expect(resolveExerciseMuscles("Peso muerto rumano")?.primary).toBe("hamstrings");
    expect(resolveExerciseMuscles("Peso muerto")?.primary).toBe("back");
  });

  it("ignora acentos y mayúsculas", () => {
    expect(resolveExerciseMuscles("SENTADILLA")?.primary).toBe("quads");
    expect(resolveExerciseMuscles("elevación lateral")?.primary).toBe("shoulders");
  });

  it("usa el muscleGroup de fallback si el nombre no matchea", () => {
    expect(resolveExerciseMuscles("Máquina rara X", "Pecho")?.primary).toBe("chest");
  });

  it("devuelve null si no se puede categorizar", () => {
    expect(resolveExerciseMuscles("zzz desconocido")).toBeNull();
  });

  it("casos del mundo real: pullover, reverse pec deck, woodchopper", () => {
    expect(resolveExerciseMuscles("Pullover en polea")?.primary).toBe("back");
    // reverse pec deck = deltoide posterior, NO pecho (aunque contenga 'pec deck')
    expect(resolveExerciseMuscles("Reverse pec deck")?.primary).toBe("shoulders");
    expect(resolveExerciseMuscles("Woodchoppers")?.primary).toBe("core");
    // dominadas lastradas siguen siendo espalda
    expect(resolveExerciseMuscles("Dominadas lastradas")?.primary).toBe("back");
  });
});

describe("plannedVolumeByMuscle (fraccional)", () => {
  it("reparte las series del compuesto a principal (1.0) y secundarios (0.5)", () => {
    const { byMuscle } = plannedVolumeByMuscle([
      { exercises: [{ name: "Press banca", sets: 4 }] },
    ]);
    expect(byMuscle.chest).toBe(4);
    expect(byMuscle.shoulders).toBe(2);
    expect(byMuscle.triceps).toBe(2);
  });

  it("suma a través de días y reporta no categorizados", () => {
    const { byMuscle, uncategorized } = plannedVolumeByMuscle([
      { exercises: [{ name: "Sentadilla", sets: 4 }] },
      { exercises: [{ name: "Sentadilla", sets: 3 }, { name: "Cosa rara", sets: 2 }] },
    ]);
    expect(byMuscle.quads).toBe(7);
    expect(byMuscle.glutes).toBe(3.5);
    expect(uncategorized).toContain("Cosa rara");
  });
});

describe("doneVolumeByMuscle (series efectivas)", () => {
  it("solo cuenta series efectivas (reps ≥ 3, RPE ≥ 6) y aplica fraccional", () => {
    const { byMuscle } = doneVolumeByMuscle(
      [
        {
          date: "2026-06-20",
          exercises: [
            {
              exerciseName: "Press banca",
              muscleGroup: "Pecho",
              sets: [
                { weight: 80, reps: 8, rpe: 8 }, // efectiva
                { weight: 80, reps: 2, rpe: 9 }, // no (reps < 3)
                { weight: 40, reps: 10, rpe: 4 }, // no (RPE < 6)
              ],
            },
          ],
        },
      ],
      "2026-06-14",
    );
    expect(byMuscle.chest).toBe(1);
    expect(byMuscle.triceps).toBe(0.5);
  });

  it("excluye sesiones anteriores a la fecha de corte", () => {
    const { byMuscle } = doneVolumeByMuscle(
      [{ date: "2026-06-01", exercises: [{ exerciseName: "Sentadilla", sets: [{ weight: 100, reps: 5, rpe: 8 }] }] }],
      "2026-06-14",
    );
    expect(byMuscle.quads ?? 0).toBe(0);
  });
});

describe("roundHalf", () => {
  it("redondea a 0.5", () => {
    expect(roundHalf(13.9)).toBe(14);
    expect(roundHalf(2.25)).toBe(2.5);
    expect(roundHalf(2.74)).toBe(2.5);
  });
});
