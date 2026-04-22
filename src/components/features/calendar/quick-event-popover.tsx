"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Trash2, X, MapPin, FileText, Bell, Repeat, Palette, Check, Folder } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/components/ui";
import type { CalendarEvent, CalendarGroup } from "./types";
import { TYPE_META } from "./types";
import { parseRecurrence, formatRecurrence } from "@/lib/calendar/recurrence";

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
  /** Grupos disponibles para asignar al evento. Se filtran por visible en UI. */
  groups?: CalendarGroup[];
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
  onDeleted?: (id: string) => void;
}

const POPOVER_WIDTH = 380;
const POPOVER_MARGIN = 8;

// Paleta custom — colores utilizables para eventos
const CUSTOM_COLORS: Array<{ hex: string; label: string }> = [
  { hex: "#b8860b", label: "Gold" },
  { hex: "#dc2626", label: "Red" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#ca8a04", label: "Yellow" },
  { hex: "#16a34a", label: "Green" },
  { hex: "#0891b2", label: "Cyan" },
  { hex: "#2563eb", label: "Blue" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#db2777", label: "Pink" },
  { hex: "#6b7280", label: "Gray" },
];

const DAYS_MO_TO_SU = [
  { dow: 1, label: "L" },
  { dow: 2, label: "M" },
  { dow: 3, label: "M" },
  { dow: 4, label: "J" },
  { dow: 5, label: "V" },
  { dow: 6, label: "S" },
  { dow: 0, label: "D" },
];

// Presets que NO se consideran "custom" para UI. Los demás ("FREQ=...") abren editor.
const PRESET_VALUES = ["daily", "weekdays", "weekly", "monthly"];

function computePosition(anchor: AnchorRect, popoverHeight: number): {
  left: number;
  top: number;
} {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  let left = anchor.left + anchor.width + POPOVER_MARGIN;
  if (left + POPOVER_WIDTH + 12 > vw) {
    left = anchor.left - POPOVER_WIDTH - POPOVER_MARGIN;
  }
  if (left < 12) {
    left = Math.max(12, Math.min(vw - POPOVER_WIDTH - 12, anchor.left));
  }

  let top = anchor.top;
  if (top + popoverHeight + 12 > vh) {
    top = Math.max(12, vh - popoverHeight - 12);
  }
  if (top < 12) top = 12;

  return { left, top };
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
  groups,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = mode.kind === "edit";

  const initial = useMemo(() => {
    if (mode.kind === "edit") {
      const e = mode.event;
      return {
        title: e.title,
        type: e.type,
        category: e.category ?? "",
        color: e.color ?? "",
        groupId: e.groupId ?? "",
        dateStr: yyyymmdd(e.startAt),
        startTime: hhmm(e.startAt),
        endTime: e.endAt ? hhmm(e.endAt) : hhmm(new Date(new Date(e.startAt).getTime() + 3600000).toISOString()),
        description: e.description ?? "",
        location: e.location ?? "",
        reminderMinutes: e.reminderMinutes,
        recurrence: e.recurrence,
      };
    }
    const defaultEndHour = mode.hour + 1;
    return {
      title: "",
      type: "custom",
      category: "",
      color: "",
      groupId: "",
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
  const [category, setCategory] = useState(initial.category);
  const [color, setColor] = useState(initial.color);
  const [groupId, setGroupId] = useState(initial.groupId);
  const [dateStr, setDateStr] = useState(initial.dateStr);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(initial.reminderMinutes);
  const [recurrence, setRecurrence] = useState<string | null>(initial.recurrence);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(!!initial.recurrence || initial.reminderMinutes !== null);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  // Custom recurrence editor state (solo se muestra si recurrence no es preset)
  const [customRecOpen, setCustomRecOpen] = useState(
    !!initial.recurrence && !PRESET_VALUES.includes(initial.recurrence),
  );
  const existingRule = useMemo(
    () => parseRecurrence(initial.recurrence ?? null),
    [initial.recurrence],
  );
  const [recFreq, setRecFreq] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    existingRule?.freq ?? "WEEKLY",
  );
  const [recInterval, setRecInterval] = useState<number>(existingRule?.interval ?? 1);
  const [recByDay, setRecByDay] = useState<number[]>(
    existingRule?.byDay ?? [new Date(dateStr + "T00:00:00").getDay()],
  );

  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Si el user abre el editor custom, reemplaza el recurrence actual con la regla custom
  useEffect(() => {
    if (!customRecOpen) return;
    const rule = {
      freq: recFreq,
      byDay: recFreq === "WEEKLY" ? recByDay : undefined,
      interval: recInterval > 1 ? recInterval : undefined,
    };
    const out = formatRecurrence(rule);
    setRecurrence(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customRecOpen, recFreq, recInterval, recByDay]);

  useEffect(() => {
    titleInputRef.current?.focus();
    if (!isEdit) titleInputRef.current?.select();
  }, [isEdit]);

  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const h = popoverRef.current.offsetHeight;
    const p = computePosition(anchor, h);
    setPos({ left: p.left, top: p.top });
  }, [anchor, showMore, customRecOpen, type]);

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
  }, [title, type, category, color, groupId, dateStr, startTime, endTime, description, location, reminderMinutes, recurrence]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(e.target as Node)) return;
      onClose();
    }
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
        category: type === "custom" ? (category.trim() || null) : null,
        color: type === "custom" ? (color || null) : null,
        groupId: groupId || null,
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
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error guardando";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (mode.kind !== "edit") return;
    if (!confirm("¿Borrar evento?")) return;
    try {
      await api.delete(`/calendar/events/${mode.event.id}`);
      // Notificar al padre y cerrar — cerrar antes evita que un re-render deje
      // el popover apuntando a un evento que ya no existe.
      onDeleted?.(mode.event.id);
      toast.success("Evento borrado");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo borrar";
      toast.error(msg);
    }
  }

  const typeMeta = TYPE_META[type] ?? TYPE_META.custom;
  const isCustom = type === "custom";

  function toggleByDay(dow: number) {
    setRecByDay((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort(),
    );
  }

  function selectPreset(val: string | null) {
    setRecurrence(val);
    setCustomRecOpen(false);
  }

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
      {/* Header: tipo + close */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-brand-light-cream">
        <div className="relative">
          <button
            onClick={() => setTypeMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border",
              typeMeta.bgClass,
            )}
            style={isCustom && color ? { backgroundColor: `${color}22`, borderColor: `${color}80` } : undefined}
            title="Tipo de evento"
          >
            <span>{typeMeta.emoji}</span>
            <span>
              {isCustom && category.trim() ? category : typeMeta.label}
            </span>
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
        {/* Selector de calendario/grupo (si el user tiene grupos creados) */}
        {groups && groups.length > 0 && (
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-brand-warm shrink-0" />
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="flex-1 px-2 py-1 rounded border border-brand-cream bg-brand-warm-white text-xs text-brand-dark focus:outline-none focus:border-accent"
            >
              <option value="">Sin calendario</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {groupId && (
              <span
                className="shrink-0 w-3 h-3 rounded-full border border-brand-cream"
                style={{ backgroundColor: groups.find((g) => g.id === groupId)?.color ?? "transparent" }}
                aria-hidden
              />
            )}
          </div>
        )}

        {/* Custom name + color (solo si type=custom) */}
        {isCustom && (
          <div className="flex flex-col gap-2 bg-brand-warm-white rounded-lg p-2.5 border border-brand-light-cream">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold w-16 shrink-0">
                Etiqueta
              </span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ej. Cumpleaños, Doctor…"
                maxLength={40}
                className="flex-1 px-2 py-1 rounded border border-brand-cream bg-brand-paper text-xs text-brand-dark focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold w-16 shrink-0 flex items-center gap-1">
                <Palette size={11} /> Color
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {CUSTOM_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition flex items-center justify-center",
                      color === c.hex ? "border-brand-dark scale-110" : "border-transparent hover:scale-110",
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                    aria-label={`Color ${c.label}`}
                  >
                    {color === c.hex && <Check size={12} className="text-white" />}
                  </button>
                ))}
                <button
                  onClick={() => setColor("")}
                  className={cn(
                    "px-1.5 h-5 rounded text-[10px] text-brand-warm border transition",
                    color === "" ? "border-brand-dark bg-brand-cream" : "border-brand-cream hover:bg-brand-cream",
                  )}
                  title="Sin color personalizado"
                >
                  auto
                </button>
              </div>
            </div>
          </div>
        )}

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
                    onClick={() => selectPreset(opt.val)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] transition",
                      !customRecOpen && recurrence === opt.val
                        ? "bg-accent text-white"
                        : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={() => setCustomRecOpen((v) => !v)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] transition",
                    customRecOpen
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                  )}
                >
                  Personalizada…
                </button>
              </div>

              {customRecOpen && (
                <div className="mt-2 bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold w-20 shrink-0">
                      Frecuencia
                    </span>
                    <select
                      value={recFreq}
                      onChange={(e) =>
                        setRecFreq(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")
                      }
                      className="flex-1 px-2 py-1 rounded border border-brand-cream bg-brand-paper text-xs text-brand-dark focus:outline-none focus:border-accent"
                    >
                      <option value="DAILY">Diariamente</option>
                      <option value="WEEKLY">Semanalmente</option>
                      <option value="MONTHLY">Mensualmente</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold w-20 shrink-0">
                      Cada
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recInterval}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setRecInterval(Number.isFinite(n) && n >= 1 ? n : 1);
                      }}
                      className="w-16 px-2 py-1 rounded border border-brand-cream bg-brand-paper text-xs text-brand-dark text-center font-mono focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-brand-warm">
                      {recFreq === "DAILY"
                        ? recInterval === 1 ? "día" : "días"
                        : recFreq === "WEEKLY"
                          ? recInterval === 1 ? "semana" : "semanas"
                          : recInterval === 1 ? "mes" : "meses"}
                    </span>
                  </div>
                  {recFreq === "WEEKLY" && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold w-20 shrink-0 mt-1">
                        Días
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {DAYS_MO_TO_SU.map(({ dow, label }) => (
                          <button
                            key={dow}
                            onClick={() => toggleByDay(dow)}
                            className={cn(
                              "w-7 h-7 rounded-md text-xs font-semibold transition",
                              recByDay.includes(dow)
                                ? "bg-accent text-white"
                                : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                            )}
                            title={[
                              "domingo",
                              "lunes",
                              "martes",
                              "miércoles",
                              "jueves",
                              "viernes",
                              "sábado",
                            ][dow]}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-brand-tan m-0">
                    RRULE: <code className="font-mono">{recurrence ?? "—"}</code>
                  </p>
                </div>
              )}
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
