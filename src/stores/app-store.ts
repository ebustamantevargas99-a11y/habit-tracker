import { create } from "zustand";
import type { PageKey } from "@/lib/constants";

export type WellnessTab = 'sleep' | 'hydration' | 'medication' | 'healthlog';
export type ProductivityTab = 'command' | 'habits' | 'projects' | 'pomodoro' | 'projection';
export type PlanTab = "today" | "week" | "month";

// Valid tab values per page (used by setPageFromURL for validation)
const VALID_TABS: Record<string, string[]> = {
  wellness:     ['sleep', 'hydration', 'medication', 'healthlog'],
  productivity: ['command', 'habits', 'projects', 'pomodoro', 'projection'],
  plan:         ['today', 'week', 'month'],
  fitness:      ['entrenamiento', 'volumen', 'plan', 'records', 'metricas', 'peso', 'pasos', 'ayuno', 'retos', 'fotos'],
  finance:      ['resumen', 'ingresos', 'gastos', 'presupuesto', 'facturas', 'suscripciones', 'deseos', 'analytics'],
  nutrition:    ['pro', 'diario', 'resumen', 'alimentos', 'metas'],
  reading:      ['reading', 'want', 'finished', 'paused'],
  organization: ['notas', 'areas', 'revision'],
  vision:       ['vision', 'metas', 'okr', 'proyecciones', 'board', 'timeline', 'afirmaciones', 'vida'],
};

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

  // Fitness deep-link
  fitnessTab: string;
  setFitnessTab: (tab: string) => void;

  // Finance deep-link
  financeTab: string;
  setFinanceTab: (tab: string) => void;

  // Nutrition deep-link
  nutritionTab: string;
  setNutritionTab: (tab: string) => void;

  // Reading deep-link
  readingTab: string;
  setReadingTab: (tab: string) => void;

  // Organization deep-link
  organizationTab: string;
  setOrganizationTab: (tab: string) => void;

  // Vision deep-link
  visionTab: string;
  setVisionTab: (tab: string) => void;

  // Apply URL state without pushing to history (called by useRouteSync)
  setPageFromURL: (page: PageKey, tab?: string) => void;

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

  planTab: "today",
  setPlanTab: (tab) => set({ planTab: tab }),

  fitnessTab: 'entrenamiento',
  setFitnessTab: (tab) => set({ fitnessTab: tab }),

  financeTab: 'resumen',
  setFinanceTab: (tab) => set({ financeTab: tab }),

  nutritionTab: 'diario',
  setNutritionTab: (tab) => set({ nutritionTab: tab }),

  readingTab: 'reading',
  setReadingTab: (tab) => set({ readingTab: tab }),

  organizationTab: 'notas',
  setOrganizationTab: (tab) => set({ organizationTab: tab }),

  visionTab: 'vision',
  setVisionTab: (tab) => set({ visionTab: tab }),

  setPageFromURL: (page, tab) => {
    const update: Partial<AppState> = { activePage: page };

    if (tab) {
      const validTabs = VALID_TABS[page] ?? [];
      if (validTabs.includes(tab)) {
        switch (page) {
          case 'wellness':
            update.wellnessSubTab = tab as WellnessTab;
            break;
          case 'productivity':
            update.productivitySubTab = tab as ProductivityTab;
            break;
          case 'plan':
            update.planTab = tab as PlanTab;
            break;
          case 'fitness':
            update.fitnessTab = tab;
            break;
          case 'finance':
            update.financeTab = tab;
            break;
          case 'nutrition':
            update.nutritionTab = tab;
            break;
          case 'reading':
            update.readingTab = tab;
            break;
          case 'organization':
            update.organizationTab = tab;
            break;
          case 'vision':
            update.visionTab = tab;
            break;
        }
      }
    }

    set(update);
  },

  showMonthlySummary: false,
  showWeeklySummary: false,
  setShowMonthlySummary: (show) => set({ showMonthlySummary: show }),
  setShowWeeklySummary: (show) => set({ showWeeklySummary: show }),
}));
