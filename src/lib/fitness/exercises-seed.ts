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

  // ── Variantes frecuentes (calistenia, asistidos, cable) ──────────────────────
  { slug: "weighted-pull-up", name: "Dominadas lastradas", nameEn: "Weighted Pull-Up", muscleGroup: "back", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "assisted-pull-up", name: "Dominadas asistidas", nameEn: "Assisted Pull-Up", muscleGroup: "back", category: "compound", equipment: "machine", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "neutral-pull-up", name: "Dominadas neutras", nameEn: "Neutral-Grip Pull-Up", muscleGroup: "back", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "unilateral-pulldown", name: "Jalón unilateral", nameEn: "Unilateral Lat Pulldown", muscleGroup: "back", category: "compound", equipment: "cable", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "cable-pullover", name: "Pullover en polea", nameEn: "Cable Pullover", muscleGroup: "back", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "chest-supported-row", name: "Remo pecho apoyado", nameEn: "Chest-Supported Row", muscleGroup: "back", category: "compound", equipment: "machine", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "unilateral-row", name: "Remo unilateral", nameEn: "Unilateral Row", muscleGroup: "back", category: "compound", equipment: "dumbbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "reverse-pec-deck", name: "Reverse pec deck", nameEn: "Reverse Pec Deck", muscleGroup: "shoulders", category: "isolation", equipment: "machine", isLowerBody: false },
  { slug: "cable-lateral-raise", name: "Elevaciones laterales en cable", nameEn: "Cable Lateral Raise", muscleGroup: "shoulders", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "incline-curl", name: "Curl inclinado", nameEn: "Incline Dumbbell Curl", muscleGroup: "biceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "triceps-extension", name: "Extensión tríceps", nameEn: "Triceps Extension", muscleGroup: "triceps", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "woodchopper", name: "Woodchoppers", nameEn: "Cable Woodchopper", muscleGroup: "core", category: "isolation", equipment: "cable", isLowerBody: false, primaryMovementPattern: "rotation" },
  { slug: "weighted-plank", name: "Plancha lastrada", nameEn: "Weighted Plank", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },

  // ── Fase B: expansión a ~150 ejercicios ──────────────────────────────────────

  // Chest — variantes
  { slug: "decline-bench-press", name: "Press declinado", nameEn: "Decline Bench Press", muscleGroup: "chest", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "incline-dumbbell-press", name: "Press inclinado con mancuernas", nameEn: "Incline Dumbbell Press", muscleGroup: "chest", category: "compound", equipment: "dumbbell", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "machine-fly", name: "Pec deck / contractor", nameEn: "Machine Fly (Pec Deck)", muscleGroup: "chest", category: "isolation", equipment: "machine", isLowerBody: false },
  { slug: "wide-push-up", name: "Flexiones con agarre ancho", nameEn: "Wide-Grip Push-Up", muscleGroup: "chest", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "pike-push-up", name: "Flexiones en pica", nameEn: "Pike Push-Up", muscleGroup: "shoulders", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "vertical_push" },
  { slug: "diamond-push-up", name: "Flexiones diamante", nameEn: "Diamond Push-Up", muscleGroup: "triceps", category: "compound", equipment: "bodyweight", isLowerBody: false, primaryMovementPattern: "horizontal_push" },
  { slug: "landmine-press", name: "Press con barra unilateral", nameEn: "Landmine Press", muscleGroup: "shoulders", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "vertical_push" },

  // Back — lats
  { slug: "close-grip-pulldown", name: "Jalón con agarre cerrado", nameEn: "Close-Grip Pulldown", muscleGroup: "back", category: "compound", equipment: "cable", isLowerBody: false, primaryMovementPattern: "vertical_pull" },
  { slug: "straight-arm-pulldown", name: "Jalón de pie (tirón recto)", nameEn: "Straight-Arm Pulldown", muscleGroup: "back", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "machine-row", name: "Remo en máquina", nameEn: "Machine Row", muscleGroup: "back", category: "compound", equipment: "machine", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "pendlay-row", name: "Remo Pendlay", nameEn: "Pendlay Row", muscleGroup: "back", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "reverse-grip-row", name: "Remo con agarre supino", nameEn: "Reverse-Grip Row", muscleGroup: "back", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "meadows-row", name: "Remo Meadows", nameEn: "Meadows Row", muscleGroup: "back", category: "compound", equipment: "barbell", isLowerBody: false, primaryMovementPattern: "horizontal_pull" },
  { slug: "dumbbell-pullover", name: "Pullover con mancuerna", nameEn: "Dumbbell Pullover", muscleGroup: "back", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // Back — traps
  { slug: "barbell-shrug", name: "Encogimiento con barra", nameEn: "Barbell Shrug", muscleGroup: "back", category: "isolation", equipment: "barbell", isLowerBody: false },
  { slug: "dumbbell-shrug", name: "Encogimiento con mancuernas", nameEn: "Dumbbell Shrug", muscleGroup: "back", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "band-pull-apart", name: "Band pull apart", nameEn: "Band Pull-Apart", muscleGroup: "shoulders", category: "isolation", equipment: "band", isLowerBody: false },
  { slug: "ytw-raise", name: "Elevaciones Y-T-W", nameEn: "Y-T-W Raise", muscleGroup: "back", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // Back — lower back
  { slug: "back-extension", name: "Hiperextensión de espalda", nameEn: "Back Extension", muscleGroup: "back", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "reverse-hyper", name: "Hiperextensión reversa", nameEn: "Reverse Hyperextension", muscleGroup: "back", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "superman-hold", name: "Superman", nameEn: "Superman Hold", muscleGroup: "back", category: "isolation", equipment: "bodyweight", isLowerBody: false },

  // Shoulders — anterior
  { slug: "dumbbell-front-raise", name: "Elevación frontal con mancuernas", nameEn: "Dumbbell Front Raise", muscleGroup: "shoulders", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "cable-front-raise", name: "Elevación frontal en cable", nameEn: "Cable Front Raise", muscleGroup: "shoulders", category: "isolation", equipment: "cable", isLowerBody: false },

  // Shoulders — lateral
  { slug: "machine-lateral-raise", name: "Elevaciones laterales en máquina", nameEn: "Machine Lateral Raise", muscleGroup: "shoulders", category: "isolation", equipment: "machine", isLowerBody: false },
  { slug: "seated-lateral-raise", name: "Elevaciones laterales sentado", nameEn: "Seated Lateral Raise", muscleGroup: "shoulders", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // Shoulders — posterior
  { slug: "rear-delt-row", name: "Remo para deltoide posterior", nameEn: "Rear Delt Row", muscleGroup: "shoulders", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "band-face-pull", name: "Face pull con banda", nameEn: "Band Face Pull", muscleGroup: "shoulders", category: "isolation", equipment: "band", isLowerBody: false },
  { slug: "prone-y-raise", name: "Y raises tumbado", nameEn: "Prone Y-Raise", muscleGroup: "shoulders", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // Biceps
  { slug: "ez-bar-curl", name: "Curl con barra EZ", nameEn: "EZ-Bar Curl", muscleGroup: "biceps", category: "isolation", equipment: "barbell", isLowerBody: false },
  { slug: "concentration-curl", name: "Curl concentrado", nameEn: "Concentration Curl", muscleGroup: "biceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "spider-curl", name: "Spider curl", nameEn: "Spider Curl", muscleGroup: "biceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },
  { slug: "cross-body-curl", name: "Curl transverso", nameEn: "Cross-Body Curl", muscleGroup: "biceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // Triceps
  { slug: "overhead-tricep-cable", name: "Extensión tríceps en polea sobre cabeza", nameEn: "Overhead Tricep Cable Extension", muscleGroup: "triceps", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "tricep-extension-machine", name: "Extensión tríceps en máquina", nameEn: "Tricep Extension Machine", muscleGroup: "triceps", category: "isolation", equipment: "machine", isLowerBody: false },
  { slug: "dumbbell-overhead-tricep", name: "Extensión tríceps sobre cabeza con mancuerna", nameEn: "Dumbbell Overhead Tricep Extension", muscleGroup: "triceps", category: "isolation", equipment: "dumbbell", isLowerBody: false },

  // Quads — variantes
  { slug: "goblet-squat", name: "Sentadilla copa", nameEn: "Goblet Squat", muscleGroup: "quads", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "squat" },
  { slug: "smith-squat", name: "Sentadilla en Smith", nameEn: "Smith Machine Squat", muscleGroup: "quads", category: "compound", equipment: "smith", isLowerBody: true, primaryMovementPattern: "squat" },
  { slug: "reverse-lunge", name: "Zancada reversa", nameEn: "Reverse Lunge", muscleGroup: "quads", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "lunge" },
  { slug: "box-step-up", name: "Step up al cajón", nameEn: "Box Step-Up", muscleGroup: "quads", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "lunge" },
  { slug: "sumo-squat", name: "Sentadilla sumo", nameEn: "Sumo Squat", muscleGroup: "quads", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "squat" },

  // Hamstrings — variantes
  { slug: "single-leg-rdl", name: "Peso muerto rumano unilateral", nameEn: "Single-Leg Romanian Deadlift", muscleGroup: "hamstrings", category: "compound", equipment: "dumbbell", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "prone-leg-curl", name: "Curl de pierna tumbado", nameEn: "Prone Leg Curl", muscleGroup: "hamstrings", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "seated-leg-curl", name: "Curl de pierna sentado", nameEn: "Seated Leg Curl", muscleGroup: "hamstrings", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "glute-ham-raise", name: "GHR (Glute-Ham Raise)", nameEn: "Glute-Ham Raise", muscleGroup: "hamstrings", category: "compound", equipment: "machine", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "sumo-deadlift-high-pull", name: "Peso muerto sumo con tirón", nameEn: "Sumo Deadlift High Pull", muscleGroup: "glutes", category: "compound", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },

  // Glutes — variantes
  { slug: "banded-hip-thrust", name: "Hip thrust con banda", nameEn: "Banded Hip Thrust", muscleGroup: "glutes", category: "compound", equipment: "band", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "single-leg-hip-thrust", name: "Hip thrust unilateral", nameEn: "Single-Leg Hip Thrust", muscleGroup: "glutes", category: "compound", equipment: "bodyweight", isLowerBody: true, primaryMovementPattern: "hinge" },
  { slug: "donkey-kick", name: "Patada trasera", nameEn: "Donkey Kick", muscleGroup: "glutes", category: "isolation", equipment: "bodyweight", isLowerBody: true },
  { slug: "clamshell", name: "Almeja con banda", nameEn: "Clamshell", muscleGroup: "glutes", category: "isolation", equipment: "band", isLowerBody: true },
  { slug: "hip-abduction-machine", name: "Abductora en máquina", nameEn: "Hip Abduction Machine", muscleGroup: "glutes", category: "isolation", equipment: "machine", isLowerBody: true },

  // Core — variantes
  { slug: "dead-bug", name: "Dead bug", nameEn: "Dead Bug", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "bird-dog", name: "Bird dog", nameEn: "Bird Dog", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "hollow-body-hold", name: "Hollow body", nameEn: "Hollow Body Hold", muscleGroup: "core", category: "isolation", equipment: "bodyweight", isLowerBody: false },
  { slug: "toes-to-bar", name: "Toes to bar", nameEn: "Toes-to-Bar", muscleGroup: "core", category: "compound", equipment: "bodyweight", isLowerBody: false },
  { slug: "pallof-press", name: "Press Pallof en polea", nameEn: "Pallof Press", muscleGroup: "core", category: "isolation", equipment: "cable", isLowerBody: false },
  { slug: "cable-oblique-crunch", name: "Crunch oblicuo en polea", nameEn: "Cable Oblique Crunch", muscleGroup: "core", category: "isolation", equipment: "cable", isLowerBody: false, primaryMovementPattern: "rotation" },

  // Calves — variantes
  { slug: "donkey-calf-raise", name: "Elevación de talón tipo burro", nameEn: "Donkey Calf Raise", muscleGroup: "calves", category: "isolation", equipment: "machine", isLowerBody: true },
  { slug: "smith-calf-raise", name: "Elevación de talón en Smith", nameEn: "Smith Machine Calf Raise", muscleGroup: "calves", category: "isolation", equipment: "smith", isLowerBody: true },

  // Back — lower back / hiperextensiones
  { slug: "jefferson-curl", name: "Curl de Jefferson", nameEn: "Jefferson Curl", muscleGroup: "back", category: "isolation", equipment: "barbell", isLowerBody: true, primaryMovementPattern: "hinge" },

  // Full body / potencia
  { slug: "power-clean", name: "Power clean", nameEn: "Power Clean", muscleGroup: "full_body", category: "compound", equipment: "barbell", isLowerBody: true },
  { slug: "hang-clean", name: "Hang clean", muscleGroup: "full_body", nameEn: "Hang Clean", category: "compound", equipment: "barbell", isLowerBody: true },
  { slug: "thruster", name: "Thruster", nameEn: "Thruster", muscleGroup: "full_body", category: "compound", equipment: "barbell", isLowerBody: true },
  { slug: "turkish-get-up", name: "Turkish get-up", nameEn: "Turkish Get-Up", muscleGroup: "full_body", category: "compound", equipment: "kettlebell", isLowerBody: true },
  { slug: "sled-push", name: "Empuje de trineo", nameEn: "Sled Push", muscleGroup: "full_body", category: "compound", equipment: "other", isLowerBody: true },
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
