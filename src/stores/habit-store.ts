import { create } from "zustand";
import type { Habit, HabitLog } from "@/types";
import { api } from "@/lib/api-client";

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  // Lifecycle
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Actions
  toggleHabitToday: (habitId: string) => Promise<void>;
  toggleHabitDate: (habitId: string, date: string) => Promise<void>;
  addHabit: (habit: Omit<Habit, "id" | "streakCurrent" | "streakBest" | "strength" | "createdAt">) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;

  // Computed helpers (work on local state)
  getTodayLogs: () => HabitLog[];
  getHabitLogs: (habitId: string, days?: number) => HabitLog[];
  getCompletionRate: (days: number) => number;
  getHeatmapData: (days?: number) => { date: string; completed: number; total: number; level: number }[];
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  clearError: () => set({ error: null }),

  initialize: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const [habits, logs] = await Promise.all([
        api.get<Habit[]>("/habits"),
        api.get<HabitLog[]>("/habits/logs?days=90"),
      ]);
      set({ habits, logs, isLoaded: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar hábitos";
      set({ error: msg, isLoading: false });
    }
  },

  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const [habits, logs] = await Promise.all([
        api.get<Habit[]>("/habits"),
        api.get<HabitLog[]>("/habits/logs?days=90"),
      ]);
      set({ habits, logs, isLoaded: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar hábitos";
      set({ error: msg, isLoading: false });
    }
  },

  toggleHabitToday: async (habitId) => {
    const today = new Date().toISOString().split("T")[0];
    const { logs } = get();

    // Optimistic update
    const existingLog = logs.find((l) => l.habitId === habitId && l.date === today);
    const newCompleted = existingLog ? !existingLog.completed : true;

    if (existingLog) {
      set((state) => ({
        logs: state.logs.map((l) =>
          l.habitId === habitId && l.date === today
            ? { ...l, completed: newCompleted }
            : l
        ),
      }));
    } else {
      set((state) => ({
        logs: [
          ...state.logs,
          { id: `temp-${habitId}-${today}`, habitId, date: today, completed: true },
        ],
      }));
    }

    try {
      const prevStreak = get().habits.find((h) => h.id === habitId)?.streakCurrent ?? 0;

      const result = await api.post<{ log: HabitLog; habit: Habit }>(
        `/habits/${habitId}/logs`,
        { date: today, completed: newCompleted }
      );

      // Replace optimistic log with server log, and update habit streaks
      set((state) => ({
        logs: [
          ...state.logs.filter((l) => !(l.habitId === habitId && l.date === today)),
          result.log,
        ],
        habits: state.habits.map((h) =>
          h.id === habitId ? { ...h, ...result.habit } : h
        ),
      }));

      // Celebrate streak milestones (7, 30, 100, 365)
      const newStreak = result.habit.streakCurrent ?? 0;
      const milestones = [7, 30, 100, 365];
      for (const m of milestones) {
        if (prevStreak < m && newStreak >= m) {
          const { fireConfettiStreak } = await import("@/lib/celebrations/confetti");
          fireConfettiStreak(m);
          const { toast } = await import("sonner");
          toast.success(
            m === 365
              ? `🏆 ¡Un año completo! Racha de ${m} días`
              : m >= 100
              ? `💎 ¡${m} días consecutivos! Leyenda.`
              : m >= 30
              ? `🔥 ¡${m} días! Hábito arraigado.`
              : `✨ ¡${m} días seguidos! Buen ritmo.`
          );
          break;
        }
      }
    } catch (e) {
      // Rollback optimistic update
      if (existingLog) {
        set((state) => ({
          logs: state.logs.map((l) =>
            l.habitId === habitId && l.date === today ? existingLog : l
          ),
        }));
      } else {
        set((state) => ({
          logs: state.logs.filter((l) => !(l.habitId === habitId && l.date === today)),
        }));
      }
    }
  },

  toggleHabitDate: async (habitId, date) => {
    const { logs } = get();
    const existingLog = logs.find((l) => l.habitId === habitId && l.date === date);
    const newCompleted = existingLog ? !existingLog.completed : true;

    // Optimistic update
    if (existingLog) {
      set((state) => ({
        logs: state.logs.map((l) =>
          l.habitId === habitId && l.date === date ? { ...l, completed: newCompleted } : l
        ),
      }));
    } else {
      set((state) => ({
        logs: [...state.logs, { id: `temp-${habitId}-${date}`, habitId, date, completed: true }],
      }));
    }

    try {
      const result = await api.post<{ log: HabitLog; habit: Habit }>(
        `/habits/${habitId}/logs`,
        { date, completed: newCompleted }
      );
      set((state) => ({
        logs: [
          ...state.logs.filter((l) => !(l.habitId === habitId && l.date === date)),
          result.log,
        ],
        habits: state.habits.map((h) => h.id === habitId ? { ...h, ...result.habit } : h),
      }));
    } catch {
      if (existingLog) {
        set((state) => ({
          logs: state.logs.map((l) => l.habitId === habitId && l.date === date ? existingLog : l),
        }));
      } else {
        set((state) => ({
          logs: state.logs.filter((l) => !(l.habitId === habitId && l.date === date)),
        }));
      }
    }
  },

  addHabit: async (habitData) => {
    const created = await api.post<Habit>("/habits", habitData);
    set((state) => ({ habits: [...state.habits, created] }));
  },

  removeHabit: async (habitId) => {
    // Optimistic
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
      logs: state.logs.filter((l) => l.habitId !== habitId),
    }));
    await api.delete(`/habits/${habitId}`);
  },

  getTodayLogs: () => {
    const today = new Date().toISOString().split("T")[0];
    return get().logs.filter((l) => l.date === today);
  },

  getHabitLogs: (habitId, days = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return get().logs.filter((l) => l.habitId === habitId && l.date >= cutoffStr);
  },

  getCompletionRate: (days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const relevantLogs = get().logs.filter((l) => l.date >= cutoffStr);
    if (relevantLogs.length === 0) return 0;
    const completed = relevantLogs.filter((l) => l.completed).length;
    return Math.round((completed / relevantLogs.length) * 100);
  },

  getHeatmapData: (days = 90) => {
    const { habits, logs } = get();
    const today = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLogs = logs.filter((l) => l.date === dateStr);
      const completed = dayLogs.filter((l) => l.completed).length;
      const total = habits.length;
      const ratio = total > 0 ? completed / total : 0;
      const level =
        ratio >= 0.9 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.4 ? 2 : ratio > 0 ? 1 : 0;
      data.push({ date: dateStr, completed, total, level });
    }

    return data;
  },
}));
