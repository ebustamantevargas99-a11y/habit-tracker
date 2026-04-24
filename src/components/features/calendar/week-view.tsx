"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import QuickAddBar from "./quick-add-bar";
import QuickEventPopover, { type AnchorRect } from "./quick-event-popover";
import type { CalendarEvent, CalendarGroup } from "./types";
import { TYPE_META } from "./types";
import { useUserStore } from "@/stores/user-store";
import { toLocalDateStr } from "@/lib/date/local";

// Configuración del grid
const HOUR_START = 6;  // 6am
const HOUR_END = 23;   // 11pm
const HOUR_HEIGHT = 56; // px por hora
const TOTAL_HOURS = HOUR_END - HOUR_START;

type WeekData = {
  events: CalendarEvent[];
  workouts: Array<{ id: string; date: string; name: string; durationMinutes: number; completed: boolean }>;
  meals: Array<{ id: string; date: string; mealType: string }>;
  habitLogs: Array<{ date: string; completed: boolean }>;
  milestones: Array<{ id: string; date: string; type: string; title: string; icon: string | null }>;
  density: Record<string, number>;
};

type Editing =
  | { mode: "create"; dateStr: string; hour: number; anchor: AnchorRect }
  | { mode: "edit"; event: CalendarEvent; anchor: AnchorRect };

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day; // Lunes como inicio
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * "YYYY-MM-DD" en la TZ del user. Fallback a la TZ del navegador si no pasa.
 * Reemplaza el viejo `toISOString().split("T")[0]` que devolvía UTC.
 */
function toDateStr(d: Date, tz?: string | null): string {
  return toLocalDateStr(d, tz);
}

