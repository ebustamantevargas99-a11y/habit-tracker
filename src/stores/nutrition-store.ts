"use client";

import { create } from "zustand";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  category?: string | null;
  servingSize: number;
  servingUnit: string;
  barcode?: string | null;
  notes?: string | null;
  // Macros principales (siempre numbers, default 0)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  // Macros desglosados — nullable (si el usuario no lo sabe, queda NULL)
  saturatedFat?: number | null;
  transFat?: number | null;
  monoFat?: number | null;
  polyFat?: number | null;
  omega3?: number | null;
  omega6?: number | null;
  cholesterol?: number | null;
  addedSugar?: number | null;
  // Minerales (mg)
  potassium?: number | null;
  calcium?: number | null;
  iron?: number | null;
  magnesium?: number | null;
  zinc?: number | null;
  phosphorus?: number | null;
  // Vitaminas
  vitaminA?: number | null;   // μg RAE
  vitaminC?: number | null;   // mg
  vitaminD?: number | null;   // μg
  vitaminE?: number | null;   // mg
  vitaminK?: number | null;   // μg
  thiamin?: number | null;    // B1 mg
  riboflavin?: number | null; // B2 mg
  niacin?: number | null;     // B3 mg
  vitaminB6?: number | null;  // mg
  folate?: number | null;     // B9 μg
  vitaminB12?: number | null; // μg
  // Glycemic + net carbs
  glycemicIndex?: number | null;
  glycemicLoad?: number | null;
  netCarbs?: number | null;
  // Aminoácidos esenciales (mg)
  leucine?: number | null;
  isoleucine?: number | null;
  valine?: number | null;
  lysine?: number | null;
  methionine?: number | null;
  phenylalanine?: number | null;
  threonine?: number | null;
  tryptophan?: number | null;
  histidine?: number | null;
  // Otros
  caffeine?: number | null;   // mg
  alcohol?: number | null;    // g
  water?: number | null;      // g
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
  // Redesign Nutrición — objetivo de peso + metabolismo calculado
  goalType?: "cut" | "maintain" | "bulk" | "recomp" | null;
  targetWeightKg?: number | null;
  startWeightKg?: number | null;
  startDate?: string | null;        // YYYY-MM-DD
  targetDate?: string | null;       // YYYY-MM-DD
  weeklyRateKg?: number | null;     // negativo = cut, positivo = bulk
  bmrKcal?: number | null;
  tdeeKcal?: number | null;
  activityFactor?: number | null;
  targetBodyFatPercent?: number | null;
  targetLeanMassKg?: number | null;
  // Macro split en %
  useMacroSplit?: boolean;
  proteinPct?: number | null;
  carbsPct?: number | null;
  fatPct?: number | null;
  // Override custom de targets de micronutrientes (keys = nombres FoodItem fields)
  customTargets?: Record<string, number> | null;
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
  updateFoodItem: (id: string, patch: Partial<Omit<FoodItem, "id" | "isCustom">>) => Promise<void>;
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

  updateFoodItem: async (id, patch) => {
    const updated = await api.patch<FoodItem>(`/nutrition/foods/${id}`, patch);
    if (updated) {
      set((s) => ({
        foodItems: s.foodItems.map((f) => (f.id === id ? updated : f)),
      }));
    }
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
