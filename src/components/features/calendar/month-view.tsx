"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import QuickAddBar from "./quick-add-bar";
import QuickEventPopover, { type AnchorRect } from "./quick-event-popover";
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

type Editing =
  | { mode: "create"; dateStr: string; hour: number; anchor: AnchorRect }
  | { mode: "edit"; event: CalendarEvent; anchor: AnchorRect };

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Hora default para eventos creados desde vista Mes (cuando el user no
// indica hora específica, arrancamos en 9:00am).
const DEFAULT_CREATE_HOUR = 9;

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
  const [editing, setEditing] = useState<Editing | null>(null);

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

  function openCreate(dateStr: string, anchor: AnchorRect) {
    setEditing({ mode: "create", dateStr, hour: DEFAULT_CREATE_HOUR, anchor });
  }

  function openEdit(event: CalendarEvent, anchor: AnchorRect) {
    setEditing({ mode: "edit", event, anchor });
  }

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
              <MonthCell
                key={k}
                dateStr={k}
                date={d}
                isOtherMonth={isOtherMonth}
                isToday={isToday}
                bgOpacity={bgOpacity}
                entry={entry}
                onOpenCreate={openCreate}
                onOpenEdit={openEdit}
                onDrillDown={onDrillDown}
              />
            );
          })}
        </div>
      </div>

      {/* Popover inline */}
      {editing && (
        <QuickEventPopover
          mode={
            editing.mode === "create"
              ? { kind: "create", dateStr: editing.dateStr, hour: editing.hour }
              : { kind: "edit", event: editing.event }
          }
          anchor={editing.anchor}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setData((prev) => {
              if (!prev) return prev;
              const exists = prev.events.some((e) => e.id === saved.id);
              return {
                ...prev,
                events: exists
                  ? prev.events.map((e) => (e.id === saved.id ? saved : e))
                  : [...prev.events, saved],
              };
            });
          }}
          onDeleted={(id) => {
            setData((prev) =>
              prev ? { ...prev, events: prev.events.filter((e) => e.id !== id) } : prev,
            );
          }}
        />
      )}

      <p className="text-[11px] text-brand-tan text-center">
        💡 Click en un día para crear · click en un evento para editar · click en la flecha ↗ para ver el día completo
      </p>
    </div>
  );
}

// ─── MonthCell ───────────────────────────────────────────────────────

function MonthCell({
  dateStr,
  date,
  isOtherMonth,
  isToday,
  bgOpacity,
  entry,
  onOpenCreate,
  onOpenEdit,
  onDrillDown,
}: {
  dateStr: string;
  date: Date;
  isOtherMonth: boolean;
  isToday: boolean;
  bgOpacity: number;
  entry:
    | {
        events: CalendarEvent[];
        workouts: MonthData["workouts"];
        habitsDone: number;
        habitsTotal: number;
        milestones: MonthData["milestones"];
        density: number;
      }
    | undefined;
  onOpenCreate: (dateStr: string, anchor: AnchorRect) => void;
  onOpenEdit: (event: CalendarEvent, anchor: AnchorRect) => void;
  onDrillDown: (date: string) => void;
}) {
  const cellRef = useRef<HTMLDivElement>(null);

  function handleCellClick() {
    const el = cellRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onOpenCreate(dateStr, { left: r.left, top: r.top, width: r.width, height: r.height });
  }

  function handleEventClick(ev: CalendarEvent, e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenEdit(ev, { left: r.left, top: r.top, width: r.width, height: r.height });
  }

  return (
    <div
      ref={cellRef}
      onClick={handleCellClick}
      className={cn(
        "group relative min-h-[100px] border-b border-r border-brand-cream p-1.5 text-left transition cursor-pointer hover:bg-accent/10",
        isOtherMonth && "opacity-35",
        isToday && "ring-2 ring-accent ring-inset z-10",
      )}
      style={{
        backgroundColor: entry && entry.density > 0 ? `rgba(184, 134, 11, ${bgOpacity})` : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "text-xs font-semibold",
            isToday ? "text-accent" : "text-brand-dark",
          )}
        >
          {date.getDate()}
        </span>
        <div className="flex items-center gap-1">
          {entry && entry.habitsTotal > 0 && (
            <span className="text-[9px] text-brand-warm font-mono">
              {entry.habitsDone}/{entry.habitsTotal}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown(dateStr);
            }}
            className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-brand-cream text-brand-warm"
            title="Ver día completo"
            aria-label="Ver día completo"
          >
            <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
      {/* Events preview */}
      <div className="space-y-0.5">
        {entry?.events.slice(0, 3).map((ev) => {
          const meta = TYPE_META[ev.type] ?? TYPE_META.custom;
          const hasCustomColor = ev.type === "custom" && ev.color;
          return (
            <div
              key={ev.id}
              onClick={(e) => handleEventClick(ev, e)}
              style={
                hasCustomColor
                  ? { backgroundColor: `${ev.color}22`, color: ev.color!, borderLeft: `3px solid ${ev.color}` }
                  : undefined
              }
              className={cn(
                "text-[9px] px-1 py-[1px] rounded truncate cursor-pointer",
                !hasCustomColor && meta.bgClass,
              )}
              title={
                ev.type === "custom" && ev.category?.trim()
                  ? `${ev.category} · Click para editar`
                  : "Click para editar"
              }
            >
              {ev.icon ?? meta.emoji} {ev.title}
            </div>
          );
        })}
        {entry && entry.events.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown(dateStr);
            }}
            className="text-[9px] text-brand-warm pl-1 hover:text-accent cursor-pointer"
          >
            +{entry.events.length - 3} más →
          </button>
        )}
      </div>
      {/* Badges: workouts + milestones */}
      <div className="absolute bottom-1 right-1 flex gap-0.5 pointer-events-none">
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
    </div>
  );
}
