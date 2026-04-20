"use client";

import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  isCustom: boolean;
}

export interface MealItem {
  id: string;
  mealLogId: string;
  foodItemId: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItem: FoodItem;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string | null;
  notes: string | null;
  items: MealItem[];
}

export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
  mealsPerDay: number;
}

export interface DailySummary {
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goal: NutritionGoal | null;
  adherence: { calories: number; protein: number; carbs: number; fat: number } | null;
}

export interface WeeklySummaryDay {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface NutritionState {
  meals: MealLog[];
  foodItems: FoodItem[];
  goals: NutritionGoal | null;
  dailySummary: DailySummary | null;
  selectedDate: string;
  isLoaded: boolean;
  error: string | null;
  clearError: () => void;

  initialize: () => Promise<void>;
  setDate: (date: string) => void;

  // Foods
  addFoodItem: (food: Omit<FoodItem, "id" | "isCustom">) => Promise<void>;
  deleteFoodItem: (id: string) => Promise<void>;

  // Meals
  addMeal: (mealType: MealLog["mealType"], name?: string) => Promise<MealLog | null>;
  deleteMeal: (id: string) => Promise<void>;
  addItemToMeal: (mealId: string, foodItemId: string, quantity: number, unit?: string) => Promise<void>;
  removeItemFromMeal: (itemId: string, mealId: string) => Promise<void>;

  // Goals
  updateGoals: (goals: Partial<NutritionGoal>) => Promise<void>;

  // Summary
  getDailySummary: (date?: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  foodItems: [],
  goals: null,
  dailySummary: null,
  selectedDate: new Date().toISOString().split("T")[0],
  isLoaded: false,
  error: null,
  clearError: () => set({ error: null }),

  initialize: async () => {
    if (get().isLoaded) return;
    const today = new Date().toISOString().split("T")[0];
    const [foods, goals, meals, summary] = await Promise.all([
      api.get<FoodItem[]>("/nutrition/foods"),
      api.get<NutritionGoal | null>("/nutrition/goals"),
      api.get<MealLog[]>(`/nutrition/meals?date=${today}`),
      api.get<DailySummary>(`/nutrition/daily-summary?date=${today}`),
    ]);
    set({
      foodItems: foods ?? [],
      goals: goals ?? null,
      meals: meals ?? [],
      dailySummary: summary ?? null,
      isLoaded: true,
    });
  },

  setDate: async (date) => {
    set({ selectedDate: date });
    const [meals, summary] = await Promise.all([
      api.get<MealLog[]>(`/nutrition/meals?date=${date}`),
      api.get<DailySummary>(`/nutrition/daily-summary?date=${date}`),
    ]);
    set({ meals: meals ?? [], dailySummary: summary ?? null });
  },

  addFoodItem: async (food) => {
    const created = await api.post<FoodItem>("/nutrition/foods", food);
    if (created) set((s) => ({ foodItems: [...s.foodItems, created] }));
  },

  deleteFoodItem: async (id) => {
    set((s) => ({ foodItems: s.foodItems.filter((f) => f.id !== id) }));
    await api.delete(`/nutrition/foods/${id}`);
  },

  addMeal: async (mealType, name) => {
    const { selectedDate } = get();
    const meal = await api.post<MealLog>("/nutrition/meals", { date: selectedDate, mealType, name });
    if (meal) {
      set((s) => ({ meals: [...s.meals, { ...meal, items: [] }] }));
      return meal;
    }
    return null;
  },

  deleteMeal: async (id) => {
    set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
    await api.delete(`/nutrition/meals/${id}`);
    const { selectedDate } = get();
    const summary = await api.get<DailySummary>(`/nutrition/daily-summary?date=${selectedDate}`);
    if (summary) set({ dailySummary: summary });
  },

  addItemToMeal: async (mealId, foodItemId, quantity, unit = "serving") => {
    const item = await api.post<MealItem>(`/nutrition/meals/${mealId}/items`, { foodItemId, quantity, unit });
    if (item) {
      set((s) => ({
        meals: s.meals.map((m) =>
          m.id === mealId ? { ...m, items: [...m.items, item] } : m
        ),
      }));
      const { selectedDate } = get();
      const summary = await api.get<DailySummary>(`/nutrition/daily-summary?date=${selectedDate}`);
      if (summary) set({ dailySummary: summary });
    }
  },

  removeItemFromMeal: async (itemId, mealId) => {
    set((s) => ({
      meals: s.meals.map((m) =>
        m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m
      ),
    }));
    await api.delete(`/nutrition/meals/items/${itemId}`);
    const { selectedDate } = get();
    const summary = await api.get<DailySummary>(`/nutrition/daily-summary?date=${selectedDate}`);
    if (summary) set({ dailySummary: summary });
  },

  updateGoals: async (goals) => {
    const current = get().goals;
    const merged = { ...(current ?? {}), ...goals } as NutritionGoal;
    set({ goals: merged });
    const updated = await api.put<NutritionGoal>("/nutrition/goals", merged);
    if (updated) set({ goals: updated });
  },

  getDailySummary: async (date) => {
    const d = date ?? get().selectedDate;
    const summary = await api.get<DailySummary>(`/nutrition/daily-summary?date=${d}`);
    if (summary) set({ dailySummary: summary });
  },
}));
