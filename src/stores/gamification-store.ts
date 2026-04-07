import { create } from "zustand";
import { getLevelForXP } from "@/lib/gamification-utils";
import { api } from "@/lib/api-client";

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isEarned: boolean;
  earnedDate?: string;
}

interface GamificationState {
  totalXP: number;
  currentLevel: number;
  levelName: string;
  xpForNextLevel: number;
  xpProgress: number;
  badges: Badge[];
  streakInsuranceDays: number;
  streakInsuranceUsedThisWeek: number;
  isLoaded: boolean;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Keep these for backwards compat — now they call refresh() instead of mutating locally
  addXP: (amount: number, reason: string) => void;
  earnBadge: (badgeId: string) => void;
  setStreakInsurance: (days: number) => void;
  useStreakInsurance: () => boolean;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  totalXP: 0,
  currentLevel: 1,
  levelName: "Principiante",
  xpForNextLevel: 100,
  xpProgress: 0,
  badges: [],
  streakInsuranceDays: 1,
  streakInsuranceUsedThisWeek: 0,
  isLoaded: false,

  initialize: async () => {
    if (get().isLoaded) return;
    await get().refresh();
  },

  refresh: async () => {
    try {
      const data = await api.get<{
        totalXP: number;
        currentLevel: number;
        streakInsuranceDays: number;
        badges: Badge[];
      }>("/user/gamification");

      const lvl = getLevelForXP(data.totalXP);

      set({
        totalXP: data.totalXP,
        currentLevel: lvl.level,
        levelName: lvl.name,
        xpForNextLevel: lvl.xpForNext,
        xpProgress: lvl.progress,
        badges: data.badges,
        streakInsuranceDays: data.streakInsuranceDays,
        isLoaded: true,
      });
    } catch {
      // silently fail — gamification is non-critical
    }
  },

  // Trigger a background refresh after server-side XP was awarded
  addXP: (_amount, _reason) => {
    setTimeout(() => get().refresh(), 500);
  },

  earnBadge: (_badgeId) => {
    setTimeout(() => get().refresh(), 500);
  },

  setStreakInsurance: (days) => set({ streakInsuranceDays: days }),

  useStreakInsurance: () => {
    const state = get();
    if (state.streakInsuranceUsedThisWeek < state.streakInsuranceDays) {
      set({ streakInsuranceUsedThisWeek: state.streakInsuranceUsedThisWeek + 1 });
      return true;
    }
    return false;
  },
}));
