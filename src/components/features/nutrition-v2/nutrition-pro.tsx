"use client";
import { todayLocal } from "@/lib/date/local";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Loader2, Sparkles, Droplet, Camera, Scan, Bookmark, BookmarkPlus, X } from "lucide-react";
import { api } from "@/lib/api-client";
import FoodSearchModal, { type CatalogFood } from "./food-search-modal";
import MacrosRing from "./macros-ring";

// ─── Meal templates + barcode types ─────────────────────────────────────────

type TemplateItem = {
  id: string;
  foodItemId: string;
  quantity: number;
  unit: string;
  foodItem: { id: string; name: string; brand: string | null };
};

type MealTemplateFull = {
  id: string;
  name: string;
  description: string | null;
  mealType: MealType | null;
  items: TemplateItem[];
};

async function resizeImageToBase64(file: File, maxSize = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  photoData?: string | null;
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

type HydrationLog = {
  amountMl: number;
  goalMl: number;
};

export default function NutritionPro() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [goal, setGoal] = useState<NutritionGoal>(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const [selectorOpenFor, setSelectorOpenFor] = useState<MealType | null>(null);
  const [hydration, setHydration] = useState<HydrationLog>({ amountMl: 0, goalMl: 2500 });
  const [templates, setTemplates] = useState<MealTemplateFull[]>([]);
  const [showTemplatesFor, setShowTemplatesFor] = useState<MealLog | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState<MealLog | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const today = todayLocal();
      const [mealsRes, goalRes, hydrationRes, templatesRes] = await Promise.all([
        api.get<MealLog[]>(`/nutrition/meals?date=${today}`),
        api.get<NutritionGoal | null>("/nutrition/goals").catch(() => null),
        api
          .get<HydrationLog[]>(`/wellness/hydration?days=1`)
          .catch(() => [] as HydrationLog[]),
        api
          .get<MealTemplateFull[]>("/nutrition/meal-templates")
          .catch(() => [] as MealTemplateFull[]),
      ]);
      setMeals(mealsRes);
      setTemplates(templatesRes);
      if (goalRes) setGoal({ ...DEFAULT_GOAL, ...goalRes });
      if (hydrationRes.length > 0) {
        setHydration({
          amountMl: hydrationRes[0].amountMl ?? 0,
          goalMl: hydrationRes[0].goalMl ?? goalRes?.waterMl ?? 2500,
        });
      } else if (goalRes?.waterMl) {
        setHydration({ amountMl: 0, goalMl: goalRes.waterMl });
      }
    } catch {
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  async function uploadMealPhoto(meal: MealLog, file: File) {
    try {
      const dataUri = await resizeImageToBase64(file, 800, 0.75);
      await api.put(`/nutrition/meals/${meal.id}/photo`, { photoData: dataUri });
      setMeals((prev) =>
        prev.map((m) => (m.id === meal.id ? { ...m, photoData: dataUri } : m))
      );
      toast.success("Foto subida");
    } catch {
      toast.error("Error subiendo foto");
    }
  }

  async function applyTemplate(template: MealTemplateFull, meal: MealLog) {
    try {
      const result = await api.post<{ items: MealItem[] }>(
        `/nutrition/meal-templates/${template.id}`,
        { mealLogId: meal.id }
      );
      setMeals((prev) =>
        prev.map((m) =>
          m.id === meal.id ? { ...m, items: [...m.items, ...result.items] } : m
        )
      );
      toast.success(`"${template.name}" agregado`);
      setShowTemplatesFor(null);
    } catch {
      toast.error("Error aplicando plantilla");
    }
  }

  async function saveTemplate(meal: MealLog, name: string) {
    if (meal.items.length === 0) return;
    try {
      const tpl = await api.post<MealTemplateFull>("/nutrition/meal-templates", {
        name,
        mealType: meal.mealType,
        items: meal.items.map((i) => ({
          foodItemId: i.foodItemId,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
      setTemplates((prev) => [tpl, ...prev]);
      setSaveAsTemplate(null);
      toast.success(`Plantilla "${name}" guardada`);
    } catch {
      toast.error("Error guardando");
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("¿Borrar plantilla?")) return;
    try {
      await api.delete(`/nutrition/meal-templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Error");
    }
  }

  async function addWater(deltaMl: number) {
    // Optimistic
    setHydration((prev) => ({
      ...prev,
      amountMl: Math.max(0, prev.amountMl + deltaMl),
    }));
    try {
      const updated = await api.patch<HydrationLog>("/wellness/hydration", { deltaMl });
      setHydration({ amountMl: updated.amountMl, goalMl: updated.goalMl });
      if (deltaMl > 0) {
        toast.success(`+${deltaMl}ml · ${updated.amountMl}ml / ${updated.goalMl}ml`);
      }
    } catch {
      // Rollback
      setHydration((prev) => ({
        ...prev,
        amountMl: Math.max(0, prev.amountMl - deltaMl),
      }));
      toast.error("Error guardando");
    }
  }

  async function ensureMeal(type: MealType): Promise<string> {
    const existing = meals.find((m) => m.mealType === type);
    if (existing) return existing.id;
    const today = todayLocal();
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
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="mt-2 text-xs text-accent hover:text-brand-brown flex items-center gap-1"
            >
              <Scan size={12} /> Escanear código de barras
            </button>
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

      {/* Hydration quick-add */}
      <div className="bg-brand-paper rounded-xl p-5 border border-brand-cream">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Droplet size={20} className="text-info" />
            <div>
              <h3 className="font-serif text-base font-semibold text-brand-dark m-0">
                Hidratación
              </h3>
              <p className="text-xs text-brand-warm">
                {hydration.amountMl}ml / {hydration.goalMl}ml ·{" "}
                {Math.round((hydration.amountMl / hydration.goalMl) * 100)}%
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[250, 500, 750].map((ml) => (
              <button
                key={ml}
                onClick={() => void addWater(ml)}
                className="px-3 py-1.5 rounded-button bg-info/10 text-info text-xs font-semibold hover:bg-info/20 flex items-center gap-1"
              >
                +{ml}ml
              </button>
            ))}
            <button
              onClick={() => void addWater(-250)}
              className="px-2.5 py-1.5 rounded-button border border-brand-cream text-brand-warm text-xs hover:bg-brand-cream"
              title="Restar 250ml"
            >
              −
            </button>
          </div>
        </div>
        <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden">
          <div
            className="h-full bg-info rounded-full transition-all"
            style={{
              width: `${Math.min(100, (hydration.amountMl / hydration.goalMl) * 100)}%`,
            }}
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
                {meal && (
                  <>
                    <button
                      onClick={() => setShowTemplatesFor(meal)}
                      title="Usar plantilla"
                      className="p-2 rounded hover:bg-brand-cream text-brand-warm"
                    >
                      <Bookmark size={14} />
                    </button>
                    {meal.items.length > 0 && (
                      <button
                        onClick={() => setSaveAsTemplate(meal)}
                        title="Guardar como plantilla"
                        className="p-2 rounded hover:bg-brand-cream text-brand-warm"
                      >
                        <BookmarkPlus size={14} />
                      </button>
                    )}
                    <label
                      title="Subir foto"
                      className="p-2 rounded hover:bg-brand-cream text-brand-warm cursor-pointer"
                    >
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadMealPhoto(meal, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </>
                )}
                <button
                  onClick={() => setSelectorOpenFor(type)}
                  className="px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar
                </button>
              </div>
            </header>

            {meal?.photoData && (
              <div className="mb-3 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meal.photoData}
                  alt={`${MEAL_LABELS[meal.mealType]} foto`}
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

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

      {showTemplatesFor && (
        <TemplatesModal
          templates={templates}
          filterMealType={showTemplatesFor.mealType}
          onClose={() => setShowTemplatesFor(null)}
          onPick={(t) => void applyTemplate(t, showTemplatesFor)}
          onDelete={(id) => void deleteTemplate(id)}
        />
      )}

      {saveAsTemplate && (
        <SaveTemplateModal
          meal={saveAsTemplate}
          onClose={() => setSaveAsTemplate(null)}
          onSave={(name) => void saveTemplate(saveAsTemplate, name)}
        />
      )}

      {showBarcodeModal && (
        <BarcodeModal
          onClose={() => setShowBarcodeModal(false)}
          onFound={(food) => {
            setShowBarcodeModal(false);
            toast.success(`${food.name} añadido a tu biblioteca`);
            // Abrir el selector con filtro hacia ese alimento recién creado
            setSelectorOpenFor("snack");
          }}
        />
      )}
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────────────────────────

function TemplatesModal({
  templates,
  filterMealType,
  onClose,
  onPick,
  onDelete,
}: {
  templates: MealTemplateFull[];
  filterMealType: MealType | null;
  onClose: () => void;
  onPick: (t: MealTemplateFull) => void;
  onDelete: (id: string) => void;
}) {
  const [all, setAll] = useState(false);
  const visible = all
    ? templates
    : templates.filter((t) => !t.mealType || t.mealType === filterMealType);
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-brand-dark m-0">
            Usar plantilla
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full"
          >
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-3 border-b border-brand-cream flex items-center justify-between text-xs">
          <span className="text-brand-warm">
            {visible.length} plantilla{visible.length !== 1 ? "s" : ""}
          </span>
          {filterMealType && (
            <button
              onClick={() => setAll((v) => !v)}
              className="text-accent hover:text-brand-brown"
            >
              {all ? "Solo de esta comida" : "Ver todas"}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {visible.length === 0 ? (
            <p className="text-sm text-brand-warm text-center py-8 italic">
              Aún no hay plantillas. Crea una guardando una comida desde el ícono
              de marcador.
            </p>
          ) : (
            <div className="space-y-2">
              {visible.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 border border-brand-cream rounded-lg hover:border-accent transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-dark truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-brand-warm">
                      {t.items.length} alimento{t.items.length !== 1 ? "s" : ""}
                      {t.mealType && ` · ${MEAL_LABELS[t.mealType]}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onPick(t)}
                    className="px-3 py-1 rounded bg-accent text-white text-xs font-semibold hover:bg-brand-brown"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-1.5 text-brand-warm hover:text-danger rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveTemplateModal({
  meal,
  onClose,
  onSave,
}: {
  meal: MealLog;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-sm shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream">
          <h2 className="font-display text-lg font-bold text-brand-dark m-0">
            Guardar como plantilla
          </h2>
        </header>
        <div className="px-6 py-4">
          <p className="text-xs text-brand-warm mb-3">
            {meal.items.length} alimento{meal.items.length !== 1 ? "s" : ""} se
            guardarán con sus cantidades. Podrás reusarla luego.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="p.ej. Mi desayuno estándar"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            className="px-5 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}

function BarcodeModal({
  onClose,
  onFound,
}: {
  onClose: () => void;
  onFound: (food: { id: string; name: string }) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!/^\d{8,20}$/.test(code.trim())) {
      setError("Código inválido (8-20 dígitos)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ food: { id: string; name: string }; source: string }>(
        `/nutrition/barcode/${code.trim()}`
      );
      onFound(res.food);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Producto no encontrado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-sm shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-brand-dark m-0">
            Escanear / ingresar código
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full"
          >
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-5">
          <p className="text-xs text-brand-warm mb-3">
            Ingresa el código EAN/UPC del producto. Se consulta en OpenFoodFacts
            (gratis, 3M+ productos).
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            autoFocus
            placeholder="3017620422003"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
          />
          {error && (
            <p className="text-xs text-danger mt-2">{error}</p>
          )}
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={lookup}
            disabled={loading || !code.trim()}
            className="px-5 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40 flex items-center gap-2"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Buscar
          </button>
        </footer>
      </div>
    </div>
  );
}
