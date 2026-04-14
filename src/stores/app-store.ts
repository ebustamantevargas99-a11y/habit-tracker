import { create } from "zustand";
import type { PageKey } from "@/lib/constants";

export type WellnessTab = 'sleep' | 'hydration' | 'medication' | 'healthlog';
export type ProductivityTab = 'command' | 'habits' | 'projects' | 'pomodoro' | 'projection';
export type PlanTab = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface AppState {
  // Navigation
  activePage: PageKey;
  sidebarOpen: boolean;
  setActivePage: (page: PageKey) => void;
  toggleSidebar: () => void;

  // Wellness deep-link
  wellnessSubTab: WellnessTab;
  setWellnessSubTab: (tab: WellnessTab) => void;

  // Productivity deep-link
  productivitySubTab: ProductivityTab;
  setProductivitySubTab: (tab: ProductivityTab) => void;

  // Plan deep-link
  planTab: PlanTab;
  setPlanTab: (tab: PlanTab) => void;

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

  productivitySubTab: 'habits',
  setProductivitySubTab: (tab) => set({ productivitySubTab: tab }),

  planTab: 0,
  setPlanTab: (tab) => set({ planTab: tab }),

  showMonthlySummary: false,
  showWeeklySummary: false,
  setShowMonthlySummary: (show) => set({ showMonthlySummary: show }),
  setShowWeeklySummary: (show) => set({ showWeeklySummary: show }),
}));
