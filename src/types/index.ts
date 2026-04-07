/**
 * Ultimate Habit Tracker — TypeScript Type Definitions
 */

// ─── Core Types ───────────────────────────────────────────────────────────────

export type TimeOfDay = "morning" | "afternoon" | "evening" | "all";

export type AreaKey =
  | "vision"
  | "plan"
  | "productivity"
  | "organization"
  | "finance"
  | "fitness"
  | "nutrition"
  | "wellness";

export interface LifeAreaScore {
  key: AreaKey;
  name: string;
  icon: string;
  score: number;
  lastWeek: number;
  color: string;
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  timeOfDay: TimeOfDay;
  frequency: "daily" | "weekly" | "custom";
  targetDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  streakCurrent: number;
  streakBest: number;
  strength: number; // 0-100
  isActive: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

// ─── Fitness ──────────────────────────────────────────────────────────────────

export type MuscleGroup =
  | "Pecho"
  | "Espalda"
  | "Hombros"
  | "Bíceps"
  | "Tríceps"
  | "Cuádriceps"
  | "Isquiotibiales"
  | "Glúteos"
  | "Core"
  | "Pantorrillas";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: "compound" | "isolation" | "cardio";
  equipment: string;
}

export interface WorkoutSet {
  setNumber: number;
  weight: number; // kg
  reps: number;
  rpe: number; // 1-10
  isPR: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
  lastSessionWeight?: number;
  lastSessionReps?: number;
  currentPR?: number;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  totalVolume: number;
  notes?: string;
  completed: boolean;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
  changeFromLastMonth: number;
}

export interface BodyMetric {
  id: string;
  date: string;
  type: string; // weight, bodyFat, chest, waist, etc.
  value: number;
  unit: string;
  method?: string;
}

export interface BioimpedanceData {
  date: string;
  waterPercent: number;
  muscleMass: number;
  boneMass: number;
  visceralFat: number;
  bmr: number;
  metabolicAge: number;
  proteinPercent?: number;
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  paymentMethod?: string;
  description: string;
  isRecurring: boolean;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  category: string;
  limit: number;
  spent: number;
}

// ─── Wellness ─────────────────────────────────────────────────────────────────

export interface MoodLog {
  id: string;
  date: string;
  mood: number; // 1-10
  emotions: string[];
  factors: string[];
  notes?: string;
}

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  quality: number; // 1-10
  durationHours: number;
  dreams?: string;
  factors: string[];
}

// ─── Planner ──────────────────────────────────────────────────────────────────

export interface TimeBlock {
  id: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  category?: string;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  topPriorities: string[];
  timeBlocks: TimeBlock[];
  rating?: number; // 1-10
  notes?: string;
}

// ─── Summaries ────────────────────────────────────────────────────────────────

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  lifeScore: number;
  lifeScoreChange: number;
  topAchievements: string[];
  focusAreaNextWeek: string;
  habitCompletionRate: number;
  longestStreak: { habit: string; days: number };
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  lifeScoreStart: number;
  lifeScoreEnd: number;
  overallChange: number;
  fitness: {
    prsHit: { exercise: string; change: string }[];
    plateaus: string[];
    avgWeeklyVolume: number;
    volumeChange: number;
    trainingDays: number;
    trainingDaysPlanned: number;
    weightChange: number;
    bodyFatChange: number;
  };
  finance: {
    totalIncome: number;
    incomeChange: number;
    topExpenseCategories: { category: string; amount: number; change: number }[];
    netSavings: number;
    budgetAdherence: number;
  };
  nutrition: {
    mealPlanAdherence: number;
    avgHydration: number;
    hydrationChange: number;
    bodyFatChange: number;
  };
  productivity: {
    habitCompletionRate: number;
    completionChange: number;
    bestStreak: { habit: string; days: number };
    pomodorosCompleted: number;
    tasksCompleted: number;
  };
  wellness: {
    avgSleepQuality: number;
    sleepChange: number;
    avgMood: number;
    moodChange: number;
    journalingDays: number;
    correlations: string[];
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  createdAt: string;
  settings: {
    units: "metric" | "imperial";
    language: "es" | "en" | "pt";
    theme: "warm" | "dark" | "light";
    lifeScoreWeights: Record<AreaKey, number>;
    weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
    stepsGoal: number;
    waterGoal: number; // liters
    sleepGoal: number; // hours
  };
}
