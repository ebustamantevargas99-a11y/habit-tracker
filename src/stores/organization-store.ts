"use client";

import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface LifeArea {
  id: string;
  name: string;
  emoji: string;
  score: number;
  description: string | null;
  color: string;
  orderIndex: number;
}

export interface WeeklyReview {
  id: string;
  weekStart: string;
  wins: string[];
  challenges: string[];
  learnings: string[];
  nextWeekGoals: string[];
  gratitude: string[];
  overallRating: number;
  energyLevel: number;
  productivityScore: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface OrganizationState {
  notes: Note[];
  lifeAreas: LifeArea[];
  weeklyReviews: WeeklyReview[];
  activeCategory: string;
  searchQuery: string;
  isLoaded: boolean;

  initialize: () => Promise<void>;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  getFilteredNotes: () => Note[];

  // Notes
  addNote: (note: { title: string; content?: string; category?: string; tags?: string[]; color?: string }) => Promise<void>;
  updateNote: (id: string, patch: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;

  // Life Areas
  addLifeArea: (area: { name: string; emoji?: string; color?: string }) => Promise<void>;
  updateLifeArea: (id: string, patch: Partial<Omit<LifeArea, "id" | "orderIndex">>) => Promise<void>;
  deleteLifeArea: (id: string) => Promise<void>;

  // Weekly Reviews
  addWeeklyReview: (review: Omit<WeeklyReview, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateWeeklyReview: (id: string, patch: Partial<Omit<WeeklyReview, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  notes: [],
  lifeAreas: [],
  weeklyReviews: [],
  activeCategory: "all",
  searchQuery: "",
  isLoaded: false,

  initialize: async () => {
    if (get().isLoaded) return;
    const [notes, lifeAreas, weeklyReviews] = await Promise.all([
      api.get<Note[]>("/organization/notes"),
      api.get<LifeArea[]>("/organization/life-areas"),
      api.get<WeeklyReview[]>("/organization/weekly-reviews?limit=4"),
    ]);
    set({
      notes: notes ?? [],
      lifeAreas: lifeAreas ?? [],
      weeklyReviews: weeklyReviews ?? [],
      isLoaded: true,
    });
  },

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  getFilteredNotes: () => {
    const { notes, activeCategory, searchQuery } = get();
    return notes.filter((n) => {
      const matchesCat = activeCategory === "all" || n.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  },

  addNote: async (note) => {
    const created = await api.post<Note>("/organization/notes", note);
    if (created) set((s) => ({ notes: [created, ...s.notes] }));
  },

  updateNote: async (id, patch) => {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
    await api.patch(`/organization/notes/${id}`, patch);
  },

  deleteNote: async (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    await api.delete(`/organization/notes/${id}`);
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const isPinned = !note.isPinned;
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, isPinned } : n)),
    }));
    await api.patch(`/organization/notes/${id}`, { isPinned });
  },

  addLifeArea: async (area) => {
    const created = await api.post<LifeArea>("/organization/life-areas", area);
    if (created) set((s) => ({ lifeAreas: [...s.lifeAreas, created] }));
  },

  updateLifeArea: async (id, patch) => {
    set((s) => ({
      lifeAreas: s.lifeAreas.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    await api.patch(`/organization/life-areas/${id}`, patch);
  },

  deleteLifeArea: async (id) => {
    set((s) => ({ lifeAreas: s.lifeAreas.filter((a) => a.id !== id) }));
    await api.delete(`/organization/life-areas/${id}`);
  },

  addWeeklyReview: async (review) => {
    const created = await api.post<WeeklyReview>("/organization/weekly-reviews", review);
    if (created) {
      set((s) => ({
        weeklyReviews: [created, ...s.weeklyReviews.filter((r) => r.weekStart !== review.weekStart)],
      }));
    }
  },

  updateWeeklyReview: async (id, patch) => {
    set((s) => ({
      weeklyReviews: s.weeklyReviews.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    await api.patch(`/organization/weekly-reviews/${id}`, patch);
  },
}));
