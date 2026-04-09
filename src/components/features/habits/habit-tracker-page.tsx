"use client";

import { useState, useMemo, useEffect } from "react";
import { useHabitStore } from "@/stores/habit-store";
import { Trash2, Plus, X, TrendingUp, Flame, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
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
    toggleHabitToday, addHabit, removeHabit, refresh,
  } = useHabitStore();

  // Always fetch fresh data (streaks, logs) when opening this tab
  useEffect(() => { refresh(); }, []);

  const [showForm, setShowForm]           = useState(false);
  const [heatmapView, setHeatmapView]     = useState<'monthly' | '6months' | 'annual'>('monthly');
  const [heatmapMonth, setHeatmapMonth]   = useState(() => new Date());
  const [heatmapYear, setHeatmapYear]     = useState(() => new Date().getFullYear());
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

  // Brown pastel palette for habit heatmap
  const habitCellColor = (done: boolean) => done ? '#8B6542' : '#EDE0D4';
  const annualBarColor = (rate: number) =>
    rate === 0 ? '#EDE0D4' : rate < 33 ? '#D4BEA0' : rate < 66 ? '#C4A882' : rate < 100 ? '#A0845C' : '#8B6542';

  // Monthly calendar data per habit
  const getMonthlyHeatmap = (habitId: string, year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
    return { daysInMonth, firstDay, cells: Array.from({ length: daysInMonth }, (_, i) => {
      const d  = i + 1;
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { day: d, dateStr: ds, isToday: ds === today, done: logs.some(l => l.habitId === habitId && l.date === ds && l.completed) };
    })};
  };

  // Annual completion rate per month
  const getAnnualData = (habitId: string, year: number) => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, m) => {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      let done = 0, total = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (new Date(ds + 'T12:00:00') <= now) {
          total++;
          if (logs.some(l => l.habitId === habitId && l.date === ds && l.completed)) done++;
        }
      }
      return { month: m, rate: total > 0 ? Math.round((done / total) * 100) : 0, total };
    });
  };

  // 6-month completion per month
  const get6MonthsData = (habitId: string) => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const done = logs.filter(l => l.habitId === habitId && l.date.startsWith(monthStr) && l.completed).length;
      const pct = Math.round((done / daysInMonth) * 100);
      const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return { label: MONTHS[d.getMonth()], pct, done, days: daysInMonth };
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

  // 30-day completion rate trend (daily %)
  const trend30 = useMemo(() => {
    const total = activeHabits.length;
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const ds = d.toISOString().split("T")[0];
      const done = logs.filter(l => l.date === ds && l.completed).length;
      return {
        date: d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" }),
        tasa: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }, [logs, activeHabits]);

  // Best day of week (Mon-Sun)
  const dayOfWeekData = useMemo(() => {
    const DAY_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);
    logs.filter(l => l.completed).forEach(l => {
      const dow = new Date(l.date + 'T12:00:00').getDay();
      counts[dow]++;
    });
    // count how many of each weekday have passed in the last 90 days
    for (let i = 0; i < 90; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      totals[d.getDay()]++;
    }
    return [1,2,3,4,5,6,0].map(dow => ({
      day: DAY_LABELS[dow],
      completados: totals[dow] > 0 ? Math.round((counts[dow] / totals[dow]) * activeHabits.length) : 0,
    }));
  }, [logs, activeHabits]);

  // Streak leaderboard
  const streakLeaderboard = useMemo(() =>
    [...activeHabits].sort((a, b) => b.streakCurrent - a.streakCurrent).slice(0, 5),
    [activeHabits]
  );

  // Radar: per category avg completion last 30d
  const radarData = useMemo(() => {
    const start30 = new Date(); start30.setDate(start30.getDate() - 29);
    const s30 = start30.toISOString().split("T")[0];
    const map: Record<string, { done: number; possible: number }> = {};
    activeHabits.forEach(h => {
      if (!map[h.category]) map[h.category] = { done: 0, possible: 0 };
      const done = logs.filter(l => l.habitId === h.id && l.date >= s30 && l.completed).length;
      map[h.category].done += done;
      map[h.category].possible += 30;
    });
    return Object.entries(map).map(([cat, { done, possible }]) => ({
      categoria: cat.length > 8 ? cat.slice(0, 8) + '…' : cat,
      valor: possible > 0 ? Math.round((done / possible) * 100) : 0,
    }));
  }, [activeHabits, logs]);

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

      {/* Heatmap view controls */}
      {activeHabits.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "700", color: C.warm }}>Vista de hábitos:</span>
          <div style={{ display: "flex", border: `1px solid ${C.tan}`, borderRadius: "8px", overflow: "hidden" }}>
            {([
              { key: 'monthly',  label: '📆 Mes' },
              { key: '6months',  label: '📊 6 Meses' },
              { key: 'annual',   label: '🗓 Anual' },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setHeatmapView(v.key)} style={{
                padding: "7px 14px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer",
                backgroundColor: heatmapView === v.key ? C.accent : C.paper,
                color: heatmapView === v.key ? C.paper : C.dark,
                border: "none", borderRight: `1px solid ${C.tan}`, transition: "background-color 0.15s",
              }}>
                {v.label}
              </button>
            ))}
          </div>
          {heatmapView === 'monthly' && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={() => setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() - 1, 1))}
                style={{ padding: "4px 10px", border: `1px solid ${C.tan}`, borderRadius: "6px", backgroundColor: C.cream, cursor: "pointer", color: C.dark, fontWeight: "700" }}>‹</button>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: C.dark, minWidth: "120px", textAlign: "center" }}>
                {heatmapMonth.toLocaleDateString("es", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1))}
                style={{ padding: "4px 10px", border: `1px solid ${C.tan}`, borderRadius: "6px", backgroundColor: C.cream, cursor: "pointer", color: C.dark, fontWeight: "700" }}>›</button>
            </div>
          )}
          {heatmapView === 'annual' && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={() => setHeatmapYear(y => y - 1)}
                style={{ padding: "4px 10px", border: `1px solid ${C.tan}`, borderRadius: "6px", backgroundColor: C.cream, cursor: "pointer", color: C.dark, fontWeight: "700" }}>‹</button>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: C.dark, minWidth: "50px", textAlign: "center" }}>{heatmapYear}</span>
              <button onClick={() => setHeatmapYear(y => y + 1)}
                style={{ padding: "4px 10px", border: `1px solid ${C.tan}`, borderRadius: "6px", backgroundColor: C.cream, cursor: "pointer", color: C.dark, fontWeight: "700" }}>›</button>
            </div>
          )}
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
                // Stats from last 30 days for badges
                const last30Start = new Date(); last30Start.setDate(last30Start.getDate() - 29);
                const last30Logs = logs.filter(l => l.habitId === habit.id && l.date >= last30Start.toISOString().split("T")[0] && l.completed);
                const last30Done = last30Logs.length;
                const rate       = last30Done / 30;
                const strength   = STRENGTH_LABEL(rate);

                // Monthly heatmap data
                const moYear  = heatmapMonth.getFullYear();
                const moMonth = heatmapMonth.getMonth();
                const { daysInMonth, firstDay, cells } = getMonthlyHeatmap(habit.id, moYear, moMonth);
                const emptyBefore = Array(firstDay).fill(null);

                // Annual data
                const annualData = getAnnualData(habit.id, heatmapYear);
                const maxRate    = Math.max(...annualData.map(d => d.rate), 1);

                const MONTH_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

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
                      <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", backgroundColor: C.lightCream, color: C.dark, fontWeight: "600" }}>
                        🔥 {habit.streakCurrent} días racha
                      </span>
                      <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", backgroundColor: STRENGTH_COLOR(strength), color: C.paper, fontWeight: "600" }}>
                        {strength}
                      </span>
                      <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", backgroundColor: C.infoLight, color: C.info, fontWeight: "600" }}>
                        {last30Done}/30 días
                      </span>
                    </div>

                    {/* ── MONTHLY HEATMAP ── */}
                    {heatmapView === 'monthly' && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        {/* Day headers */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "2px" }}>
                          {['L','M','M','J','V','S','D'].map((d, i) => (
                            <div key={i} style={{ textAlign: "center", fontSize: "0.55rem", color: C.warm, fontWeight: "600" }}>{d}</div>
                          ))}
                        </div>
                        {/* Calendar cells */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                          {emptyBefore.map((_, i) => <div key={`e-${i}`} />)}
                          {cells.map(({ day, dateStr, isToday, done: dayDone }) => (
                            <button
                              key={dateStr}
                              onClick={isToday ? () => toggleHabitToday(habit.id) : undefined}
                              title={isToday ? (dayDone ? "Mark as pending" : "Mark as completed") : dateStr}
                              style={{
                                width: "100%", aspectRatio: "1",
                                border: isToday ? `2px solid ${C.accent}` : `1px solid ${C.tan}`,
                                borderRadius: "4px",
                                backgroundColor: habitCellColor(dayDone),
                                cursor: isToday ? "pointer" : "default",
                                transition: "background-color 0.15s",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                padding: 0,
                              }}
                            >
                              <span style={{ fontSize: "0.5rem", color: dayDone ? C.paper : C.warm, fontWeight: "600", lineHeight: 1 }}>{day}</span>
                            </button>
                          ))}
                        </div>
                        {/* Legend */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", justifyContent: "flex-end" }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#EDE0D4", border: `1px solid ${C.tan}` }} />
                          <span style={{ fontSize: "0.55rem", color: C.warm }}>No</span>
                          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#8B6542" }} />
                          <span style={{ fontSize: "0.55rem", color: C.warm }}>Done</span>
                        </div>
                      </div>
                    )}

                    {/* ── 6 MONTHS ── */}
                    {heatmapView === '6months' && (() => {
                      const sixData = get6MonthsData(habit.id);
                      const maxPct = Math.max(...sixData.map(d => d.pct), 1);
                      return (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "56px" }}>
                            {sixData.map((m, i) => {
                              const h = maxPct > 0 ? (m.pct / maxPct) * 100 : 0;
                              const bg = m.pct >= 80 ? C.success : m.pct >= 50 ? C.accent : m.pct >= 20 ? C.tan : C.lightCream;
                              return (
                                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: "2px" }}>
                                  <span style={{ fontSize: "0.45rem", color: C.warm, fontWeight: "700" }}>{m.pct}%</span>
                                  <div
                                    title={`${m.label}: ${m.done}/${m.days} días (${m.pct}%)`}
                                    style={{ width: "100%", height: `${Math.max(h, 4)}%`, backgroundColor: bg, borderRadius: "3px 3px 0 0", minHeight: "4px", transition: "height 0.4s ease" }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", gap: "4px", marginTop: "3px", borderTop: `1px solid ${C.lightTan}`, paddingTop: "3px" }}>
                            {sixData.map((m, i) => (
                              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.5rem", color: C.medium, fontWeight: "600" }}>{m.label}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── ANNUAL CHART ── */}
                    {heatmapView === 'annual' && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "50px", borderBottom: `1px solid ${C.lightTan}` }}>
                          {annualData.map(({ month: m, rate: r }) => {
                            const h   = maxRate > 0 ? (r / maxRate) * 100 : 0;
                            const isCurMo = m === new Date().getMonth() && heatmapYear === new Date().getFullYear();
                            return (
                              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                <div
                                  title={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]}: ${r}%`}
                                  style={{
                                    width: "100%", height: `${Math.max(r > 0 ? h : 2, 2)}%`,
                                    backgroundColor: annualBarColor(r),
                                    borderRadius: "2px 2px 0 0",
                                    border: isCurMo ? `1px solid ${C.accent}` : "none",
                                    minHeight: "2px",
                                    transition: "height 0.3s",
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
                          {MONTH_SHORT.map((s, i) => (
                            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.5rem", color: C.warm }}>{s}</div>
                          ))}
                        </div>
                      </div>
                    )}

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

      {/* ── Analytics Section ── */}
      {activeHabits.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1.5rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={20} color={C.accent} /> Analítica de Hábitos
          </h2>

          {/* Row 1: Trend + Day of week */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* 30-day trend area chart */}
            <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0" }}>
                📈 Tasa de completado — últimos 30 días
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trend30} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.warm }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: C.warm }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => [`${v}%`, "Completado"]}
                  />
                  <Area type="monotone" dataKey="tasa" stroke={C.accent} strokeWidth={2.5} fill="url(#trendGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Best day of week */}
            <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0" }}>
                📅 Mejor día de la semana
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dayOfWeekData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.warm }} />
                  <YAxis tick={{ fontSize: 10, fill: C.warm }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="completados" name="Promedio completados" radius={[6, 6, 0, 0]}>
                    {dayOfWeekData.map((entry, i) => (
                      <Cell key={i} fill={entry.completados === Math.max(...dayOfWeekData.map(d => d.completados)) ? C.success : C.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Per-habit progress bars + Pie */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Progress bars */}
            <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1.25rem 0" }}>
                🎯 Cumplimiento individual — últimos 30 días
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {activeHabits.map((habit) => {
                  const start30 = new Date(); start30.setDate(start30.getDate() - 29);
                  const done30  = logs.filter(l => l.habitId === habit.id && l.date >= start30.toISOString().split("T")[0] && l.completed).length;
                  const pct = Math.round((done30 / 30) * 100);
                  const barColor = pct >= 70 ? C.success : pct >= 40 ? C.accent : C.warning;
                  return (
                    <div key={habit.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.82rem", color: C.dark, fontWeight: "600" }}>{habit.icon} {habit.name}</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: "700", color: barColor }}>{pct}%</span>
                      </div>
                      <div style={{ height: "9px", backgroundColor: C.lightTan, borderRadius: "5px", overflow: "hidden", position: "relative" }}>
                        <div style={{ height: "100%", borderRadius: "5px", width: `${pct}%`, backgroundColor: barColor, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ fontSize: "0.7rem", color: C.warm, marginTop: "2px" }}>{done30} de 30 días · Racha: {habit.streakCurrent}d</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category pie + radar stacked */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem", flex: 1 }}>
                <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 0.75rem 0" }}>
                  🏷 Por categoría
                </h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                        {categoryData.map((_, idx) => (
                          <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p style={{ color: C.warm, textAlign: "center", fontSize: "0.85rem" }}>Sin datos aún</p>}
              </div>
            </div>
          </div>

          {/* Row 3: Radar by category + Streak leaderboard */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Radar */}
            {radarData.length >= 3 && (
              <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0" }}>
                  🕸 Consistencia por categoría (30d)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={C.lightTan} />
                    <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 10, fill: C.warm }} />
                    <Radar name="Completado" dataKey="valor" stroke={C.accent} fill={C.accent} fillOpacity={0.25} />
                    <Tooltip contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`${v}%`, "Completado"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Streak leaderboard */}
            <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <Flame size={16} color={C.warning} /> Ranking de Rachas
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {streakLeaderboard.map((habit, rank) => {
                  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                  const barW = streakLeaderboard[0]?.streakCurrent > 0
                    ? Math.round((habit.streakCurrent / streakLeaderboard[0].streakCurrent) * 100)
                    : 0;
                  return (
                    <div key={habit.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.1rem", minWidth: "24px" }}>{medals[rank]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.icon} {habit.name}</span>
                          <span style={{ fontSize: "0.82rem", fontWeight: "700", color: C.warning, marginLeft: "8px", flexShrink: 0 }}>{habit.streakCurrent}d 🔥</span>
                        </div>
                        <div style={{ height: "6px", backgroundColor: C.lightTan, borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${barW}%`, backgroundColor: rank === 0 ? C.accent : C.tan, borderRadius: "3px", transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {streakLeaderboard.length === 0 && (
                  <p style={{ color: C.warm, fontSize: "0.85rem", textAlign: "center" }}>Completa hábitos para ver tu ranking</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: 14-day daily bar */}
          <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightTan}`, borderRadius: "14px", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontFamily: "Georgia, serif", color: C.dark, margin: "0 0 1rem 0" }}>
              📊 Hábitos completados por día — últimos 14 días
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last14} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightCream} />
                <XAxis dataKey="date" stroke={C.warm} tick={{ fontSize: 10 }} />
                <YAxis stroke={C.warm} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: C.paper, border: `1px solid ${C.tan}`, borderRadius: "8px", fontSize: "12px" }} cursor={{ fill: C.lightCream }} />
                <Bar dataKey="completados" name="Completados" fill={C.accent} radius={[6, 6, 0, 0]}>
                  {last14.map((entry, i) => (
                    <Cell key={i} fill={entry.completados === activeHabits.length ? C.success : C.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
