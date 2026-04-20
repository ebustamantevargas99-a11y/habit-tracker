import { create } from "zustand";
import { api } from "@/lib/api-client";

interface TimeBlockAPI {
  id?: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  title: string;
  category: string | null;
  completed: boolean;
}

interface DailyPlanAPI {
  date: string;
  topPriorities: string[];
  timeBlocks: TimeBlockAPI[];
  rating: number | null;
  notes: string | null;
}

interface PlannerState {
  plans: Record<string, DailyPlanAPI>; // keyed by date string
  isSaving: boolean;
  error: string | null;
  clearError: () => void;

  loadPlan: (date: string) => Promise<DailyPlanAPI>;
  savePlan: (plan: DailyPlanAPI) => Promise<void>;
}

/** Convert fractional hour (e.g. 9.5) to "HH:MM" */
export function hourToTime(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plans: {},
  isSaving: false,
  error: null,
  clearError: () => set({ error: null }),

  loadPlan: async (date) => {
    const cached = get().plans[date];
    if (cached) return cached;

    const plan = await api.get<DailyPlanAPI>(`/planner/daily/${date}`);
    set((state) => ({ plans: { ...state.plans, [date]: plan } }));
    return plan;
  },

  savePlan: async (plan) => {
    set({ isSaving: true, error: null });
    try {
      const saved = await api.put<DailyPlanAPI>(
        `/planner/daily/${plan.date}`,
        plan
      );
      set((state) => ({
        plans: { ...state.plans, [plan.date]: saved },
        isSaving: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar el plan";
      set({ error: msg, isSaving: false });
      throw e;
    }
  },
}));
