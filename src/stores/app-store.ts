import { create } from "zustand";
import type { PageKey } from "@/lib/constants";

export type WellnessTab = 'sleep' | 'hydration' | 'medication' | 'period' | 'healthlog';

interface AppState {
  // Navigation
  activePage: PageKey;
  sidebarOpen: boolean;
  setActivePage: (page: PageKey) => void;
  toggleSidebar: () => void;

  // Wellness deep-link
  wellnessSubTab: WellnessTab;
  setWellnessSubTab: (tab: WellnessTab) => void;

  // Modals
  showMonthlySummary: boolean;
  showWeeklySummary: boolean;
  setShowMonthlySummary: (show: boolean) => void;
  setShowWeeklySummary: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: "home",
  sidebarOpen: true,
  setActivePage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  wellnessSubTab: 'sleep',
  setWellnessSubTab: (tab) => set({ wellnessSubTab: tab }),

  showMonthlySummary: false,
  showWeeklySummary: false,
  setShowMonthlySummary: (show) => set({ showMonthlySummary: show }),
  setShowWeeklySummary: (show) => set({ showWeeklySummary: show }),
}));
