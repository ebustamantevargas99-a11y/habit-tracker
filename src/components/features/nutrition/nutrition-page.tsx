"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  Plus, Trash2, Search, Target, UtensilsCrossed, Apple, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { colors } from "@/lib/colors";
import { useNutritionStore, MealLog, FoodItem } from "@/stores/nutrition-store";
import { useAppStore } from "@/stores/app-store";
import { cn, ErrorBanner } from "@/components/ui";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

// Static known colors → Tailwind border-l classes
const MEAL_BORDER: Record<string, string> = {
  breakfast: "border-l-accent-light",
  lunch:     "border-l-success",
  dinner:    "border-l-brand-medium",
  snack:     "border-l-info",
};

// Used for recharts/icon color props (not inline styles)
const MACRO_COLORS = [colors.success, colors.accentLight, colors.medium];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function macroRing(protein: number, carbs: number, fat: number) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total === 0) return [];
  return [
    { name: "Proteína", value: protein * 4, pct: Math.round((protein * 4 / total) * 100) },
    { name: "Carbs",    value: carbs * 4,   pct: Math.round((carbs * 4 / total) * 100) },
    { name: "Grasa",    value: fat * 9,     pct: Math.round((fat * 9 / total) * 100) },
  ];
}

const INP = "w-full px-2 py-2 border border-brand-light-tan rounded-md text-sm text-brand-dark box-border";

// ─── Tab Components ───────────────────────────────────────────────────────────

