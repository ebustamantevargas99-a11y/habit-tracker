"use client";

/**
 * Recipe Builder — crear / editar / ver recetas custom.
 *
 * Una receta agrupa N FoodItems con cantidad cada uno. Al guardarla, la app
 * calcula totales (todos los nutrientes) + por porción. Útil para comidas
 * repetidas: "Mi bowl" = arroz 150g + pollo 200g + aguacate 80g, lo loggeas
 * 1 vez y siempre que lo comas añades la receta al diario de comidas.
 *
 * Estados:
 *   list   → cards de recetas con búsqueda + "Nueva"
 *   editor → form + picker de ingredientes + totales en vivo
 *   detail → cards de ingredientes + tabla de nutrientes / porción
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChefHat,
  Minus,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useNutritionStore } from "@/stores/nutrition-store";
import type { FoodItem } from "@/stores/nutrition-store";
import {
  computeRecipeTotals,
  perServing,
  totalGrams,
  type RecipeTotals,
} from "@/lib/nutrition/recipe-totals";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipeItem {
  id: string;
  foodItemId: string;
  quantity: number;
  unit: string;
  foodItem: FoodItem;
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  createdAt: string;
  updatedAt: string;
  items: RecipeItem[];
}

interface DraftItem {
  foodItem: FoodItem;
  quantity: number;
  unit: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecipeBuilder() {
  const { foodItems } = useNutritionStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "new" | "edit" | "detail">("list");
  const [active, setActive] = useState<Recipe | null>(null);
  const [search, setSearch] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.get<Recipe[]>("/nutrition/recipes");
      setRecipes(list ?? []);
    } catch {
      toast.error("Error cargando recetas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar esta receta?")) return;
    try {
      await api.delete(`/nutrition/recipes/${id}`);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (active?.id === id) {
        setActive(null);
        setMode("list");
      }
      toast.success("Receta borrada");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error";
      toast.error(msg);
    }
  }

  // ─── Render switch ────────────────────────────────────────────────────────

  if (mode === "new") {
    return (
      <RecipeEditor
        availableFoods={foodItems}
        onSubmit={async (payload) => {
          const created = await api.post<Recipe>(
            "/nutrition/recipes",
            payload,
          );
          setRecipes((prev) => [created, ...prev]);
          setActive(created);
          setMode("detail");
          toast.success("Receta creada");
        }}
        onCancel={() => setMode("list")}
      />
    );
  }

  if (mode === "edit" && active) {
    return (
      <RecipeEditor
        availableFoods={foodItems}
        initial={active}
        onSubmit={async (payload) => {
          const updated = await api.patch<Recipe>(
            `/nutrition/recipes/${active.id}`,
            payload,
          );
          setRecipes((prev) =>
            prev.map((r) => (r.id === active.id ? updated : r)),
          );
          setActive(updated);
          setMode("detail");
          toast.success("Receta actualizada");
        }}
        onCancel={() => setMode("detail")}
      />
    );
  }

  if (mode === "detail" && active) {
    return (
      <RecipeDetail
        recipe={active}
        onEdit={() => setMode("edit")}
        onDelete={() => handleDelete(active.id)}
        onClose={() => {
          setActive(null);
          setMode("list");
        }}
      />
    );
  }

  // Lista
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recetas..."
            className="w-full py-2 pr-2 pl-9 border border-brand-light-tan rounded-lg text-sm text-brand-dark bg-brand-warm-white box-border"
          />
        </div>
        <button
          onClick={() => setMode("new")}
          disabled={foodItems.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white border-none rounded-lg cursor-pointer text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          title={
            foodItems.length === 0
              ? "Primero crea alimentos en Mis Alimentos"
              : undefined
          }
        >
          <Plus size={16} /> Nueva receta
        </button>
      </div>

      {foodItems.length === 0 && (
        <Card variant="default" padding="sm" className="border-brand-light-tan">
          <p className="text-xs text-brand-warm m-0">
            ℹ️ Para crear recetas primero necesitas alimentos en <em>Mis
            Alimentos</em>. Los alimentos son los ingredientes.
          </p>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-brand-warm text-sm p-8">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card
          variant="default"
          padding="md"
          className="border-brand-light-tan text-center"
        >
          <ChefHat size={40} className="mx-auto mb-3 opacity-40 text-brand-warm" />
          <h3 className="font-serif text-lg text-brand-dark m-0">
            {recipes.length === 0
              ? "Aún no tienes recetas"
              : "Ninguna receta coincide"}
          </h3>
          <p className="text-brand-warm text-sm m-0 mt-1 max-w-md mx-auto">
            Crea recetas para tus comidas repetidas (&quot;mi bowl&quot;,
            &quot;smoothie matutino&quot;) y añádelas al diario con 1 click
            en vez de re-armar los ingredientes cada día.
          </p>
        </Card>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onOpen={() => {
                setActive(r);
                setMode("detail");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RecipeCard ───────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onOpen,
}: {
  recipe: Recipe;
  onOpen: () => void;
}) {
  const totals = computeRecipeTotals(recipe.items);
  const perServ = perServing(totals, recipe.servings);
  const grams = totalGrams(recipe.items);

  return (
    <button
      onClick={onOpen}
      className="text-left bg-brand-warm-white rounded-[10px] p-4 border border-brand-cream hover:border-accent transition"
      type="button"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-brand-dark truncate">
            {recipe.name}
          </div>
          {recipe.description && (
            <div className="text-xs text-brand-warm truncate mt-0.5">
              {recipe.description}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-brand-warm mb-2">
        {recipe.items.length} ingrediente{recipe.items.length === 1 ? "" : "s"}{" "}
        · {recipe.servings} porc{recipe.servings === 1 ? "ión" : "iones"} ·{" "}
        {grams} g total
      </div>
      <div className="flex gap-3 text-xs items-baseline pt-2 border-t border-brand-light-cream">
        <span className="font-bold text-accent text-base font-mono">
          {Math.round(perServ.calories ?? 0)}
        </span>
        <span className="text-brand-warm">kcal / porción</span>
      </div>
      <div className="flex gap-2 text-[11px] font-mono mt-1">
        <span className="text-success">
          P {Math.round(perServ.protein ?? 0)}g
        </span>
        <span className="text-accent-light">
          C {Math.round(perServ.carbs ?? 0)}g
        </span>
        <span className="text-brand-medium">
          G {Math.round(perServ.fat ?? 0)}g
        </span>
      </div>
    </button>
  );
}

// ─── RecipeEditor ────────────────────────────────────────────────────────────

interface EditorSubmitPayload {
  name: string;
  description: string | null;
  servings: number;
  items: Array<{ foodItemId: string; quantity: number; unit: string }>;
}

function RecipeEditor({
  initial,
  availableFoods,
  onSubmit,
  onCancel,
}: {
  initial?: Recipe;
  availableFoods: FoodItem[];
  onSubmit: (payload: EditorSubmitPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [servings, setServings] = useState<string>(
    String(initial?.servings ?? 1),
  );
  const [items, setItems] = useState<DraftItem[]>(() =>
    initial
      ? initial.items.map((it) => ({
          foodItem: it.foodItem,
          quantity: it.quantity,
          unit: it.unit,
        }))
      : [],
  );
  const [pickerSearch, setPickerSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Totales en vivo
  const totals = useMemo(() => computeRecipeTotals(items), [items]);
  const servN = Math.max(1, parseInt(servings, 10) || 1);
  const perServ = useMemo(() => perServing(totals, servN), [totals, servN]);
  const grams = useMemo(() => totalGrams(items), [items]);

  const filteredFoods = useMemo(() => {
    const q = pickerSearch.toLowerCase();
    return availableFoods
      .filter((f) => !items.some((i) => i.foodItem.id === f.id))
      .filter(
        (f) =>
          !q ||
          f.name.toLowerCase().includes(q) ||
          (f.brand ?? "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [availableFoods, pickerSearch, items]);

  function addFood(food: FoodItem) {
    setItems((prev) => [
      ...prev,
      { foodItem: food, quantity: food.servingSize, unit: food.servingUnit },
    ]);
    setPickerSearch("");
    setShowPicker(false);
  }

  function removeIngredient(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function setIngredientQty(idx: number, qty: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, quantity: qty } : it)),
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (items.length === 0) {
      toast.error("Añade al menos 1 ingrediente");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        servings: servN,
        items: items.map((it) => ({
          foodItemId: it.foodItem.id,
          quantity: it.quantity,
          unit: it.unit,
        })),
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error guardando";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!initial;

  return (
    <Card
      variant="default"
      padding="md"
      className="border-accent flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-lg text-brand-dark m-0">
            {isEdit ? "Editar receta" : "Nueva receta"}
          </h3>
          <p className="text-xs text-brand-warm m-0 mt-0.5">
            Añade ingredientes con su cantidad — la app suma todos los
            nutrientes automáticamente.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded hover:bg-brand-cream text-brand-warm"
          type="button"
        >
          <X size={14} />
        </button>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Label>Nombre *</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi bowl energético"
            className={INP}
          />
        </div>
        <div>
          <Label>Porciones</Label>
          <input
            type="number"
            min={1}
            max={100}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className={INP}
          />
        </div>
        <div className="sm:col-span-3">
          <Label>Descripción</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional — ocasión, método de preparación, etc."
            rows={2}
            className={cn(INP, "resize-none")}
          />
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Ingredientes ({items.length})</Label>
          <button
            onClick={() => setShowPicker(true)}
            disabled={availableFoods.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40"
            type="button"
          >
            <Plus size={12} /> Añadir
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center p-6 rounded-lg bg-brand-warm-white border border-dashed border-brand-light-tan">
            <p className="text-sm text-brand-warm m-0">
              {availableFoods.length === 0
                ? "Crea alimentos primero en la pestaña Mis Alimentos."
                : 'Click "Añadir" para elegir un ingrediente.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((it, idx) => (
              <IngredientRow
                key={`${it.foodItem.id}-${idx}`}
                item={it}
                onChange={(qty) => setIngredientQty(idx, qty)}
                onRemove={() => removeIngredient(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Food picker modal */}
      {showPicker && (
        <FoodPicker
          foods={filteredFoods}
          search={pickerSearch}
          onSearchChange={setPickerSearch}
          onPick={addFood}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Totales en vivo */}
      {items.length > 0 && (
        <TotalsBlock totals={totals} perServ={perServ} grams={grams} servings={servN} />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-brand-light-cream">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-button bg-transparent text-brand-medium border border-brand-light-tan text-sm hover:bg-brand-cream"
          type="button"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim() || items.length === 0}
          className="flex items-center gap-1.5 px-5 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
          type="button"
        >
          <Save size={14} />
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear receta"}
        </button>
      </div>
    </Card>
  );
}

