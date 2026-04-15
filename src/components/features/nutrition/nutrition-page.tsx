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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: colors.accentLight,
  lunch: colors.success,
  dinner: colors.medium,
  snack: colors.info,
};

const MACRO_COLORS = [colors.success, colors.accentLight, colors.medium];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function macroRing(protein: number, carbs: number, fat: number) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total === 0) return [];
  return [
    { name: "Proteína", value: protein * 4, pct: Math.round((protein * 4 / total) * 100) },
    { name: "Carbs", value: carbs * 4, pct: Math.round((carbs * 4 / total) * 100) },
    { name: "Grasa", value: fat * 9, pct: Math.round((fat * 9 / total) * 100) },
  ];
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function DiaryTab() {
  const {
    meals, foodItems, dailySummary, goals, selectedDate,
    addMeal, deleteMeal, addItemToMeal, removeItemFromMeal, setDate,
  } = useNutritionStore();

  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showAddFood, setShowAddFood] = useState<string | null>(null); // mealId
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Date Picker + Summary */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ fontSize: "0.75rem", color: colors.medium }}>Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem", border: `1px solid ${colors.lightTan}`,
              borderRadius: "6px", backgroundColor: colors.paper, color: colors.dark,
              fontSize: "0.875rem",
            }}
          />
        </div>

        {/* Calorie ring summary */}
        <div
          style={{
            flex: 1, minWidth: "280px",
            backgroundColor: colors.warmWhite, borderRadius: "12px",
            padding: "1rem", border: `1px solid ${colors.cream}`,
            display: "flex", gap: "1.5rem", alignItems: "center",
          }}
        >
          <div style={{ width: 80, height: 80 }}>
            <PieChart width={80} height={80}>
              <Pie data={macros.length ? macros : [{ name: "Vacío", value: 1 }]}
                cx={35} cy={35} innerRadius={25} outerRadius={38} dataKey="value" startAngle={90} endAngle={-270}>
                {macros.length
                  ? macros.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)
                  : [<Cell key={0} fill={colors.cream} />]}
              </Pie>
            </PieChart>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: colors.dark }}>
              {Math.round(totals.calories)} <span style={{ fontSize: "0.875rem", fontWeight: 400, color: colors.medium }}>kcal</span>
            </div>
            {goal && (
              <div style={{ fontSize: "0.75rem", color: colors.medium, marginBottom: "0.5rem" }}>
                Meta: {goal.calories} kcal ({Math.round((totals.calories / goal.calories) * 100)}%)
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem" }}>
              {[
                { label: "P", value: totals.protein, color: colors.success },
                { label: "C", value: totals.carbs, color: colors.accentLight },
                { label: "G", value: totals.fat, color: colors.medium },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color }}>{label}</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: colors.dark }}>{Math.round(value)}g</div>
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
            style={{
              backgroundColor: colors.warmWhite, borderRadius: "12px",
              border: `1px solid ${colors.cream}`, overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.875rem 1.25rem",
                borderLeft: `4px solid ${MEAL_COLORS[mealType]}`,
                cursor: meal ? "pointer" : "default",
              }}
              onClick={() => meal && setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontWeight: 600, color: colors.dark }}>{MEAL_LABELS[mealType]}</span>
                {meal && (
                  <span style={{ fontSize: "0.75rem", color: colors.medium, backgroundColor: colors.cream, padding: "0.125rem 0.5rem", borderRadius: "4px" }}>
                    {Math.round(mealCalories)} kcal
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {!meal ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddMeal(mealType); }}
                    disabled={addingMeal === mealType}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.375rem 0.75rem", backgroundColor: colors.accent, color: "#fff",
                      border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem",
                    }}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddFood(meal.id); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.375rem",
                        padding: "0.375rem 0.75rem", backgroundColor: colors.accent, color: "#fff",
                        border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem",
                      }}
                    >
                      <Plus size={14} /> Alimento
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, padding: "0.375rem" }}
                    >
                      <Trash2 size={16} />
                    </button>
                    {expandedMeal === meal.id ? <ChevronUp size={16} color={colors.medium} /> : <ChevronDown size={16} color={colors.medium} />}
                  </>
                )}
              </div>
            </div>

            {/* Items */}
            {meal && expandedMeal === meal.id && (
              <div style={{ borderTop: `1px solid ${colors.cream}`, padding: "0.5rem 1.25rem" }}>
                {meal.items.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: colors.medium, textAlign: "center", padding: "0.75rem 0" }}>
                    Sin alimentos. Agrega uno con el botón de arriba.
                  </p>
                ) : (
                  meal.items.map((item) => (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.5rem 0", borderBottom: `1px solid ${colors.lightCream}`,
                    }}>
                      <div>
                        <span style={{ fontSize: "0.875rem", color: colors.dark }}>{item.foodItem.name}</span>
                        <span style={{ fontSize: "0.75rem", color: colors.medium, marginLeft: "0.5rem" }}>
                          {item.quantity}g
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: colors.medium }}>
                          {Math.round(item.calories)} kcal · {Math.round(item.protein)}P · {Math.round(item.carbs)}C · {Math.round(item.fat)}G
                        </span>
                        <button
                          onClick={() => removeItemFromMeal(item.id, meal.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, padding: "0.25rem" }}
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
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: colors.paper, borderRadius: "16px", padding: "1.5rem",
            width: "min(480px, 90vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", gap: "1rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: colors.dark }}>Agregar alimento</h3>
              <button onClick={() => setShowAddFood(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={colors.medium} />
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: colors.medium }} />
              <input
                value={searchFood}
                onChange={(e) => setSearchFood(e.target.value)}
                placeholder="Buscar alimento..."
                style={{
                  width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem",
                  border: `1px solid ${colors.lightTan}`, borderRadius: "8px",
                  fontSize: "0.875rem", color: colors.dark, backgroundColor: colors.warmWhite,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Food list */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: "250px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {filteredFoods.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: colors.medium, textAlign: "center", padding: "1rem" }}>
                  No hay alimentos. Agrégalos en la pestaña "Mis Alimentos".
                </p>
              ) : (
                filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    style={{
                      padding: "0.625rem 0.75rem", borderRadius: "8px", cursor: "pointer",
                      backgroundColor: selectedFood?.id === food.id ? colors.accentGlow : "transparent",
                      border: `1px solid ${selectedFood?.id === food.id ? colors.accent : "transparent"}`,
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: "0.875rem", color: colors.dark }}>{food.name}</div>
                    <div style={{ fontSize: "0.75rem", color: colors.medium }}>
                      {food.calories} kcal / {food.servingSize}{food.servingUnit} · {food.protein}P {food.carbs}C {food.fat}G
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedFood && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <label style={{ fontSize: "0.8rem", color: colors.medium, whiteSpace: "nowrap" }}>Cantidad (g):</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    flex: 1, padding: "0.5rem", border: `1px solid ${colors.lightTan}`,
                    borderRadius: "6px", fontSize: "0.875rem", color: colors.dark,
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddFood(null)}
                style={{ padding: "0.5rem 1rem", border: `1px solid ${colors.lightTan}`, borderRadius: "8px", background: "none", cursor: "pointer", color: colors.medium }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedFood}
                style={{
                  padding: "0.5rem 1.25rem", backgroundColor: selectedFood ? colors.accent : colors.lightTan,
                  color: "#fff", border: "none", borderRadius: "8px", cursor: selectedFood ? "pointer" : "default",
                }}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Average cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Calorías promedio", value: Math.round(avgs?.calories ?? 0), unit: "kcal", color: colors.accent, goal: goals?.calories },
          { label: "Proteína promedio", value: Math.round(avgs?.protein ?? 0), unit: "g/día", color: colors.success, goal: goals?.protein },
          { label: "Carbs promedio", value: Math.round(avgs?.carbs ?? 0), unit: "g/día", color: colors.accentLight, goal: goals?.carbs },
          { label: "Grasa promedio", value: Math.round(avgs?.fat ?? 0), unit: "g/día", color: colors.medium, goal: goals?.fat },
        ].map(({ label, value, unit, color, goal: g }) => (
          <div key={label} style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1rem", border: `1px solid ${colors.cream}` }}>
            <div style={{ fontSize: "0.75rem", color: colors.medium, marginBottom: "0.5rem" }}>{label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: "0.75rem", color: colors.medium }}>{unit}</div>
            {g && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ height: "4px", backgroundColor: colors.cream, borderRadius: "2px" }}>
                  <div style={{ height: "4px", backgroundColor: color, borderRadius: "2px", width: `${Math.min(100, (value / g) * 100)}%` }} />
                </div>
                <div style={{ fontSize: "0.7rem", color: colors.medium, marginTop: "0.25rem" }}>{Math.round((value / g) * 100)}% meta</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Calorie chart */}
      <div style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1.25rem", border: `1px solid ${colors.cream}` }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", color: colors.dark }}>Calorías (7 días)</h3>
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
      <div style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1.25rem", border: `1px solid ${colors.cream}` }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", color: colors.dark }}>Macros (7 días)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.cream} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.medium }} />
            <YAxis tick={{ fontSize: 12, fill: colors.medium }} />
            <Tooltip contentStyle={{ backgroundColor: colors.paper, border: `1px solid ${colors.lightTan}` }} />
            <Line type="monotone" dataKey="protein" stroke={colors.success} dot={false} name="Proteína" />
            <Line type="monotone" dataKey="carbs" stroke={colors.accentLight} dot={false} name="Carbs" />
            <Line type="monotone" dataKey="fat" stroke={colors.medium} dot={false} name="Grasa" />
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: colors.medium }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alimentos..."
            style={{
              width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem",
              border: `1px solid ${colors.lightTan}`, borderRadius: "8px",
              fontSize: "0.875rem", color: colors.dark, backgroundColor: colors.warmWhite,
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem", backgroundColor: colors.accent, color: "#fff",
            border: "none", borderRadius: "8px", cursor: "pointer",
          }}
        >
          <Plus size={16} /> Nuevo alimento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1.25rem", border: `1px solid ${colors.cream}` }}>
          <h4 style={{ margin: "0 0 1rem", color: colors.dark }}>Nuevo alimento</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
            {[
              { key: "name", label: "Nombre *", type: "text" },
              { key: "brand", label: "Marca", type: "text" },
              { key: "servingSize", label: "Porción", type: "number" },
              { key: "servingUnit", label: "Unidad", type: "text" },
              { key: "calories", label: "Calorías *", type: "number" },
              { key: "protein", label: "Proteína (g)", type: "number" },
              { key: "carbs", label: "Carbs (g)", type: "number" },
              { key: "fat", label: "Grasa (g)", type: "number" },
              { key: "fiber", label: "Fibra (g)", type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label style={{ fontSize: "0.75rem", color: colors.medium, display: "block", marginBottom: "0.25rem" }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "0.5rem", border: `1px solid ${colors.lightTan}`,
                    borderRadius: "6px", fontSize: "0.875rem", color: colors.dark, boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowForm(false)}
              style={{ padding: "0.5rem 1rem", border: `1px solid ${colors.lightTan}`, borderRadius: "8px", background: "none", cursor: "pointer", color: colors.medium }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              style={{ padding: "0.5rem 1.25rem", backgroundColor: colors.accent, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Food list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: colors.medium }}>
            <Apple size={40} style={{ marginBottom: "0.75rem", opacity: 0.4 }} />
            <p>No hay alimentos. Agrega uno con el botón "Nuevo alimento".</p>
          </div>
        ) : (
          filtered.map((food) => (
            <div
              key={food.id}
              style={{
                backgroundColor: colors.warmWhite, borderRadius: "10px", padding: "1rem",
                border: `1px solid ${colors.cream}`, display: "flex", flexDirection: "column", gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, color: colors.dark }}>{food.name}</div>
                  {food.brand && <div style={{ fontSize: "0.75rem", color: colors.medium }}>{food.brand}</div>}
                </div>
                <button
                  onClick={() => deleteFoodItem(food.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, padding: "0.25rem" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem" }}>
                <span style={{ fontWeight: 700, color: colors.accent }}>{food.calories} kcal</span>
                <span style={{ color: colors.medium }}>por {food.servingSize}{food.servingUnit}</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: colors.medium }}>
                <span style={{ color: colors.success }}>P {food.protein}g</span>
                <span style={{ color: colors.accentLight }}>C {food.carbs}g</span>
                <span style={{ color: colors.medium }}>G {food.fat}g</span>
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
    if (goals) setForm({ calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat, fiber: goals.fiber, waterMl: goals.waterMl, mealsPerDay: goals.mealsPerDay });
  }, [goals]);

  const handleSave = async () => {
    await updateGoals(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalCalFromMacros = form.protein * 4 + form.carbs * 4 + form.fat * 9;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "600px" }}>
      <div style={{ backgroundColor: colors.warmWhite, borderRadius: "12px", padding: "1.5rem", border: `1px solid ${colors.cream}` }}>
        <h3 style={{ margin: "0 0 1.25rem", color: colors.dark }}>Metas Nutricionales</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[
            { key: "calories", label: "Calorías (kcal/día)", min: 1000, max: 5000 },
            { key: "protein", label: "Proteína (g/día)", min: 0, max: 400 },
            { key: "carbs", label: "Carbohidratos (g/día)", min: 0, max: 600 },
            { key: "fat", label: "Grasas (g/día)", min: 0, max: 200 },
            { key: "fiber", label: "Fibra (g/día)", min: 0, max: 100 },
            { key: "waterMl", label: "Agua (ml/día)", min: 500, max: 6000 },
            { key: "mealsPerDay", label: "Comidas/día", min: 1, max: 8 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <label style={{ fontSize: "0.75rem", color: colors.medium, display: "block", marginBottom: "0.25rem" }}>{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: "100%", padding: "0.5rem 0.75rem",
                  border: `1px solid ${colors.lightTan}`, borderRadius: "8px",
                  fontSize: "0.875rem", color: colors.dark, boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>

        {/* Macro distribution preview */}
        <div style={{ marginTop: "1.25rem", padding: "0.875rem", backgroundColor: colors.cream, borderRadius: "8px" }}>
          <div style={{ fontSize: "0.75rem", color: colors.medium, marginBottom: "0.5rem" }}>Distribución de calorías desde macros</div>
          <div style={{ fontSize: "0.875rem", color: colors.dark }}>
            P: {Math.round((form.protein * 4 / totalCalFromMacros) * 100)}% · C: {Math.round((form.carbs * 4 / totalCalFromMacros) * 100)}% · G: {Math.round((form.fat * 9 / totalCalFromMacros) * 100)}%
            {" "}= {totalCalFromMacros} kcal totales
          </div>
          {Math.abs(totalCalFromMacros - form.calories) > 50 && (
            <div style={{ fontSize: "0.75rem", color: colors.warning, marginTop: "0.25rem" }}>
              Los macros suman {totalCalFromMacros} kcal, diferente a tu meta de {form.calories} kcal.
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: "1.25rem", padding: "0.625rem 1.5rem",
            backgroundColor: saved ? colors.success : colors.accent,
            color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
            transition: "background-color 0.3s",
          }}
        >
          {saved ? "¡Guardado!" : "Guardar metas"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "diario", label: "Diario", icon: UtensilsCrossed },
  { id: "resumen", label: "Resumen 7d", icon: BarChart },
  { id: "alimentos", label: "Mis Alimentos", icon: Apple },
  { id: "metas", label: "Metas", icon: Target },
] as const;

export default function NutritionPage() {
  const activeTab = useAppStore((s) => s.nutritionTab);
  const setActiveTab = useAppStore((s) => s.setNutritionTab);
  const { initialize, isLoaded } = useNutritionStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: `2px solid ${colors.cream}`, paddingBottom: "0" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              backgroundColor: "transparent", border: "none",
              borderBottom: activeTab === id ? `2px solid ${colors.accent}` : "2px solid transparent",
              marginBottom: "-2px", cursor: "pointer",
              color: activeTab === id ? colors.accent : colors.medium,
              fontWeight: activeTab === id ? 600 : 400,
              fontSize: "0.875rem", transition: "color 0.2s",
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!isLoaded ? (
        <div style={{ textAlign: "center", padding: "3rem", color: colors.medium }}>Cargando datos...</div>
      ) : (
        <>
          {activeTab === "diario" && <DiaryTab />}
          {activeTab === "resumen" && <SummaryTab />}
          {activeTab === "alimentos" && <FoodsTab />}
          {activeTab === "metas" && <GoalsTab />}
        </>
      )}
    </div>
  );
}
