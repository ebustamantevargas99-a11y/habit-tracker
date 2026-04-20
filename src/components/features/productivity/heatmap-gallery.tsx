"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/components/ui";
import { useHabitStore } from "@/stores/habit-store";

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
};

// Intensity levels: 0=none, 1=low, 2=med, 3=high, 4=max
const HEAT_COLORS = [C.lightCream, C.cream, C.tan, C.warm, C.brown];

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAYS_SHORT   = ["D","L","M","X","J","V","S"];

function buildYearGrid(today: Date): { date: string; dayOfWeek: number }[][] {
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  const dow = start.getDay();
  start.setDate(start.getDate() - dow);

  const weeks: { date: string; dayOfWeek: number }[][] = [];
  let current = new Date(start);

  while (current <= today) {
    const week: { date: string; dayOfWeek: number }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: current.toISOString().split("T")[0],
        dayOfWeek: current.getDay(),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function buildMonthLabels(weeks: { date: string }[][]): { col: number; label: string }[] {
  const labels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      labels.push({ col, label: MONTHS_SHORT[m] });
      lastMonth = m;
    }
  });
  return labels;
}

interface HabitHeatmapProps {
  habitId: string;
  habitName: string;
  habitIcon: string;
  streakCurrent: number;
  streakBest: number;
}

