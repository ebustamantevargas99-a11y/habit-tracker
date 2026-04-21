"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import FoodSearchModal, { type CatalogFood } from "./food-search-modal";
import MacrosRing from "./macros-ring";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

type MealItem = {
  id: string;
  foodItemId: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItem: { id: string; name: string; brand: string | null; servingSize: number; servingUnit: string };
};

type MealLog = {
  id: string;
  mealType: MealType;
  date: string;
  items: MealItem[];
};

type NutritionGoal = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
};

const DEFAULT_GOAL: NutritionGoal = {
  calories: 2200,
  protein: 150,
  carbs: 220,
  fat: 75,
  fiber: 25,
  waterMl: 2500,
};

export default function NutritionPro() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [goal, setGoal] = useState<NutritionGoal>(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const [selectorOpenFor, setSelectorOpenFor] = useState<MealType | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [mealsRes, goalRes] = await Promise.all([
        api.get<MealLog[]>(`/nutrition/meals?date=${today}`),
        api.get<NutritionGoal | null>("/nutrition/goals").catch(() => null),
      ]);
      setMeals(mealsRes);
      if (goalRes) setGoal({ ...DEFAULT_GOAL, ...goalRes });
    } catch {
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  async function ensureMeal(type: MealType): Promise<string> {
    const existing = meals.find((m) => m.mealType === type);
    if (existing) return existing.id;
    const today = new Date().toISOString().split("T")[0];
    const created = await api.post<MealLog>("/nutrition/meals", {
      date: today,
      mealType: type,
    });
    setMeals((prev) => [...prev, { ...created, items: created.items ?? [] }]);
    return created.id;
  }

  async function addFoodToMeal(
    mealType: MealType,
    food: CatalogFood,
    quantity: number
  ) {
    try {
      const mealId = await ensureMeal(mealType);
      let foodItemId = food.id;

      // Si es seed, crear FoodItem custom del user primero (DB constraint)
      if (food.source === "seed") {
        const created = await api.post<{ id: string }>("/nutrition/foods", {
          name: food.name,
          brand: food.brand ?? undefined,
          servingSize: food.servingSize,
          servingUnit: food.servingUnit,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          sugar: food.sugar,
        });
        foodItemId = created.id;
      }

      const item = await api.post<MealItem>(`/nutrition/meals/${mealId}/items`, {
        foodItemId,
        quantity,
        unit: food.servingUnit,
      });

      setMeals((prev) =>
        prev.map((m) =>
          m.mealType === mealType
            ? { ...m, items: [...m.items, item] }
            : m
        )
      );
      toast.success(`${food.name} agregado a ${MEAL_LABELS[mealType]}`);
    } catch {
      toast.error("Error agregando alimento");
    }
  }

  async function removeItem(mealId: string, itemId: string) {
    try {
      await api.delete(`/nutrition/meals/items/${itemId}`);
      setMeals((prev) =>
        prev.map((m) =>
          m.id === mealId
            ? { ...m, items: m.items.filter((i) => i.id !== itemId) }
            : m
        )
      );
    } catch {
      toast.error("Error eliminando");
    }
  }

  async function copyPrevious(type: MealType) {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yday = yesterday.toISOString().split("T")[0];
      const yMeals = await api.get<MealLog[]>(`/nutrition/meals?date=${yday}`);
      const match = yMeals.find((m) => m.mealType === type);
      if (!match || match.items.length === 0) {
        toast.info("No hay comida de ayer para copiar");
        return;
      }
      const mealId = await ensureMeal(type);
      for (const it of match.items) {
        await api.post(`/nutrition/meals/${mealId}/items`, {
          foodItemId: it.foodItemId,
          quantity: it.quantity,
          unit: it.unit,
        });
      }
      toast.success("Copiado de ayer");
      await loadData();
    } catch {
      toast.error("Error copiando");
    }
  }

  const totals = meals.reduce(
    (acc, meal) => {
      for (const it of meal.items) {
        acc.calories += it.calories;
        acc.protein += it.protein;
        acc.carbs += it.carbs;
        acc.fat += it.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (loading) {
    return (
      <div className="text-center py-12 text-brand-warm">
        <Loader2 size={20} className="animate-spin inline mr-2" />
        Cargando nutrición…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Macros rings */}
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-cream">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-brand-dark m-0">
              Macros de hoy
            </h3>
            <p className="text-xs text-brand-warm">
              vs objetivo diario. Rojo = pasado el límite.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-dark">
              {Math.round(totals.calories)}
              <span className="text-sm font-normal text-brand-warm">
                {" "}
                / {goal.calories} kcal
              </span>
            </p>
            <p className="text-xs text-brand-warm">
              {Math.max(0, goal.calories - totals.calories)} kcal restantes
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MacrosRing
            label="Proteína"
            value={totals.protein}
            goal={goal.protein}
            color="#7A9E3E"
          />
          <MacrosRing
            label="Carbohidratos"
            value={totals.carbs}
            goal={goal.carbs}
            color="#D4943A"
          />
          <MacrosRing
            label="Grasa"
            value={totals.fat}
            goal={goal.fat}
            color="#B8860B"
          />
        </div>
      </div>

      {/* Meals — 4 cards */}
      {(Object.keys(MEAL_LABELS) as MealType[]).map((type) => {
        const meal = meals.find((m) => m.mealType === type);
        const mealCals = meal?.items.reduce((s, i) => s + i.calories, 0) ?? 0;
        return (
          <div
            key={type}
            className="bg-brand-paper rounded-xl p-5 border border-brand-cream"
          >
            <header className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-serif text-lg font-semibold text-brand-dark m-0">
                  {MEAL_LABELS[type]}
                </h4>
                <p className="text-xs text-brand-warm">
                  {Math.round(mealCals)} kcal · {meal?.items.length ?? 0} items
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => void copyPrevious(type)}
                  title="Copiar de ayer"
                  className="p-2 rounded hover:bg-brand-cream text-brand-warm"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setSelectorOpenFor(type)}
                  className="px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar
                </button>
              </div>
            </header>

            {meal && meal.items.length > 0 ? (
              <div className="space-y-1">
                {meal.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-cream/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-dark truncate">
                        {it.foodItem.name}
                      </p>
                      <p className="text-xs text-brand-warm">
                        {Math.round(it.quantity)}
                        {it.unit} · {Math.round(it.calories)} kcal · P{" "}
                        {Math.round(it.protein)}g · C{" "}
                        {Math.round(it.carbs)}g · F{" "}
                        {Math.round(it.fat)}g
                      </p>
                    </div>
                    <button
                      onClick={() => void removeItem(meal.id, it.id)}
                      className="p-1.5 text-brand-warm hover:text-danger hover:bg-danger-light/30 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-warm text-center py-3 italic">
                Sin registros. Toca &ldquo;Agregar&rdquo; para empezar.
              </p>
            )}
          </div>
        );
      })}

      {/* Export IA hint */}
      <div className="bg-brand-warm-white border border-brand-cream rounded-xl p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="text-sm text-brand-medium">
          Usa el botón flotante <strong>Analizar con IA</strong> abajo-derecha
          para generar un prompt con tu nutrición del día y pedirle
          a Claude/ChatGPT feedback personalizado.
        </div>
      </div>

      {selectorOpenFor && (
        <FoodSearchModal
          open={Boolean(selectorOpenFor)}
          onClose={() => setSelectorOpenFor(null)}
          onPick={(food, grams) => {
            void addFoodToMeal(selectorOpenFor, food, grams);
          }}
        />
      )}
    </div>
  );
}
