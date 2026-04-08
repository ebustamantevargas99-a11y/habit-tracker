"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Search, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewType = "day" | "week" | "month" | "year";

interface CalEvent {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  startTime: string | null; // "HH:MM"
  endTime: string | null;
  isAllDay: boolean;
  calendarId: string;
  color: string;
  location?: string;
  notes?: string;
}

interface CalendarDef {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  group: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const HOUR_HEIGHT = 60;

const DEFAULT_CALS: CalendarDef[] = [
  { id: "calendar", name: "Calendar", color: "#007AFF", enabled: true, group: "iCloud" },
  { id: "personal", name: "Personal", color: "#AF52DE", enabled: true, group: "iCloud" },
  { id: "work", name: "Work", color: "#FF3B30", enabled: true, group: "iCloud" },
  { id: "family", name: "Family", color: "#34C759", enabled: true, group: "iCloud" },
  { id: "school", name: "School", color: "#FFCC00", enabled: true, group: "iCloud" },
  { id: "reminders", name: "Scheduled Reminders", color: "#FF9500", enabled: true, group: "Otros" },
  { id: "birthdays", name: "Cumpleaños", color: "#FF2D55", enabled: true, group: "Otros" },
];

const SAMPLE_EVENTS: CalEvent[] = [
  { id: "s1", title: "Reunión de equipo", date: "2026-04-08", startTime: "10:00", endTime: "11:00", isAllDay: false, calendarId: "work", color: "#FF3B30" },
  { id: "s2", title: "Ejercicio matutino", date: "2026-04-08", startTime: "07:00", endTime: "08:00", isAllDay: false, calendarId: "personal", color: "#AF52DE" },
  { id: "s3", title: "Almuerzo con cliente", date: "2026-04-09", startTime: "13:00", endTime: "14:30", isAllDay: false, calendarId: "work", color: "#FF3B30" },
  { id: "s4", title: "Sesión de planificación", date: "2026-04-10", startTime: "09:00", endTime: "10:30", isAllDay: false, calendarId: "calendar", color: "#007AFF" },
  { id: "s5", title: "Día libre", date: "2026-04-11", startTime: null, endTime: null, isAllDay: true, calendarId: "personal", color: "#AF52DE" },
  { id: "s6", title: "Revisión de proyecto", date: "2026-04-07", startTime: "15:00", endTime: "16:00", isAllDay: false, calendarId: "work", color: "#FF3B30" },
  { id: "s7", title: "Clases de idiomas", date: "2026-04-06", startTime: "11:00", endTime: "12:00", isAllDay: false, calendarId: "school", color: "#FFCC00" },
  { id: "s8", title: "Cena familiar", date: "2026-04-12", startTime: "19:00", endTime: "21:00", isAllDay: false, calendarId: "family", color: "#34C759" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return fmt(a) === fmt(b);
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function getWeekDays(d: Date): Date[] {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(s);
    day.setDate(s.getDate() + i);
    return day;
  });
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - startOffset + i));
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function newId(): string {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Event Modal ──────────────────────────────────────────────────────────────
interface EventModalProps {
  event: Partial<CalEvent>;
  calendars: CalendarDef[];
  onSave: (e: CalEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

function EventModal({ event, calendars, onSave, onDelete, onClose }: EventModalProps) {
  const [title, setTitle] = useState(event.title || "");
  const [date, setDate] = useState(event.date || fmt(new Date()));
  const [startTime, setStartTime] = useState(event.startTime || "09:00");
  const [endTime, setEndTime] = useState(event.endTime || "10:00");
  const [isAllDay, setIsAllDay] = useState(event.isAllDay ?? false);
  const [calId, setCalId] = useState(event.calendarId || "calendar");
  const [location, setLocation] = useState(event.location || "");
  const [notes, setNotes] = useState(event.notes || "");
  const isEditing = Boolean(event.id);
  const selectedCal = calendars.find(c => c.id === calId);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: event.id || newId(),
      title: title.trim(),
      date,
      startTime: isAllDay ? null : startTime,
      endTime: isAllDay ? null : endTime,
      isAllDay,
      calendarId: calId,
      color: selectedCal?.color || "#007AFF",
      location: location || undefined,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "14px", width: "420px", maxWidth: "92vw", boxShadow: "0 24px 80px rgba(0,0,0,0.35)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: "1px solid #E5E5EA" }}>
          <span style={{ fontSize: "17px", fontWeight: "600", color: "#1C1C1E" }}>
            {isEditing ? "Editar evento" : "Nuevo evento"}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isEditing && onDelete && (
              <button onClick={() => { onDelete(event.id!); onClose(); }} style={{ padding: "5px 12px", borderRadius: "8px", border: "none", backgroundColor: "#FF3B30", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: "500" }}>
                Eliminar
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
              <X size={20} color="#8E8E93" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título"
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{ fontSize: "17px", fontWeight: "500", border: "none", borderBottom: "2px solid #E5E5EA", padding: "4px 0", outline: "none", color: "#1C1C1E", width: "100%", fontFamily: "system-ui" }}
          />

          {/* All-day toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "15px", color: "#1C1C1E" }}>Todo el día</span>
            <div onClick={() => setIsAllDay(!isAllDay)} style={{ width: "51px", height: "31px", borderRadius: "15.5px", backgroundColor: isAllDay ? "#34C759" : "#E5E5EA", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: "2px", left: isAllDay ? "22px" : "2px", width: "27px", height: "27px", borderRadius: "50%", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.25)", transition: "left 0.2s" }} />
            </div>
          </div>

          {/* Date */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "15px", color: "#8E8E93", minWidth: "60px" }}>Fecha</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ fontSize: "15px", border: "1px solid #E5E5EA", borderRadius: "8px", padding: "6px 10px", color: "#1C1C1E", backgroundColor: "#F2F2F7", fontFamily: "system-ui" }} />
          </div>

          {/* Time */}
          {!isAllDay && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "15px", color: "#8E8E93", minWidth: "60px" }}>Hora</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ fontSize: "15px", border: "1px solid #E5E5EA", borderRadius: "8px", padding: "6px 10px", color: "#1C1C1E", backgroundColor: "#F2F2F7", fontFamily: "system-ui" }} />
                <span style={{ color: "#8E8E93", fontSize: "14px" }}>→</span>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ fontSize: "15px", border: "1px solid #E5E5EA", borderRadius: "8px", padding: "6px 10px", color: "#1C1C1E", backgroundColor: "#F2F2F7", fontFamily: "system-ui" }} />
              </div>
            </div>
          )}

          {/* Calendar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "15px", color: "#8E8E93", minWidth: "60px" }}>Calendario</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              {selectedCal && <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: selectedCal.color, flexShrink: 0 }} />}
              <select value={calId} onChange={e => setCalId(e.target.value)} style={{ fontSize: "15px", border: "1px solid #E5E5EA", borderRadius: "8px", padding: "6px 10px", color: "#1C1C1E", backgroundColor: "#F2F2F7", flex: 1, fontFamily: "system-ui" }}>
                {calendars.filter(c => c.id !== "reminders" && c.id !== "birthdays").map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "15px", color: "#8E8E93", minWidth: "60px" }}>Lugar</span>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Añadir lugar" style={{ fontSize: "15px", border: "1px solid #E5E5EA", borderRadius: "8px", padding: "6px 10px", color: "#1C1C1E", backgroundColor: "#F2F2F7", flex: 1, outline: "none", fontFamily: "system-ui" }} />
          </div>

          {/* Notes */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ fontSize: "15px", color: "#8E8E93", minWidth: "60px", paddingTop: "6px" }}>Notas</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Añadir notas" rows={3} style={{ fontSize: "15px", border: "1px solid #E5E5EA", borderRadius: "8px", padding: "6px 10px", color: "#1C1C1E", backgroundColor: "#F2F2F7", flex: 1, resize: "vertical", outline: "none", fontFamily: "system-ui" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E5EA", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #E5E5EA", backgroundColor: "#fff", fontSize: "15px", cursor: "pointer", color: "#1C1C1E", fontFamily: "system-ui" }}>Cancelar</button>
          <button onClick={handleSave} disabled={!title.trim()} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "#007AFF", fontSize: "15px", cursor: "pointer", color: "#fff", fontWeight: "500", opacity: title.trim() ? 1 : 0.5, fontFamily: "system-ui" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCal({ displayMonth, selectedDate, onSelectDate, onChangeMonth }: {
  displayMonth: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onChangeMonth: (dir: 1 | -1) => void;
}) {
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const grid = getMonthGrid(year, month);
  const todayDate = new Date();

  return (
    <div style={{ padding: "8px 10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <button onClick={() => onChangeMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", color: "#8E8E93" }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#1C1C1E" }}>
          {MONTH_SHORT[month]} {year}
        </span>
        <button onClick={() => onChangeMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", color: "#8E8E93" }}>
          <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "4px" }}>
        {["D", "L", "M", "X", "J", "V", "S"].map(d => (
          <span key={d} style={{ fontSize: "10px", color: "#8E8E93", fontWeight: "600" }}>{d}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px" }}>
        {grid.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const isTd = isSameDay(d, todayDate);
          const isSel = isSameDay(d, selectedDate);
          return (
            <div
              key={i}
              onClick={() => onSelectDate(d)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "22px", borderRadius: "50%", cursor: "pointer",
                fontSize: "11px",
                backgroundColor: isSel ? "#007AFF" : "transparent",
                color: isSel ? "#fff" : isTd ? "#FF3B30" : isCurrentMonth ? "#1C1C1E" : "#C7C7CC",
                fontWeight: isTd || isSel ? "700" : "400",
                outline: isTd && !isSel ? "1.5px solid #FF3B30" : "none",
                outlineOffset: "-1px",
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ days, events, enabledCalendarIds, onSlotClick, onEventClick }: {
  days: Date[];
  events: CalEvent[];
  enabledCalendarIds: string[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (e: CalEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isCurrentWeek = days.some(d => isSameDay(d, now));
  const visibleEvents = events.filter(e => enabledCalendarIds.includes(e.calendarId));

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = isCurrentWeek
        ? Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT)
        : 8 * HOUR_HEIGHT;
      scrollRef.current.scrollTop = scrollTo;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDayEvents = (d: Date) => visibleEvents.filter(e => e.date === fmt(d) && !e.isAllDay);
  const getAllDayEvents = (d: Date) => visibleEvents.filter(e => e.date === fmt(d) && e.isAllDay);
  const anyAllDay = days.some(d => getAllDayEvents(d).length > 0);

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, d: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = Math.floor((y / HOUR_HEIGHT) * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minute = Math.round((totalMinutes % 60) / 30) * 30;
    const time = `${String(Math.min(hour, 23)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    onSlotClick(fmt(d), time);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: "1px solid #E5E5EA", backgroundColor: "#fff", flexShrink: 0 }}>
        <div />
        {days.map((d, i) => {
          const isTd = isToday(d);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px 6px", borderLeft: i > 0 ? "1px solid #E5E5EA" : "none" }}>
              <span style={{ fontSize: "11px", color: isTd ? "#FF3B30" : "#8E8E93", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {DAY_LABELS[d.getDay()]}
              </span>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: isTd ? "#FF3B30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
                <span style={{ fontSize: "22px", fontWeight: isTd ? "700" : "400", color: isTd ? "#fff" : "#1C1C1E" }}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {anyAllDay && (
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: "1px solid #E5E5EA", backgroundColor: "#fff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "8px", paddingBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "#8E8E93", lineHeight: 1.2, textAlign: "right" }}>todo{"\n"}el día</span>
          </div>
          {days.map((d, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? "1px solid #E5E5EA" : "none", minHeight: "26px", padding: "2px 2px" }}>
              {getAllDayEvents(d).map(ev => (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} style={{ backgroundColor: ev.color, color: "#fff", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", fontWeight: "500", cursor: "pointer", marginBottom: "2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {ev.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", height: `${24 * HOUR_HEIGHT}px`, position: "relative" }}>
          {/* Time labels */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ position: "absolute", top: `${h * HOUR_HEIGHT - 7}px`, right: "8px", fontSize: "10px", color: "#8E8E93", whiteSpace: "nowrap", userSelect: "none" }}>
                {h === 0 ? "" : formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, colIdx) => {
            const dayEvts = getDayEvents(d);
            return (
              <div
                key={colIdx}
                style={{ borderLeft: colIdx > 0 ? "1px solid #E5E5EA" : "none", position: "relative", cursor: "crosshair" }}
                onClick={e => handleColumnClick(e, d)}
              >
                {/* Hour lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} style={{ position: "absolute", top: `${h * HOUR_HEIGHT}px`, left: 0, right: 0, borderTop: h === 0 ? "none" : "1px solid #E5E5EA" }} />
                ))}
                {/* Half-hour lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={`h${h}`} style={{ position: "absolute", top: `${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`, left: 4, right: 0, borderTop: "1px solid #F2F2F7" }} />
                ))}

                {/* Events */}
                {dayEvts.map(ev => {
                  const start = timeToMin(ev.startTime!);
                  const end = timeToMin(ev.endTime!);
                  const duration = Math.max(end - start, 30);
                  return (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      style={{
                        position: "absolute",
                        top: `${(start / 60) * HOUR_HEIGHT + 1}px`,
                        left: "2px", right: "2px",
                        height: `${(duration / 60) * HOUR_HEIGHT - 2}px`,
                        backgroundColor: ev.color,
                        borderRadius: "6px",
                        padding: "3px 6px",
                        cursor: "pointer",
                        overflow: "hidden",
                        zIndex: 1,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#fff", lineHeight: 1.3, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {ev.title}
                      </div>
                      {(duration / 60) * HOUR_HEIGHT > 34 && (
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {formatTime(ev.startTime!)} – {formatTime(ev.endTime!)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isCurrentWeek && isSameDay(d, now) && (
                  <div style={{ position: "absolute", top: `${(currentMinutes / 60) * HOUR_HEIGHT}px`, left: 0, right: 0, height: "2px", backgroundColor: "#FF3B30", zIndex: 2, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: "-5px", top: "-4px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#FF3B30" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({ year, month, events, enabledCalendarIds, selectedDate, onDateClick, onEventClick, onSlotClick }: {
  year: number;
  month: number;
  events: CalEvent[];
  enabledCalendarIds: string[];
  selectedDate: Date;
  onDateClick: (d: Date) => void;
  onEventClick: (e: CalEvent) => void;
  onSlotClick: (date: string, time: string) => void;
}) {
  const grid = getMonthGrid(year, month);
  const todayDate = new Date();
  const visibleEvents = events.filter(e => enabledCalendarIds.includes(e.calendarId));
  const getEventsForDay = (d: Date) => visibleEvents.filter(e => e.date === fmt(d));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #E5E5EA", backgroundColor: "#fff", flexShrink: 0 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: "center", padding: "8px 0", fontSize: "12px", color: "#8E8E93", fontWeight: "600", letterSpacing: "0.3px" }}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: "repeat(6, 1fr)", flex: 1, overflow: "auto" }}>
        {grid.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const isTd = isSameDay(d, todayDate);
          const dayEvents = getEventsForDay(d);
          return (
            <div
              key={i}
              onClick={() => { onDateClick(d); if (isCurrentMonth) onSlotClick(fmt(d), "09:00"); }}
              style={{ border: "1px solid #E5E5EA", borderTop: "none", borderLeft: i % 7 === 0 ? "none" : "1px solid #E5E5EA", padding: "4px", cursor: "pointer", backgroundColor: "#fff", minHeight: "90px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginBottom: "2px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: isTd ? "#FF3B30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "13px", color: isTd ? "#fff" : isCurrentMonth ? "#1C1C1E" : "#C7C7CC", fontWeight: isTd ? "700" : "400" }}>
                    {d.getDate()}
                  </span>
                </div>
              </div>
              {dayEvents.slice(0, 3).map(ev => (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} style={{ backgroundColor: ev.color, color: "#fff", borderRadius: "3px", padding: "1px 5px", fontSize: "11px", fontWeight: "500", marginBottom: "2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {!ev.isAllDay && ev.startTime && <span style={{ opacity: 0.85 }}>{formatTime(ev.startTime)} </span>}
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div style={{ fontSize: "10px", color: "#8E8E93" }}>+{dayEvents.length - 3} más</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ date, events, enabledCalendarIds, onSlotClick, onEventClick }: {
  date: Date;
  events: CalEvent[];
  enabledCalendarIds: string[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (e: CalEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const isCurrentDay = isSameDay(date, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const visibleEvents = events.filter(e => enabledCalendarIds.includes(e.calendarId) && e.date === fmt(date) && !e.isAllDay);
  const allDayEvents = events.filter(e => enabledCalendarIds.includes(e.calendarId) && e.date === fmt(date) && e.isAllDay);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = isCurrentDay ? Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT) : 8 * HOUR_HEIGHT;
      scrollRef.current.scrollTop = scrollTo;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = Math.floor((y / HOUR_HEIGHT) * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minute = Math.round((totalMinutes % 60) / 30) * 30;
    const time = `${String(Math.min(hour, 23)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    onSlotClick(fmt(date), time);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderBottom: "1px solid #E5E5EA", flexShrink: 0 }}>
        <span style={{ fontSize: "13px", color: isCurrentDay ? "#FF3B30" : "#8E8E93", marginRight: "8px", fontWeight: "600", textTransform: "uppercase" }}>{DAY_LABELS[date.getDay()]}</span>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: isCurrentDay ? "#FF3B30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "24px", fontWeight: isCurrentDay ? "700" : "400", color: isCurrentDay ? "#fff" : "#1C1C1E" }}>{date.getDate()}</span>
        </div>
      </div>

      {/* All-day */}
      {allDayEvents.length > 0 && (
        <div style={{ display: "flex", borderBottom: "1px solid #E5E5EA", padding: "4px 8px 4px 64px", gap: "4px", flexShrink: 0 }}>
          {allDayEvents.map(ev => (
            <div key={ev.id} onClick={() => onEventClick(ev)} style={{ backgroundColor: ev.color, color: "#fff", borderRadius: "4px", padding: "2px 10px", fontSize: "13px", cursor: "pointer" }}>{ev.title}</div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", height: `${24 * HOUR_HEIGHT}px`, position: "relative" }}>
          <div style={{ position: "relative" }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ position: "absolute", top: `${h * HOUR_HEIGHT - 7}px`, right: "8px", fontSize: "11px", color: "#8E8E93", whiteSpace: "nowrap" }}>
                {h === 0 ? "" : formatHour(h)}
              </div>
            ))}
          </div>
          <div style={{ position: "relative", borderLeft: "1px solid #E5E5EA", cursor: "crosshair" }} onClick={handleColumnClick}>
            {Array.from({ length: 24 }, (_, h) => (
              <React.Fragment key={h}>
                <div style={{ position: "absolute", top: `${h * HOUR_HEIGHT}px`, left: 0, right: 0, borderTop: h === 0 ? "none" : "1px solid #E5E5EA" }} />
                <div style={{ position: "absolute", top: `${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`, left: 4, right: 0, borderTop: "1px solid #F2F2F7" }} />
              </React.Fragment>
            ))}
            {visibleEvents.map(ev => {
              const start = timeToMin(ev.startTime!);
              const end = timeToMin(ev.endTime!);
              const duration = Math.max(end - start, 30);
              return (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} style={{ position: "absolute", top: `${(start / 60) * HOUR_HEIGHT + 1}px`, left: "4px", right: "4px", height: `${(duration / 60) * HOUR_HEIGHT - 2}px`, backgroundColor: ev.color, borderRadius: "6px", padding: "4px 8px", cursor: "pointer", overflow: "hidden", zIndex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{ev.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>{formatTime(ev.startTime!)} – {formatTime(ev.endTime!)}</div>
                  {ev.location && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>{ev.location}</div>}
                </div>
              );
            })}
            {isCurrentDay && (
              <div style={{ position: "absolute", top: `${(currentMinutes / 60) * HOUR_HEIGHT}px`, left: 0, right: 0, height: "2px", backgroundColor: "#FF3B30", zIndex: 2, pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: "-5px", top: "-4px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#FF3B30" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Year View ────────────────────────────────────────────────────────────────
function YearView({ year, events, enabledCalendarIds, onMonthClick }: {
  year: number;
  events: CalEvent[];
  enabledCalendarIds: string[];
  onMonthClick: (month: number) => void;
}) {
  const todayDate = new Date();
  const visibleEvents = events.filter(e => enabledCalendarIds.includes(e.calendarId));

  const getEventDates = (month: number): Set<string> => {
    return new Set(visibleEvents.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).map(e => e.date));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", padding: "24px", overflowY: "auto", flex: 1 }}>
      {Array.from({ length: 12 }, (_, monthIdx) => {
        const grid = getMonthGrid(year, monthIdx);
        const eventDates = getEventDates(monthIdx);
        const isCurrentMonth = monthIdx === todayDate.getMonth() && year === todayDate.getFullYear();
        return (
          <div key={monthIdx} onClick={() => onMonthClick(monthIdx)} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: isCurrentMonth ? "#FF3B30" : "#1C1C1E", marginBottom: "8px", textAlign: "center" }}>
              {MONTH_NAMES[monthIdx]}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "3px" }}>
              {["D", "L", "M", "X", "J", "V", "S"].map(d => (
                <span key={d} style={{ fontSize: "9px", color: "#8E8E93", fontWeight: "600" }}>{d}</span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px" }}>
              {grid.map((d, i) => {
                const inMonth = d.getMonth() === monthIdx;
                const isTd = isSameDay(d, todayDate);
                const hasEv = inMonth && eventDates.has(fmt(d));
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: isTd ? "#FF3B30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "9px", color: isTd ? "#fff" : inMonth ? "#1C1C1E" : "#E5E5EA", fontWeight: isTd ? "700" : "400" }}>
                        {d.getDate()}
                      </span>
                    </div>
                    {hasEv && <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#007AFF", marginTop: "1px" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main CalendarTab ─────────────────────────────────────────────────────────
export default function CalendarTab() {
  const todayDate = new Date();

  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(todayDate);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [miniCalMonth, setMiniCalMonth] = useState(todayDate);

  const [events, setEvents] = useState<CalEvent[]>(SAMPLE_EVENTS);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [calendars, setCalendars] = useState<CalendarDef[]>(DEFAULT_CALS);
  const [calsLoaded, setCalsLoaded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalEvent, setModalEvent] = useState<Partial<CalEvent>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const se = localStorage.getItem("apple_calendar_events");
      if (se) setEvents(JSON.parse(se));
    } catch {}
    setEventsLoaded(true);
  }, []);
  useEffect(() => {
    try {
      const sc = localStorage.getItem("apple_calendar_cals");
      if (sc) setCalendars(JSON.parse(sc));
    } catch {}
    setCalsLoaded(true);
  }, []);
  useEffect(() => { if (eventsLoaded) localStorage.setItem("apple_calendar_events", JSON.stringify(events)); }, [events, eventsLoaded]);
  useEffect(() => { if (calsLoaded) localStorage.setItem("apple_calendar_cals", JSON.stringify(calendars)); }, [calendars, calsLoaded]);

  const enabledCalendarIds = calendars.filter(c => c.enabled).map(c => c.id);

  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "year") d.setFullYear(d.getFullYear() + dir);
    setCurrentDate(d);
    setMiniCalMonth(d);
  };

  const goToToday = () => {
    setCurrentDate(todayDate);
    setSelectedDate(todayDate);
    setMiniCalMonth(todayDate);
  };

  const getTitle = () => {
    if (view === "day") return `${currentDate.getDate()} de ${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    if (view === "week") {
      const days = getWeekDays(currentDate);
      const first = days[0], last = days[6];
      if (first.getMonth() === last.getMonth())
        return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
      return `${MONTH_SHORT[first.getMonth()]} – ${MONTH_SHORT[last.getMonth()]} ${last.getFullYear()}`;
    }
    if (view === "month") return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    return `${currentDate.getFullYear()}`;
  };

  const handleSlotClick = (date: string, time: string) => {
    const h = parseInt(time.split(":")[0]);
    const endH = String(Math.min(h + 1, 23)).padStart(2, "0");
    const min = time.split(":")[1];
    setModalEvent({ date, startTime: time, endTime: `${endH}:${min}`, isAllDay: false, calendarId: "calendar", color: "#007AFF" });
    setShowModal(true);
  };

  const handleEventClick = (ev: CalEvent) => {
    setModalEvent(ev);
    setShowModal(true);
  };

  const handleSaveEvent = (ev: CalEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === ev.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = ev; return next; }
      return [...prev, ev];
    });
  };

  const handleDeleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));
  const toggleCalendar = (id: string) => setCalendars(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));

  const weekDays = getWeekDays(currentDate);
  const calGroups = Array.from(new Set(calendars.map(c => c.group)));
  const viewLabels: Record<ViewType, string> = { day: "Día", week: "Semana", month: "Mes", year: "Año" };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 195px)",
      minHeight: "600px",
      backgroundColor: "#fff",
      borderRadius: "10px",
      overflow: "hidden",
      border: "1px solid #D1D1D6",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 14px", borderBottom: "1px solid #E5E5EA",
        backgroundColor: "#fff", flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Mostrar barra lateral" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#007AFF", padding: "2px 6px", borderRadius: "6px", lineHeight: 1 }}>
          ☰
        </button>

        {/* Add event */}
        <button
          onClick={() => {
            setModalEvent({ date: fmt(selectedDate), startTime: "09:00", endTime: "10:00", isAllDay: false, calendarId: "calendar", color: "#007AFF" });
            setShowModal(true);
          }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#007AFF", display: "flex", alignItems: "center", padding: "2px" }}
        >
          <Plus size={22} />
        </button>

        {/* Title */}
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1C1C1E", margin: 0, flex: 1, letterSpacing: "-0.3px" }}>
          {getTitle()}
        </h2>

        {/* Navigation arrows + Today */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "1px solid #D1D1D6", borderRadius: "7px 0 0 7px", cursor: "pointer", padding: "5px 10px", color: "#007AFF", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} style={{ background: "none", border: "1px solid #D1D1D6", borderLeft: "none", borderRadius: "0 7px 7px 0", cursor: "pointer", padding: "5px 10px", color: "#007AFF", display: "flex", alignItems: "center" }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={goToToday} style={{ background: "none", border: "1px solid #D1D1D6", borderRadius: "7px", cursor: "pointer", padding: "5px 13px", color: "#007AFF", fontSize: "13px", fontWeight: "500", marginLeft: "6px" }}>
            Hoy
          </button>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid #D1D1D6", borderRadius: "8px", overflow: "hidden" }}>
          {(["day", "week", "month", "year"] as ViewType[]).map((v, i) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "5px 12px", border: "none", borderLeft: i > 0 ? "1px solid #D1D1D6" : "none", backgroundColor: view === v ? "#007AFF" : "#fff", color: view === v ? "#fff" : "#1C1C1E", cursor: "pointer", fontSize: "13px", fontWeight: view === v ? "600" : "400" }}>
              {viewLabels[v]}
            </button>
          ))}
        </div>

        {/* Search */}
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#8E8E93", padding: "2px", display: "flex" }}>
          <Search size={18} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div style={{ width: "198px", borderRight: "1px solid #E5E5EA", backgroundColor: "#F2F2F7", flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Mini calendar */}
            <MiniCal
              displayMonth={miniCalMonth}
              selectedDate={selectedDate}
              onSelectDate={d => {
                setSelectedDate(d);
                setCurrentDate(d);
                setMiniCalMonth(d);
              }}
              onChangeMonth={dir => {
                const m = new Date(miniCalMonth);
                m.setMonth(m.getMonth() + dir);
                setMiniCalMonth(m);
              }}
            />

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "#E5E5EA", margin: "0 10px" }} />

            {/* Calendar list */}
            <div style={{ padding: "10px 12px", flex: 1 }}>
              {calGroups.map(group => (
                <div key={group} style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#8E8E93", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "6px" }}>
                    {group}
                  </div>
                  {calendars.filter(c => c.group === group).map(cal => (
                    <div key={cal.id} onClick={() => toggleCalendar(cal.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", cursor: "pointer" }}>
                      <div style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: cal.enabled ? cal.color : "transparent", border: `2px solid ${cal.color}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {cal.enabled && <Check size={9} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: "13px", color: "#1C1C1E", userSelect: "none" }}>{cal.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#fff" }}>
          {view === "week" && (
            <WeekView days={weekDays} events={events} enabledCalendarIds={enabledCalendarIds} onSlotClick={handleSlotClick} onEventClick={handleEventClick} />
          )}
          {view === "month" && (
            <MonthView year={currentDate.getFullYear()} month={currentDate.getMonth()} events={events} enabledCalendarIds={enabledCalendarIds} selectedDate={selectedDate} onDateClick={d => setSelectedDate(d)} onEventClick={handleEventClick} onSlotClick={handleSlotClick} />
          )}
          {view === "day" && (
            <DayView date={currentDate} events={events} enabledCalendarIds={enabledCalendarIds} onSlotClick={handleSlotClick} onEventClick={handleEventClick} />
          )}
          {view === "year" && (
            <YearView year={currentDate.getFullYear()} events={events} enabledCalendarIds={enabledCalendarIds} onMonthClick={month => { setCurrentDate(new Date(currentDate.getFullYear(), month, 1)); setView("month"); }} />
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <EventModal event={modalEvent} calendars={calendars} onSave={handleSaveEvent} onDelete={handleDeleteEvent} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
