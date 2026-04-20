import { create } from "zustand";
import { api } from "@/lib/api-client";

interface MoodLog {
  id: string;
  date: string;
  mood: number;
  emotions: string[];
  factors: string[];
  notes: string | null;
}

interface SleepLog {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  durationHours: number;
  dreamJournal: string | null;
  factors: string[];
}

interface WellnessState {
  moodLogs: MoodLog[];
  sleepLogs: SleepLog[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  savingMood: boolean;
  savingSleep: boolean;

  initialize: () => Promise<void>;
  saveMoodToday: (mood: number, factors: string[], notes: string) => Promise<void>;
  saveSleepToday: (
    bedtime: string,
    wakeTime: string,
    quality: number,
    durationHours: number,
    dreamJournal: string,
    date?: string
  ) => Promise<void>;
  deleteSleepLog: (id: string) => Promise<void>;
}

export const useWellnessStore = create<WellnessState>((set, get) => ({
  moodLogs: [],
  sleepLogs: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  clearError: () => set({ error: null }),
  savingMood: false,
  savingSleep: false,

  initialize: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true, error: null });
    try {
      const [moodLogs, sleepLogs] = await Promise.all([
        api.get<MoodLog[]>("/wellness/mood?days=30"),
        api.get<SleepLog[]>("/wellness/sleep?days=30"),
      ]);
      set({ moodLogs, sleepLogs, isLoaded: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar wellness";
      set({ error: msg, isLoading: false });
    }
  },

  saveMoodToday: async (mood, factors, notes) => {
    set({ savingMood: true });
    try {
      const log = await api.post<MoodLog>("/wellness/mood", {
        mood,
        factors,
        notes,
        date: new Date().toISOString().split("T")[0],
      });
      set((state) => ({
        moodLogs: [
          log,
          ...state.moodLogs.filter((l) => l.date !== log.date),
        ],
        savingMood: false,
      }));
    } catch (e) {
      set({ savingMood: false });
      throw e;
    }
  },

  saveSleepToday: async (bedtime, wakeTime, quality, durationHours, dreamJournal, date) => {
    set({ savingSleep: true });
    try {
      const targetDate = date ?? new Date().toISOString().split("T")[0];
      const log = await api.post<SleepLog>("/wellness/sleep", {
        bedtime,
        wakeTime,
        quality,
        durationHours,
        dreamJournal,
        date: targetDate,
      });
      set((state) => ({
        sleepLogs: [
          log,
          ...state.sleepLogs.filter((l) => l.date !== log.date),
        ],
        savingSleep: false,
      }));
    } catch (e) {
      set({ savingSleep: false });
      throw e;
    }
  },

  deleteSleepLog: async (id) => {
    await api.delete(`/wellness/sleep?id=${id}`);
    set((state) => ({
      sleepLogs: state.sleepLogs.filter((l) => l.id !== id),
    }));
  },
}));
