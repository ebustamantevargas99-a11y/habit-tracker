"use client";
import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HydrationLog {
  id: string;
  date: string;
  amountMl: number;
  goalMl: number;
  notes: string | null;
}

export interface SupplementFact {
  id: string;
  medicationId: string;
  nutrient: string;
  amount: string;
  dailyValuePct: string | null;
}

export interface Medication {
  id: string;
  name: string;
  brand: string | null;
  dosage: string | null;
  frequency: string;
  timeOfDay: string | null;
  isActive: boolean;
  supplementFacts: SupplementFact[];
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  date: string;
  taken: boolean;
  takenAt: string | null;
  notes: string | null;
}

export interface SymptomLog {
  id: string;
  date: string;
  symptom: string;
  intensity: number;
  duration: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicalAppointment {
  id: string;
  doctorName: string;
  specialty: string;
  location: string | null;
  dateTime: string;
  reason: string | null;
  status: string;
  result: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface WellnessExtendedState {
  // Hydration
  hydrationLogs: HydrationLog[];
  hydrationGoalMl: number;

  // Medications
  medications: Medication[];
  todayMedicationLogs: MedicationLog[];

  // Symptoms
  symptomLogs: SymptomLog[];

  // Appointments
  appointments: MedicalAppointment[];

  isLoaded: boolean;
  isSaving: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Hydration
  saveHydration: (amountMl: number, goalMl?: number, date?: string) => Promise<void>;

  // Medications
  addMedication: (data: {
    name: string; brand?: string; dosage?: string;
    frequency?: string; timeOfDay?: string;
    supplementFacts?: { nutrient: string; amount: string; dailyValuePct?: string }[];
  }) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  toggleMedicationTaken: (medicationId: string, taken: boolean, date?: string) => Promise<void>;

  // Symptoms
  addSymptomLog: (data: { symptom: string; intensity: number; duration?: string; notes?: string; date?: string }) => Promise<void>;
  removeSymptomLog: (id: string) => Promise<void>;

  // Appointments
  addAppointment: (data: {
    doctorName: string; specialty: string; location?: string;
    dateTime: string; reason?: string; notes?: string;
  }) => Promise<void>;
  updateAppointment: (id: string, data: Partial<MedicalAppointment>) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
}

// ─── Migration helper (one-time localStorage → API) ───────────────────────────

async function migrateFromLocalStorage() {
  if (typeof window === "undefined") return;

  try {
    // Migrate hydration_log: { [date]: ml }
    const hydrationRaw = localStorage.getItem("hydration_log");
    if (hydrationRaw) {
      const hydrationData: Record<string, number> = JSON.parse(hydrationRaw);
      const goalMl = parseInt(localStorage.getItem("hydration_goal") ?? "2500");
      const entries = Object.entries(hydrationData).filter(([, v]) => v > 0);
      if (entries.length > 0) {
        await Promise.allSettled(
          entries.map(([date, amountMl]) =>
            api.post("/wellness/hydration", { date, amountMl, goalMl })
          )
        );
        localStorage.removeItem("hydration_log");
        localStorage.removeItem("hydration_goal");
      }
    }

    // Migrate medication_log: { [date]: adherencePct } — just remove since medications
    // themselves were hardcoded sample data, not user data
    localStorage.removeItem("medication_log");
    localStorage.removeItem("sleep_goal");
  } catch {
    // Migration errors are non-fatal
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWellnessExtendedStore = create<WellnessExtendedState>((set, get) => ({
  hydrationLogs: [],
  hydrationGoalMl: 2500,
  medications: [],
  todayMedicationLogs: [],
  symptomLogs: [],
  appointments: [],
  isLoaded: false,
  isSaving: false,
  error: null,

  initialize: async () => {
    if (get().isLoaded) return;
    // Run one-time migration before loading
    await migrateFromLocalStorage();
    await get().refresh();
  },

  refresh: async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [hydration, medications, symptoms, appointments] = await Promise.all([
        api.get<HydrationLog[]>("/wellness/hydration?days=90"),
        api.get<Medication[]>("/wellness/medications"),
        api.get<SymptomLog[]>("/wellness/symptoms?days=90"),
        api.get<MedicalAppointment[]>("/wellness/appointments"),
      ]);

      // Load today's med logs for all medications
      let todayMedLogs: MedicationLog[] = [];
      if ((medications as Medication[]).length > 0) {
        const logsResults = await Promise.allSettled(
          (medications as Medication[]).map(m =>
            api.get<MedicationLog[]>(`/wellness/medications/${m.id}/logs?days=1`)
          )
        );
        todayMedLogs = logsResults
          .filter(r => r.status === "fulfilled")
          .flatMap(r => (r as PromiseFulfilledResult<MedicationLog[]>).value)
          .filter(l => l.date === today);
      }

      const latestHydration = (hydration as HydrationLog[]).find(h => h.date === today);
      set({
        hydrationLogs: hydration as HydrationLog[],
        hydrationGoalMl: latestHydration?.goalMl ?? 2500,
        medications: medications as Medication[],
        todayMedicationLogs: todayMedLogs,
        symptomLogs: symptoms as SymptomLog[],
        appointments: appointments as MedicalAppointment[],
        isLoaded: true,
        error: null,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error al cargar datos", isLoaded: true });
    }
  },

  saveHydration: async (amountMl, goalMl, date) => {
    set({ isSaving: true });
    try {
      const today = date ?? new Date().toISOString().split("T")[0];
      const goal = goalMl ?? get().hydrationGoalMl;
      const updated = await api.post<HydrationLog>("/wellness/hydration", { date: today, amountMl, goalMl: goal });
      set(s => ({
        hydrationLogs: [updated, ...s.hydrationLogs.filter(h => h.date !== today)],
        hydrationGoalMl: goal,
        isSaving: false,
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error", isSaving: false });
    }
  },

  addMedication: async (data) => {
    set({ isSaving: true });
    try {
      const med = await api.post<Medication>("/wellness/medications", data);
      set(s => ({ medications: [...s.medications, med], isSaving: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error", isSaving: false });
    }
  },

  removeMedication: async (id) => {
    try {
      await api.delete(`/wellness/medications/${id}`);
      set(s => ({ medications: s.medications.filter(m => m.id !== id) }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
    }
  },

  toggleMedicationTaken: async (medicationId, taken, date) => {
    const today = date ?? new Date().toISOString().split("T")[0];
    set({ isSaving: true });
    try {
      const log = await api.post<MedicationLog>(`/wellness/medications/${medicationId}/logs`, { date: today, taken });
      set(s => ({
        todayMedicationLogs: [
          ...s.todayMedicationLogs.filter(l => l.medicationId !== medicationId || l.date !== today),
          log,
        ],
        isSaving: false,
      }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error", isSaving: false });
    }
  },

  addSymptomLog: async (data) => {
    set({ isSaving: true });
    try {
      const log = await api.post<SymptomLog>("/wellness/symptoms", data);
      set(s => ({ symptomLogs: [log, ...s.symptomLogs], isSaving: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error", isSaving: false });
    }
  },

  removeSymptomLog: async (id) => {
    try {
      await api.delete(`/wellness/symptoms/${id}`);
      set(s => ({ symptomLogs: s.symptomLogs.filter(l => l.id !== id) }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
    }
  },

  addAppointment: async (data) => {
    set({ isSaving: true });
    try {
      const appt = await api.post<MedicalAppointment>("/wellness/appointments", data);
      set(s => ({ appointments: [...s.appointments, appt], isSaving: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error", isSaving: false });
    }
  },

  updateAppointment: async (id, data) => {
    try {
      const updated = await api.patch<MedicalAppointment>(`/wellness/appointments/${id}`, data);
      set(s => ({ appointments: s.appointments.map(a => a.id === id ? updated : a) }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
    }
  },

  removeAppointment: async (id) => {
    try {
      await api.delete(`/wellness/appointments/${id}`);
      set(s => ({ appointments: s.appointments.filter(a => a.id !== id) }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error" });
    }
  },
}));
