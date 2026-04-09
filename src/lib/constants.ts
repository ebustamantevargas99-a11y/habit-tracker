/**
 * Ultimate Habit Tracker — Constants & Configuration
 */

// ─── Navigation Items ─────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  {
    key: "home",
    label: "Inicio",
    icon: "Home",
    sections: [],
  },
  {
    key: "plan",
    label: "Calendar",
    icon: "Calendar",
    sections: [
      "Calendar",
      "Daily Planner",
      "Weekly Planner",
      "Monthly Planner",
      "Quarterly Planner",
      "Yearly Planner",
    ],
  },
  {
    key: "productivity",
    label: "Productividad",
    icon: "Zap",
    sections: [
      "Operations Center",
      "Habit Tracker",
      "Project Management",
      "Pomodoro",
      "Dashboard KPIs",
    ],
  },
  {
    key: "finance",
    label: "Finanzas",
    icon: "DollarSign",
    sections: [
      "Income",
      "Expenses",
      "Budget Tracker",
      "Bills",
      "Subscriptions",
      "Wishlist",
    ],
  },
  {
    key: "fitness",
    label: "Fitness",
    icon: "Dumbbell",
    sections: [
      "Workout Tracker",
      "Volume Tracker",
      "Workout Plan",
      "PR Board",
      "Body Metrics",
      "Weight Tracker",
      "Steps",
      "Fasting",
    ],
  },
  {
    key: "nutrition",
    label: "Nutrición",
    icon: "UtensilsCrossed",
    sections: [
      "Recipe Book",
      "Meal Planner",
      "Grocery List",
      "Kitchen Conversions",
    ],
  },
  {
    key: "wellness",
    label: "Bienestar",
    icon: "Heart",
    sections: [
      "Sleep Tracker",
      "Hydration",
      "Medication",
      "Menstrual Cycle",
      "Health Log",
    ],
  },
  {
    key: "settings",
    label: "Configuración",
    icon: "Settings",
    sections: [
      "Perfil",
      "Gamificación",
      "Preferencias",
      "Datos",
    ],
  },
] as const;

export type PageKey = (typeof NAV_ITEMS)[number]["key"];

// ─── Life Score Weights ───────────────────────────────────────────────────────
export const LIFE_SCORE_WEIGHTS = {
  plan: 0.10,
  productivity: 0.15,
  finance: 0.15,
  fitness: 0.15,
  nutrition: 0.12,
  wellness: 0.15,
} as const;

// ─── Muscle Volume Landmarks (series/week) ────────────────────────────────────
export const VOLUME_LANDMARKS = {
  Pecho: { mv: 6, mev: 8, mavLow: 12, mavHigh: 20, mrv: 22 },
  Espalda: { mv: 6, mev: 8, mavLow: 14, mavHigh: 22, mrv: 25 },
  "Hombros (lateral)": { mv: 6, mev: 8, mavLow: 16, mavHigh: 22, mrv: 26 },
  Bíceps: { mv: 4, mev: 6, mavLow: 14, mavHigh: 20, mrv: 22 },
  Tríceps: { mv: 4, mev: 6, mavLow: 10, mavHigh: 16, mrv: 18 },
  Cuádriceps: { mv: 6, mev: 8, mavLow: 12, mavHigh: 18, mrv: 20 },
  Isquiotibiales: { mv: 4, mev: 6, mavLow: 10, mavHigh: 16, mrv: 18 },
  Glúteos: { mv: 4, mev: 6, mavLow: 12, mavHigh: 16, mrv: 20 },
  Core: { mv: 0, mev: 4, mavLow: 8, mavHigh: 12, mrv: 16 },
  Pantorrillas: { mv: 6, mev: 8, mavLow: 12, mavHigh: 16, mrv: 20 },
} as const;

// ─── Rest Timer Presets ───────────────────────────────────────────────────────
export const REST_TIMER_PRESETS = [30, 60, 90, 120, 180] as const;

// ─── Motivational Quotes (Spanish) ────────────────────────────────────────────
export const QUOTES = [
  {
    text: "No tienes que ser genial para empezar, pero tienes que empezar para ser genial.",
    author: "Zig Ziglar",
  },
  {
    text: "Somos lo que hacemos repetidamente. La excelencia no es un acto sino un hábito.",
    author: "Aristóteles",
  },
  {
    text: "Cada acción que tomas es un voto por la persona en la que te quieres convertir.",
    author: "James Clear",
  },
  {
    text: "El secreto del cambio es concentrar toda tu energía no en luchar contra lo viejo, sino en construir lo nuevo.",
    author: "Sócrates",
  },
  {
    text: "La disciplina es elegir entre lo que quieres ahora y lo que más quieres.",
    author: "Abraham Lincoln",
  },
  {
    text: "No cuentes los días, haz que los días cuenten.",
    author: "Muhammad Ali",
  },
  {
    text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    author: "Robert Collier",
  },
  {
    text: "Primero hacemos nuestros hábitos, y luego nuestros hábitos nos hacen a nosotros.",
    author: "John Dryden",
  },
  {
    text: "La constancia es la virtud por la que todas las otras virtudes dan fruto.",
    author: "Arturo Graf",
  },
  {
    text: "Un viaje de mil millas comienza con un solo paso.",
    author: "Lao Tzu",
  },
] as const;

// ─── XP System ────────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  completeHabit: 5,
  completeAllDaily: 20,
  streak7: 50,
  streak30: 200,
  logWorkout: 15,
  monthAt90: 500,
  lifeScoreUp10: 300,
} as const;

export const LEVELS = [
  { level: 1, name: "Principiante", xpRequired: 0 },
  { level: 2, name: "Explorador", xpRequired: 100 },
  { level: 3, name: "Consistente", xpRequired: 300 },
  { level: 4, name: "Dedicado", xpRequired: 600 },
  { level: 5, name: "Imparable", xpRequired: 1000 },
  { level: 6, name: "Maestro", xpRequired: 2000 },
  { level: 7, name: "Legendario", xpRequired: 5000 },
  { level: 8, name: "Elite", xpRequired: 10000 },
  { level: 9, name: "Champion", xpRequired: 20000 },
  { level: 10, name: "Ultimate", xpRequired: 50000 },
] as const;
