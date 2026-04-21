"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import QuickAddBar from "./quick-add-bar";
import type { CalendarEvent } from "./types";
import { TYPE_META } from "./types";

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

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
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

export default function WeekView() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const from = toDateStr(weekStart);
      const to = toDateStr(weekEnd);
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
    const eventId = e.active.id as string;
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

  async function deleteEvent(id: string) {
    if (!confirm("¿Borrar evento?")) return;
    try {
      await api.delete(`/calendar/events/${id}`);
      setData((prev) =>
        prev ? { ...prev, events: prev.events.filter((e) => e.id !== id) } : prev
      );
      setSelectedEvent(null);
      toast.success("Borrado");
    } catch {
      toast.error("Error");
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
              const isToday = toDateStr(d) === toDateStr(new Date());
              const density = data?.density[toDateStr(d)] ?? 0;
              return (
                <div
                  key={toDateStr(d)}
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
              const dateStr = toDateStr(d);
              const dayEvents = data?.events.filter(
                (e) => toDateStr(new Date(e.startAt)) === dateStr
              ) ?? [];
              const dayWorkouts = data?.workouts.filter((w) => w.date === dateStr) ?? [];
              return (
                <DayColumn
                  key={dateStr}
                  dateStr={dateStr}
                  events={dayEvents}
                  workouts={dayWorkouts}
                  onEventClick={setSelectedEvent}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Detalle de evento seleccionado */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => deleteEvent(selectedEvent.id)}
          onUpdate={(updated) => {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    events: prev.events.map((e) => (e.id === updated.id ? updated : e)),
                  }
                : prev
            );
            setSelectedEvent(updated);
          }}
        />
      )}

      <p className="text-[11px] text-brand-tan text-center">
        💡 Arrastra eventos para moverlos · Click en uno para editarlo
      </p>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function DayColumn({
  dateStr,
  events,
  workouts,
  onEventClick,
}: {
  dateStr: string;
  events: CalendarEvent[];
  workouts: Array<{ id: string; name: string; durationMinutes: number; completed: boolean }>;
  onEventClick: (ev: CalendarEvent) => void;
}) {
  const isToday = dateStr === toDateStr(new Date());

  return (
    <div
      className={cn(
        "relative border-l border-brand-cream",
        isToday && "bg-accent/5"
      )}
      style={{ height: (TOTAL_HOURS + 1) * HOUR_HEIGHT }}
    >
      {/* Cells droppable por hora */}
      {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
        <DropCell key={i} dateStr={dateStr} hour={HOUR_START + i} />
      ))}

      {/* Eventos custom (draggable) */}
      {events.map((ev) => (
        <EventBlock key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
      ))}

      {/* Workouts (read-only) */}
      {workouts.map((w) => (
        <WorkoutBlock key={w.id} workout={w} />
      ))}
    </div>
  );
}

function DropCell({ dateStr, hour }: { dateStr: string; hour: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${dateStr}-${hour}` });
  return (
    <div
      ref={setNodeRef}
      style={{ height: HOUR_HEIGHT }}
      className={cn(
        "border-t border-brand-cream transition",
        isOver && "bg-accent/20"
      )}
    />
  );
}

function EventBlock({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
  });

  const hourStart = hourFromDate(event.startAt);
  const dur = durationHours(event);
  const top = (hourStart - HOUR_START) * HOUR_HEIGHT;
  const height = Math.max(20, dur * HOUR_HEIGHT);

  const meta = TYPE_META[event.type] ?? TYPE_META.custom;

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "rounded-md border-l-4 px-1.5 py-1 cursor-grab active:cursor-grabbing text-[10px] leading-tight overflow-hidden",
        meta.bgClass,
        event.completed && "line-through opacity-60"
      )}
    >
      <div className="flex items-center gap-1">
        {event.icon && <span>{event.icon}</span>}
        <span className="font-semibold truncate">{event.title}</span>
      </div>
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
      title="Workout del día"
    >
      <div className="font-semibold text-danger truncate">💪 {workout.name}</div>
      <div className="text-[9px] text-danger/70">{workout.durationMinutes}min</div>
    </div>
  );
}

function EventDetailPanel({
  event,
  onClose,
  onDelete,
  onUpdate,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (ev: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(event.reminderMinutes);
  const [recurrence, setRecurrence] = useState<string | null>(event.recurrence);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.patch<CalendarEvent>(`/calendar/events/${event.id}`, {
        title,
        description: description || null,
        location: location || null,
        reminderMinutes,
        recurrence,
      });
      onUpdate(updated);
      toast.success("Guardado");
    } catch {
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream">
          <h3 className="font-display text-lg font-bold text-brand-dark m-0">Editar evento</h3>
          <p className="text-xs text-brand-warm">
            {new Date(event.startAt).toLocaleString("es-MX", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </header>
        <div className="px-6 py-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Descripción"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ubicación"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <div>
            <label className="text-xs text-brand-warm block mb-1.5">Recordatorio</label>
            <div className="flex gap-1.5 flex-wrap">
              {[null, 5, 15, 30, 60].map((m) => (
                <button
                  key={m ?? "none"}
                  onClick={() => setReminderMinutes(m)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition",
                    reminderMinutes === m
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {m === null ? "Sin" : `${m}min antes`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-brand-warm block mb-1.5">Se repite</label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { val: null, label: "Una vez" },
                { val: "daily", label: "Diario" },
                { val: "weekdays", label: "L-V" },
                { val: "weekly", label: "Semanal" },
                { val: "monthly", label: "Mensual" },
              ].map((opt) => (
                <button
                  key={opt.val ?? "once"}
                  onClick={() => setRecurrence(opt.val)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition",
                    recurrence === opt.val
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-between">
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-button text-xs text-danger hover:bg-danger-light/30 flex items-center gap-1.5"
          >
            <Trash2 size={12} /> Borrar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
            >
              {saving ? "…" : "Guardar"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