// ─── IngredientRow ───────────────────────────────────────────────────────────

function IngredientRow({
  item,
  onChange,
  onRemove,
}: {
  item: DraftItem;
  onChange: (qty: number) => void;
  onRemove: () => void;
}) {
  // Calorías del ingrediente escaladas
  const base = item.foodItem.servingSize;
  const factor = base > 0 ? item.quantity / base : 0;
  const kcal = Math.round(item.foodItem.calories * factor);

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-warm-white border border-brand-light-cream">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-brand-dark m-0 font-semibold truncate">
          {item.foodItem.name}
        </p>
        {item.foodItem.brand && (
          <p className="text-[11px] text-brand-warm m-0">
            {item.foodItem.brand}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, item.quantity - 10))}
          className="p-1 rounded hover:bg-brand-cream text-brand-warm"
          type="button"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          step="1"
          min={0}
          value={item.quantity}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-16 px-2 py-1 text-sm text-center font-mono rounded border border-brand-cream bg-brand-paper"
        />
        <span className="text-[11px] text-brand-warm font-mono">
          {item.unit}
        </span>
        <button
          onClick={() => onChange(item.quantity + 10)}
          className="p-1 rounded hover:bg-brand-cream text-brand-warm"
          type="button"
        >
          <Plus size={12} />
        </button>
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-mono text-accent font-semibold">
          {kcal}
        </span>
        <span className="text-[10px] text-brand-warm ml-1">kcal</span>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-danger-light/40 text-brand-warm hover:text-danger"
        type="button"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ─── FoodPicker (modal-like inline) ──────────────────────────────────────────

