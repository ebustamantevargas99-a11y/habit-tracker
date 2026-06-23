import { describe, it, expect } from "vitest";
import {
  resolveExerciseMuscles,
  resolveExerciseContributions,
  plannedVolumeByMuscle,
  doneVolumeByMuscle,
  roundHalf,
  type MuscleContribution,
} from "@/lib/fitness/muscle-volume";

function frac(c: MuscleContribution[] | null, muscle: string): number {
  return c?.find((x) => x.muscle === muscle)?.fraction ?? 0;
}

describe("resolveExerciseContributions (fracciones por músculo)", () => {
  it("press banca: pecho 1.0, delt_ant 0.5, tríceps 0.5 (NO delt_lat)", () => {
    const c = resolveExerciseContributions("Press banca");
    expect(frac(c, "chest")).toBe(1);
    expect(frac(c, "delt_ant")).toBe(0.5);
    expect(frac(c, "triceps")).toBe(0.5);
    expect(frac(c, "delt_lat")).toBe(0);
    expect(frac(c, "shoulders")).toBe(0); // slug legacy no usado
  });

  it("press inclinado: pecho 1.0, delt_ant 0.5, tríceps 0.5", () => {
    const c = resolveExerciseContributions("Press inclinado");
    expect(frac(c, "chest")).toBe(1);
    expect(frac(c, "delt_ant")).toBe(0.5);
    expect(frac(c, "triceps")).toBe(0.5);
  });

  it("press militar: delt_ant 1.0, delt_lat 0.5, tríceps 0.5", () => {
    const c = resolveExerciseContributions("Press militar");
    expect(frac(c, "delt_ant")).toBe(1);
    expect(frac(c, "delt_lat")).toBe(0.5);
    expect(frac(c, "triceps")).toBe(0.5);
  });

  it("sentadilla: cuádriceps 1.0, glúteo 0.5, SIN isquios", () => {
    const c = resolveExerciseContributions("Sentadilla");
    expect(frac(c, "quads")).toBe(1);
    expect(frac(c, "glutes")).toBe(0.5);
    expect(frac(c, "hamstrings")).toBe(0);
  });

  it("remo al mentón → delt_lat primario (no espalda genérica)", () => {
    const c = resolveExerciseContributions("Remo al mentón");
    expect(c?.[0].muscle).toBe("delt_lat");
    expect(frac(c, "traps")).toBe(0.5);
  });

  it("peso muerto sumo → glúteos primario, lower_back secundario (no back)", () => {
    const c = resolveExerciseContributions("Peso muerto sumo");
    expect(frac(c, "glutes")).toBe(1);
    expect(frac(c, "lower_back")).toBe(0.5);
    expect(frac(c, "back")).toBe(0); // slug legacy no usado
  });

  it("peso muerto convencional → lower_back 1.0, isquios + glúteos 0.5, trapecios 0.25", () => {
    const c = resolveExerciseContributions("Peso muerto");
    expect(frac(c, "lower_back")).toBe(1);
    expect(frac(c, "hamstrings")).toBe(0.5);
    expect(frac(c, "glutes")).toBe(0.5);
    expect(frac(c, "traps")).toBe(0.25);
    expect(frac(c, "back")).toBe(0); // slug legacy no usado
  });

  it("press banca agarre cerrado → tríceps primario, delt_ant (no shoulders)", () => {
    const c = resolveExerciseContributions("Press banca agarre cerrado");
    expect(frac(c, "triceps")).toBe(1);
    expect(frac(c, "chest")).toBe(0.5);
    expect(frac(c, "delt_ant")).toBe(0.25);
  });

  it("face pull → delt_post 1.0, trapecios 0.5", () => {
    const c = resolveExerciseContributions("Face pull");
    expect(frac(c, "delt_post")).toBe(1);
    expect(frac(c, "traps")).toBe(0.5);
  });

  it("reverse pec deck → delt_post (no pecho ni hombros genérico)", () => {
    const c = resolveExerciseContributions("Reverse pec deck");
    expect(c?.[0].muscle).toBe("delt_post");
  });

  it("elevaciones laterales → delt_lat 1.0", () => {
    expect(frac(resolveExerciseContributions("Elevaciones laterales"), "delt_lat")).toBe(1);
  });

  it("elevación frontal → delt_ant 1.0", () => {
    expect(frac(resolveExerciseContributions("Elevación frontal"), "delt_ant")).toBe(1);
  });

  it("dominadas → lats 1.0, bíceps 0.5 (no back genérico)", () => {
    const c = resolveExerciseContributions("Dominadas");
    expect(frac(c, "lats")).toBe(1);
    expect(frac(c, "biceps")).toBe(0.5);
    expect(frac(c, "back")).toBe(0);
  });

  it("remo con barra → lats 1.0, trapecios 0.5, bíceps 0.25", () => {
    const c = resolveExerciseContributions("Remo con barra");
    expect(frac(c, "lats")).toBe(1);
    expect(frac(c, "traps")).toBe(0.5);
    expect(frac(c, "biceps")).toBe(0.25);
  });
});