function DiaryTab() {
  const {
    meals, foodItems, dailySummary, goals, selectedDate,
    addMeal, deleteMeal, addItemToMeal, removeItemFromMeal, setDate,
  } = useNutritionStore();

  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showAddFood, setShowAddFood] = useState<string | null>(null);
  const [searchFood, setSearchFood] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [addingMeal, setAddingMeal] = useState<string | null>(null);

  const filteredFoods = foodItems.filter(
    (f) => f.name.toLowerCase().includes(searchFood.toLowerCase())
  );

  const handleAddMeal = async (mealType: MealLog["mealType"]) => {
    setAddingMeal(mealType);
    await addMeal(mealType);
    setAddingMeal(null);
  };

  const handleAddItem = async () => {
    if (!showAddFood || !selectedFood) return;
    await addItemToMeal(showAddFood, selectedFood.id, parseFloat(quantity) || 100);
    setShowAddFood(null);
    setSelectedFood(null);
    setSearchFood("");
    setQuantity("100");
  };

  const totals = dailySummary?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goal = goals;
  const macros = macroRing(totals.protein, totals.carbs, totals.fat);

  return (
    <div className="flex flex-col gap-6">
      {/* Date Picker + Summary */}
      <div className="flex gap-4 flex-wrap items-start">
        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-brand-medium">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-brand-light-tan rounded-md bg-brand-paper text-brand-dark text-sm"
          />
        </div>

        {/* Calorie ring summary */}
        <div className="flex-1 min-w-[280px] bg-brand-warm-white rounded-xl p-4 border border-brand-cream flex gap-6 items-center">
          <div className="w-20 h-20 shrink-0">
            <PieChart width={80} height={80}>
              <Pie
                data={macros.length ? macros : [{ name: "Vacío", value: 1 }]}
                cx={35} cy={35} innerRadius={25} outerRadius={38}
                dataKey="value" startAngle={90} endAngle={-270}
              >
                {macros.length
                  ? macros.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)
                  : [<Cell key={0} fill={colors.cream} />]}
              </Pie>
            </PieChart>
          </div>
          <div className="flex-1">
            <div className="text-[1.5rem] font-bold text-brand-dark">
              {Math.round(totals.calories)}{" "}
              <span className="text-sm font-normal text-brand-medium">kcal</span>
            </div>
            {goal && (
              <div className="text-xs text-brand-medium mb-2">
                Meta: {goal.calories} kcal ({Math.round((totals.calories / goal.calories) * 100)}%)
              </div>
            )}
            <div className="flex gap-4">
              {[
                { label: "P", value: totals.protein, cls: "text-success" },
                { label: "C", value: totals.carbs,   cls: "text-accent-light" },
                { label: "G", value: totals.fat,     cls: "text-brand-medium" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="text-center">
                  <div className={cn("text-xs", cls)}>{label}</div>
                  <div className="text-sm font-semibold text-brand-dark">{Math.round(value)}g</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Cards */}
      {(["breakfast", "lunch", "dinner", "snack"] as MealLog["mealType"][]).map((mealType) => {
        const meal = meals.find((m) => m.mealType === mealType);
        const mealCalories = meal ? meal.items.reduce((s, i) => s + i.calories, 0) : 0;

        return (
          <div
            key={mealType}
            className="bg-brand-warm-white rounded-xl border border-brand-cream overflow-hidden"
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between px-5 py-[14px] border-l-4",
                MEAL_BORDER[mealType],
                meal ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => meal && setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-brand-dark">{MEAL_LABELS[mealType]}</span>
                {meal && (
                  <span className="text-xs text-brand-medium bg-brand-cream px-2 py-[2px] rounded-[4px]">
                    {Math.round(mealCalories)} kcal
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                {!meal ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddMeal(mealType); }}
                    disabled={addingMeal === mealType}
                    className="flex items-center gap-[6px] px-3 py-[6px] bg-accent text-white border-none rounded-md cursor-pointer text-[0.8rem]"
                  >
                    <Plus size={14} /> Agregar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddFood(meal.id); }}
                      className="flex items-center gap-[6px] px-3 py-[6px] bg-accent text-white border-none rounded-md cursor-pointer text-[0.8rem]"
                    >
                      <Plus size={14} /> Alimento
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id); }}
                      className="bg-transparent border-none cursor-pointer text-danger p-[6px]"
                    >
                      <Trash2 size={16} />
                    </button>
                    {expandedMeal === meal.id
                      ? <ChevronUp size={16} color={colors.medium} />
                      : <ChevronDown size={16} color={colors.medium} />
                    }
                  </>
                )}
              </div>
            </div>

            {/* Items */}
            {meal && expandedMeal === meal.id && (
              <div className="border-t border-brand-cream px-5 py-2">
                {meal.items.length === 0 ? (
                  <p className="text-[0.8rem] text-brand-medium text-center py-3">
                    Sin alimentos. Agrega uno con el botón de arriba.
                  </p>
                ) : (
                  meal.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-brand-light-cream">
                      <div>
                        <span className="text-sm text-brand-dark">{item.foodItem.name}</span>
                        <span className="text-xs text-brand-medium ml-2">{item.quantity}g</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-brand-medium">
                          {Math.round(item.calories)} kcal · {Math.round(item.protein)}P · {Math.round(item.carbs)}C · {Math.round(item.fat)}G
                        </span>
                        <button
                          onClick={() => removeItemFromMeal(item.id, meal.id)}
                          className="bg-transparent border-none cursor-pointer text-danger p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-brand-paper rounded-[16px] p-6 w-[min(480px,90vw)] max-h-[80vh] flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="m-0 text-brand-dark">Agregar alimento</h3>
              <button onClick={() => setShowAddFood(null)} className="bg-transparent border-none cursor-pointer">
                <X size={20} color={colors.medium} />
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium" />
              <input
                value={searchFood}
                onChange={(e) => setSearchFood(e.target.value)}
                placeholder="Buscar alimento..."
                className="w-full py-2 pr-2 pl-9 border border-brand-light-tan rounded-lg text-sm text-brand-dark bg-brand-warm-white box-border"
              />
            </div>

            {/* Food list */}
            <div className="flex-1 overflow-y-auto max-h-[250px] flex flex-col gap-1">
              {filteredFoods.length === 0 ? (
                <p className="text-[0.8rem] text-brand-medium text-center p-4">
                  No hay alimentos. Agrégalos en la pestaña &ldquo;Mis Alimentos&rdquo;.
                </p>
              ) : (
                filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className={cn(
                      "px-3 py-[10px] rounded-lg cursor-pointer border",
                      selectedFood?.id === food.id
                        ? "bg-accent-glow border-accent"
                        : "border-transparent"
                    )}
                  >
                    <div className="font-medium text-sm text-brand-dark">{food.name}</div>
                    <div className="text-xs text-brand-medium">
                      {food.calories} kcal / {food.servingSize}{food.servingUnit} · {food.protein}P {food.carbs}C {food.fat}G
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedFood && (
              <div className="flex gap-3 items-center">
                <label className="text-[0.8rem] text-brand-medium whitespace-nowrap">Cantidad (g):</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 px-2 py-2 border border-brand-light-tan rounded-md text-sm text-brand-dark"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddFood(null)}
                className="px-4 py-2 border border-brand-light-tan rounded-lg bg-transparent cursor-pointer text-brand-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedFood}
                className={cn(
                  "px-5 py-2 text-white border-none rounded-lg",
                  selectedFood ? "bg-accent cursor-pointer" : "bg-brand-light-tan cursor-default"
                )}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTab() {
  const [weeklyData, setWeeklyData] = useState<{
    days: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
    averages: { calories: number; protein: number; carbs: number; fat: number };
  } | null>(null);
  const { goals } = useNutritionStore();

  useEffect(() => {
    fetch("/api/nutrition/weekly-summary")
      .then((r) => r.json())
      .then(setWeeklyData)
      .catch(() => {});
  }, []);

  const chartData = weeklyData?.days.map((d) => ({
    date: d.date.slice(5),
    calories: Math.round(d.calories),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
  })) ?? [];

  const avgs = weeklyData?.averages;

  const AVG_CARDS = [
    { label: "Calorías promedio", value: Math.round(avgs?.calories ?? 0), unit: "kcal",  textCls: "text-accent",        bgCls: "bg-accent",        goal: goals?.calories },
    { label: "Proteína promedio", value: Math.round(avgs?.protein ?? 0),  unit: "g/día", textCls: "text-success",       bgCls: "bg-success",       goal: goals?.protein  },
    { label: "Carbs promedio",    value: Math.round(avgs?.carbs ?? 0),    unit: "g/día", textCls: "text-accent-light",  bgCls: "bg-accent-light",  goal: goals?.carbs    },
    { label: "Grasa promedio",    value: Math.round(avgs?.fat ?? 0),      unit: "g/día", textCls: "text-brand-medium",  bgCls: "bg-brand-medium",  goal: goals?.fat      },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Average cards */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] gap-4">
        {AVG_CARDS.map(({ label, value, unit, textCls, bgCls, goal: g }) => (
          <div key={label} className="bg-brand-warm-white rounded-xl p-4 border border-brand-cream">
            <div className="text-xs text-brand-medium mb-2">{label}</div>
            <div className={cn("text-[1.5rem] font-bold", textCls)}>{value}</div>
            <div className="text-xs text-brand-medium">{unit}</div>
            {g && (
              <div className="mt-2">
                <div className="h-1 bg-brand-cream rounded-[2px] overflow-hidden">
                  <div
                    className={cn("h-full rounded-[2px]", bgCls)}
                    style={{ width: `${Math.min(100, (value / g) * 100)}%` }}
                  />
                </div>
                <div className="text-[0.7rem] text-brand-medium mt-1">{Math.round((value / g) * 100)}% meta</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Calorie chart */}
      <div className="bg-brand-warm-white rounded-xl p-5 border border-brand-cream">
        <h3 className="m-0 mb-4 text-base text-brand-dark">Calorías (7 días)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.cream} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.medium }} />
            <YAxis tick={{ fontSize: 12, fill: colors.medium }} />
            <Tooltip contentStyle={{ backgroundColor: colors.paper, border: `1px solid ${colors.lightTan}` }} />
            <Bar dataKey="calories" fill={colors.accent} radius={[4, 4, 0, 0]} />
            {goals && <Bar dataKey={() => goals.calories} fill="transparent" stroke={colors.accentLight} strokeDasharray="4 4" />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Macro breakdown chart */}
      <div className="bg-brand-warm-white rounded-xl p-5 border border-brand-cream">
        <h3 className="m-0 mb-4 text-base text-brand-dark">Macros (7 días)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.cream} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.medium }} />
            <YAxis tick={{ fontSize: 12, fill: colors.medium }} />
            <Tooltip contentStyle={{ backgroundColor: colors.paper, border: `1px solid ${colors.lightTan}` }} />
            <Line type="monotone" dataKey="protein" stroke={colors.success}    dot={false} name="Proteína" />
            <Line type="monotone" dataKey="carbs"   stroke={colors.accentLight} dot={false} name="Carbs"   />
            <Line type="monotone" dataKey="fat"     stroke={colors.medium}     dot={false} name="Grasa"   />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FoodsTab() {
  const { foodItems, addFoodItem, deleteFoodItem } = useNutritionStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", brand: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", servingSize: "100", servingUnit: "g",
  });

  const filtered = foodItems.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async () => {
    if (!form.name || !form.calories) return;
    await addFoodItem({
      name: form.name, brand: form.brand || null,
      servingSize: parseFloat(form.servingSize) || 100, servingUnit: form.servingUnit,
      calories: parseFloat(form.calories) || 0, protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0, fat: parseFloat(form.fat) || 0,
      fiber: parseFloat(form.fiber) || 0, sugar: 0, sodium: 0,
    });
    setForm({ name: "", brand: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", servingSize: "100", servingUnit: "g" });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alimentos..."
            className="w-full py-2 pr-2 pl-9 border border-brand-light-tan rounded-lg text-sm text-brand-dark bg-brand-warm-white box-border"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white border-none rounded-lg cursor-pointer"
        >
          <Plus size={16} /> Nuevo alimento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-brand-warm-white rounded-xl p-5 border border-brand-cream">
          <h4 className="m-0 mb-4 text-brand-dark">Nuevo alimento</h4>
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {[
              { key: "name",        label: "Nombre *",       type: "text"   },
              { key: "brand",       label: "Marca",          type: "text"   },
              { key: "servingSize", label: "Porción",        type: "number" },
              { key: "servingUnit", label: "Unidad",         type: "text"   },
              { key: "calories",    label: "Calorías *",     type: "number" },
              { key: "protein",     label: "Proteína (g)",   type: "number" },
              { key: "carbs",       label: "Carbs (g)",      type: "number" },
              { key: "fat",         label: "Grasa (g)",      type: "number" },
              { key: "fiber",       label: "Fibra (g)",      type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs text-brand-medium block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className={INP}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-brand-light-tan rounded-lg bg-transparent cursor-pointer text-brand-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-accent text-white border-none rounded-lg cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Food list */}
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center p-12 text-brand-medium">
            <Apple size={40} className="mb-3 opacity-40 mx-auto" />
            <p>No hay alimentos. Agrega uno con el botón &ldquo;Nuevo alimento&rdquo;.</p>
          </div>
        ) : (
          filtered.map((food) => (
            <div
              key={food.id}
              className="bg-brand-warm-white rounded-[10px] p-4 border border-brand-cream flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-brand-dark">{food.name}</div>
                  {food.brand && <div className="text-xs text-brand-medium">{food.brand}</div>}
                </div>
                <button
                  onClick={() => deleteFoodItem(food.id)}
                  className="bg-transparent border-none cursor-pointer text-danger p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="font-bold text-accent">{food.calories} kcal</span>
                <span className="text-brand-medium">por {food.servingSize}{food.servingUnit}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-success">P {food.protein}g</span>
                <span className="text-accent-light">C {food.carbs}g</span>
                <span className="text-brand-medium">G {food.fat}g</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GoalsTab() {
  const { goals, updateGoals } = useNutritionStore();
  const [form, setForm] = useState({
    calories: goals?.calories ?? 2000,
    protein: goals?.protein ?? 150,
    carbs: goals?.carbs ?? 200,
    fat: goals?.fat ?? 65,
    fiber: goals?.fiber ?? 25,
    waterMl: goals?.waterMl ?? 2500,
    mealsPerDay: goals?.mealsPerDay ?? 3,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (goals) setForm({
      calories: goals.calories, protein: goals.protein, carbs: goals.carbs,
      fat: goals.fat, fiber: goals.fiber, waterMl: goals.waterMl, mealsPerDay: goals.mealsPerDay,
    });
  }, [goals]);

  const handleSave = async () => {
    await updateGoals(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalCalFromMacros = form.protein * 4 + form.carbs * 4 + form.fat * 9;

  return (
    <div className="flex flex-col gap-6 max-w-[600px]">
      <div className="bg-brand-warm-white rounded-xl p-6 border border-brand-cream">
        <h3 className="m-0 mb-5 text-brand-dark">Metas Nutricionales</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "calories",    label: "Calorías (kcal/día)",    min: 1000, max: 5000 },
            { key: "protein",     label: "Proteína (g/día)",       min: 0,    max: 400  },
            { key: "carbs",       label: "Carbohidratos (g/día)",  min: 0,    max: 600  },
            { key: "fat",         label: "Grasas (g/día)",         min: 0,    max: 200  },
            { key: "fiber",       label: "Fibra (g/día)",          min: 0,    max: 100  },
            { key: "waterMl",     label: "Agua (ml/día)",          min: 500,  max: 6000 },
            { key: "mealsPerDay", label: "Comidas/día",            min: 1,    max: 8    },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="text-xs text-brand-medium block mb-1">{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-brand-light-tan rounded-lg text-sm text-brand-dark box-border"
              />
            </div>
          ))}
        </div>

        {/* Macro distribution preview */}
        <div className="mt-5 p-[14px] bg-brand-cream rounded-lg">
          <div className="text-xs text-brand-medium mb-2">Distribución de calorías desde macros</div>
          <div className="text-sm text-brand-dark">
            P: {Math.round((form.protein * 4 / totalCalFromMacros) * 100)}% · C: {Math.round((form.carbs * 4 / totalCalFromMacros) * 100)}% · G: {Math.round((form.fat * 9 / totalCalFromMacros) * 100)}%
            {" "}= {totalCalFromMacros} kcal totales
          </div>
          {Math.abs(totalCalFromMacros - form.calories) > 50 && (
            <div className="text-xs text-warning mt-1">
              Los macros suman {totalCalFromMacros} kcal, diferente a tu meta de {form.calories} kcal.
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className={cn(
            "mt-5 px-6 py-[10px] text-white border-none rounded-lg cursor-pointer transition-[background-color] duration-300",
            saved ? "bg-success" : "bg-accent"
          )}
        >
          {saved ? "¡Guardado!" : "Guardar metas"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "diario",    label: "Diario",         icon: UtensilsCrossed },
  { id: "resumen",   label: "Resumen 7d",     icon: BarChart        },
  { id: "alimentos", label: "Mis Alimentos",  icon: Apple           },
  { id: "metas",     label: "Metas",          icon: Target          },
] as const;

export default function NutritionPage() {
  const activeTab = useAppStore((s) => s.nutritionTab);
  const setActiveTab = useAppStore((s) => s.setNutritionTab);
  const { initialize, isLoaded, error, clearError } = useNutritionStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col gap-6">
      <ErrorBanner error={error} onDismiss={clearError} />
      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-brand-cream pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-[10px] bg-transparent border-none border-b-2 -mb-[2px] cursor-pointer text-sm transition-colors duration-200",
              activeTab === id
                ? "border-b-accent text-accent font-semibold"
                : "border-b-transparent text-brand-medium font-normal"
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!isLoaded ? (
        <div className="text-center p-12 text-brand-medium">Cargando datos...</div>
      ) : (
        <>
          {activeTab === "diario"    && <DiaryTab />}
          {activeTab === "resumen"   && <SummaryTab />}
          {activeTab === "alimentos" && <FoodsTab />}
          {activeTab === "metas"     && <GoalsTab />}
        </>
      )}
    </div>
  );
}
