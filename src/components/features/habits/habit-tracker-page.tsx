"use client";

import { useState, useMemo } from "react";
import { useHabitStore } from "@/stores/habit-store";
import { Trash2, Plus, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { TimeOfDay } from "@/types";

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

const TIME_LABELS: Record<string, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
  all: "Todo el día",
};

const CATEGORY_COLORS = ["#B8860B","#7A9E3E","#5A8FA8","#D4943A","#C0544F","#6B4226","#A0845C","#8B6542"];

const HABIT_CATEGORIES = [
  { value: "Bienestar",     label: "🧘 Bienestar" },
  { value: "Fitness",       label: "💪 Fitness" },
  { value: "Nutrición",     label: "🥗 Nutrición" },
  { value: "Productividad", label: "💻 Productividad" },
  { value: "Aprendizaje",   label: "📚 Aprendizaje" },
  { value: "Finanzas",      label: "💰 Finanzas" },
  { value: "Relaciones",    label: "❤️ Relaciones" },
  { value: "Creatividad",   label: "🎨 Creatividad" },
  { value: "Mindfulness",   label: "🌿 Mindfulness" },
  { value: "Sueño",         label: "😴 Sueño" },
  { value: "Otro",          label: "⭐ Otro" },
];

// 0=Dom,1=Lun,2=Mar,3=Mié,4=Jue,5=Vie,6=Sáb (JS getDay order)
const WEEK_DAYS = [
  { idx: 1, label: "L" },
  { idx: 2, label: "M" },
  { idx: 3, label: "M" },
  { idx: 4, label: "J" },
  { idx: 5, label: "V" },
  { idx: 6, label: "S" },
  { idx: 0, label: "D" },
];

const STRENGTH_LABEL = (rate: number) => {
  if (rate === 0) return "Nuevo";
  if (rate < 0.3) return "En Progreso";
  if (rate < 0.7) return "Formándose";
  return "Arraigado";
};
const STRENGTH_COLOR = (label: string) => {
  if (label === "Arraigado") return C.success;
  if (label === "Formándose") return C.warning;
  if (label === "En Progreso") return C.info;
  return C.warm;
};

const EMOJIS = ["⭐","🧘","💪","📚","💧","😴","💻","🏃","🎯","🥗","🎸","✍️","🧠","🌿","🫁","🚴","🤸","📖","🍎","☀️"];

