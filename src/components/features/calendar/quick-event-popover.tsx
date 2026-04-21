"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Trash2, X, MapPin, FileText, Bell, Repeat } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import type { CalendarEvent } from "./types";
import { TYPE_META } from "./types";

type Mode =
  | { kind: "create"; dateStr: string; hour: number }
  | { kind: "edit"; event: CalendarEvent };

export interface AnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  mode: Mode;
  /** Rect del elemento clickeado (viewport coords). El popover se posiciona al lado. */
  anchor: AnchorRect;
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
  onDeleted?: (id: string) => void;
}

const POPOVER_WIDTH = 360;
const POPOVER_MARGIN = 8;

/**
 * Decide posición fixed del popover en viewport, eligiendo si debe abrirse
 * a la derecha o izquierda del anchor y ajustando si se sale de la pantalla.
 */
function computePosition(anchor: AnchorRect, popoverHeight: number): {
  left: number;
  top: number;
  side: "right" | "left";
} {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  // Preferir derecha, caer a izquierda si no cabe
  let side: "right" | "left" = "right";
  let left = anchor.left + anchor.width + POPOVER_MARGIN;
  if (left + POPOVER_WIDTH + 12 > vw) {
    side = "left";
    left = anchor.left - POPOVER_WIDTH - POPOVER_MARGIN;
  }
  // Si tampoco cabe a la izquierda (columna estrecha + popover grande), recurre a centrarlo
  if (left < 12) {
    left = Math.max(12, Math.min(vw - POPOVER_WIDTH - 12, anchor.left));
  }

  // Vertical: alinea por top del anchor, ajusta si desborda abajo
  let top = anchor.top;
  if (top + popoverHeight + 12 > vh) {
    top = Math.max(12, vh - popoverHeight - 12);
  }
  if (top < 12) top = 12;

  return { left, top, side };
}