describe("resolveExerciseMuscles", () => {
  it("press banca → pecho primario + delt_ant y tríceps como secundarios", () => {
    const m = resolveExerciseMuscles("Press banca");
    expect(m?.primary).toBe("chest");
    expect(m?.secondaries).toEqual(expect.arrayContaining(["delt_ant", "triceps"]));
    expect(m?.secondaries).not.toContain("shoulders");
  });

  it("press militar → delt_ant primario (antes que la regla genérica de 'press')", () => {
    expect(resolveExerciseMuscles("Press militar")?.primary).toBe("delt_ant");
  });

  it("curl de bíceps → bíceps, sin secundarios", () => {
    const m = resolveExerciseMuscles("Curl de bíceps");
    expect(m?.primary).toBe("biceps");
    expect(m?.secondaries).toEqual([]);
  });

  it("peso muerto → lumbar primario; peso muerto rumano → isquios primario", () => {
    expect(resolveExerciseMuscles("Peso muerto")?.primary).toBe("lower_back");
    expect(resolveExerciseMuscles("Peso muerto rumano")?.primary).toBe("hamstrings");
  });

  it("ignora acentos y mayúsculas", () => {
    expect(resolveExerciseMuscles("SENTADILLA")?.primary).toBe("quads");
    expect(resolveExerciseMuscles("elevación lateral")?.primary).toBe("delt_lat");
  });

  it("usa el muscleGroup de fallback si el nombre no matchea", () => {
    expect(resolveExerciseMuscles("Máquina rara X", "Pecho")?.primary).toBe("chest");
  });

  it("devuelve null si no se puede categorizar", () => {
    expect(resolveExerciseMuscles("zzz desconocido")).toBeNull();
  });

  it("pullover → dorsales (lats); reverse pec deck → delt_post; woodchopper → core; dominadas → lats", () => {
    expect(resolveExerciseMuscles("Pullover en polea")?.primary).toBe("lats");
    expect(resolveExerciseMuscles("Reverse pec deck")?.primary).toBe("delt_post");
    expect(resolveExerciseMuscles("Woodchoppers")?.primary).toBe("core");
    expect(resolveExerciseMuscles("Dominadas lastradas")?.primary).toBe("lats");
  });
});

describe("plannedVolumeByMuscle (fraccional)", () => {
  it("press banca acumula delt_ant (no shoulders) como sinergista", () => {
    const { byMuscle } = plannedVolumeByMuscle([
      { exercises: [{ name: "Press banca", sets: 4 }] },
    ]);
    expect(byMuscle.chest).toBe(4);
    expect(byMuscle.delt_ant).toBe(2);   // insight clave: anterior delt recibe trabajo indirecto
    expect(byMuscle.triceps).toBe(2);
    expect(byMuscle.shoulders ?? 0).toBe(0); // slug legacy no debe aparecer
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

  it("press militar + elevaciones laterales → acumulan deltoides por separado", () => {
    const { byMuscle } = plannedVolumeByMuscle([
      { exercises: [
        { name: "Press militar", sets: 3 },       // delt_ant +3, delt_lat +1.5
        { name: "Elevaciones laterales", sets: 4 }, // delt_lat +4
      ]},
    ]);
    expect(byMuscle.delt_ant).toBe(3);
    expect(byMuscle.delt_lat).toBe(5.5);
    expect(byMuscle.delt_post ?? 0).toBe(0);
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
    expect(byMuscle.delt_ant).toBe(0.5); // la serie efectiva de bench da 0.5 a delt_ant
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