export default function HabitTrackerPage() {
  const {
    habits, logs, isLoaded, isLoading,
    toggleHabitToday, addHabit, removeHabit,
  } = useHabitStore();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    icon: "⭐",
    category: "Bienestar",
    timeOfDay: "morning" as TimeOfDay,
    frequency: "daily" as "daily" | "weekly" | "custom",
    customDays: [1, 2, 3, 4, 5] as number[], // default: lunes-viernes
  });
  const [saving, setSaving] = useState(false);

  const toggleCustomDay = (dayIdx: number) => {
    setForm((f) => {
      const has = f.customDays.includes(dayIdx);
      return {
        ...f,
        customDays: has
          ? f.customDays.filter((d) => d !== dayIdx)
          : [...f.customDays, dayIdx].sort((a, b) => a - b),
      };
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l) => l.date === today && l.completed);
  const completedIds = new Set(todayLogs.map((l) => l.habitId));

  const activeHabits = habits.filter((h) => h.isActive !== false);

  // Group by time of day
  const grouped = useMemo(() => {
    const order: TimeOfDay[] = ["morning", "afternoon", "evening", "all"];
    const knownTods = new Set(order);
    // Habits with unrecognised timeOfDay fall into "all"
    const normalised = activeHabits.map((h) => ({
      ...h,
      timeOfDay: knownTods.has(h.timeOfDay as TimeOfDay) ? h.timeOfDay : ("all" as TimeOfDay),
    }));
    return order
      .map((tod) => ({
        tod,
        label: TIME_LABELS[tod],
        items: normalised.filter((h) => h.timeOfDay === tod),
      }))
      .filter((g) => g.items.length > 0);
  }, [activeHabits]);

  // Last 30 days presence for each habit
  const getHeatmap = (habitId: string) => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const ds = d.toISOString().split("T")[0];
      return {
        dateStr: ds,
        isToday: ds === today,
        done: logs.some((l) => l.habitId === habitId && l.date === ds && l.completed),
      };
    });
  };

  // Charts — last 14 days
  const last14 = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const ds = d.toISOString().split("T")[0];
      const done = logs.filter((l) => l.date === ds && l.completed).length;
      return {
        date: d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" }),
        completados: done,
      };
    });
  }, [logs]);

  // Category pie
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    activeHabits.forEach((h) => {
      map[h.category] = (map[h.category] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeHabits]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const targetDays =
      form.frequency === "daily"
        ? [0, 1, 2, 3, 4, 5, 6]
        : form.customDays.length > 0
        ? form.customDays
        : [0, 1, 2, 3, 4, 5, 6];
    setSaving(true);
    try {
      await addHabit({
        name: form.name.trim(),
        icon: form.icon,
        category: form.category,
        timeOfDay: form.timeOfDay,
        frequency: form.frequency,
        targetDays,
        isActive: true,
      });
      setForm({ name: "", icon: "⭐", category: "Bienestar", timeOfDay: "morning", frequency: "daily", customDays: [1, 2, 3, 4, 5] });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (habitId: string, name: string) => {
    if (!window.confirm(`¿Eliminar el hábito "${name}"?`)) return;
    removeHabit(habitId);
  };

  if (isLoading || !isLoaded) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: C.warm }}>
        Cargando hábitos...
      </div>
    );
  }

  const completedTodayCount = activeHabits.filter((h) => completedIds.has(h.id)).length;
  const bestStreak = activeHabits.length > 0 ? Math.max(...activeHabits.map((h) => h.streakCurrent)) : 0;
  const overallRate = (() => {
    const last30Logs = logs.filter((l) => {
      const d = new Date(); d.setDate(d.getDate() - 30);
      return l.date >= d.toISOString().split("T")[0];
    });
    if (last30Logs.length === 0) return 0;
    return Math.round((last30Logs.filter((l) => l.completed).length / last30Logs.length) * 100);
  })();

  return (
    <div style={{ backgroundColor: C.warmWhite }}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Hábitos Activos", value: String(activeHabits.length), bg: C.lightCream, color: C.brown },
          { label: "Completados Hoy", value: `${completedTodayCount}/${activeHabits.length}`, bg: C.successLight, color: C.success },
          { label: "Mejor Racha Activa", value: `${bestStreak} días`, bg: C.accentGlow, color: C.accent },
          { label: "Tasa Últimos 30d", value: `${overallRate}%`, bg: C.infoLight, color: C.info },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{
            backgroundColor: bg, borderRadius: "12px",
            border: `1px solid ${C.tan}`, padding: "1.25rem", textAlign: "center",
          }}>
            <p style={{ fontSize: "0.8rem", color: C.warm, margin: "0 0 0.25rem 0" }}>{label}</p>
            <p style={{ fontSize: "1.8rem", fontWeight: "700", color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Add habit button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            backgroundColor: C.accent, color: C.paper,
            border: "none", borderRadius: "8px", padding: "0.65rem 1.25rem",
            fontSize: "0.95rem", fontWeight: "600", cursor: "pointer",
            marginBottom: "2rem",
          }}
        >
          <Plus size={18} /> Agregar hábito
        </button>
      ) : (
        <div style={{
          backgroundColor: C.paper, border: `2px solid ${C.tan}`,
          borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, color: C.dark, fontFamily: "Georgia, serif", fontSize: "1.1rem" }}>Nuevo hábito</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.warm }}>
              <X size={20} />
            </button>
          </div>

          {/* Emoji + Nombre en la misma fila */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: C.warm, display: "block", marginBottom: "0.4rem" }}>Emoji</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="⭐"
                maxLength={4}
                style={{
                  width: "100%", padding: "0.6rem", textAlign: "center",
                  border: `2px solid ${C.tan}`, borderRadius: "8px",
                  backgroundColor: C.warmWhite, color: C.dark,
                  fontSize: "1.6rem", boxSizing: "border-box", cursor: "text",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: C.warm, display: "block", marginBottom: "0.4rem" }}>Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="ej. Meditación matutina"
                autoFocus
                style={{
                  width: "100%", padding: "0.6rem 0.75rem",
                  border: `1px solid ${C.tan}`, borderRadius: "6px",
                  backgroundColor: C.warmWhite, color: C.dark, fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: C.warm, display: "block", marginBottom: "0.4rem" }}>Categoría *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={{
                  width: "100%", padding: "0.6rem 0.75rem",
                  border: `1px solid ${C.tan}`, borderRadius: "6px",
                  backgroundColor: C.warmWhite, color: C.dark, fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              >
                {HABIT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: C.warm, display: "block", marginBottom: "0.4rem" }}>Momento del día</label>
              <select
                value={form.timeOfDay}
                onChange={(e) => setForm((f) => ({ ...f, timeOfDay: e.target.value as TimeOfDay }))}
                style={{
                  width: "100%", padding: "0.6rem 0.75rem",
                  border: `1px solid ${C.tan}`, borderRadius: "6px",
                  backgroundColor: C.warmWhite, color: C.dark, fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              >
                <option value="morning">Mañana</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noche</option>
                <option value="all">Todo el día</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: C.warm, display: "block", marginBottom: "0.4rem" }}>Frecuencia</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as "daily" | "weekly" | "custom" }))}
                style={{
                  width: "100%", padding: "0.6rem 0.75rem",
                  border: `1px solid ${C.tan}`, borderRadius: "6px",
                  backgroundColor: C.warmWhite, color: C.dark, fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              >
                <option value="daily">Todos los días</option>
                <option value="custom">Días específicos</option>
              </select>
            </div>
          </div>

          {/* Day-of-week selector — solo si frecuencia es custom */}
          {form.frequency === "custom" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8rem", color: C.warm, display: "block", marginBottom: "0.5rem" }}>
                ¿Qué días? {form.customDays.length === 0 && <span style={{ color: C.danger }}>— selecciona al menos 1</span>}
              </label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {WEEK_DAYS.map(({ idx, label }) => {
                  const active = form.customDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleCustomDay(idx)}
                      style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        border: `2px solid ${active ? C.accent : C.tan}`,
                        backgroundColor: active ? C.accent : C.paper,
                        color: active ? C.paper : C.warm,
                        fontWeight: "700", fontSize: "0.85rem",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.warm, margin: "0.5rem 0 0 0" }}>
                {form.customDays.length > 0
                  ? `Seleccionados: ${form.customDays.map(d => ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][d]).join(", ")}`
                  : "Ningún día seleccionado"}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim() || (form.frequency === "custom" && form.customDays.length === 0)}
              style={{
                backgroundColor: C.accent, color: C.paper,
                border: "none", borderRadius: "8px", padding: "0.65rem 1.5rem",
                fontSize: "0.95rem", fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : "Guardar hábito"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                backgroundColor: "transparent", color: C.warm,
                border: `1px solid ${C.tan}`, borderRadius: "8px",
                padding: "0.65rem 1.25rem", fontSize: "0.95rem", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Habit groups */}
      {activeHabits.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem",
          backgroundColor: C.paper, borderRadius: "12px",
          border: `2px dashed ${C.tan}`, marginBottom: "2rem",
        }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🌱</p>
          <p style={{ color: C.warm, margin: 0 }}>Aún no tienes hábitos. ¡Agrega el primero!</p>
        </div>
      ) : (
        grouped.map(({ tod, label, items }) => (
          <div key={tod} style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: C.dark, margin: "0 0 1rem 0", fontFamily: "Georgia, serif" }}>
              {label}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {items.map((habit) => {
                const done = completedIds.has(habit.id);
                const heatmap = getHeatmap(habit.id);
                const last30Done = heatmap.filter((d) => d.done).length;
                const rate = last30Done / 30;
                const strength = STRENGTH_LABEL(rate);
                return (
                  <div
                    key={habit.id}
                    style={{
                      backgroundColor: C.paper,
                      border: `2px solid ${done ? C.success : C.lightCream}`,
                      borderRadius: "12px", padding: "1rem",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                      transition: "border-color 0.2s",
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontSize: "1.8rem" }}>{habit.icon || "⭐"}</span>
                        <div>
                          <p style={{ fontSize: "0.95rem", fontWeight: "700", color: C.dark, margin: "0 0 2px 0" }}>{habit.name}</p>
                          <p style={{ fontSize: "0.75rem", color: C.warm, margin: 0 }}>{habit.category}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(habit.id, habit.name)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, padding: "2px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Badges */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px",
                        backgroundColor: C.lightCream, color: C.dark, fontWeight: "600",
                      }}>
                        🔥 {habit.streakCurrent} días racha
                      </span>
                      <span style={{
                        fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px",
                        backgroundColor: STRENGTH_COLOR(strength), color: C.paper, fontWeight: "600",
                      }}>
                        {strength}
                      </span>
                      <span style={{
                        fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px",
                        backgroundColor: C.infoLight, color: C.info, fontWeight: "600",
                      }}>
                        {last30Done}/30 días
                      </span>
                    </div>

                    {/* 30-day heatmap */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "3px", marginBottom: "0.75rem" }}>
                      {heatmap.map(({ dateStr, isToday, done: dayDone }, i) => (
                        <button
                          key={i}
                          onClick={isToday ? () => toggleHabitToday(habit.id) : undefined}
                          title={isToday ? (dayDone ? "Marcar como pendiente" : "Marcar como completado") : dateStr}
                          style={{
                            width: "100%", aspectRatio: "1",
                            border: isToday ? `2px solid ${C.accent}` : `1px solid ${C.lightTan}`,
                            borderRadius: "4px",
                            backgroundColor: dayDone ? C.accent : C.lightCream,
                            cursor: isToday ? "pointer" : "default",
                            transition: "background-color 0.15s",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {dayDone && (
                            <span style={{ color: C.paper, fontSize: "0.55rem", fontWeight: "700" }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Toggle today button */}
                    <button
                      onClick={() => toggleHabitToday(habit.id)}
                      style={{
                        width: "100%", padding: "0.5rem",
                        backgroundColor: done ? C.successLight : C.accentGlow,
                        border: `1px solid ${done ? C.success : C.accent}`,
                        borderRadius: "8px", cursor: "pointer",
                        fontSize: "0.85rem", fontWeight: "600",
                        color: done ? C.success : C.accent,
                        transition: "all 0.2s",
                      }}
                    >
                      {done ? "✓ Completado hoy" : "Marcar hoy como completado"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Charts */}
      {activeHabits.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", marginTop: "1rem" }}>
          {/* Bar chart */}
          <div style={{
            backgroundColor: C.paper, border: `1px solid ${C.lightTan}`,
            borderRadius: "12px", padding: "1.5rem",
          }}>
            <h3 style={{ fontSize: "1rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0" }}>
              📊 Hábitos completados por día (últimos 14 días)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last14} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" stroke={C.warm} tick={{ fontSize: 10 }} />
                <YAxis stroke={C.warm} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: C.lightCream, border: `1px solid ${C.tan}`, borderRadius: "8px" }}
                  cursor={{ fill: C.lightCream }}
                />
                <Bar dataKey="completados" fill={C.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div style={{
            backgroundColor: C.paper, border: `1px solid ${C.lightTan}`,
            borderRadius: "12px", padding: "1.5rem",
          }}>
            <h3 style={{ fontSize: "1rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0" }}>
              🎯 Por categoría
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: C.lightCream, border: `1px solid ${C.tan}`, borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: C.warm, textAlign: "center" }}>Sin datos aún</p>
            )}
          </div>
        </div>
      )}

      {/* Per-habit progress bars */}
      {activeHabits.length > 0 && (
        <div style={{
          backgroundColor: C.paper, border: `1px solid ${C.lightTan}`,
          borderRadius: "12px", padding: "1.5rem", marginTop: "2rem",
        }}>
          <h3 style={{ fontSize: "1rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1.25rem 0" }}>
            📈 Progreso individual (últimos 30 días)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activeHabits.map((habit) => {
              const hm = getHeatmap(habit.id);
              const pct = Math.round((hm.filter((d) => d.done).length / 30) * 100);
              return (
                <div key={habit.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.85rem", color: C.dark, fontWeight: "600" }}>
                      {habit.icon} {habit.name}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: C.warm, fontWeight: "600" }}>{pct}%</span>
                  </div>
                  <div style={{ height: "8px", backgroundColor: C.lightTan, borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "4px",
                      width: `${pct}%`,
                      backgroundColor: pct >= 70 ? C.success : pct >= 40 ? C.accent : C.warning,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
