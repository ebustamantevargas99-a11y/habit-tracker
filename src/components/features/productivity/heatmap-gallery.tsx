"use client";
import React, { useState, useMemo } from "react";
import { useHabitStore } from "@/stores/habit-store";

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", dangerLight: "#F5D0CE", info: "#5A8FA8",
};

// Intensity levels: 0=none, 1=low, 2=med, 3=high, 4=max
const HEAT_COLORS = [C.lightCream, C.cream, C.tan, C.warm, C.brown];

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAYS_SHORT   = ["D","L","M","X","J","V","S"];

// Build a full 365-day grid aligned to Sunday weeks
function buildYearGrid(today: Date): { date: string; dayOfWeek: number }[][] {
  const start = new Date(today);
  start.setDate(start.getDate() - 364); // go back ~52 weeks
  // align to Sunday
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

// Compute month labels for the week columns
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

  // Build lookup: date → level
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
    <div style={{
      backgroundColor: C.paper,
      border: `1px solid ${C.lightCream}`,
      borderRadius: "14px",
      padding: "20px 24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: C.dark, display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{habitIcon}</span>
            <span style={{ fontFamily: "Georgia, serif" }}>{habitName}</span>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
            <span style={{ fontSize: "12px", color: C.warm }}>{completedDays} días completados</span>
            <span style={{ fontSize: "12px", color: C.warm }}>Racha actual: <strong style={{ color: streakCurrent > 0 ? C.accent : C.medium }}>{streakCurrent}d</strong></span>
            <span style={{ fontSize: "12px", color: C.warm }}>Mejor racha: <strong style={{ color: C.brown }}>{streakBest}d</strong></span>
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: C.tan }}>Menos</span>
          {HEAT_COLORS.map((col, i) => (
            <div key={i} style={{ width: CELL, height: CELL, backgroundColor: col, borderRadius: "3px" }} />
          ))}
          <span style={{ fontSize: "11px", color: C.tan }}>Más</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 0 }}>
          {/* Month labels */}
          <div style={{ display: "flex", gap: GAP, marginBottom: "4px", paddingLeft: "28px" }}>
            {weeks.map((_, col) => {
              const label = monthLabels.find(ml => ml.col === col);
              return (
                <div key={col} style={{ width: CELL, fontSize: "10px", color: C.medium, whiteSpace: "nowrap" }}>
                  {label ? label.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid rows = days of week */}
          {[0, 1, 2, 3, 4, 5, 6].map(dow => (
            <div key={dow} style={{ display: "flex", alignItems: "center", gap: GAP, marginBottom: GAP }}>
              {/* Day label */}
              <div style={{ width: "22px", fontSize: "10px", color: C.medium, textAlign: "right", paddingRight: "4px", flexShrink: 0 }}>
                {dow % 2 === 1 ? DAYS_SHORT[dow] : ""}
              </div>
              {/* Cells */}
              {weeks.map((week, col) => {
                const cell = week[dow];
                if (!cell) return <div key={col} style={{ width: CELL, height: CELL }} />;
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
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: bg,
                      borderRadius: "3px",
                      border: isToday ? `2px solid ${C.accent}` : isFuture ? "none" : `1px solid rgba(0,0,0,0.05)`,
                      boxSizing: "border-box",
                      cursor: "default",
                      transition: "transform 0.1s",
                      flexShrink: 0,
                    }}
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
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "48px", marginTop: "12px" }}>
      {months.map(m => (
        <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
          <div style={{ fontSize: "10px", color: C.warm, fontWeight: "600" }}>{m.pct}%</div>
          <div style={{ width: "100%", backgroundColor: C.lightCream, borderRadius: "4px", overflow: "hidden", height: "28px", display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", height: `${m.pct}%`, backgroundColor: m.pct >= 80 ? C.success : m.pct >= 50 ? C.accent : C.tan, borderRadius: "4px", transition: "height 0.6s ease" }} />
          </div>
          <div style={{ fontSize: "10px", color: C.medium }}>{m.label}</div>
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", border: `4px solid ${C.cream}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: C.warm, fontSize: "14px" }}>Cargando hábitos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: C.medium }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
        <p style={{ fontSize: "16px", fontFamily: "Georgia, serif", color: C.dark }}>Sin hábitos activos</p>
        <p style={{ fontSize: "13px" }}>Crea hábitos en el Habit Tracker para ver tus heatmaps aquí.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontFamily: "Georgia, serif", color: C.dark }}>Heatmaps por Hábito</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: C.warm }}>Visualización anual de tu consistencia</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `2px solid ${C.tan}`, borderRadius: "8px", overflow: "hidden" }}>
            {(["annual", "monthly"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ padding: "7px 14px", backgroundColor: view === v ? C.accent : C.paper, color: view === v ? C.paper : C.dark, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: view === v ? "700" : "400", transition: "background-color 0.2s" }}
              >
                {v === "annual" ? "Anual" : "Últimos 6 meses"}
              </button>
            ))}
          </div>
          {/* Category filter */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: "8px 12px", border: `2px solid ${C.tan}`, borderRadius: "8px", fontSize: "13px", backgroundColor: C.paper, color: C.dark, cursor: "pointer" }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmaps */}
      <div style={{ display: "grid", gap: "20px" }}>
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
              <div style={{ backgroundColor: C.paper, border: `1px solid ${C.lightCream}`, borderRadius: "14px", padding: "20px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: C.dark, display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span>{habit.icon}</span>
                  <span style={{ fontFamily: "Georgia, serif" }}>{habit.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: C.warm, fontWeight: "400" }}>
                    Racha: <strong style={{ color: habit.streakCurrent > 0 ? C.accent : C.medium }}>{habit.streakCurrent}d</strong>
                  </span>
                </div>
                <MonthlyBar habitId={habit.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall summary */}
      <div style={{ marginTop: "32px", padding: "20px 24px", backgroundColor: C.lightCream, borderRadius: "14px", display: "flex", gap: "32px", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: C.dark, fontFamily: "Georgia, serif" }}>{habits.length}</div>
          <div style={{ fontSize: "12px", color: C.warm }}>Hábitos activos</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: C.accent, fontFamily: "Georgia, serif" }}>
            {habits.reduce((m, h) => Math.max(m, h.streakCurrent), 0)}d
          </div>
          <div style={{ fontSize: "12px", color: C.warm }}>Mejor racha actual</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: C.brown, fontFamily: "Georgia, serif" }}>
            {habits.reduce((m, h) => Math.max(m, h.streakBest), 0)}d
          </div>
          <div style={{ fontSize: "12px", color: C.warm }}>Mejor racha histórica</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: C.success, fontFamily: "Georgia, serif" }}>
            {habits.filter(h => h.streakCurrent >= 7).length}
          </div>
          <div style={{ fontSize: "12px", color: C.warm }}>Hábitos con racha ≥7d</div>
        </div>
      </div>
    </div>
  );
}
