import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkoutSet {
  weight: number;
  reps: number;
  rpe?: number;
}

interface ExerciseLog {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  notes?: string;
}

interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  duration: number;
  exercises: ExerciseLog[];
  totalVolume: number;
  prsHit: number;
}

interface PersonalRecord {
  exercise: string;
  oneRM: number;
  fiveRM: number;
  tenRM: number;
  date: string;
}

interface BodyMetric {
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  armLeft?: number;
  armRight?: number;
  thighLeft?: number;
  thighRight?: number;
}

interface WeightEntry {
  date: string;
  weight: number;
}

interface StepEntry {
  date: string;
  steps: number;
}

export interface PlanExercise {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
}

export interface EnginePlanDay {
  day: string;
  type: "Push" | "Pull" | "Legs" | "Rest";
  exercises: PlanExercise[];
}

export interface TonelagePoint {
  week: string;
  volume: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `S${week}`;
}

// ─── State ───────────────────────────────────────────────────────────────────

interface FitnessState {
  workouts: WorkoutSession[];
  personalRecords: PersonalRecord[];
  bodyMetrics: BodyMetric[];
  weightLog: WeightEntry[];
  stepsLog: StepEntry[];
  weeklyPlan: EnginePlanDay[];
  totalWorkouts: number;
  currentWeekWorkouts: number;
  weeklyVolume: Record<string, number>;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Lifecycle
  initialize: () => Promise<void>;

  // Workouts
  addWorkout: (workout: Omit<WorkoutSession, "id">) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;

  // Personal records
  updatePR: (pr: PersonalRecord) => Promise<void>;

  // Body metrics
  addBodyMetric: (metric: BodyMetric) => Promise<void>;

  // Weight tracking
  addWeight: (entry: WeightEntry) => Promise<void>;

  // Steps tracking
  addSteps: (entry: StepEntry) => Promise<void>;

  // Weekly plan
  saveWeeklyPlanDay: (dayOfWeek: number, planDay: EnginePlanDay) => Promise<void>;

  // Derived tonelage history from stored workouts
  getTonelageHistory: () => Record<string, TonelagePoint[]>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFitnessStore = create<FitnessState>((set, get) => ({
  workouts: [],
  personalRecords: [],
  bodyMetrics: [],
  weightLog: [],
  stepsLog: [],
  weeklyPlan: [],
  totalWorkouts: 0,
  currentWeekWorkouts: 0,
  weeklyVolume: {},
  isLoaded: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const [workouts, personalRecords, bodyMetrics, weightLog, stepsLog, stats, weeklyPlanRows] =
        await Promise.all([
          api.get<WorkoutSession[]>("/fitness/workouts"),
          api.get<PersonalRecord[]>("/fitness/personal-records"),
          api.get<BodyMetric[]>("/fitness/body-metrics"),
          api.get<WeightEntry[]>("/fitness/weight?days=30"),
          api.get<StepEntry[]>("/fitness/steps?days=7"),
          api.get<{ totalWorkouts: number; currentWeekWorkouts: number; weeklyVolume: Record<string, number> }>("/fitness/stats"),
          api.get<{ dayOfWeek: number; exercises: PlanExercise[] }[]>("/fitness/weekly-plan"),
        ]);

      // Reconstruct EnginePlanDay[] from saved rows (only if rows exist)
      let weeklyPlan: EnginePlanDay[] = [];
      if ((weeklyPlanRows as { dayOfWeek: number; exercises: PlanExercise[] }[]).length > 0) {
        weeklyPlan = (weeklyPlanRows as { dayOfWeek: number; exercises: PlanExercise[] }[]).map(
          (r) => ({
            // dayOfWeek stored but day/type not persisted — use placeholder, page will merge with WEEKLY_PLAN_DEFAULT
            day: "",
            type: "Rest" as const,
            exercises: r.exercises,
            _dayOfWeek: r.dayOfWeek,
          })
        ) as unknown as EnginePlanDay[];
      }

      set({
        workouts,
        personalRecords,
        bodyMetrics,
        weightLog,
        stepsLog,
        weeklyPlan,
        totalWorkouts: stats.totalWorkouts,
        currentWeekWorkouts: stats.currentWeekWorkouts,
        weeklyVolume: stats.weeklyVolume,
        isLoaded: true,
        isLoading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar fitness";
      set({ error: msg, isLoading: false, isLoaded: true });
    }
  },

  addWorkout: async (workoutData) => {
    const created = await api.post<WorkoutSession>("/fitness/workouts", workoutData);
    set((state) => ({
      workouts: [created, ...state.workouts],
      totalWorkouts: state.totalWorkouts + 1,
      currentWeekWorkouts: state.currentWeekWorkouts + 1,
    }));
  },

  deleteWorkout: async (id) => {
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== id),
      totalWorkouts: Math.max(0, state.totalWorkouts - 1),
    }));
    await api.delete(`/fitness/workouts/${id}`);
  },

  updatePR: async (pr) => {
    const updated = await api.put<PersonalRecord>("/fitness/personal-records", pr);
    set((state) => ({
      personalRecords: state.personalRecords.some((p) => p.exercise === pr.exercise)
        ? state.personalRecords.map((p) => (p.exercise === pr.exercise ? updated : p))
        : [...state.personalRecords, updated],
    }));
  },

  addBodyMetric: async (metric) => {
    await api.post("/fitness/body-metrics", metric);
    set((state) => ({ bodyMetrics: [metric, ...state.bodyMetrics] }));
  },

  addWeight: async (entry) => {
    await api.post("/fitness/weight", entry);
    set((state) => ({ weightLog: [...state.weightLog, entry] }));
  },

  addSteps: async (entry) => {
    await api.post("/fitness/steps", entry);
    set((state) => ({ stepsLog: [...state.stepsLog, entry] }));
  },

  saveWeeklyPlanDay: async (dayOfWeek, planDay) => {
    await api.put("/fitness/weekly-plan", { dayOfWeek, exercises: planDay.exercises });
  },

  getTonelageHistory: () => {
    const { workouts } = get();
    const byExercise: Record<string, Record<string, number>> = {};

    for (const workout of workouts) {
      const weekLabel = getWeekLabel(workout.date);
      for (const ex of workout.exercises) {
        if (!byExercise[ex.exerciseName]) byExercise[ex.exerciseName] = {};
        const vol = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
        byExercise[ex.exerciseName][weekLabel] =
          (byExercise[ex.exerciseName][weekLabel] ?? 0) + vol;
      }
    }

    const result: Record<string, TonelagePoint[]> = {};
    for (const [exercise, weekMap] of Object.entries(byExercise)) {
      result[exercise] = Object.entries(weekMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, volume]) => ({ week, volume: Math.round(volume) }));
    }
    return result;
  },
}));
