"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Target, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import QuickAddBar from "./quick-add-bar";
import type { CalendarEvent } from "./types";
import { TYPE_META } from "./types";

type MonthData = {
  events: CalendarEvent[];
  workouts: Array<{ id: string; date: string; name: string; prsHit: number; completed: boolean }>;
  meals: Array<{ id: string; date: string; mealType: string }>;
  habitLogs: Array<{ date: string; completed: boolean }>;
  milestones: Array<{ id: string; date: string; type: string; title: string; icon: string | null }>;
  density: Record<string, number>;
};

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function startOfMonth(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), 1);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfMonth(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  r.setHours(23, 59, 59, 999);
  return r;
}

// Primer día visible en el grid: lunes de la semana del 1° del mes
function gridStart(d: Date): Date {
  const first = startOfMonth(d);
  const day = first.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(first);
  r.setDate(r.getDate() + diff);
  return r;
}

// 42 celdas (6 semanas × 7 días) para cubrir cualquier mes
function buildGrid(d: Date): Date[] {
  const start = gridStart(d);
  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + i);
    return cell;
  });
}

export default function MonthView({
  onDrillDown,
}: {
  onDrillDown: (date: string) => void;
}) {
  const [cursor, setCursor] = useState<Date>(new Date());
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const month = cursor.getMonth();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const from = toDateStr(grid[0]);
      const to = toDateStr(grid[grid.length - 1]);
      const res = await api.get<MonthData>(`/calendar/range?from=${from}&to=${to}`);
      setData(res);
    } catch {
      toast.error("Error cargando mes");
    } finally {
      setLoading(false);
    }
  }, [grid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const r = new Date(prev);
      r.setMonth(r.getMonth() + delta);
      return r;
    });
  }

  // Aggregated per-day data
  const dayData = useMemo(() => {
    const map = new Map<
      string,
      {
        events: CalendarEvent[];
        workouts: MonthData["workouts"];
        habitsDone: number;
        habitsTotal: number;
        milestones: MonthData["milestones"];
        density: number;
      }
    >();
    if (!data) return map;
    for (const g of grid) {
      const k = toDateStr(g);
      map.set(k, {
        events: [],
        workouts: [],
        habitsDone: 0,
        habitsTotal: 0,
        milestones: [],
        density: data.density[k] ?? 0,
      });
    }
    for (const ev of data.events) {
      const k = toDateStr(new Date(ev.startAt));
      const entry = map.get(k);
      if (entry) entry.events.push(ev);
    }
    for (const w of data.workouts) {
      const entry = map.get(w.date);
      if (entry) entry.workouts.push(w);
    }
    for (const m of data.milestones) {
      const entry = map.get(m.date);
      if (entry) entry.milestones.push(m);
    }
    for (const l of data.habitLogs) {
      const entry = map.get(l.date);
      if (entry) {
        entry.habitsTotal++;
        if (l.completed) entry.habitsDone++;
      }
    }
    return map;
  }, [data, grid]);

  const maxDensity = Math.max(1, ...Object.values(data?.density ?? {}));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-button border border-brand-cream text-brand-medium hover:bg-brand-cream"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-3 py-1.5 rounded-button border border-brand-cream text-sm text-brand-medium hover:bg-brand-cream"
          >
            Este mes
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-button border border-brand-cream text-brand-medium hover:bg-brand-cream"
          >
            <ChevronRight size={16} />
          </button>
          <h2 className="font-display text-xl font-bold text-brand-dark ml-3 capitalize">
            {cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
          </h2>
        </div>
      </div>

      <QuickAddBar
        onCreated={(ev) => {
          setData((prev) => (prev ? { ...prev, events: [...prev.events, ev] } : prev));
        }}
      />

      {/* Heatmap legend */}
      <div className="flex items-center gap-2 text-[11px] text-brand-warm">
        <span>Actividad:</span>
        <span className="inline-block w-3 h-3 rounded bg-brand-cream" title="Sin actividad" />
        <span className="inline-block w-3 h-3 rounded bg-accent/30" />
        <span className="inline-block w-3 h-3 rounded bg-accent/60" />
        <span className="inline-block w-3 h-3 rounded bg-accent" />
        <span>→ más</span>
        <span className="ml-auto">{loading && <Loader2 size={12} className="animate-spin inline" />}</span>
      </div>

      {/* Grid */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl overflow-hidden">
        {/* Header días */}
        <div className="grid grid-cols-7 border-b border-brand-cream bg-brand-warm-white">
          {WEEK_DAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-[10px] uppercase tracking-widest text-brand-warm font-semibold"
            >
              {w}
            </div>
          ))}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7">
          {grid.map((d) => {
            const k = toDateStr(d);
            const isOtherMonth = d.getMonth() !== month;
            const isToday = k === toDateStr(new Date());
            const entry = dayData.get(k);
            const dens = entry?.density ?? 0;
            const densityIntensity = Math.min(1, dens / Math.max(1, maxDensity));
            const bgOpacity = densityIntensity === 0 ? 0 : 0.15 + densityIntensity * 0.5;

            return (
              <button
                key={k}
                onClick={() => onDrillDown(k)}
                className={cn(
                  "relative min-h-[100px] border-b border-r border-brand-cream p-1.5 text-left transition hover:bg-accent/10",
                  isOtherMonth && "opacity-35",
                  isToday && "ring-2 ring-accent ring-inset z-10"
                )}
                style={{
                  backgroundColor: dens > 0 ? `rgba(184, 134, 11, ${bgOpacity})` : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isToday ? "text-accent" : "text-brand-dark"
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {entry && entry.habitsTotal > 0 && (
                    <span className="text-[9px] text-brand-warm font-mono">
                      {entry.habitsDone}/{entry.habitsTotal}
                    </span>
                  )}
                </div>
                {/* Events preview */}
                <div className="space-y-0.5">
                  {entry?.events.slice(0, 3).map((ev) => {
                    const meta = TYPE_META[ev.type] ?? TYPE_META.custom;
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "text-[9px] px-1 py-[1px] rounded truncate",
                          meta.bgClass
                        )}
                      >
                        {ev.icon ?? meta.emoji} {ev.title}
                      </div>
                    );
                  })}
                  {entry && entry.events.length > 3 && (
                    <div className="text-[9px] text-brand-warm pl-1">
                      +{entry.events.length - 3} más
                    </div>
                  )}
                </div>
                {/* Badges: workouts + milestones */}
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                  {entry && entry.workouts.length > 0 && (
                    <span className="text-[10px]" title="Workout">
                      💪
                    </span>
                  )}
                  {entry?.workouts.some((w) => w.prsHit > 0) && (
                    <span className="text-[10px]" title="PR nuevo">
                      🏆
                    </span>
                  )}
                  {entry && entry.milestones.length > 0 && (
                    <span className="text-[10px]" title="Milestone">
                      ✨
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-brand-tan text-center">
        💡 Click un día para abrir la vista Hoy de esa fecha
      </p>
    </div>
  );
}
