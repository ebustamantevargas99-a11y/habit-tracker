"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  Utensils,
  Target,
  Wind,
  Droplet,
  Flame,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  Sunrise,
  Sunset,
  Sparkles,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import QuickAddBar from "./quick-add-bar";
import AIExportButton from "@/components/features/ai-export/ai-export-button";
import type { DayAgenda, CalendarEvent } from "./types";
import { TYPE_META } from "./types";
import { useUserStore } from "@/stores/user-store";
import { todayLocal, toLocalDateStr } from "@/lib/date/local";

// Construimos un timeline virtual combinando todos los recursos del día
type TimelineItem =
  | { kind: "event"; data: CalendarEvent; hourStart: number; hourEnd: number }
  | { kind: "workout"; data: DayAgenda["agenda"]["workouts"][number]; hourStart: number; hourEnd: number }
  | { kind: "meal"; data: DayAgenda["agenda"]["meals"][number]; hourStart: number; hourEnd: number }
  | { kind: "focus"; data: DayAgenda["agenda"]["focus"][number]; hourStart: number; hourEnd: number }
  | { kind: "meditation"; data: DayAgenda["agenda"]["meditations"][number]; hourStart: number; hourEnd: number }
  | { kind: "timeblock"; data: DayAgenda["dailyPlan"]["timeBlocks"][number]; hourStart: number; hourEnd: number };