function FoodPicker({
  foods,
  search,
  onSearchChange,
  onPick,
  onClose,
}: {
  foods: FoodItem[];
  search: string;
  onSearchChange: (v: string) => void;
  onPick: (food: FoodItem) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-brand-dark/60 flex items-center justify-center p-4">
      <div className="bg-brand-paper rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-light-cream">
          <h4 className="font-serif text-base text-brand-dark m-0">
            Elegir ingrediente
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-brand-cream text-brand-warm"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-3 border-b border-brand-light-cream">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium"
            />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar alimento..."
              autoFocus
              className="w-full py-2 pr-2 pl-9 border border-brand-light-tan rounded-lg text-sm bg-brand-warm-white"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {foods.length === 0 ? (
            <p className="text-center text-brand-warm text-sm p-6 m-0">
              {search
                ? "Ningún alimento coincide."
                : "Ya añadiste todos tus alimentos."}
            </p>
          ) : (
            foods.map((f) => (
              <button
                key={f.id}
                onClick={() => onPick(f)}
                className="w-full text-left px-3 py-2 rounded hover:bg-brand-cream flex items-baseline justify-between gap-3 cursor-pointer"
                type="button"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-dark m-0 font-semibold truncate">
                    {f.name}
                  </p>
                  <p className="text-[11px] text-brand-warm m-0">
                    {f.brand ? `${f.brand} · ` : ""}
                    {f.servingSize}
                    {f.servingUnit}
                  </p>
                </div>
                <span className="text-xs font-mono text-accent shrink-0">
                  {f.calories} kcal
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TotalsBlock ─────────────────────────────────────────────────────────────

function TotalsBlock({
  totals,
  perServ,
  grams,
  servings,
}: {
  totals: RecipeTotals;
  perServ: RecipeTotals;
  grams: number;
  servings: number;
}) {
  return (
    <Card
      variant="default"
      padding="sm"
      className="bg-brand-warm-white border-brand-dark"
    >
      <div className="flex flex-wrap gap-4 justify-between items-start mb-3">
        <h4 className="font-serif text-base text-brand-dark m-0">
          Totales
        </h4>
        <p className="text-xs text-brand-warm m-0">
          {grams} g total · {servings} porc{servings === 1 ? "ión" : "iones"}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Stat
          label="Por porción"
          main={`${Math.round(perServ.calories ?? 0)} kcal`}
          sub={`P ${Math.round(perServ.protein ?? 0)}g · C ${Math.round(perServ.carbs ?? 0)}g · G ${Math.round(perServ.fat ?? 0)}g`}
          highlight
        />
        <Stat
          label="Total receta"
          main={`${Math.round(totals.calories ?? 0)} kcal`}
          sub={`P ${Math.round(totals.protein ?? 0)}g · C ${Math.round(totals.carbs ?? 0)}g · G ${Math.round(totals.fat ?? 0)}g`}
        />
        <Stat
          label="Fibra / porción"
          main={`${(perServ.fiber ?? 0).toFixed(1)}g`}
        />
        <Stat
          label="Sodio / porción"
          main={`${Math.round(perServ.sodium ?? 0)}mg`}
        />
      </div>
    </Card>
  );
}

function Stat({
  label,
  main,
  sub,
  highlight,
}: {
  label: string;
  main: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-2 border",
        highlight
          ? "bg-accent/10 border-accent"
          : "bg-brand-paper border-brand-light-cream",
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
        {label}
      </p>
      <p
        className={cn(
          "font-mono m-0 mt-0.5",
          highlight ? "text-lg text-accent" : "text-sm text-brand-dark",
        )}
      >
        {main}
      </p>
      {sub && (
        <p className="text-[10px] text-brand-warm font-mono m-0 mt-0.5">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── RecipeDetail ─────────────────────────────────────────────────────────────

function RecipeDetail({
  recipe,
  onEdit,
  onDelete,
  onClose,
}: {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const totals = useMemo(() => computeRecipeTotals(recipe.items), [recipe]);
  const perServ = useMemo(
    () => perServing(totals, recipe.servings),
    [totals, recipe.servings],
  );
  const grams = useMemo(() => totalGrams(recipe.items), [recipe.items]);

  return (
    <Card variant="default" padding="md" className="border-accent flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-xl text-brand-dark m-0">
            {recipe.name}
          </h3>
          {recipe.description && (
            <p className="text-sm text-brand-warm m-0 mt-1">
              {recipe.description}
            </p>
          )}
          <p className="text-xs text-brand-warm m-0 mt-1">
            {recipe.items.length} ingrediente
            {recipe.items.length === 1 ? "" : "s"} · {recipe.servings} porción
            {recipe.servings === 1 ? "" : "es"} · {grams}g total
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded hover:bg-accent/10 text-accent"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded hover:bg-danger-light/40 text-danger"
            title="Borrar"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-brand-cream text-brand-warm"
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <SectionTitle>Ingredientes</SectionTitle>
        <div className="flex flex-col gap-2">
          {recipe.items.map((it) => {
            const factor = it.foodItem.servingSize > 0 ? it.quantity / it.foodItem.servingSize : 0;
            const kcal = Math.round(it.foodItem.calories * factor);
            return (
              <div
                key={it.id}
                className="flex items-baseline justify-between gap-3 px-3 py-2 rounded bg-brand-paper border border-brand-light-cream text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-brand-dark font-semibold">
                    {it.foodItem.name}
                  </span>
                  {it.foodItem.brand && (
                    <span className="text-brand-warm text-xs ml-2">
                      {it.foodItem.brand}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-brand-warm shrink-0">
                  {it.quantity} {it.unit}
                </span>
                <span className="font-mono text-xs text-accent shrink-0 min-w-[60px] text-right">
                  {kcal} kcal
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totales */}
      <TotalsBlock
        totals={totals}
        perServ={perServ}
        grams={grams}
        servings={recipe.servings}
      />

      {/* Nutrientes extendidos */}
      <NutrientsGrid totals={perServ} />

      <p className="text-[10px] text-brand-tan m-0 mt-1 border-t border-brand-light-cream pt-2">
        Valores por porción. Creada {new Date(recipe.createdAt).toLocaleDateString()} · última edición{" "}
        {new Date(recipe.updatedAt).toLocaleDateString()}.
      </p>
    </Card>
  );
}

function NutrientsGrid({ totals }: { totals: RecipeTotals }) {
  const rows: Array<{ label: string; value: number | undefined; unit: string }> = [
    { label: "Fibra", value: totals.fiber, unit: "g" },
    { label: "Azúcar", value: totals.sugar, unit: "g" },
    { label: "Saturada", value: totals.saturatedFat, unit: "g" },
    { label: "Colesterol", value: totals.cholesterol, unit: "mg" },
    { label: "Sodio", value: totals.sodium, unit: "mg" },
    { label: "Potasio", value: totals.potassium, unit: "mg" },
    { label: "Calcio", value: totals.calcium, unit: "mg" },
    { label: "Hierro", value: totals.iron, unit: "mg" },
    { label: "Vit A", value: totals.vitaminA, unit: "μg" },
    { label: "Vit C", value: totals.vitaminC, unit: "mg" },
    { label: "Vit D", value: totals.vitaminD, unit: "μg" },
    { label: "B12", value: totals.vitaminB12, unit: "μg" },
  ];
  const withValues = rows.filter(
    (r) => typeof r.value === "number" && Number.isFinite(r.value) && r.value > 0,
  );
  if (withValues.length === 0) return null;
  return (
    <div>
      <SectionTitle>Nutrientes / porción</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {withValues.map((r) => (
          <div
            key={r.label}
            className="px-3 py-2 rounded bg-brand-paper border border-brand-light-cream text-xs"
          >
            <p className="text-[10px] text-brand-warm m-0">{r.label}</p>
            <p className="font-mono text-brand-dark m-0 mt-0.5">
              {fmt(r.value!)} {r.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INP =
  "w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm text-brand-dark box-border";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
      {children}
    </p>
  );
}

function fmt(v: number): string {
  return v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : String(Math.round(v));
}
