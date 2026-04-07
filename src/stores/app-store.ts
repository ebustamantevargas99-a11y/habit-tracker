import { create } from "zustand";
import type { PageKey } from "@/lib/constants";

interface AppState {
  // Navigation
  activePage: PageKey;
  sidebarOpen: boolean;
  setActivePage: (page: PageKey) => void;
  toggleSidebar: () => void;

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

  showMonthlySummary: false,
  showWeeklySummary: false,
  setShowMonthlySummary: (show) => set({ showMonthlySummary: show }),
  setShowWeeklySummary: (show) => set({ showWeeklySummary: show }),
}));
