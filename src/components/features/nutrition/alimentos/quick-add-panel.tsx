"use client";

/**
 * Quick-Add Panel — 3 chorros rápidos para el Hoy hub:
 *
 *   • 🌟 Frecuentes: top foods más usados últimos 60 días
 *   • 🕑 Recientes: últimos 10 foods únicos que loggeaste
 *   • 📋 Copiar de ayer: clona breakfast/lunch/dinner/snack a hoy
 *
 * Reduce fricción de loggear comidas repetidas. El usuario no tiene que
 * buscar cada vez su "avena + plátano + proteína" del desayuno: click →
 * agrega en 1 tap.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Copy, Star, Loader2, Plus } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

interface QuickFood {
  foodItemId: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  count?: number;
  lastUsed?: string;
}

interface YesterdayItem {
  foodItemId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
}

interface QuickAddData {
  today: string;
  yesterday: string;
  frequent: QuickFood[];
  recent: QuickFood[];
  yesterdayByMeal: Record<MealType, YesterdayItem[]>;
}

interface Props {
  tz?: string;
  // El hub padre decide cómo añadir un food a una comida concreta.
  onAddFood: (
    mealType: MealType,
    food: { foodItemId: string; servingSize: number; servingUnit: string; name: string },
  ) => Promise<void>;
  // Callback tras copiar para refrescar el listado de meals del día.
  onCopied: () => void;
}

export default function QuickAddPanel({ tz, onAddFood, onCopied }: Props) {
  const [data, setData] = useState<QuickAddData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"frequent" | "recent" | "copy">("frequent");
  const [targetMeal, setTargetMeal] = useState<MealType>("breakfast");
  const [busy, setBusy] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = tz ? `?tz=${encodeURIComponent(tz)}` : "";
      const res = await api.get<QuickAddData>(`/nutrition/quick-add${q}`);
      setData(res);
    } catch {
      // Silencioso — el panel es opcional, que no rompa si la query falla
    } finally {
      setLoading(false);
    }
  }, [tz]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleQuickAdd(food: QuickFood) {
    setBusy(food.foodItemId);
    try {
      await onAddFood(targetMeal, {
        foodItemId: food.foodItemId,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        name: food.name,
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleCopyMeal(mealType: MealType) {
    if (!data) return;
    setCopying(true);
    try {
      await api.post("/nutrition/meals/copy", {
        fromDate: data.yesterday,
        toDate: data.today,
        mealType,
      });
      toast.success(`${MEAL_LABELS[mealType]} de ayer copiado`);
      onCopied();
      void load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error copiando";
      toast.error(msg);
    } finally {
      setCopying(false);
    }
  }

  async function handleCopyAllYesterday() {
    if (!data) return;
    setCopying(true);
    try {
      await api.post("/nutrition/meals/copy", {
        fromDate: data.yesterday,
        toDate: data.today,
      });
      toast.success("Todo el día de ayer copiado");
      onCopied();
      void load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error copiando";
      toast.error(msg);
    } finally {
      setCopying(false);
    }
  }

  if (loading) {
    return (
      <Card
        variant="default"
        padding="sm"
        className="border-brand-light-tan text-center text-brand-warm text-xs"
      >
        <Loader2 size={12} className="inline animate-spin mr-2" />
        Cargando quick-add…
      </Card>
    );
  }

  if (!data) return null;

  const hasAnything =
    data.frequent.length > 0 ||
    data.recent.length > 0 ||
    Object.values(data.yesterdayByMeal).some((arr) => arr.length > 0);

  if (!hasAnything) {
    return null; // Primera semana del user — no hay nada que ofrecer
  }

  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="font-serif text-sm text-brand-dark m-0">
            Quick-add
          </h3>
          <p className="text-[11px] text-brand-warm m-0 mt-0.5">
            Añade comidas repetidas con 1 click.
          </p>
        </div>
        <div className="flex gap-1">
          {(["frequent", "recent", "copy"] as const).map((t) => {
            const Icon = t === "frequent" ? Star : t === "recent" ? Clock : Copy;
            const label =
              t === "frequent"
                ? "Frecuentes"
                : t === "recent"
                  ? "Recientes"
                  : "Copiar ayer";
            const count =
              t === "frequent"
                ? data.frequent.length
                : t === "recent"
                  ? data.recent.length
                  : Object.values(data.yesterdayByMeal).reduce(
                      (s, arr) => s + arr.length,
                      0,
                    );
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                disabled={count === 0}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition",
                  tab === t
                    ? "bg-brand-dark text-brand-cream"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan disabled:opacity-30 disabled:hover:bg-brand-cream",
                )}
                type="button"
              >
                <Icon size={11} /> {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de comida destino (solo para frequent/recent, copy tiene su propio layout) */}
      {tab !== "copy" && (
        <div className="flex gap-1 mb-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold self-center">
            Añadir a:
          </span>
          {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => (
            <button
              key={m}
              onClick={() => setTargetMeal(m)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] transition",
                targetMeal === m
                  ? "bg-accent text-white"
                  : "bg-brand-paper text-brand-medium border border-brand-light-cream hover:bg-brand-cream",
              )}
              type="button"
            >
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {tab === "frequent" && (
        <FoodStrip
          foods={data.frequent}
          busy={busy}
          onAdd={handleQuickAdd}
          showCount
        />
      )}
      {tab === "recent" && (
        <FoodStrip
          foods={data.recent}
          busy={busy}
          onAdd={handleQuickAdd}
        />
      )}
      {tab === "copy" && (
        <CopyYesterday
          byMeal={data.yesterdayByMeal}
          onCopyOne={handleCopyMeal}
          onCopyAll={handleCopyAllYesterday}
          copying={copying}
        />
      )}
    </Card>
  );
}