function isoOfDateHour(dateStr: string, hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  // Construir localmente para que el offset sea el del navegador (México).
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function yyyymmdd(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function combineDateAndTime(dateStr: string, hhmmStr: string): string {
  const [hh, mm] = hhmmStr.split(":").map((n) => parseInt(n, 10) || 0);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function QuickEventPopover({
  mode,
  anchor,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = mode.kind === "edit";

  // Estado inicial según modo
  const initial = useMemo(() => {
    if (mode.kind === "edit") {
      const e = mode.event;
      return {
        title: e.title,
        type: e.type,
        dateStr: yyyymmdd(e.startAt),
        startTime: hhmm(e.startAt),
        endTime: e.endAt ? hhmm(e.endAt) : hhmm(new Date(new Date(e.startAt).getTime() + 3600000).toISOString()),
        description: e.description ?? "",
        location: e.location ?? "",
        reminderMinutes: e.reminderMinutes,
        recurrence: e.recurrence,
      };
    }
    // create
    const defaultEndHour = mode.hour + 1;
    return {
      title: "",
      type: "custom",
      dateStr: mode.dateStr,
      startTime: `${String(Math.floor(mode.hour)).padStart(2, "0")}:${String(Math.round((mode.hour - Math.floor(mode.hour)) * 60)).padStart(2, "0")}`,
      endTime: `${String(Math.floor(defaultEndHour)).padStart(2, "0")}:${String(Math.round((defaultEndHour - Math.floor(defaultEndHour)) * 60)).padStart(2, "0")}`,
      description: "",
      location: "",
      reminderMinutes: null as number | null,
      recurrence: null as string | null,
    };
  }, [mode]);

  const [title, setTitle] = useState(initial.title);
  const [type, setType] = useState<string>(initial.type);
  const [dateStr, setDateStr] = useState(initial.dateStr);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(initial.reminderMinutes);
  const [recurrence, setRecurrence] = useState<string | null>(initial.recurrence);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Focus al input de título al abrir (create) o al título existente (edit)
  useEffect(() => {
    titleInputRef.current?.focus();
    if (!isEdit) titleInputRef.current?.select();
  }, [isEdit]);

  // Calcular posición después del primer render (necesitamos saber la altura real)
  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const h = popoverRef.current.offsetHeight;
    const p = computePosition(anchor, h);
    setPos({ left: p.left, top: p.top });
  }, [anchor, showMore]);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, type, dateStr, startTime, endTime, description, location, reminderMinutes, recurrence]);

  // Cerrar al click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(e.target as Node)) return;
      onClose();
    }
    // Delay para que el click que abre no lo cierre inmediatamente
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onClickOutside);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [onClose]);

  async function save() {
    if (!title.trim()) {
      toast.error("Escribe un título");
      titleInputRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      const startAt = combineDateAndTime(dateStr, startTime);
      const endAt = combineDateAndTime(dateStr, endTime);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        startAt,
        endAt,
        type,
        location: location.trim() || null,
        reminderMinutes,
        recurrence,
      };
      const saved =
        mode.kind === "edit"
          ? await api.patch<CalendarEvent>(`/calendar/events/${mode.event.id}`, payload)
          : await api.post<CalendarEvent>("/calendar/events", payload);
      onSaved(saved);
      toast.success(isEdit ? "Guardado" : "Evento creado");
      onClose();
    } catch {
      toast.error("Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (mode.kind !== "edit") return;
    if (!confirm("¿Borrar evento?")) return;
    try {
      await api.delete(`/calendar/events/${mode.event.id}`);
      onDeleted?.(mode.event.id);
      toast.success("Borrado");
      onClose();
    } catch {
      toast.error("Error");
    }
  }

  const typeMeta = TYPE_META[type] ?? TYPE_META.custom;

  // Render en portal-like fixed position
  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={isEdit ? "Editar evento" : "Nuevo evento"}
      className="fixed z-50 bg-brand-paper rounded-2xl shadow-warm-lg border border-brand-tan flex flex-col"
      style={{
        width: POPOVER_WIDTH,
        left: pos?.left ?? anchor.left,
        top: pos?.top ?? anchor.top,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {/* Header: color/type picker + close */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-brand-light-cream">
        <div className="relative">
          <button
            onClick={() => setTypeMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border",
              typeMeta.bgClass,
            )}
            title="Tipo de evento"
          >
            <span>{typeMeta.emoji}</span>
            <span>{typeMeta.label}</span>
            <span className="text-[10px] opacity-60">▾</span>
          </button>
          {typeMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-brand-paper rounded-lg border border-brand-tan shadow-warm py-1 z-10 w-40">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => {
                    setType(key);
                    setTypeMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-brand-cream flex items-center gap-2",
                    type === key && "bg-brand-cream font-semibold",
                  )}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-brand-cream text-brand-warm"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isEdit ? "Título" : "Nuevo evento"}
          className="w-full px-0 py-1 border-0 border-b border-brand-light-cream bg-transparent text-brand-dark text-base font-serif focus:outline-none focus:border-accent"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void save();
            }
          }}
        />

        <div className="text-xs text-brand-warm">
          {formatDateLong(dateStr)}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-xs text-brand-dark focus:outline-none focus:border-accent"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-[88px] px-2 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-xs text-brand-dark font-mono focus:outline-none focus:border-accent"
          />
          <span className="text-brand-warm text-xs">→</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-[88px] px-2 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-xs text-brand-dark font-mono focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-brand-warm shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Agregar ubicación"
            className="flex-1 px-2 py-1 border-0 bg-transparent text-brand-dark text-sm placeholder:text-brand-tan focus:outline-none"
          />
        </div>

        <div className="flex items-start gap-2">
          <FileText size={14} className="text-brand-warm shrink-0 mt-1.5" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas, URL…"
            rows={2}
            className="flex-1 px-2 py-1 border-0 bg-transparent text-brand-dark text-sm placeholder:text-brand-tan focus:outline-none resize-none"
          />
        </div>

        {!showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="text-xs text-accent hover:underline self-start"
          >
            Más opciones (recordatorio, repetir)
          </button>
        )}

        {showMore && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Bell size={14} className="text-brand-warm" />
                <span className="text-xs font-semibold text-brand-medium">Recordatorio</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {[null, 5, 15, 30, 60, 1440].map((m) => (
                  <button
                    key={m ?? "none"}
                    onClick={() => setReminderMinutes(m)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] transition",
                      reminderMinutes === m
                        ? "bg-accent text-white"
                        : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                    )}
                  >
                    {m === null
                      ? "Sin"
                      : m === 1440
                        ? "1 día antes"
                        : m >= 60
                          ? `${m / 60}h antes`
                          : `${m}min antes`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Repeat size={14} className="text-brand-warm" />
                <span className="text-xs font-semibold text-brand-medium">Se repite</span>
              </div>
              <div className="flex gap-1 flex-wrap">
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
                      "px-2 py-0.5 rounded-full text-[11px] transition",
                      recurrence === opt.val
                        ? "bg-accent text-white"
                        : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-brand-light-cream flex items-center justify-between">
        {isEdit ? (
          <button
            onClick={remove}
            className="p-1.5 rounded hover:bg-danger-light/30 text-danger"
            title="Borrar evento"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <span className="text-[10px] text-brand-tan">⌘⏎ para guardar</span>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-button text-xs text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-button text-xs font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
          >
            {saving ? "…" : isEdit ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper para construir AnchorRect desde un MouseEvent (útil para llamadores)
export function anchorFromClickEvent(e: React.MouseEvent | MouseEvent): AnchorRect {
  const target = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
  if (target) {
    const r = target.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }
  // Fallback: construye rect de 1×1 en la posición del click
  return { left: e.clientX, top: e.clientY, width: 0, height: 0 };
}

// isoOfDateHour exportada por si algún caller necesita el ISO default
export { isoOfDateHour };