function HabitHeatmap({ habitId, habitName, habitIcon, streakCurrent, streakBest }: HabitHeatmapProps) {
  const logs = useHabitStore(s => s.logs);

  const today = useMemo(() => new Date(), []);
  const weeks = useMemo(() => buildYearGrid(today), [today]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  const levelMap = useMemo(() => {
    const m: Record<string, number> = {};
    logs.filter(l => l.habitId === habitId).forEach(l => {
      m[l.date] = l.completed ? 4 : 0;
    });
    return m;
  }, [logs, habitId]);

  const completedDays = useMemo(() =>
    Object.values(levelMap).filter(v => v > 0).length, [levelMap]);

  const CELL = 13;
  const GAP  = 2;

  return (
    <div className="bg-brand-paper border border-brand-light-cream rounded-[14px] px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-bold text-brand-dark flex items-center gap-2">
            <span>{habitIcon}</span>
            <span className="font-serif">{habitName}</span>
          </div>
          <div className="flex gap-4 mt-1.5">
            <span className="text-xs text-brand-warm">{completedDays} días completados</span>
            <span className="text-xs text-brand-warm">Racha actual: <strong className={streakCurrent > 0 ? "text-accent" : "text-brand-medium"}>{streakCurrent}d</strong></span>
            <span className="text-xs text-brand-warm">Mejor racha: <strong className="text-brand-brown">{streakBest}d</strong></span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-brand-tan">Menos</span>
          {HEAT_COLORS.map((col, i) => (
            <div key={i} className="rounded-[3px]" style={{ width: CELL, height: CELL, backgroundColor: col }} />
          ))}
          <span className="text-[11px] text-brand-tan">Más</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0">
          {/* Month labels */}
          <div className="flex mb-1 pl-7 gap-[2px]">
            {weeks.map((_, col) => {
              const label = monthLabels.find(ml => ml.col === col);
              return (
                <div key={col} className="text-[10px] text-brand-medium whitespace-nowrap w-[13px]">
                  {label ? label.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid rows = days of week */}
          {[0, 1, 2, 3, 4, 5, 6].map(dow => (
            <div key={dow} className="flex items-center gap-[2px] mb-[2px]">
              {/* Day label */}
              <div className="text-[10px] text-brand-medium text-right pr-1 shrink-0 w-[22px]">
                {dow % 2 === 1 ? DAYS_SHORT[dow] : ""}
              </div>
              {/* Cells */}
              {weeks.map((week, col) => {
                const cell = week[dow];
                if (!cell) return <div key={col} className="w-[13px] h-[13px]" />;
                const cellDate = new Date(cell.date + "T00:00:00");
                const isFuture = cellDate > today;
                const level = isFuture ? -1 : (levelMap[cell.date] ?? 0);
                const bg = isFuture ? "transparent" : HEAT_COLORS[level] ?? HEAT_COLORS[0];
                const todayStr = today.toISOString().split("T")[0];
                const isToday = cell.date === todayStr;
                return (
                  <div
                    key={col}
                    title={`${cell.date}: ${level > 0 ? "Completado ✓" : isFuture ? "—" : "No completado"}`}
                    className={cn(
                      "rounded-[3px] box-border cursor-default transition-transform duration-100 shrink-0",
                      isToday ? "border-2 border-accent" : isFuture ? "border-0" : "border border-black/5"
                    )}
                    style={{ width: CELL, height: CELL, backgroundColor: bg }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Monthly Summary Bar ──────────────────────────────────────────────────────
function MonthlyBar({ habitId }: { habitId: string }) {
  const logs = useHabitStore(s => s.logs);
  const today = new Date();

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const monthStr = d.toISOString().slice(0, 7);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const completed = logs.filter(l => l.habitId === habitId && l.date.startsWith(monthStr) && l.completed).length;
      const pct = Math.round((completed / daysInMonth) * 100);
      return { label: MONTHS_SHORT[d.getMonth()], pct, completed, days: daysInMonth };
    });
  }, [logs, habitId]);

  return (
    <div className="flex gap-2 items-end h-12 mt-3">
      {months.map(m => (
        <div key={m.label} className="flex-1 flex flex-col items-center gap-[3px]">
          <div className="text-[10px] text-brand-warm font-semibold">{m.pct}%</div>
          <div className="w-full bg-brand-light-cream rounded-[4px] overflow-hidden h-7 flex items-end">
            <div
              className={cn("w-full rounded-[4px] transition-[height] duration-[600ms]", m.pct >= 80 ? "bg-success" : m.pct >= 50 ? "bg-accent" : "bg-brand-tan")}
              style={{ height: `${m.pct}%` }}
            />
          </div>
          <div className="text-[10px] text-brand-medium">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeatMapGallery() {
  const { habits, isLoaded } = useHabitStore();
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"annual" | "monthly">("annual");

  const categories = useMemo(() => {
    const cats = new Set(habits.map(h => h.category));
    return ["all", ...Array.from(cats)];
  }, [habits]);

  const filtered = useMemo(() =>
    habits.filter(h => filter === "all" || h.category === filter),
    [habits, filter]
  );

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] gap-4">
        <div className="w-12 h-12 border-4 border-brand-cream border-t-accent rounded-full animate-spin" />
        <p className="text-brand-warm text-sm">Cargando hábitos...</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center px-5 py-[60px] text-brand-medium">
        <div className="text-[48px] mb-4">📊</div>
        <p className="text-base font-serif text-brand-dark">Sin hábitos activos</p>
        <p className="text-[13px]">Crea hábitos en el Habit Tracker para ver tus heatmaps aquí.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-[22px] font-serif text-brand-dark">Heatmaps por Hábito</h2>
          <p className="m-0 mt-1 text-[13px] text-brand-warm">Visualización anual de tu consistencia</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          {/* View toggle */}
          <div className="flex border-2 border-brand-tan rounded-lg overflow-hidden">
            {(["annual", "monthly"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3.5 py-[7px] border-none cursor-pointer text-xs transition-colors duration-200",
                  view === v ? "bg-accent text-brand-paper font-bold" : "bg-brand-paper text-brand-dark font-normal"
                )}
              >
                {v === "annual" ? "Anual" : "Últimos 6 meses"}
              </button>
            ))}
          </div>
          {/* Category filter */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border-2 border-brand-tan rounded-lg text-[13px] bg-brand-paper text-brand-dark cursor-pointer"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmaps */}
      <div className="grid gap-5">
        {filtered.map(habit => (
          <div key={habit.id}>
            {view === "annual" ? (
              <HabitHeatmap
                habitId={habit.id}
                habitName={habit.name}
                habitIcon={habit.icon}
                streakCurrent={habit.streakCurrent}
                streakBest={habit.streakBest}
              />
            ) : (
              <div className="bg-brand-paper border border-brand-light-cream rounded-[14px] px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <div className="text-base font-bold text-brand-dark flex items-center gap-2 mb-1">
                  <span>{habit.icon}</span>
                  <span className="font-serif">{habit.name}</span>
                  <span className="ml-auto text-xs text-brand-warm font-normal">
                    Racha: <strong className={habit.streakCurrent > 0 ? "text-accent" : "text-brand-medium"}>{habit.streakCurrent}d</strong>
                  </span>
                </div>
                <MonthlyBar habitId={habit.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall summary */}
      <div className="mt-8 px-6 py-5 bg-brand-light-cream rounded-[14px] flex gap-8 flex-wrap">
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-brand-dark font-serif">{habits.length}</div>
          <div className="text-xs text-brand-warm">Hábitos activos</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-accent font-serif">
            {habits.reduce((m, h) => Math.max(m, h.streakCurrent), 0)}d
          </div>
          <div className="text-xs text-brand-warm">Mejor racha actual</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-brand-brown font-serif">
            {habits.reduce((m, h) => Math.max(m, h.streakBest), 0)}d
          </div>
          <div className="text-xs text-brand-warm">Mejor racha histórica</div>
        </div>
        <div className="text-center">
          <div className="text-[28px] font-extrabold text-success font-serif">
            {habits.filter(h => h.streakCurrent >= 7).length}
          </div>
          <div className="text-xs text-brand-warm">Hábitos con racha ≥7d</div>
        </div>
      </div>
    </div>
  );
}
