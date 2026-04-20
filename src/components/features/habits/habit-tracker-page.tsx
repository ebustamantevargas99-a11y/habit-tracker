"use client";

import { useState, useMemo, useEffect } from "react";
import { useHabitStore } from "@/stores/habit-store";
import type { HabitLog } from "@/types";
import { Trash2, Plus, X, TrendingUp, Flame, CalendarDays } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import type { TimeOfDay } from "@/types";
import { cn } from "@/components/ui";

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

// ─── Habit consolidation system ──────────────────────────────────────────────
const META_DIAS = 92;

const INP = "w-full px-3 py-[0.6rem] border border-brand-tan rounded-md bg-brand-warm-white text-brand-dark text-[0.95rem] box-border";
const LABEL_CLS = "text-[0.8rem] text-brand-warm block mb-[0.4rem]";
const CARD = "bg-brand-paper border border-brand-light-tan rounded-[14px] p-6";

function habitLabel(diasCumplidos: number): { text: string; bgClass: string; textClass: string } {
  if (diasCumplidos <= 0)        return { text: "Sin iniciar",                            bgClass: "bg-brand-light-cream", textClass: "text-brand-warm"  };
  if (diasCumplidos === 1)       return { text: "Nuevo",                                  bgClass: "bg-info-light",        textClass: "text-info"        };
  if (diasCumplidos < META_DIAS) {
    const r = META_DIAS - diasCumplidos;
    return { text: `A ${r} día${r === 1 ? "" : "s"} de arraigar`,                         bgClass: "bg-warning-light",     textClass: "text-warning"     };
  }
  if (diasCumplidos === META_DIAS) return { text: "¡Hábito Arraigado!",                   bgClass: "bg-success-light",     textClass: "text-success"     };
  const extra = diasCumplidos - META_DIAS;
  return { text: `Arraigo Firme: Día ${extra}`,                                            bgClass: "bg-accent-glow",       textClass: "text-brand-brown" };
}

function annualBarClass(rate: number): string {
  if (rate === 0) return "bg-brand-cream";
  if (rate < 33)  return "bg-brand-light-tan";
  if (rate < 66)  return "bg-brand-tan";
  if (rate < 100) return "bg-brand-warm";
  return "bg-brand-medium";
}

