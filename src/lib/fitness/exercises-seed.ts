// Catálogo base de ejercicios populares para Ultimate TRACKER.
// muscleGroup usa taxonomía inglesa (alineada con VOLUME_LANDMARKS).
// Extensible: users pueden crear ejercicios custom via prisma.Exercise con userId.

export type ExerciseSeed = {
  slug: string;
  name: string;
  nameEn: string;
  muscleGroup:
    | "chest"
    | "back"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "quads"
    | "hamstrings"
    | "glutes"
    | "core"
    | "calves"
    | "forearms"
    | "full_body";
  category: "compound" | "isolation" | "plyometric" | "cardio";
  equipment:
    | "barbell"
    | "dumbbell"
    | "machine"
    | "cable"
    | "bodyweight"
    | "kettlebell"
    | "band"
    | "smith"
    | "other";
  isLowerBody: boolean;
  primaryMovementPattern?:
    | "horizontal_push"
    | "horizontal_pull"
    | "vertical_push"
    | "vertical_pull"
    | "squat"
    | "hinge"
    | "lunge"
    | "carry"
    | "rotation";
};

export const EXERCISES_SEED: ExerciseSeed[] = [
  // ── Chest ───────────────────────────────────────────────────────────────────
  { slug: "bench-press", name: "Press de banca", nameEn: "Bench Press", muscleGroup: "chest", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "incline-bench-press", name: "Press inclinado", nameEn: "Incline Bench Press", muscleGroup: "chest", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "dumbbell-bench-press", name: "Press con mancuernas", nameEn: "Dumbbell Bench Press", muscleGroup: "chest", category: "compound", equipment: "dumbbell", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "dumbbell-fly", name: "Aperturas con mancuernas", nameEn: "Dumbbell Fly", muscleGroup: "chest", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "cable-crossover", name: "Cruce en polea", nameEn: "Cable Crossover", muscleGroup: "chest", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "pushup", name: "Flexiones", nameEn: "Push-Up", muscleGroup: "chest", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "chest-press-machine", name: "Press de pecho en máquina", nameEn: "Chest Press Machine", muscleGroup: "chest", category: "compound", equipment: "machine", isLowerBody: false },

  // ── Back ────────────────────────────────────────────────────────────────────
  { slug: "deadlift", name: "Peso muerto", nameEn: "Deadlift", muscleGroup: "back", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "pull-up", name: "Dominadas", nameEn: "Pull-Up", muscleGroup: "back", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "lat-pulldown", name: "Jalón al pecho", nameEn: "Lat Pulldown", muscleGroup: "back", category: "compound", equipment: "cable", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "barbell-row", name: "Remo con barra", nameEn: "Barbell Row", muscleGroup: "back", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "dumbbell-row", name: "Remo con mancuerna", nameEn: "Dumbbell Row", muscleGroup: "back", category: "compound", equipment: "dumbbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "cable-row", name: "Remo en polea sentado", nameEn: "Seated Cable Row", muscleGroup: "back", category: "compound", equipment: "cable", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "t-bar-row", name: "Remo T-Bar", nameEn: "T-Bar Row", muscleGroup: "back", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "face-pull", name: "Face pull", nameEn: "Face Pull", muscleGroup: "back", category: "isolation", equipment: "cable", isLowerBody: false },

  // ── Shoulders ───────────────────────────────────────────────────────────────
  { slug: "overhead-press", name: "Press militar", nameEn: "Overhead Press", muscleGroup: "shoulders", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "vertical_push" },
  { slug: "dumbbell-shoulder-press", name: "Press de hombro con mancuernas", nameEn: "Dumbbell Shoulder Press", muscleGroup: "shoulders", category: "compound", equipment: "dumbbell", isLowerBody: false, primaryMovementPattern: "vertical_push" },
  { slug: "lateral-raise", name: "Elevaciones laterales", nameEn: "Lateral Raise", muscleGroup: "shoulders", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "rear-delt-fly", name: "Pájaros", nameEn: "Rear Delt Fly", muscleGroup: "shoulders", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "arnold-press", name: "Press Arnold", nameEn: "Arnold Press", muscleGroup: "shoulders", category: "compound", equipment: "dumbbell", isLowerBody: false },
  { slug: "upright-row", name: "Remo al mentón", nameEn: "Upright Row", muscleGroup: "shoulders", category: "compound", equipment: "barbell", isLowerBody: false },

  // ── Biceps ──────────────────────────────────────────────────────────────────
  { slug: "barbell-curl", name: "Curl con barra", nameEn: "Barbell Curl", muscleGroup: "biceps", category: "isolation", equipment: "barbell", isLowerBody: false },
  { slug: "dumbbell-curl", name: "Curl con mancuernas", nameEn: "Dumbbell Curl", muscleGroup: "biceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "hammer-curl", name: "Curl martillo", nameEn: "Hammer Curl", muscleGroup: "biceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "preacher-curl", name: "Curl predicador", nameEn: "Preacher Curl", muscleGroup: "biceps", category: "isolation", equipment: "barbell", isLowerBody: false },
  { slug: "cable-curl", name: "Curl en polea", nameEn: "Cable Curl", muscleGroup: "biceps", category: "isolation", equipment: "cable", isLowerBody: false },

  // ── Triceps ─────────────────────────────────────────────────────────────────
  { slug: "close-grip-bench", name: "Press banca agarre cerrado", nameEn: "Close-Grip Bench Press", muscleGroup: "triceps", category: "compound", equipment: "barbell", isLowerBody: false },
  { slug: "tricep-pushdown", name: "Pushdown de tríceps", nameEn: "Tricep Pushdown", muscleGroup: "triceps", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "skull-crusher", name: "Press francés", nameEn: "Skull Crusher", muscleGroup: "triceps", category: "isolation", equipment: "barbell", isLowerBody: false },
  { slug: "dips", name: "Fondos en paralelas", nameEn: "Dips", muscleGroup: "triceps", category: "compound", equipment: "bodyweight", isLowerBody: false },
  { slug: "overhead-tricep-extension", name: "Extensión tríceps sobre cabeza", nameEn: "Overhead Tricep Extension", muscleGroup: "triceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // ── Quads ───────────────────────────────────────────────────────────────────
  { slug: "back-squat", name: "Sentadilla trasera", nameEn: "Back Squat", muscleGroup: "quads", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "squat" },
  { slug: "front-squat", name: "Sentadilla frontal", nameEn: "Front Squat", muscleGroup: "quads", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "squat" },
  { slug: "leg-press", name: "Prensa de piernas", nameEn: "Leg Press", muscleGroup: "quads", category: "compound", equipment: "machine", isLowerBody: true },
  { slug: "bulgarian-split-squat", name: "Sentadilla búlgara", nameEn: "Bulgarian Split Squat", muscleGroup: "quads", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "lunge" },
  { slug: "leg-extension", name: "Extensión de pierna", nameEn: "Leg Extension", muscleGroup: "quads", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "walking-lunge", name: "Zancadas caminando", nameEn: "Walking Lunge", muscleGroup: "quads", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "lunge" },
  { slug: "hack-squat", name: "Hack squat", nameEn: "Hack Squat", muscleGroup: "quads", category: "compound", equipment: "machine", isLowerBody: true },

  // ── Hamstrings ──────────────────────────────────────────────────────────────
  { slug: "romanian-deadlift", name: "Peso muerto rumano", nameEn: "Romanian Deadlift", muscleGroup: "hamstrings", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "leg-curl", name: "Curl de pierna", nameEn: "Leg Curl", muscleGroup: "hamstrings", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "nordic-curl", name: "Nordic curl", nameEn: "Nordic Curl", muscleGroup: "hamstrings", category: "isolation", equipment: "bodyweight", isLowerBody: true },
  { slug: "good-morning", name: "Buenos días", nameEn: "Good Morning", muscleGroup: "hamstrings", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },

  // ── Glutes ──────────────────────────────────────────────────────────────────
  { slug: "hip-thrust", name: "Hip thrust", nameEn: "Hip Thrust", muscleGroup: "glutes", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "glute-bridge", name: "Puente de glúteo", nameEn: "Glute Bridge", muscleGroup: "glutes", category: "compound", equipment: "bodyweight", isLowerBody: true },
  { slug: "cable-kickback", name: "Patada de glúteo en polea", nameEn: "Cable Kickback", muscleGroup: "glutes", category: "isolation", equipment: "cable", isLowerBody: true },
  { slug: "sumo-deadlift", name: "Peso muerto sumo", nameEn: "Sumo Deadlift", muscleGroup: "glutes", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },

  // ── Core ────────────────────────────────────────────────────────────────────
  { slug: "plank", name: "Plancha", nameEn: "Plank", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "crunch", name: "Crunch abdominal", nameEn: "Crunch", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "hanging-leg-raise", name: "Elevación de piernas colgado", nameEn: "Hanging Leg Raise", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "ab-wheel", name: "Rueda abdominal", nameEn: "Ab Wheel Rollout", muscleGroup: "core", category: "compound", equipment: "other", isLowerBody: false },
  { slug: "russian-twist", name: "Giro ruso", nameEn: "Russian Twist", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "rotation" },
  { slug: "cable-crunch", name: "Crunch en polea", nameEn: "Cable Crunch", muscleGroup: "core", category: "isolation", equipment: "cable", isLowerBody: false },

  // ── Calves ──────────────────────────────────────────────────────────────────
  { slug: "standing-calf-raise", name: "Elevación de talón de pie", nameEn: "Standing Calf Raise", muscleGroup: "calves", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "seated-calf-raise", name: "Elevación de talón sentado", nameEn: "Seated Calf Raise", muscleGroup: "calves", category: "isolation", equipment: "machine", isLowerBody: true },

  // ── Forearms ────────────────────────────────────────────────────────────────
  { slug: "wrist-curl", name: "Curl de muñeca", nameEn: "Wrist Curl", muscleGroup: "forearms", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "farmers-carry", name: "Farmer's walk", nameEn: "Farmer's Carry", muscleGroup: "forearms", category: "compound", equipment: "dumbbell", isLowerBody: false, primaryMovementPattern: "carry" },

  // ── Full body / Plyometric ──────────────────────────────────────────────────
  { slug: "clean-and-jerk", name: "Clean & jerk", nameEn: "Clean and Jerk", muscleGroup: "full_body", category: "compound", equipment: "barbell", isLowerBody: true },
  { slug: "snatch", name: "Arranque", nameEn: "Snatch", muscleGroup: "full_body", category: "compound", equipment: "barbell", isLowerBody: true },
  { slug: "kettlebell-swing", name: "Kettlebell swing", nameEn: "Kettlebell Swing", muscleGroup: "full_body", category: "compound", equipment: "kettlebell", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "burpee", name: "Burpee", nameEn: "Burpee", muscleGroup: "full_body", category: "plyometric", equipment: "bodyweight", isLowerBody: true },
  { slug: "box-jump", name: "Box jump", nameEn: "Box Jump", muscleGroup: "quads", category: "plyometric", equipment: "other", isLowerBody: true },
];

export const EXERCISES_BY_MUSCLE = EXERCISES_SEED.reduce<
  Record<string, ExerciseSeed[]>
>((acc, ex) => {
  if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
  acc[ex.muscleGroup].push(ex);
  return acc;
}, {});

export const EXERCISE_BY_SLUG: Record<string, ExerciseSeed> =
  EXERCISES_SEED.reduce<Record<string, ExerciseSeed>>((acc, ex) => {
    acc[ex.slug] = ex;
    return acc;
  }, {});
