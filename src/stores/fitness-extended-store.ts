"use client";
import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────
//
// NOTA (2026-04-21 — Fitness redesign Fase 9):
// El tipo FastingLog y sus endpoints fueron movidos a LifeOS (FastingSession).
// Este store conserva solo Challenges hasta que la Fase 2 reemplace challenges
// por TrainingPrograms.

export interface FitnessChallenge {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  targetValue: number;   // total days
  unit: string;          // category
  currentValue: number;
  isCompleted: boolean;
  completedDays: number[]; // array of completed day indices
}

// ─── State ────────────────────────────────────────────────────────────────────

interface FitnessExtendedState {
  challenges: FitnessChallenge[];
  isLoaded: boolean;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  // Challenges
  addChallenge: (data: { name: string; totalDays: number; category?: string; description?: string }) => Promise<FitnessChallenge>;
  deleteChallenge: (id: string) => Promise<void>;
  toggleChallengeDay: (id: string, dayIndex: number) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFitnessExtendedStore = create<FitnessExtendedState>((set, get) => ({
  challenges: [],
  isLoaded: false,

  initialize: async () => {
    if (get().isLoaded) return;
    await get().refresh();
  },

  refresh: async () => {
    try {
      const challenges = await api.get<FitnessChallenge[]>("/fitness/challenges");
      set({
        challenges: challenges as FitnessChallenge[],
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  addChallenge: async (data) => {
    const created = await api.post<FitnessChallenge>("/fitness/challenges", {
      name: data.name,
      description: data.description ?? `Reto de ${data.totalDays} días`,
      targetValue: data.totalDays,
      unit: data.category ?? "Personalizado",
      startDate: new Date().toISOString().split("T")[0],
    });
    set(s => ({ challenges: [...s.challenges, created] }));
    return created;
  },

  deleteChallenge: async (id) => {
    await api.delete(`/fitness/challenges/${id}`);
    set(s => ({ challenges: s.challenges.filter(c => c.id !== id) }));
  },

  toggleChallengeDay: async (id, dayIndex) => {
    const challenge = get().challenges.find(c => c.id === id);
    if (!challenge) return;

    const days = [...challenge.completedDays];
    const idx = days.indexOf(dayIndex);
    if (idx >= 0) {
      days.splice(idx, 1);
    } else {
      days.push(dayIndex);
      days.sort((a, b) => a - b);
    }

    // Optimistic update
    set(s => ({
      challenges: s.challenges.map(c =>
        c.id !== id ? c : { ...c, completedDays: days }
      ),
    }));

    // Persist
    api.patch(`/fitness/challenges/${id}`, { completedDays: days }).catch(() => {
      // Rollback on error
      set(s => ({
        challenges: s.challenges.map(c =>
          c.id !== id ? c : { ...c, completedDays: challenge.completedDays }
        ),
      }));
    });
  },
}));