function hourFromDate(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function durationHours(ev: CalendarEvent): number {
  if (ev.endAt) {
    return (
      (new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime()) /
      3600000
    );
  }
  return 0.5;
}

interface WeekViewProps {
  groups: CalendarGroup[];
}

export default function WeekView({ groups }: WeekViewProps) {
  const tz = useUserStore((s) => s.user?.profile?.timezone);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);

  // Índice id→group para lookups rápidos (color, visible)
  const groupsById = useMemo(() => {
    const m = new Map<string, CalendarGroup>();
    for (const g of groups) m.set(g.id, g);
    return m;
  }, [groups]);

  // Filtra eventos: si tienen groupId, solo aparecen si el grupo es visible.
  // Si no tienen groupId, siempre se muestran (comportamiento por defecto).
  function isEventVisible(ev: CalendarEvent): boolean {
    if (!ev.groupId) return true;
    const g = groupsById.get(ev.groupId);
    return g ? g.visible : true;
  }

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const todayStr = useMemo(() => toDateStr(new Date(), tz), [tz]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const from = toDateStr(weekStart, tz);
      const to = toDateStr(weekEnd, tz);
      const res = await api.get<WeekData>(`/calendar/range?from=${from}&to=${to}`);
      setData(res);
    } catch {
      toast.error("Error cargando semana");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(e: DragEndEvent) {
    if (!e.over || !e.active) return;
    // Los eventos no recurrentes usan `${id}` como dnd-id. No emitimos
    // listeners para recurrentes (disabled en useDraggable), así que
    // aquí sólo llegan no-recurrentes.
    const eventId = String(e.active.id);
    const overId = e.over.id as string; // formato "cell-YYYY-MM-DD-H.H"

    const event = data?.events.find((ev) => ev.id === eventId);
    if (!event) return;

    const match = overId.match(/^cell-(\d{4}-\d{2}-\d{2})-([\d.]+)$/);
    if (!match) return;
    const newDate = match[1];
    const newHour = parseFloat(match[2]);

    // Construir nuevo startAt conservando minutos/duración
    const newStart = new Date(newDate + "T00:00:00");
    newStart.setHours(Math.floor(newHour), Math.round((newHour - Math.floor(newHour)) * 60));

    const dur = durationHours(event);
    const newEnd = event.endAt ? new Date(newStart.getTime() + dur * 3600000) : null;

    // Optimistic update
    setData((prev) =>
      prev
        ? {
            ...prev,
            events: prev.events.map((ev) =>
              ev.id === eventId
                ? {
                    ...ev,
                    startAt: newStart.toISOString(),
                    endAt: newEnd?.toISOString() ?? null,
                  }
                : ev
            ),
          }
        : prev
    );

    try {
      await api.patch(`/calendar/events/${eventId}`, {
        startAt: newStart.toISOString(),
        endAt: newEnd?.toISOString() ?? null,
      });
    } catch {
      toast.error("Error moviendo evento");
      await refresh();
    }
  }

  function goToToday() {
    setWeekStart(startOfWeek(new Date()));
  }

  function shiftWeek(delta: number) {
    setWeekStart((prev) => addDays(prev, delta * 7));
  }

  const weekLabel = useMemo(() => {
    const first = weekStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    const last = weekEnd.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
    return `${first} – ${last}`;
  }, [weekStart, weekEnd]);

  if (loading && !data) {
    return (
      <div className="text-center py-16 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando semana…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-2 rounded-button border border-brand-cream text-brand-medium hover:bg-brand-cream"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-button border border-brand-cream text-sm text-brand-medium hover:bg-brand-cream"
          >
            Esta semana
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="p-2 rounded-button border border-brand-cream text-brand-medium hover:bg-brand-cream"
          >
            <ChevronRight size={16} />
          </button>
          <h2 className="font-serif text-lg font-semibold text-brand-dark ml-3">{weekLabel}</h2>
        </div>
      </div>

      <QuickAddBar
        onCreated={(ev) => {
          setData((prev) => (prev ? { ...prev, events: [...prev.events, ev] } : prev));
        }}
      />

      {/* Grid semanal */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl overflow-hidden">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {/* Header días */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-brand-cream bg-brand-warm-white">
            <div />
            {weekDays.map((d) => {
              const isToday = toDateStr(d, tz) === todayStr;
              const density = data?.density[toDateStr(d, tz)] ?? 0;
              return (
                <div
                  key={toDateStr(d, tz)}
                  className={cn(
                    "px-2 py-2 text-center border-l border-brand-cream",
                    isToday && "bg-accent/10"
                  )}
                >
                  <div className="text-[10px] uppercase tracking-widest text-brand-warm">
                    {d.toLocaleDateString("es-MX", { weekday: "short" })}
                  </div>
                  <div
                    className={cn(
                      "text-xl font-bold",
                      isToday ? "text-accent" : "text-brand-dark"
                    )}
                  >
                    {d.getDate()}
                  </div>
                  {density > 0 && (
                    <div
                      className="mt-1 h-1 rounded-full mx-auto bg-accent"
                      style={{
                        width: `${Math.min(100, density * 15)}%`,
                        opacity: Math.min(1, 0.3 + density * 0.1),
                      }}
                      title={`${Math.round(density)} items`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid horario */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {/* Columna de horas */}
            <div>
              {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                <div
                  key={i}
                  style={{ height: HOUR_HEIGHT }}
                  className="text-[10px] font-mono text-brand-tan text-right pr-2 pt-0.5 border-t border-brand-cream"
                >
                  {String(HOUR_START + i).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {weekDays.map((d) => {
              const dateStr = toDateStr(d, tz);
              const dayEvents = data?.events.filter(
                (e) => toDateStr(new Date(e.startAt), tz) === dateStr && isEventVisible(e),
              ) ?? [];
              const dayWorkouts = data?.workouts.filter((w) => w.date === dateStr) ?? [];
              return (
                <DayColumn
                  key={dateStr}
                  dateStr={dateStr}
                  todayStr={todayStr}
                  events={dayEvents}
                  workouts={dayWorkouts}
                  groupsById={groupsById}
                  onCellClick={(hour, anchor) =>
                    setEditing({ mode: "create", dateStr, hour, anchor })
                  }
                  onEventClick={(ev, anchor) =>
                    setEditing({ mode: "edit", event: ev, anchor })
                  }
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Popover inline para crear / editar */}
      {editing && (
        <QuickEventPopover
          mode={
            editing.mode === "create"
              ? { kind: "create", dateStr: editing.dateStr, hour: editing.hour }
              : { kind: "edit", event: editing.event }
          }
          anchor={editing.anchor}
          groups={groups}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            // Si el evento es recurrente, las ocurrencias expandidas
            // viven sólo en el server — tenemos que re-fetch para que
            // aparezcan todos los días correctamente.
            if (saved.recurrence) {
              void refresh();
              return;
            }
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
        💡 Clic en una celda vacía para crear · clic en un evento para editarlo · arrástralos para moverlos
      </p>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function DayColumn({
  dateStr,
  todayStr,
  events,
  workouts,
  groupsById,
  onCellClick,
  onEventClick,
}: {
  dateStr: string;
  todayStr: string;
  events: CalendarEvent[];
  workouts: Array<{ id: string; name: string; durationMinutes: number; completed: boolean }>;
  groupsById: Map<string, CalendarGroup>;
  onCellClick: (hour: number, anchor: AnchorRect) => void;
  onEventClick: (ev: CalendarEvent, anchor: AnchorRect) => void;
}) {
  const isToday = dateStr === todayStr;

  return (
    <div
      className={cn(
        "relative border-l border-brand-cream",
        isToday && "bg-accent/5"
      )}
      style={{ height: (TOTAL_HOURS + 1) * HOUR_HEIGHT }}
    >
      {/* Cells droppable + clickable por hora */}
      {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
        <DropCell
          key={i}
          dateStr={dateStr}
          hour={HOUR_START + i}
          onCellClick={onCellClick}
        />
      ))}

      {/* Eventos custom (draggable) — los recurrentes emiten una fila
          por ocurrencia con mismo id. Composite key evita colisiones. */}
      {events.map((ev) => (
        <EventBlock
          key={`${ev.id}-${ev.startAt}`}
          event={ev}
          group={ev.groupId ? groupsById.get(ev.groupId) ?? null : null}
          onClick={(anchor) => onEventClick(ev, anchor)}
        />
      ))}

      {/* Workouts (read-only) */}
      {workouts.map((w) => (
        <WorkoutBlock key={w.id} workout={w} />
      ))}
    </div>
  );
}

function DropCell({
  dateStr,
  hour,
  onCellClick,
}: {
  dateStr: string;
  hour: number;
  onCellClick: (hour: number, anchor: AnchorRect) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${dateStr}-${hour}` });
  const cellRef = useRef<HTMLDivElement | null>(null);

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      cellRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Ignorar si el click vino desde un drag
    if (!cellRef.current) return;
    const r = cellRef.current.getBoundingClientRect();
    // Calcular la hora exacta del click basado en la posición vertical dentro de la celda.
    // Cada celda ocupa HOUR_HEIGHT px y representa 1h; offsetY / HOUR_HEIGHT = fracción.
    const fraction = (e.clientY - r.top) / r.height;
    const preciseHour =
      hour + Math.max(0, Math.min(0.75, Math.floor(fraction * 4) / 4));
    onCellClick(preciseHour, {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    });
  }

  return (
    <div
      ref={combinedRef}
      onClick={handleClick}
      style={{ height: HOUR_HEIGHT }}
      className={cn(
        "border-t border-brand-cream transition cursor-pointer hover:bg-accent/5",
        isOver && "bg-accent/20",
      )}
    />
  );
}

function EventBlock({
  event,
  group,
  onClick,
}: {
  event: CalendarEvent;
  group: CalendarGroup | null;
  onClick: (anchor: AnchorRect) => void;
}) {
  const isRecurring = !!event.recurrence;
  // Para eventos recurrentes deshabilitamos drag: cada ocurrencia
  // comparte id con el seed, y mover una ocurrencia no crea excepción
  // (feature pendiente). Mejor forzar que el user edite la serie.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    disabled: isRecurring,
  });
  const elRef = useRef<HTMLDivElement | null>(null);

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      elRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  const hourStart = hourFromDate(event.startAt);
  const dur = durationHours(event);
  const top = (hourStart - HOUR_START) * HOUR_HEIGHT;
  const height = Math.max(20, dur * HOUR_HEIGHT);

  const meta = TYPE_META[event.type] ?? TYPE_META.custom;
  // Prioridad de color: custom explícito > color del grupo > default del type
  const effectiveColor =
    event.type === "custom" && event.color
      ? event.color
      : group
        ? group.color
        : null;

  const style: React.CSSProperties = {
    position: "absolute",
    top,
    left: 2,
    right: 2,
    height,
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 10,
  };

  if (effectiveColor) {
    style.backgroundColor = `${effectiveColor}22`;
    style.borderLeftColor = effectiveColor;
    style.color = effectiveColor;
  }

  const label =
    event.type === "custom" && event.category?.trim()
      ? event.category
      : group
        ? group.name
        : null;

  return (
    <div
      ref={combinedRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        if (!elRef.current) return;
        const r = elRef.current.getBoundingClientRect();
        onClick({ left: r.left, top: r.top, width: r.width, height: r.height });
      }}
      className={cn(
        "rounded-md border-l-4 px-1.5 py-1 cursor-grab active:cursor-grabbing text-[10px] leading-tight overflow-hidden",
        !effectiveColor && meta.bgClass,
        event.completed && "line-through opacity-60"
      )}
    >
      <div className="flex items-center gap-1">
        {event.icon && <span>{event.icon}</span>}
        <span className="font-semibold truncate">{event.title}</span>
        {isRecurring && <span className="ml-auto text-[9px] opacity-70" title="Evento recurrente">🔁</span>}
      </div>
      {label && (
        <div className="text-[9px] uppercase tracking-widest opacity-70 truncate">
          {label}
        </div>
      )}
      {height > 30 && (
        <div className="text-[9px] opacity-70 font-mono">
          {new Date(event.startAt).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}

function WorkoutBlock({
  workout,
}: {
  workout: { name: string; durationMinutes: number; completed: boolean };
}) {
  // Workouts sin hora específica → los ponemos a las 18:00 por default
  const hour = 18;
  const dur = workout.durationMinutes / 60;
  const top = (hour - HOUR_START) * HOUR_HEIGHT;
  const height = Math.max(24, dur * HOUR_HEIGHT);
  return (
    <div
      style={{ position: "absolute", top, left: 2, right: 2, height, zIndex: 5 }}
      className={cn(
        "rounded-md border-l-4 border-danger bg-danger/10 px-1.5 py-1 text-[10px] leading-tight overflow-hidden",
        workout.completed && "opacity-60"
      )}
      title="Entrenamiento del día"
    >
      <div className="font-semibold text-danger truncate">💪 {workout.name}</div>
      <div className="text-[9px] text-danger/70">{workout.durationMinutes}min</div>
    </div>
  );
}
