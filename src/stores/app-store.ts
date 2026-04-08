import { create } from "zustand";
import type { PageKey } from "@/lib/constants";

export type WellnessTab = 'sleep' | 'hydration' | 'medication' | 'period' | 'healthlog';
export type ProductivityTab = 'habits' | 'projects' | 'tasks' | 'worktimelog' | 'pomodoro';

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

  showMonthlySummary: false,
  showWeeklySummary: false,
  setShowMonthlySummary: (show) => set({ showMonthlySummary: show }),
  setShowWeeklySummary: (show) => set({ showWeeklySummary: show }),
}));