// ─── FoodStrip ────────────────────────────────────────────────────────────────

function FoodStrip({
  foods,
  busy,
  onAdd,
  showCount,
}: {
  foods: QuickFood[];
  busy: string | null;
  onAdd: (f: QuickFood) => void;
  showCount?: boolean;
}) {
  if (foods.length === 0) {
    return (
      <p className="text-xs text-brand-warm text-center p-4 m-0">
        Sin data aún — loggea algunas comidas y aparecerá aquí.
      </p>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {foods.map((f) => (
        <button
          key={f.foodItemId}
          onClick={() => onAdd(f)}
          disabled={busy === f.foodItemId}
          className="shrink-0 min-w-[160px] max-w-[200px] px-3 py-2 rounded-lg bg-brand-paper border border-brand-light-cream hover:border-accent text-left transition disabled:opacity-40"
          type="button"
        >
          <p className="text-sm text-brand-dark font-semibold m-0 truncate">
            {f.name}
          </p>
          {f.brand && (
            <p className="text-[10px] text-brand-warm m-0 truncate">
              {f.brand}
            </p>
          )}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-accent font-mono text-sm font-bold">
              {f.calories}
            </span>
            <span className="text-[10px] text-brand-warm">
              kcal / {f.servingSize}
              {f.servingUnit}
            </span>
          </div>
          {showCount && f.count != null && (
            <p className="text-[9px] text-brand-tan m-0 mt-0.5">
              Usado {f.count}× en 60d
            </p>
          )}
          {!showCount && f.lastUsed && (
            <p className="text-[9px] text-brand-tan m-0 mt-0.5">
              Último: {f.lastUsed}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 text-[10px] text-accent font-semibold">
            <Plus size={10} /> añadir
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── CopyYesterday ────────────────────────────────────────────────────────────

function CopyYesterday({
  byMeal,
  onCopyOne,
  onCopyAll,
  copying,
}: {
  byMeal: Record<MealType, YesterdayItem[]>;
  onCopyOne: (m: MealType) => void;
  onCopyAll: () => void;
  copying: boolean;
}) {
  const meals: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const anyHasItems = meals.some((m) => byMeal[m].length > 0);

  if (!anyHasItems) {
    return (
      <p className="text-xs text-brand-warm text-center p-4 m-0">
        Ayer no loggeaste nada.
      </p>
    );
  }

  const totalKcal = meals.reduce(
    (s, m) => s + byMeal[m].reduce((a, i) => a + i.calories, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onCopyAll}
        disabled={copying}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/10 border border-accent hover:bg-accent/20 disabled:opacity-40"
        type="button"
      >
        <div className="text-left">
          <p className="text-sm text-brand-dark font-semibold m-0">
            Copiar todo el día
          </p>
          <p className="text-[10px] text-brand-warm m-0">
            Todos los meals con sus ingredientes
          </p>
        </div>
        <span className="text-accent font-mono text-sm font-bold">
          {Math.round(totalKcal)} kcal
        </span>
      </button>
      {meals.map((m) => {
        const items = byMeal[m];
        if (items.length === 0) return null;
        const kcal = items.reduce((s, i) => s + i.calories, 0);
        return (
          <button
            key={m}
            onClick={() => onCopyOne(m)}
            disabled={copying}
            className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-brand-paper border border-brand-light-cream hover:border-accent/60 disabled:opacity-40 text-left"
            type="button"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-brand-dark font-semibold m-0">
                Copiar {MEAL_LABELS[m]}
              </p>
              <p className="text-[11px] text-brand-warm m-0 truncate">
                {items.map((i) => i.foodName).join(", ")}
              </p>
            </div>
            <span className="text-accent font-mono text-xs font-bold shrink-0">
              {Math.round(kcal)} kcal
            </span>
          </button>
        );
      })}
    </div>
  );
}