// Tolerance streak: 1 missed day = grace (pause, don't reset); 2+ = reset to 0
function computeToleranceStreak(habitId: string, logs: HabitLog[]): number {
  const logMap = new Map(
    logs.filter(l => l.habitId === habitId).map(l => [l.date, l.completed])
  );
  let streak = 0;
  let consecutiveMisses = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const ds = d.toISOString().split("T")[0];
    if (logMap.get(ds) === true) {
      streak++;
      consecutiveMisses = 0;
    } else {
      consecutiveMisses++;
      if (consecutiveMisses >= 2) break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

const EMOJIS = ["⭐","🧘","💪","📚","💧","😴","💻","🏃","🎯","🥗","🎸","✍️","🧠","🌿","🫁","🚴","🤸","📖","🍎","☀️"];

export default function HabitTrackerPage() {
  const {
    habits, logs, isLoaded, isLoading,
    toggleHabitToday, toggleHabitDate, addHabit, removeHabit, refresh,
  } = useHabitStore();

  useEffect(() => { refresh(); }, []);

  const [showForm, setShowForm]           = useState(false);
  const [selectedDate, setSelectedDate]   = useState(() => new Date().toISOString().split("T")[0]);
  const [heatmapView, setHeatmapView]     = useState<'monthly' | '6months' | 'annual'>('monthly');
  const [heatmapMonth, setHeatmapMonth]   = useState(() => new Date());
  const [heatmapYear, setHeatmapYear]     = useState(() => new Date().getFullYear());
  const [form, setForm] = useState({
    name: "",
    icon: "⭐",
    category: "Bienestar",
    timeOfDay: "morning" as TimeOfDay,
    frequency: "daily" as "daily" | "weekly" | "custom",
    customDays: [1, 2, 3, 4, 5] as number[],
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
  const completedIds = new Set(
    logs.filter((l) => l.date === selectedDate && l.completed).map((l) => l.habitId)
  );
  const todayCompletedIds = new Set(
    logs.filter((l) => l.date === today && l.completed).map((l) => l.habitId)
  );

  const activeHabits = habits.filter((h) => h.isActive !== false);

  const grouped = useMemo(() => {
    const order: TimeOfDay[] = ["morning", "afternoon", "evening", "all"];
    const knownTods = new Set(order);
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

  const getMonthlyHeatmap = (habitId: string, year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = (new Date(year, month, 1).getDay() + 6) % 7;
    return { daysInMonth, firstDay, cells: Array.from({ length: daysInMonth }, (_, i) => {
      const d  = i + 1;
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { day: d, dateStr: ds, isToday: ds === today, done: logs.some(l => l.habitId === habitId && l.date === ds && l.completed) };
    })};
  };

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

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    activeHabits.forEach((h) => {
      map[h.category] = (map[h.category] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeHabits]);

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

  const dayOfWeekData = useMemo(() => {
    const DAY_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);
    logs.filter(l => l.completed).forEach(l => {
      const dow = new Date(l.date + 'T12:00:00').getDay();
      counts[dow]++;
    });
    for (let i = 0; i < 90; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      totals[d.getDay()]++;
    }
    return [1,2,3,4,5,6,0].map(dow => ({
      day: DAY_LABELS[dow],
      completados: totals[dow] > 0 ? Math.round((counts[dow] / totals[dow]) * activeHabits.length) : 0,
    }));
  }, [logs, activeHabits]);

  const streakLeaderboard = useMemo(() =>
    [...activeHabits].sort((a, b) => b.streakCurrent - a.streakCurrent).slice(0, 5),
    [activeHabits]
  );

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
    return <div className="p-8 text-center text-brand-warm">Cargando hábitos...</div>;
  }

  const completedTodayCount = activeHabits.filter((h) => todayCompletedIds.has(h.id)).length;
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
    <div className="bg-brand-warm-white">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Hábitos Activos",      value: String(activeHabits.length),                         bgCls: "bg-brand-light-cream", colorCls: "text-brand-brown" },
          { label: "Completados Hoy",       value: `${completedTodayCount}/${activeHabits.length}`,     bgCls: "bg-success-light",     colorCls: "text-success"     },
          { label: "Mejor Racha Activa",    value: `${bestStreak} días`,                                bgCls: "bg-accent-glow",       colorCls: "text-accent"      },
          { label: "Tasa Últimos 30d",      value: `${overallRate}%`,                                   bgCls: "bg-info-light",        colorCls: "text-info"        },
        ].map(({ label, value, bgCls, colorCls }) => (
          <div key={label} className={cn("rounded-xl border border-brand-tan p-5 text-center", bgCls)}>
            <p className="text-[0.8rem] text-brand-warm m-0 mb-1">{label}</p>
            <p className={cn("text-[1.8rem] font-bold m-0", colorCls)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Add habit button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent text-brand-paper border-none rounded-lg px-5 py-[0.65rem] text-[0.95rem] font-semibold cursor-pointer mb-8"
        >
          <Plus size={18} /> Agregar hábito
        </button>
      ) : (
        <div className="bg-brand-paper border-2 border-brand-tan rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h3 className="m-0 text-brand-dark font-serif text-[1.1rem]">Nuevo hábito</h3>
            <button onClick={() => setShowForm(false)} className="bg-transparent border-none cursor-pointer text-brand-warm">
              <X size={20} />
            </button>
          </div>

          {/* Emoji + Nombre */}
          <div className="grid grid-cols-[80px_1fr] gap-4 mb-4">
            <div>
              <label className={LABEL_CLS}>Emoji</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="⭐"
                maxLength={4}
                className={cn(INP, "text-center text-[1.6rem]")}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="ej. Meditación matutina"
                autoFocus
                className={INP}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={LABEL_CLS}>Categoría *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={INP}>
                {HABIT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Momento del día</label>
              <select value={form.timeOfDay} onChange={(e) => setForm((f) => ({ ...f, timeOfDay: e.target.value as TimeOfDay }))} className={INP}>
                <option value="morning">Mañana</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noche</option>
                <option value="all">Todo el día</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Frecuencia</label>
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as "daily" | "weekly" | "custom" }))} className={INP}>
                <option value="daily">Todos los días</option>
                <option value="custom">Días específicos</option>
              </select>
            </div>
          </div>

          {/* Day-of-week selector */}
          {form.frequency === "custom" && (
            <div className="mb-4">
              <label className={LABEL_CLS}>
                ¿Qué días? {form.customDays.length === 0 && <span className="text-danger">— selecciona al menos 1</span>}
              </label>
              <div className="flex gap-[0.4rem]">
                {WEEK_DAYS.map(({ idx, label }) => {
                  const active = form.customDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleCustomDay(idx)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 font-bold text-[0.85rem] cursor-pointer transition-all",
                        active ? "border-accent bg-accent text-brand-paper" : "border-brand-tan bg-brand-paper text-brand-warm"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[0.75rem] text-brand-warm mt-2 mb-0">
                {form.customDays.length > 0
                  ? `Seleccionados: ${form.customDays.map(d => ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][d]).join(", ")}`
                  : "Ningún día seleccionado"}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim() || (form.frequency === "custom" && form.customDays.length === 0)}
              className={cn("bg-accent text-brand-paper border-none rounded-lg px-6 py-[0.65rem] text-[0.95rem] font-semibold", saving ? "cursor-not-allowed opacity-70" : "cursor-pointer")}
            >
              {saving ? "Guardando..." : "Guardar hábito"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-transparent text-brand-warm border border-brand-tan rounded-lg px-5 py-[0.65rem] text-[0.95rem] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Date selector ── */}
      {activeHabits.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className={cn("flex items-center gap-2 px-[14px] py-2 bg-brand-paper border-2 rounded-[10px]", selectedDate === today ? "border-accent" : "border-warning")}>
            <CalendarDays size={16} color={selectedDate === today ? C.accent : C.warning} />
            <span className="text-[0.82rem] font-semibold text-brand-dark">
              {selectedDate === today ? "Hoy" : "Fecha seleccionada:"}
            </span>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => {
                setSelectedDate(e.target.value);
                if (e.target.value) {
                  const d = new Date(e.target.value + "T12:00:00");
                  setHeatmapMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }
              }}
              className="border-none bg-transparent text-[0.82rem] text-brand-dark cursor-pointer font-semibold outline-none"
            />
          </div>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-[14px] py-[7px] bg-accent text-brand-paper border-none rounded-lg cursor-pointer text-[0.8rem] font-semibold"
            >
              Volver a hoy
            </button>
          )}
          {selectedDate !== today && (
            <span className="text-[0.78rem] text-warning italic">
              Registrando para {new Date(selectedDate + "T12:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          )}
        </div>
      )}

      {/* Heatmap view controls */}
      {activeHabits.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-[0.8rem] font-bold text-brand-warm">Vista de hábitos:</span>
          <div className="flex border border-brand-tan rounded-lg overflow-hidden">
            {([
              { key: 'monthly',  label: '📆 Mes' },
              { key: '6months',  label: '📊 6 Meses' },
              { key: 'annual',   label: '🗓 Anual' },
            ] as const).map(v => (
              <button
                key={v.key}
                onClick={() => setHeatmapView(v.key)}
                className={cn(
                  "px-[14px] py-[7px] text-[0.8rem] font-semibold cursor-pointer border-none border-r border-brand-tan transition-colors",
                  heatmapView === v.key ? "bg-accent text-brand-paper" : "bg-brand-paper text-brand-dark"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          {heatmapView === 'monthly' && (
            <div className="flex items-center gap-[6px]">
              <button onClick={() => setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() - 1, 1))}
                className="px-[10px] py-1 border border-brand-tan rounded-md bg-brand-cream cursor-pointer text-brand-dark font-bold">‹</button>
              <span className="text-[0.85rem] font-semibold text-brand-dark min-w-[120px] text-center">
                {heatmapMonth.toLocaleDateString("es", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1))}
                className="px-[10px] py-1 border border-brand-tan rounded-md bg-brand-cream cursor-pointer text-brand-dark font-bold">›</button>
            </div>
          )}
          {heatmapView === 'annual' && (
            <div className="flex items-center gap-[6px]">
              <button onClick={() => setHeatmapYear(y => y - 1)}
                className="px-[10px] py-1 border border-brand-tan rounded-md bg-brand-cream cursor-pointer text-brand-dark font-bold">‹</button>
              <span className="text-[0.85rem] font-semibold text-brand-dark min-w-[50px] text-center">{heatmapYear}</span>
              <button onClick={() => setHeatmapYear(y => y + 1)}
                className="px-[10px] py-1 border border-brand-tan rounded-md bg-brand-cream cursor-pointer text-brand-dark font-bold">›</button>
            </div>
          )}
        </div>
      )}

      {/* Habit groups */}
      {activeHabits.length === 0 ? (
        <div className="text-center p-12 bg-brand-paper rounded-xl border-2 border-dashed border-brand-tan mb-8">
          <p className="text-2xl mb-2">🌱</p>
          <p className="text-brand-warm m-0">Aún no tienes hábitos. ¡Agrega el primero!</p>
        </div>
      ) : (
        grouped.map(({ tod, label, items }) => (
          <div key={tod} className="mb-8">
            <h3 className="text-[1.1rem] font-bold text-brand-dark m-0 mb-4 font-serif">{label}</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {items.map((habit) => {
                const done = completedIds.has(habit.id);
                const toleranceStreak = computeToleranceStreak(habit.id, logs);
                const lbl = habitLabel(toleranceStreak);
                const last30Start = new Date(); last30Start.setDate(last30Start.getDate() - 29);
                const last30Done = logs.filter(l => l.habitId === habit.id && l.date >= last30Start.toISOString().split("T")[0] && l.completed).length;

                const moYear  = heatmapMonth.getFullYear();
                const moMonth = heatmapMonth.getMonth();
                const { daysInMonth, firstDay, cells } = getMonthlyHeatmap(habit.id, moYear, moMonth);
                const emptyBefore = Array(firstDay).fill(null);

                const annualData = getAnnualData(habit.id, heatmapYear);
                const maxRate    = Math.max(...annualData.map(d => d.rate), 1);

                const MONTH_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

                return (
                  <div
                    key={habit.id}
                    className={cn("bg-brand-paper border-2 rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-[border-color]", done ? "border-success" : "border-brand-light-cream")}
                  >
                    {/* Card header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-center">
                        <span className="text-[1.8rem]">{habit.icon || "⭐"}</span>
                        <div>
                          <p className="text-[0.95rem] font-bold text-brand-dark m-0 mb-[2px]">{habit.name}</p>
                          <p className="text-[0.75rem] text-brand-warm m-0">{habit.category}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(habit.id, habit.name)} className="bg-transparent border-none cursor-pointer text-danger p-[2px]">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className="text-[0.7rem] px-2 py-[3px] rounded-[4px] bg-brand-light-cream text-brand-dark font-semibold">
                        🔥 {toleranceStreak}d racha
                      </span>
                      <span className={cn("text-[0.7rem] px-2 py-[3px] rounded-[4px] font-bold", lbl.bgClass, lbl.textClass)}>
                        {lbl.text}
                      </span>
                      <span className="text-[0.7rem] px-2 py-[3px] rounded-[4px] bg-info-light text-info font-semibold">
                        {last30Done}/30 días
                      </span>
                    </div>

                    {/* ── MONTHLY HEATMAP ── */}
                    {heatmapView === 'monthly' && (
                      <div className="mb-3">
                        <div className="grid grid-cols-7 gap-[3px] mb-[2px]">
                          {['L','M','M','J','V','S','D'].map((d, i) => (
                            <div key={i} className="text-center text-[0.55rem] text-brand-warm font-semibold">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-[3px]">
                          {emptyBefore.map((_, i) => <div key={`e-${i}`} />)}
                          {cells.map(({ day, dateStr, isToday, done: dayDone }) => {
                            const isFuture = dateStr > today;
                            const isSelected = dateStr === selectedDate;
                            return (
                              <button
                                key={dateStr}
                                onClick={isFuture ? undefined : () => {
                                  setSelectedDate(dateStr);
                                  toggleHabitDate(habit.id, dateStr);
                                }}
                                title={isFuture ? "Fecha futura" : (dayDone ? "Quitar completado" : "Marcar completado")}
                                className={cn(
                                  "w-full aspect-square rounded-[4px] flex items-center justify-center p-0 transition-[background-color,transform] duration-[150ms]",
                                  isSelected ? "border-2 border-accent" : isToday ? "border-2 border-brand-warm" : "border border-brand-tan",
                                  dayDone ? "bg-brand-medium" : isFuture ? "bg-brand-light-cream opacity-40" : "bg-brand-cream",
                                  isFuture ? "cursor-default" : "cursor-pointer hover:scale-[1.15]"
                                )}
                              >
                                <span className={cn("text-[0.5rem] font-semibold leading-none", dayDone ? "text-brand-paper" : "text-brand-warm")}>{day}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-cream border border-brand-tan" />
                          <span className="text-[0.55rem] text-brand-warm">No</span>
                          <div className="w-[10px] h-[10px] rounded-[2px] bg-brand-medium" />
                          <span className="text-[0.55rem] text-brand-warm">Done</span>
                        </div>
                      </div>
                    )}

                    {/* ── 6 MONTHS ── */}
                    {heatmapView === '6months' && (() => {
                      const sixData = get6MonthsData(habit.id);
                      const maxPct = Math.max(...sixData.map(d => d.pct), 1);
                      return (
                        <div className="mb-3">
                          <div className="flex items-end gap-1 h-14">
                            {sixData.map((m, i) => {
                              const h = maxPct > 0 ? (m.pct / maxPct) * 100 : 0;
                              const barBg = m.pct >= 80 ? "bg-success" : m.pct >= 50 ? "bg-accent" : m.pct >= 20 ? "bg-brand-tan" : "bg-brand-light-cream";
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-[2px]">
                                  <span className="text-[0.45rem] text-brand-warm font-bold">{m.pct}%</span>
                                  <div
                                    title={`${m.label}: ${m.done}/${m.days} días (${m.pct}%)`}
                                    className={cn("w-full rounded-[3px_3px_0_0] min-h-[4px] transition-[height] duration-[400ms]", barBg)}
                                    style={{ height: `${Math.max(h, 4)}%` }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-1 mt-[3px] border-t border-brand-light-tan pt-[3px]">
                            {sixData.map((m, i) => (
                              <div key={i} className="flex-1 text-center text-[0.5rem] text-brand-medium font-semibold">{m.label}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── ANNUAL CHART ── */}
                    {heatmapView === 'annual' && (
                      <div className="mb-3">
                        <div className="flex items-end gap-[3px] h-[50px] border-b border-brand-light-tan">
                          {annualData.map(({ month: m, rate: r }) => {
                            const h   = maxRate > 0 ? (r / maxRate) * 100 : 0;
                            const isCurMo = m === new Date().getMonth() && heatmapYear === new Date().getFullYear();
                            return (
                              <div key={m} className="flex-1 flex flex-col items-center h-full justify-end">
                                <div
                                  title={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]}: ${r}%`}
                                  className={cn("w-full rounded-[2px_2px_0_0] min-h-[2px] transition-[height] duration-300", annualBarClass(r), isCurMo ? "border border-accent" : "border-0")}
                                  style={{ height: `${Math.max(r > 0 ? h : 2, 2)}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-[3px] mt-[2px]">
                          {MONTH_SHORT.map((s, i) => (
                            <div key={i} className="flex-1 text-center text-[0.5rem] text-brand-warm">{s}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Toggle date button */}
                    <button
                      onClick={() => toggleHabitDate(habit.id, selectedDate)}
                      className={cn(
                        "w-full py-2 border-2 rounded-lg cursor-pointer text-[0.85rem] font-semibold transition-all",
                        done
                          ? "bg-success-light border-success text-success"
                          : selectedDate !== today
                            ? "bg-accent-glow border-warning text-warning"
                            : "bg-accent-glow border-accent text-accent"
                      )}
                    >
                      {done
                        ? `✓ Completado${selectedDate === today ? " hoy" : ` el ${new Date(selectedDate + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}`}`
                        : selectedDate === today
                          ? "Marcar como completado"
                          : `Registrar el ${new Date(selectedDate + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}`
                      }
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
        <div className="mt-10">
          <h2 className="text-[1.2rem] font-serif text-brand-dark m-0 mb-6 flex items-center gap-2">
            <TrendingUp size={20} color={C.accent} /> Analítica de Hábitos
          </h2>

          {/* Row 1: Trend + Day of week */}
          <div className="grid grid-cols-[1.6fr_1fr] gap-6 mb-6">
            <div className={CARD}>
              <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-4">
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

            <div className={CARD}>
              <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-4">
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
          <div className="grid grid-cols-[1.6fr_1fr] gap-6 mb-6">
            <div className={CARD}>
              <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-5">
                🎯 Cumplimiento individual — últimos 30 días
              </h3>
              <div className="flex flex-col gap-[0.85rem]">
                {activeHabits.map((habit) => {
                  const start30 = new Date(); start30.setDate(start30.getDate() - 29);
                  const done30  = logs.filter(l => l.habitId === habit.id && l.date >= start30.toISOString().split("T")[0] && l.completed).length;
                  const pct = Math.round((done30 / 30) * 100);
                  const barTextCls = pct >= 70 ? "text-success" : pct >= 40 ? "text-accent" : "text-warning";
                  const barBgCls   = pct >= 70 ? "bg-success"   : pct >= 40 ? "bg-accent"   : "bg-warning";
                  return (
                    <div key={habit.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[0.82rem] text-brand-dark font-semibold">{habit.icon} {habit.name}</span>
                        <span className={cn("text-[0.82rem] font-bold", barTextCls)}>{pct}%</span>
                      </div>
                      <div className="h-[9px] bg-brand-light-tan rounded-[5px] overflow-hidden relative">
                        <div className={cn("h-full rounded-[5px] transition-[width] duration-[600ms]", barBgCls)} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[0.7rem] text-brand-warm mt-[2px]">{done30} de 30 días · Racha: {habit.streakCurrent}d</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className={cn(CARD, "flex-1")}>
                <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-3">
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
                ) : <p className="text-brand-warm text-center text-[0.85rem]">Sin datos aún</p>}
              </div>
            </div>
          </div>

          {/* Row 3: Radar + Streak leaderboard */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {radarData.length >= 3 && (
              <div className={CARD}>
                <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-4">
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

            <div className={CARD}>
              <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-4 flex items-center gap-[6px]">
                <Flame size={16} color={C.warning} /> Ranking de Rachas
              </h3>
              <div className="flex flex-col gap-[10px]">
                {streakLeaderboard.map((habit, rank) => {
                  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                  const barW = streakLeaderboard[0]?.streakCurrent > 0
                    ? Math.round((habit.streakCurrent / streakLeaderboard[0].streakCurrent) * 100)
                    : 0;
                  return (
                    <div key={habit.id} className="flex items-center gap-[10px]">
                      <span className="text-[1.1rem] min-w-[24px]">{medals[rank]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-[3px]">
                          <span className="text-[0.82rem] font-bold text-brand-dark overflow-hidden text-ellipsis whitespace-nowrap">{habit.icon} {habit.name}</span>
                          <span className="text-[0.82rem] font-bold text-warning ml-2 shrink-0">{habit.streakCurrent}d 🔥</span>
                        </div>
                        <div className="h-[6px] bg-brand-light-tan rounded-[3px] overflow-hidden">
                          <div className={cn("h-full rounded-[3px] transition-[width] duration-500", rank === 0 ? "bg-accent" : "bg-brand-tan")} style={{ width: `${barW}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {streakLeaderboard.length === 0 && (
                  <p className="text-brand-warm text-[0.85rem] text-center">Completa hábitos para ver tu ranking</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: 14-day daily bar */}
          <div className={CARD}>
            <h3 className="text-[0.95rem] font-serif text-brand-dark m-0 mb-4">
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