// Meal default hours si no hay hora explícita
const MEAL_DEFAULT_HOUR: Record<string, number> = {
  breakfast: 8,
  lunch: 13,
  dinner: 20,
  snack: 16,
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

function hourOfDate(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function fmtHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export default function TodayView({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string;
  onDateChange: (date: string) => void;
}) {
  const tz = useUserStore((s) => s.user?.profile?.timezone);
  const [data, setData] = useState<DayAgenda | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);

  // Edit state for priorities + rating
  const [priorities, setPriorities] = useState<string[]>(["", "", ""]);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DayAgenda>(`/calendar/day/${selectedDate}`);
      setData(res);
      const p = [...(res.dailyPlan.topPriorities ?? [])];
      while (p.length < 3) p.push("");
      setPriorities(p.slice(0, 3));
      setRating(res.dailyPlan.rating);
      setNotes(res.dailyPlan.notes ?? "");
    } catch {
      toast.error("Error cargando el día");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Debounced save del daily plan
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      const cleanPriorities = priorities.filter((p) => p.trim().length > 0);
      const currentClean = data.dailyPlan.topPriorities.filter((p) => p.trim());
      const shouldSave =
        JSON.stringify(cleanPriorities) !== JSON.stringify(currentClean) ||
        rating !== data.dailyPlan.rating ||
        notes !== (data.dailyPlan.notes ?? "");
      if (!shouldSave) return;
      setSavingPlan(true);
      api
        .put(`/planner/daily/${selectedDate}`, {
          date: selectedDate,
          topPriorities: cleanPriorities,
          rating,
          notes,
          timeBlocks: data.dailyPlan.timeBlocks ?? [],
        })
        .catch(() => toast.error("Error guardando plan"))
        .finally(() => setSavingPlan(false));
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorities, rating, notes]);

  async function deleteEvent(id: string) {
    try {
      await api.delete(`/calendar/events/${id}`);
      setData((prev) =>
        prev ? { ...prev, events: prev.events.filter((e) => e.id !== id) } : prev
      );
      toast.success("Evento borrado");
    } catch {
      toast.error("Error");
    }
  }

  async function toggleEventComplete(id: string, completed: boolean) {
    try {
      await api.patch(`/calendar/events/${id}`, { completed: !completed });
      setData((prev) =>
        prev
          ? {
              ...prev,
              events: prev.events.map((e) =>
                e.id === id ? { ...e, completed: !completed } : e
              ),
            }
          : prev
      );
    } catch {
      toast.error("Error");
    }
  }

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!data) return [];
    const items: TimelineItem[] = [];

    for (const ev of data.events) {
      const hourStart = hourOfDate(ev.startAt);
      const hourEnd = ev.endAt ? hourOfDate(ev.endAt) : hourStart + 0.5;
      items.push({ kind: "event", data: ev, hourStart, hourEnd });
    }
    for (const w of data.agenda.workouts) {
      // Sin hora específica, asumimos 18:00 si no está completado; si completado, dejamos al final del día
      const hourStart = 18;
      const hourEnd = 18 + (w.durationMinutes || 60) / 60;
      items.push({ kind: "workout", data: w, hourStart, hourEnd });
    }
    for (const m of data.agenda.meals) {
      const hourStart = MEAL_DEFAULT_HOUR[m.mealType] ?? 12;
      items.push({ kind: "meal", data: m, hourStart, hourEnd: hourStart + 0.5 });
    }
    for (const f of data.agenda.focus) {
      const hourStart = hourOfDate(f.startedAt);
      const dur = (f.actualMinutes ?? f.plannedMinutes) / 60;
      items.push({ kind: "focus", data: f, hourStart, hourEnd: hourStart + dur });
    }
    for (const m of data.agenda.meditations) {
      // Sin hora, asumimos 7am si no se sabe
      const hourStart = 7;
      items.push({ kind: "meditation", data: m, hourStart, hourEnd: hourStart + m.durationMinutes / 60 });
    }
    for (const tb of data.dailyPlan.timeBlocks) {
      items.push({ kind: "timeblock", data: tb, hourStart: tb.startTime, hourEnd: tb.endTime });
    }
    return items.sort((a, b) => a.hourStart - b.hourStart);
  }, [data]);

  const todayDate = new Date(selectedDate + "T12:00:00");
  const isToday = selectedDate === todayLocal(tz);

  function shiftDate(delta: number) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    onDateChange(toLocalDateStr(d, tz));
  }

  if (loading && !data) {
    return (
      <div className="text-center py-20 text-brand-warm">
        <Loader2 size={24} className="inline animate-spin mr-2" />
        Cargando tu día…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header con fecha + nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark m-0 capitalize">
            {isToday
              ? "Hoy"
              : todayDate.toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
          </h2>
          <p className="text-xs text-brand-warm mt-0.5">
            {timeline.length} elemento{timeline.length !== 1 ? "s" : ""} en tu agenda ·{" "}
            {data?.agenda.habits.filter((h) => h.completed).length}/
            {data?.agenda.habits.length ?? 0} hábitos
            {savingPlan && <span className="ml-3 text-brand-tan">· guardando…</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => shiftDate(-1)}
            className="px-3 py-1.5 rounded-button border border-brand-cream text-sm text-brand-medium hover:bg-brand-cream"
          >
            ← Ayer
          </button>
          <button
            onClick={() => onDateChange(todayLocal(tz))}
            className="px-3 py-1.5 rounded-button border border-brand-cream text-sm text-brand-medium hover:bg-brand-cream"
          >
            Hoy
          </button>
          <button
            onClick={() => shiftDate(1)}
            className="px-3 py-1.5 rounded-button border border-brand-cream text-sm text-brand-medium hover:bg-brand-cream"
          >
            Mañana →
          </button>
          <AIExportButton
            scope="daily"
            label="Analizar con IA"
            title="Cierre del día"
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      {/* Quick add */}
      <QuickAddBar
        onCreated={(ev) => {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  events: [...prev.events, ev].sort(
                    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
                  ),
                }
              : prev
          );
        }}
      />

      {/* Ambient cards: fasting, cycle, rituals */}
      {data && <AmbientCards data={data} />}

      {/* Top 3 priorities */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-semibold text-brand-dark m-0">
            Top 3 prioridades
          </h3>
          <Bookmark size={14} className="text-accent" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-bold text-accent w-5">{i + 1}.</span>
              <input
                type="text"
                value={priorities[i] ?? ""}
                onChange={(e) => {
                  const next = [...priorities];
                  next[i] = e.target.value;
                  setPriorities(next);
                }}
                placeholder={`Prioridad ${i + 1}…`}
                className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-4">
          Timeline del día
        </h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-8">
            Tu día está libre. Usa el quick-add arriba para agendar algo.
          </p>
        ) : (
          <div className="space-y-1.5">
            {timeline.map((item, idx) => (
              <TimelineRow
                key={`${item.kind}-${idx}`}
                item={item}
                onDelete={item.kind === "event" ? () => deleteEvent(item.data.id) : undefined}
                onToggleComplete={
                  item.kind === "event"
                    ? () => toggleEventComplete(item.data.id, item.data.completed)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Hábitos del día (chips) */}
      {data && data.agenda.habits.length > 0 && (
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
            Hábitos del día
          </h3>
          <div className="flex gap-2 flex-wrap">
            {data.agenda.habits.map((h) => (
              <div
                key={h.id}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border",
                  h.completed
                    ? "bg-success/10 border-success text-success"
                    : "bg-brand-cream border-brand-cream text-brand-medium"
                )}
              >
                <span>{h.icon}</span>
                <span className="font-medium">{h.name}</span>
                {h.streak > 0 && (
                  <span className="text-[10px] opacity-80">· 🔥 {h.streak}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating + notes */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Cómo fue tu día · {rating ?? "—"}/10
        </h3>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setRating(rating === n ? null : n)}
              className={cn(
                "flex-1 py-2 rounded text-xs font-semibold transition",
                rating === n
                  ? "bg-accent text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas del día…"
          className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────

function AmbientCards({ data }: { data: DayAgenda }) {
  const cards: React.ReactNode[] = [];
  if (data.agenda.fasting?.active) {
    const f = data.agenda.fasting;
    const elapsed = (Date.now() - new Date(f.startedAt).getTime()) / 3600000;
    const pct = Math.min(100, (elapsed / f.targetHours) * 100);
    cards.push(
      <div
        key="fasting"
        className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-xl p-3 flex items-center gap-3"
      >
        <Droplet size={18} className="text-accent" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-brand-dark">
            Ayuno activo · {f.protocol ?? `${f.targetHours}h`}
          </p>
          <p className="text-[11px] text-brand-warm">
            {elapsed.toFixed(1)}h de {f.targetHours}h · {pct.toFixed(0)}%
          </p>
        </div>
      </div>
    );
  }
  if (data.agenda.cycle) {
    cards.push(
      <div
        key="cycle"
        className="bg-gradient-to-r from-danger/10 to-danger/5 border border-danger/30 rounded-xl p-3 flex items-center gap-3"
      >
        <span className="text-lg">{data.agenda.cycle.emoji}</span>
        <div>
          <p className="text-xs font-semibold text-brand-dark">
            Día {data.agenda.cycle.day} · Fase {data.agenda.cycle.name}
          </p>
        </div>
      </div>
    );
  }
  if (data.agenda.rituals.morning) {
    cards.push(
      <div
        key="morning"
        className={cn(
          "border rounded-xl p-3 flex items-center gap-3",
          data.agenda.rituals.morning.completed
            ? "bg-success/10 border-success/30"
            : "bg-accent-glow/20 border-accent/30"
        )}
      >
        <Sunrise size={18} className="text-accent" />
        <p className="text-xs font-semibold text-brand-dark">
          Ritual mañana {data.agenda.rituals.morning.completed ? "✓" : "pendiente"}
        </p>
      </div>
    );
  }
  if (data.agenda.rituals.evening) {
    cards.push(
      <div
        key="evening"
        className={cn(
          "border rounded-xl p-3 flex items-center gap-3",
          data.agenda.rituals.evening.completed
            ? "bg-success/10 border-success/30"
            : "bg-brand-dark/5 border-brand-medium/30"
        )}
      >
        <Sunset size={18} className="text-brand-medium" />
        <p className="text-xs font-semibold text-brand-dark">
          Ritual noche {data.agenda.rituals.evening.completed ? "✓" : "pendiente"}
        </p>
      </div>
    );
  }
  if (cards.length === 0) return null;
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{cards}</div>;
}

function TimelineRow({
  item,
  onDelete,
  onToggleComplete,
}: {
  item: TimelineItem;
  onDelete?: () => void;
  onToggleComplete?: () => void;
}) {
  let icon: React.ReactNode;
  let title = "";
  let subtitle = "";
  let colorClass = "border-brand-cream bg-brand-warm-white";
  let completed = false;

  switch (item.kind) {
    case "event": {
      const meta = TYPE_META[item.data.type] ?? TYPE_META.custom;
      icon = <span className="text-base">{item.data.icon ?? meta.emoji}</span>;
      title = item.data.title;
      subtitle = [
        item.data.location,
        item.data.description?.slice(0, 60),
      ]
        .filter(Boolean)
        .join(" · ");
      colorClass = meta.bgClass;
      completed = item.data.completed;
      break;
    }
    case "workout":
      icon = <Dumbbell size={16} className="text-danger" />;
      title = item.data.title;
      subtitle = `${item.data.durationMinutes}min${
        item.data.prsHit > 0 ? ` · 🏆 ${item.data.prsHit} PR${item.data.prsHit > 1 ? "s" : ""}` : ""
      }`;
      colorClass = "bg-danger/5 border-danger/30";
      completed = item.data.completed;
      break;
    case "meal":
      icon = <Utensils size={16} className="text-success" />;
      title = MEAL_LABELS[item.data.mealType] ?? "Comida";
      subtitle = `${item.data.itemCount} alimento${item.data.itemCount !== 1 ? "s" : ""} · ${item.data.calories} kcal`;
      colorClass = "bg-success/5 border-success/30";
      completed = true;
      break;
    case "focus":
      icon = <Target size={16} className="text-info" />;
      title = item.data.task ?? "Deep Work";
      subtitle = `${item.data.actualMinutes ?? item.data.plannedMinutes}min${
        item.data.active ? " · en curso" : ""
      }`;
      colorClass = item.data.active ? "bg-info/10 border-info" : "bg-info/5 border-info/30";
      completed = !item.data.active;
      break;
    case "meditation":
      icon = <Wind size={16} className="text-accent" />;
      title = "Meditación";
      subtitle = `${item.data.durationMinutes}min · ${item.data.meditationType}`;
      colorClass = "bg-accent/5 border-accent/30";
      completed = true;
      break;
    case "timeblock":
      icon = <Circle size={14} className="text-brand-medium" />;
      title = item.data.title;
      subtitle = `${fmtHour(item.data.startTime)} – ${fmtHour(item.data.endTime)}${
        item.data.category ? ` · ${item.data.category}` : ""
      }`;
      colorClass = item.data.completed
        ? "bg-brand-cream border-brand-cream"
        : "bg-brand-warm-white border-brand-cream";
      completed = item.data.completed;
      break;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 border rounded-lg px-3 py-2.5 transition",
        colorClass,
        completed && "opacity-60"
      )}
    >
      <span className="text-[11px] font-mono text-brand-warm shrink-0 pt-0.5 w-12">
        {fmtHour(item.hourStart)}
      </span>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-brand-dark truncate",
            completed && "line-through"
          )}
        >
          {title}
        </p>
        {subtitle && <p className="text-[11px] text-brand-warm">{subtitle}</p>}
      </div>
      {onToggleComplete && (
        <button
          onClick={onToggleComplete}
          className="shrink-0 p-1 text-brand-warm hover:text-success"
          title={completed ? "Marcar pendiente" : "Marcar completado"}
        >
          {completed ? <CheckCircle2 size={14} className="text-success" /> : <Circle size={14} />}
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="shrink-0 p-1 text-brand-warm hover:text-danger"
          title="Borrar"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
