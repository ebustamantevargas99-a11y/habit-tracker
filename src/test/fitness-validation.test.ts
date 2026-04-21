import { describe, it, expect } from "vitest";
import {
  setTypeEnum,
  primaryMuscleEnum,
  equipmentEnum,
  workoutCreateSchema,
  exerciseCreateSchema,
  trainingProgramCreateSchema,
  programPhaseCreateSchema,
  readinessCheckUpsertSchema,
  cardioSessionCreateSchema,
  shoeCreateSchema,
  bodyCompositionUpsertSchema,
} from "@/lib/validation";

describe("Zod fitness — WorkoutSet extendido", () => {
  it("setType acepta todos los tipos soportados", () => {
    const types = [
      "straight",
      "warmup",
      "dropset",
      "restpause",
      "myoreps",
      "cluster",
      "superset",
      "amrap",
      "failure",
    ];
    for (const t of types) {
      expect(setTypeEnum.safeParse(t).success).toBe(true);
    }
  });

  it("setType rechaza tipo desconocido", () => {
    expect(setTypeEnum.safeParse("magic-set").success).toBe(false);
  });

  it("tempo acepta formato 3-1-1-2", () => {
    const r = workoutCreateSchema.safeParse({
      date: "2026-04-21",
      name: "Push",
      exercises: [
        {
          exerciseName: "Bench Press",
          sets: [
            { weight: 100, reps: 5, rpe: 8, tempo: "3-1-1-2", setType: "straight" },
          ],
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("tempo acepta formato 3010 (condensado)", () => {
    const r = workoutCreateSchema.safeParse({
      date: "2026-04-21",
      name: "Push",
      exercises: [
        {
          exerciseName: "Bench Press",
          sets: [{ weight: 100, reps: 5, tempo: "3010" }],
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("tempo rechaza formato inválido", () => {
    const r = workoutCreateSchema.safeParse({
      date: "2026-04-21",
      name: "Push",
      exercises: [
        {
          exerciseName: "Bench Press",
          sets: [{ weight: 100, reps: 5, tempo: "abc" }],
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rir válido 0..10", () => {
    const r = workoutCreateSchema.safeParse({
      date: "2026-04-21",
      name: "Push",
      exercises: [
        {
          exerciseName: "Bench Press",
          sets: [{ weight: 100, reps: 5, rir: 2 }],
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rir fuera de rango falla", () => {
    const r = workoutCreateSchema.safeParse({
      date: "2026-04-21",
      name: "Push",
      exercises: [
        {
          exerciseName: "Bench Press",
          sets: [{ weight: 100, reps: 5, rir: 11 }],
        },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("groupId + setType=superset juntos", () => {
    const r = workoutCreateSchema.safeParse({
      date: "2026-04-21",
      name: "Arms",
      exercises: [
        {
          exerciseName: "DB Curl",
          sets: [
            {
              weight: 15,
              reps: 10,
              setType: "superset",
              groupId: "arms-A",
            },
          ],
        },
        {
          exerciseName: "Rope Pushdown",
          sets: [
            {
              weight: 30,
              reps: 12,
              setType: "superset",
              groupId: "arms-A",
            },
          ],
        },
      ],
    });
    expect(r.success).toBe(true);
  });
});

describe("Zod fitness — Exercise extendido", () => {
  it("acepta campos mínimos legacy", () => {
    const r = exerciseCreateSchema.safeParse({
      name: "Press Banca",
      muscleGroup: "Pecho",
      category: "compound",
    });
    expect(r.success).toBe(true);
  });

  it("acepta primaryMuscle enum + equipment list", () => {
    const r = exerciseCreateSchema.safeParse({
      name: "Press Banca",
      muscleGroup: "Pecho",
      primaryMuscle: "chest",
      secondaryMuscles: ["triceps", "shoulders"],
      equipmentList: ["barbell"],
      difficulty: "intermediate",
      category: "compound",
      formTips: ["Arco controlado", "Escápulas retraídas"],
      commonMistakes: ["Despegar glúteo del banco"],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza primaryMuscle no enumerado", () => {
    const r = exerciseCreateSchema.safeParse({
      name: "X",
      muscleGroup: "Pecho",
      primaryMuscle: "pecho-raro",
      category: "compound",
    });
    expect(r.success).toBe(false);
  });

  it("primaryMuscleEnum incluye todos los grupos esperados", () => {
    const required = [
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "quads",
      "hamstrings",
      "glutes",
      "core",
      "calves",
    ];
    for (const m of required) {
      expect(primaryMuscleEnum.safeParse(m).success).toBe(true);
    }
  });

  it("equipmentEnum incluye bodyweight y barbell", () => {
    expect(equipmentEnum.safeParse("bodyweight").success).toBe(true);
    expect(equipmentEnum.safeParse("barbell").success).toBe(true);
    expect(equipmentEnum.safeParse("random-thing").success).toBe(false);
  });
});

describe("Zod fitness — TrainingProgram + ProgramPhase", () => {
  it("acepta programa mínimo", () => {
    const r = trainingProgramCreateSchema.safeParse({
      name: "Push Pull Legs 12 semanas",
      durationWeeks: 12,
      startDate: "2026-04-21",
      type: "linear",
      goal: "hypertrophy",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza durationWeeks = 0", () => {
    const r = trainingProgramCreateSchema.safeParse({
      name: "X",
      durationWeeks: 0,
      startDate: "2026-04-21",
    });
    expect(r.success).toBe(false);
  });

  it("schedule con exercises válidos", () => {
    const r = trainingProgramCreateSchema.safeParse({
      name: "Upper / Lower",
      durationWeeks: 8,
      startDate: "2026-04-21",
      schedule: [
        {
          dayOfWeek: 1,
          templateName: "Upper",
          exercises: [
            { name: "Bench Press", sets: 4, repRange: [5, 8], targetRpe: 8 },
          ],
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("ProgramPhase acepta fase accumulation", () => {
    const r = programPhaseCreateSchema.safeParse({
      programId: "p123",
      name: "accumulation",
      weekStart: 1,
      weekEnd: 4,
      targetRpeMin: 7,
      targetRpeMax: 8,
      targetSetsPerMuscle: 14,
    });
    expect(r.success).toBe(true);
  });

  it("ProgramPhase rechaza nombre no enumerado", () => {
    const r = programPhaseCreateSchema.safeParse({
      programId: "p123",
      name: "random-phase",
      weekStart: 1,
      weekEnd: 4,
    });
    expect(r.success).toBe(false);
  });
});

describe("Zod fitness — ReadinessCheck", () => {
  it("acepta check básico con sliders", () => {
    const r = readinessCheckUpsertSchema.safeParse({
      date: "2026-04-21",
      sleepHours: 7.5,
      sleepQuality: 8,
      soreness: 3,
      mood: 8,
      energy: 7,
      motivation: 9,
      score: 82,
      recommendation: "moderate",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza mood > 10", () => {
    const r = readinessCheckUpsertSchema.safeParse({
      date: "2026-04-21",
      mood: 11,
    });
    expect(r.success).toBe(false);
  });

  it("rechaza recommendation no enumerada", () => {
    const r = readinessCheckUpsertSchema.safeParse({
      date: "2026-04-21",
      recommendation: "destroy",
    });
    expect(r.success).toBe(false);
  });

  it("acepta restingHr 60 y hrv 55", () => {
    const r = readinessCheckUpsertSchema.safeParse({
      date: "2026-04-21",
      restingHr: 60,
      hrv: 55,
    });
    expect(r.success).toBe(true);
  });
});

describe("Zod fitness — CardioSession + Shoe", () => {
  it("acepta corrida 5km 30 min manual", () => {
    const r = cardioSessionCreateSchema.safeParse({
      date: "2026-04-21",
      startedAt: "2026-04-21T07:00:00Z",
      endedAt: "2026-04-21T07:30:00Z",
      activityType: "run",
      distanceKm: 5,
      durationSec: 1800,
      avgPaceSecPerKm: 360,
      avgHr: 155,
      perceivedExertion: 7,
    });
    expect(r.success).toBe(true);
  });

  it("acepta zones parciales", () => {
    const r = cardioSessionCreateSchema.safeParse({
      date: "2026-04-21",
      startedAt: "2026-04-21T07:00:00Z",
      durationSec: 1800,
      activityType: "bike",
      zones: { z2: 1200, z3: 600 },
    });
    expect(r.success).toBe(true);
  });

  it("acepta splits array", () => {
    const r = cardioSessionCreateSchema.safeParse({
      date: "2026-04-21",
      startedAt: "2026-04-21T07:00:00Z",
      durationSec: 1800,
      splits: [
        { km: 1, paceSec: 355 },
        { km: 2, paceSec: 360, hr: 160 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza avgHr > 240", () => {
    const r = cardioSessionCreateSchema.safeParse({
      date: "2026-04-21",
      startedAt: "2026-04-21T07:00:00Z",
      durationSec: 1800,
      avgHr: 350,
    });
    expect(r.success).toBe(false);
  });

  it("Shoe acepta datos mínimos", () => {
    const r = shoeCreateSchema.safeParse({ name: "Nike Pegasus 41" });
    expect(r.success).toBe(true);
  });

  it("Shoe rechaza maxKm = 10 (menor a 50)", () => {
    const r = shoeCreateSchema.safeParse({ name: "Nike", maxKm: 10 });
    expect(r.success).toBe(false);
  });
});

describe("Zod fitness — BodyComposition", () => {
  it("acepta upsert con weight y bodyFat", () => {
    const r = bodyCompositionUpsertSchema.safeParse({
      date: "2026-04-21",
      weightKg: 78.5,
      bodyFatPercent: 17.2,
      method: "bia",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza bodyFat = 95", () => {
    const r = bodyCompositionUpsertSchema.safeParse({
      date: "2026-04-21",
      bodyFatPercent: 95,
    });
    // 95 > 80 (max)
    expect(r.success).toBe(false);
  });

  it("rechaza method desconocido", () => {
    const r = bodyCompositionUpsertSchema.safeParse({
      date: "2026-04-21",
      method: "magic",
    });
    expect(r.success).toBe(false);
  });
});
