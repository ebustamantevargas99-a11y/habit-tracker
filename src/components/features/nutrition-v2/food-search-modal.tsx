"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { api } from "@/lib/api-client";

export type CatalogFood = {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  category: string;
  categoryLabel: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  tags: string[];
  isCustom: boolean;
  source: "seed" | "user";
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "protein", label: "Proteínas" },
  { key: "dairy", label: "Lácteos" },
  { key: "grain", label: "Granos" },
  { key: "vegetable", label: "Vegetales" },
  { key: "fruit", label: "Frutas" },
  { key: "legume", label: "Legumbres" },
  { key: "nut_seed", label: "Frutos secos" },
  { key: "oil_fat", label: "Aceites" },
  { key: "beverage", label: "Bebidas" },
  { key: "sweet", label: "Dulces" },
  { key: "prepared", label: "Preparados" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (food: CatalogFood, grams: number) => void;
};

export default function FoodSearchModal({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [foods, setFoods] = useState<CatalogFood[]>([]);
  const [selected, setSelected] = useState<CatalogFood | null>(null);
  const [quantity, setQuantity] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category !== "all") params.set("category", category);
        params.set("limit", "80");
        const res = await api.get<{ foods: CatalogFood[] }>(
          `/nutrition/foods-catalog?${params.toString()}`
        );
        if (!cancelled) setFoods(res.foods);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, query, category]);

  const byCategory = useMemo(() => {
    const groups = new Map<string, CatalogFood[]>();
    for (const f of foods) {
      const key = f.categoryLabel;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return groups;
  }, [foods]);

  useEffect(() => {
    if (selected) setQuantity(String(selected.servingSize));
  }, [selected]);

  if (!open) return null;

  function handleAdd() {
    if (!selected) return;
    const grams = parseFloat(quantity) || selected.servingSize;
    onPick(selected, grams);
    setSelected(null);
    setQuantity("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-brand-cream">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-dark m-0">
              {selected ? "Confirmar porción" : "Agregar alimento"}
            </h2>
            {!selected && (
              <p className="text-xs text-brand-warm mt-0.5">
                {foods.length} alimentos · seed + tus custom
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-warm hover:bg-brand-cream rounded-full"
          >
            <X size={18} />
          </button>
        </header>

        {!selected && (
          <>
            <div className="px-6 py-3 border-b border-brand-cream">
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-warm pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar alimento…"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                      category === c.key
                        ? "bg-accent text-white"
                        : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading && (
                <p className="text-sm text-brand-warm text-center py-8">
                  Buscando…
                </p>
              )}
              {!loading && foods.length === 0 && (
                <p className="text-sm text-brand-warm text-center py-8">
                  Sin resultados.
                </p>
              )}
              {!loading &&
                Array.from(byCategory.entries()).map(([label, list]) => (
                  <div key={label} className="mb-4 last:mb-0">
                    <h3 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
                      {label}
                    </h3>
                    <div className="space-y-1">
                      {list.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelected(f)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-cream hover:border-accent hover:bg-accent/5 transition text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-brand-dark truncate">
                              {f.name}
                              {f.brand && (
                                <span className="text-xs text-brand-warm font-normal ml-2">
                                  {f.brand}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-brand-warm">
                              {Math.round(f.calories)} kcal ·{" "}
                              P {Math.round(f.protein)}g · C{" "}
                              {Math.round(f.carbs)}g · F{" "}
                              {Math.round(f.fat)}g ·{" "}
                              {f.servingSize}
                              {f.servingUnit}
                              {f.isCustom && " · tuyo"}
                            </p>
                          </div>
                          <Plus size={14} className="text-brand-warm shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {selected && (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="text-xs text-brand-warm uppercase tracking-widest mb-1">
              {selected.categoryLabel}
            </p>
            <h3 className="text-lg font-semibold text-brand-dark m-0">
              {selected.name}
              {selected.brand && (
                <span className="text-sm font-normal text-brand-warm ml-2">
                  {selected.brand}
                </span>
              )}
            </h3>
            <p className="text-xs text-brand-warm mt-1 mb-4">
              Por {selected.servingSize}
              {selected.servingUnit}: {Math.round(selected.calories)} kcal · P{" "}
              {selected.protein}g · C {selected.carbs}g · F {selected.fat}g
            </p>

            <label className="block text-sm font-medium text-brand-dark mb-2">
              Cantidad ({selected.servingUnit})
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-40 px-4 py-3 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-lg font-mono focus:outline-none focus:border-accent"
              autoFocus
            />

            {quantity && parseFloat(quantity) > 0 && (
              <div className="mt-4 bg-brand-cream/30 rounded-lg p-4">
                <p className="text-xs text-brand-warm mb-2">
                  Macros calculados para {quantity}
                  {selected.servingUnit}:
                </p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <Macro
                    label="Cal"
                    value={Math.round(
                      (selected.calories * parseFloat(quantity)) /
                        selected.servingSize
                    )}
                  />
                  <Macro
                    label="Prot"
                    value={Math.round(
                      (selected.protein * parseFloat(quantity)) /
                        selected.servingSize
                    )}
                    suffix="g"
                  />
                  <Macro
                    label="Carbs"
                    value={Math.round(
                      (selected.carbs * parseFloat(quantity)) /
                        selected.servingSize
                    )}
                    suffix="g"
                  />
                  <Macro
                    label="Grasa"
                    value={Math.round(
                      (selected.fat * parseFloat(quantity)) /
                        selected.servingSize
                    )}
                    suffix="g"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selected && (
          <footer className="px-6 py-4 border-t border-brand-cream flex gap-3 justify-end">
            <button
              onClick={() => setSelected(null)}
              className="px-5 py-2.5 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
            >
              Volver
            </button>
            <button
              onClick={handleAdd}
              disabled={!quantity || parseFloat(quantity) <= 0}
              className="px-6 py-2.5 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
            >
              Agregar a la comida
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

function Macro({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-xl font-bold text-brand-dark">
        {value}
        {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </p>
      <p className="text-xs text-brand-warm uppercase tracking-wider">{label}</p>
    </div>
  );
}
