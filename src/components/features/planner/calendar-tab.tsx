"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Search, Check } from "lucide-react";
import { cn } from "@/components/ui";

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
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-[14px] w-[420px] max-w-[92vw] shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#E5E5EA]">
          <span className="text-[17px] font-semibold text-[#1C1C1E]">
            {isEditing ? "Editar evento" : "Nuevo evento"}
          </span>
          <div className="flex gap-2 items-center">
            {isEditing && onDelete && (
              <button onClick={() => { onDelete(event.id!); onClose(); }} className="px-3 py-[5px] rounded-lg border-none bg-[#FF3B30] text-white text-[13px] cursor-pointer font-medium">
                Eliminar
              </button>
            )}
            <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 flex">
              <X size={20} color="#8E8E93" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-[14px]">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título"
            onKeyDown={e => e.key === "Enter" && handleSave()}
            className="text-[17px] font-medium border-0 border-b-2 border-[#E5E5EA] py-1 outline-none text-[#1C1C1E] w-full font-sans"
          />

          {/* All-day toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-[#1C1C1E]">Todo el día</span>
            <div
              onClick={() => setIsAllDay(!isAllDay)}
              className={cn("w-[51px] h-[31px] rounded-[15.5px] cursor-pointer relative transition-[background] duration-200", isAllDay ? "bg-[#34C759]" : "bg-[#E5E5EA]")}
            >
              <div className={cn("absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-[left] duration-200", isAllDay ? "left-[22px]" : "left-[2px]")} />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <span className="text-[15px] text-[#8E8E93] min-w-[60px]">Fecha</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-[15px] border border-[#E5E5EA] rounded-lg px-[10px] py-[6px] text-[#1C1C1E] bg-[#F2F2F7] font-sans" />
          </div>

          {/* Time */}
          {!isAllDay && (
            <div className="flex items-center gap-3">
              <span className="text-[15px] text-[#8E8E93] min-w-[60px]">Hora</span>
              <div className="flex items-center gap-2">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="text-[15px] border border-[#E5E5EA] rounded-lg px-[10px] py-[6px] text-[#1C1C1E] bg-[#F2F2F7] font-sans" />
                <span className="text-[#8E8E93] text-sm">→</span>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="text-[15px] border border-[#E5E5EA] rounded-lg px-[10px] py-[6px] text-[#1C1C1E] bg-[#F2F2F7] font-sans" />
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="flex items-center gap-3">
            <span className="text-[15px] text-[#8E8E93] min-w-[60px]">Calendario</span>
            <div className="flex items-center gap-2 flex-1">
              {selectedCal && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedCal.color }} />}
              <select value={calId} onChange={e => setCalId(e.target.value)} className="text-[15px] border border-[#E5E5EA] rounded-lg px-[10px] py-[6px] text-[#1C1C1E] bg-[#F2F2F7] flex-1 font-sans">
                {calendars.filter(c => c.id !== "reminders" && c.id !== "birthdays").map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <span className="text-[15px] text-[#8E8E93] min-w-[60px]">Lugar</span>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Añadir lugar" className="text-[15px] border border-[#E5E5EA] rounded-lg px-[10px] py-[6px] text-[#1C1C1E] bg-[#F2F2F7] flex-1 outline-none font-sans" />
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <span className="text-[15px] text-[#8E8E93] min-w-[60px] pt-[6px]">Notas</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Añadir notas" rows={3} className="text-[15px] border border-[#E5E5EA] rounded-lg px-[10px] py-[6px] text-[#1C1C1E] bg-[#F2F2F7] flex-1 resize-vertical outline-none font-sans" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#E5E5EA] flex justify-end gap-2">
          <button onClick={onClose} className="px-[18px] py-2 rounded-lg border border-[#E5E5EA] bg-white text-[15px] cursor-pointer text-[#1C1C1E] font-sans">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className={cn("px-[18px] py-2 rounded-lg border-none bg-[#007AFF] text-[15px] cursor-pointer text-white font-medium font-sans", !title.trim() ? "opacity-50" : "opacity-100")}
          >Guardar</button>
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
    <div className="px-[10px] pt-2 pb-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onChangeMonth(-1)} className="bg-transparent border-none cursor-pointer p-[2px] flex text-[#8E8E93]">
          <ChevronLeft size={14} />
        </button>
        <span className="text-[13px] font-semibold text-[#1C1C1E]">
          {MONTH_SHORT[month]} {year}
        </span>
        <button onClick={() => onChangeMonth(1)} className="bg-transparent border-none cursor-pointer p-[2px] flex text-[#8E8E93]">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {["D", "L", "M", "X", "J", "V", "S"].map(d => (
          <span key={d} className="text-[10px] text-[#8E8E93] font-semibold">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[1px]">
        {grid.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const isTd = isSameDay(d, todayDate);
          const isSel = isSameDay(d, selectedDate);
          return (
            <div
              key={i}
              onClick={() => onSelectDate(d)}
              className={cn(
                "flex items-center justify-center h-[22px] rounded-full cursor-pointer text-[11px]",
                isSel
                  ? "bg-[#007AFF] text-white font-bold"
                  : isTd
                    ? "text-[#FF3B30] font-bold outline outline-[1.5px] outline-[#FF3B30] -outline-offset-1"
                    : isCurrentMonth
                      ? "text-[#1C1C1E]"
                      : "text-[#C7C7CC]"
              )}
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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-[#E5E5EA] bg-white shrink-0">
        <div />
        {days.map((d, i) => {
          const isTd = isToday(d);
          return (
            <div key={i} className={cn("flex flex-col items-center px-1 pt-2 pb-[6px]", i > 0 ? "border-l border-[#E5E5EA]" : "")}>
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.5px]", isTd ? "text-[#FF3B30]" : "text-[#8E8E93]")}>
                {DAY_LABELS[d.getDay()]}
              </span>
              <div className={cn("w-[34px] h-[34px] rounded-full flex items-center justify-center mt-[2px]", isTd ? "bg-[#FF3B30]" : "bg-transparent")}>
                <span className={cn("text-[22px]", isTd ? "font-bold text-white" : "font-normal text-[#1C1C1E]")}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {anyAllDay && (
        <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-[#E5E5EA] bg-white shrink-0">
          <div className="flex items-center justify-end pr-2 pb-1">
            <span className="text-[10px] text-[#8E8E93] leading-[1.2] text-right">todo{"\n"}el día</span>
          </div>
          {days.map((d, i) => (
            <div key={i} className={cn("min-h-[26px] p-[2px]", i > 0 ? "border-l border-[#E5E5EA]" : "")}>
              {getAllDayEvents(d).map(ev => (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} className="text-white rounded-[4px] px-[6px] py-[2px] text-xs font-medium cursor-pointer mb-[2px] overflow-hidden whitespace-nowrap text-ellipsis" style={{ backgroundColor: ev.color }}>
                  {ev.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-[52px_repeat(7,1fr)] relative h-[1440px]">
          {/* Time labels */}
          <div className="relative shrink-0">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="absolute right-2 text-[10px] text-[#8E8E93] whitespace-nowrap select-none" style={{ top: `${h * HOUR_HEIGHT - 7}px` }}>
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
                className={cn("relative cursor-crosshair", colIdx > 0 ? "border-l border-[#E5E5EA]" : "")}
                onClick={e => handleColumnClick(e, d)}
              >
                {/* Hour lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className={cn("absolute left-0 right-0", h === 0 ? "" : "border-t border-[#E5E5EA]")} style={{ top: `${h * HOUR_HEIGHT}px` }} />
                ))}
                {/* Half-hour lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={`h${h}`} className="absolute left-1 right-0 border-t border-[#F2F2F7]" style={{ top: `${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }} />
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
                      className="absolute left-[2px] right-[2px] rounded-md px-[6px] py-[3px] cursor-pointer overflow-hidden z-[1] shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                      style={{ top: `${(start / 60) * HOUR_HEIGHT + 1}px`, height: `${(duration / 60) * HOUR_HEIGHT - 2}px`, backgroundColor: ev.color }}
                    >
                      <div className="text-xs font-semibold text-white leading-[1.3] overflow-hidden whitespace-nowrap text-ellipsis">
                        {ev.title}
                      </div>
                      {(duration / 60) * HOUR_HEIGHT > 34 && (
                        <div className="text-[11px] text-[rgba(255,255,255,0.85)] overflow-hidden whitespace-nowrap">
                          {formatTime(ev.startTime!)} – {formatTime(ev.endTime!)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isCurrentWeek && isSameDay(d, now) && (
                  <div className="absolute left-0 right-0 h-[2px] bg-[#FF3B30] z-[2] pointer-events-none" style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}>
                    <div className="absolute left-[-5px] top-[-4px] w-[10px] h-[10px] rounded-full bg-[#FF3B30]" />
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-[#E5E5EA] bg-white shrink-0">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center py-2 text-xs text-[#8E8E93] font-semibold tracking-[0.3px]">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 overflow-auto">
        {grid.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const isTd = isSameDay(d, todayDate);
          const dayEvents = getEventsForDay(d);
          return (
            <div
              key={i}
              onClick={() => { onDateClick(d); if (isCurrentMonth) onSlotClick(fmt(d), "09:00"); }}
              className={cn("border border-[#E5E5EA] border-t-0 p-1 cursor-pointer bg-white min-h-[90px]", i % 7 === 0 ? "border-l-0" : "")}
            >
              <div className="flex items-center justify-start mb-[2px]">
                <div className={cn("w-[26px] h-[26px] rounded-full flex items-center justify-center", isTd ? "bg-[#FF3B30]" : "bg-transparent")}>
                  <span className={cn("text-[13px]", isTd ? "font-bold text-white" : isCurrentMonth ? "text-[#1C1C1E]" : "text-[#C7C7CC]", !isTd && "font-normal")}>
                    {d.getDate()}
                  </span>
                </div>
              </div>
              {dayEvents.slice(0, 3).map(ev => (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} className="text-white rounded-[3px] px-[5px] py-[1px] text-[11px] font-medium mb-[2px] overflow-hidden whitespace-nowrap text-ellipsis" style={{ backgroundColor: ev.color }}>
                  {!ev.isAllDay && ev.startTime && <span className="opacity-85">{formatTime(ev.startTime)} </span>}
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[10px] text-[#8E8E93]">+{dayEvents.length - 3} más</div>
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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center p-3 border-b border-[#E5E5EA] shrink-0">
        <span className={cn("text-[13px] font-semibold uppercase mr-2", isCurrentDay ? "text-[#FF3B30]" : "text-[#8E8E93]")}>{DAY_LABELS[date.getDay()]}</span>
        <div className={cn("w-[38px] h-[38px] rounded-full flex items-center justify-center", isCurrentDay ? "bg-[#FF3B30]" : "bg-transparent")}>
          <span className={cn("text-2xl", isCurrentDay ? "font-bold text-white" : "font-normal text-[#1C1C1E]")}>{date.getDate()}</span>
        </div>
      </div>

      {/* All-day */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-[#E5E5EA] px-2 py-1 pl-16 gap-1 shrink-0">
          {allDayEvents.map(ev => (
            <div key={ev.id} onClick={() => onEventClick(ev)} className="text-white rounded-[4px] px-[10px] py-[2px] text-[13px] cursor-pointer" style={{ backgroundColor: ev.color }}>{ev.title}</div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr] relative h-[1440px]">
          <div className="relative">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="absolute right-2 text-[11px] text-[#8E8E93] whitespace-nowrap" style={{ top: `${h * HOUR_HEIGHT - 7}px` }}>
                {h === 0 ? "" : formatHour(h)}
              </div>
            ))}
          </div>
          <div className="relative border-l border-[#E5E5EA] cursor-crosshair" onClick={handleColumnClick}>
            {Array.from({ length: 24 }, (_, h) => (
              <React.Fragment key={h}>
                <div className={cn("absolute left-0 right-0", h === 0 ? "" : "border-t border-[#E5E5EA]")} style={{ top: `${h * HOUR_HEIGHT}px` }} />
                <div className="absolute left-1 right-0 border-t border-[#F2F2F7]" style={{ top: `${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }} />
              </React.Fragment>
            ))}
            {visibleEvents.map(ev => {
              const start = timeToMin(ev.startTime!);
              const end = timeToMin(ev.endTime!);
              const duration = Math.max(end - start, 30);
              return (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} className="absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer overflow-hidden z-[1] shadow-[0_1px_3px_rgba(0,0,0,0.15)]" style={{ top: `${(start / 60) * HOUR_HEIGHT + 1}px`, height: `${(duration / 60) * HOUR_HEIGHT - 2}px`, backgroundColor: ev.color }}>
                  <div className="text-[13px] font-semibold text-white">{ev.title}</div>
                  <div className="text-xs text-[rgba(255,255,255,0.85)]">{formatTime(ev.startTime!)} – {formatTime(ev.endTime!)}</div>
                  {ev.location && <div className="text-[11px] text-[rgba(255,255,255,0.75)]">{ev.location}</div>}
                </div>
              );
            })}
            {isCurrentDay && (
              <div className="absolute left-0 right-0 h-[2px] bg-[#FF3B30] z-[2] pointer-events-none" style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}>
                <div className="absolute left-[-5px] top-[-4px] w-[10px] h-[10px] rounded-full bg-[#FF3B30]" />
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
    <div className="grid grid-cols-4 gap-6 p-6 overflow-y-auto flex-1">
      {Array.from({ length: 12 }, (_, monthIdx) => {
        const grid = getMonthGrid(year, monthIdx);
        const eventDates = getEventDates(monthIdx);
        const isCurrentMonth = monthIdx === todayDate.getMonth() && year === todayDate.getFullYear();
        return (
          <div key={monthIdx} onClick={() => onMonthClick(monthIdx)} className="cursor-pointer">
            <div className={cn("text-sm font-semibold mb-2 text-center", isCurrentMonth ? "text-[#FF3B30]" : "text-[#1C1C1E]")}>
              {MONTH_NAMES[monthIdx]}
            </div>
            <div className="grid grid-cols-7 text-center mb-[3px]">
              {["D", "L", "M", "X", "J", "V", "S"].map(d => (
                <span key={d} className="text-[9px] text-[#8E8E93] font-semibold">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[1px]">
              {grid.map((d, i) => {
                const inMonth = d.getMonth() === monthIdx;
                const isTd = isSameDay(d, todayDate);
                const hasEv = inMonth && eventDates.has(fmt(d));
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", isTd ? "bg-[#FF3B30]" : "bg-transparent")}>
                      <span className={cn("text-[9px]", isTd ? "font-bold text-white" : inMonth ? "text-[#1C1C1E]" : "text-[#E5E5EA]", !isTd && "font-normal")}>
                        {d.getDate()}
                      </span>
                    </div>
                    {hasEv && <div className="w-1 h-1 rounded-full bg-[#007AFF] mt-[1px]" />}
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
    <div
      className="flex flex-col h-[calc(100vh-195px)] min-h-[600px] bg-white rounded-[10px] overflow-hidden border border-[#D1D1D6] shadow-[0_2px_12px_rgba(0,0,0,0.08)] font-sans"
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-[10px] px-[14px] py-[10px] border-b border-[#E5E5EA] bg-white shrink-0">
        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} title="Mostrar barra lateral" className="bg-transparent border-none cursor-pointer text-lg text-[#007AFF] px-[6px] py-[2px] rounded-md leading-none">
          ☰
        </button>

        {/* Add event */}
        <button
          onClick={() => {
            setModalEvent({ date: fmt(selectedDate), startTime: "09:00", endTime: "10:00", isAllDay: false, calendarId: "calendar", color: "#007AFF" });
            setShowModal(true);
          }}
          className="bg-transparent border-none cursor-pointer text-[#007AFF] flex items-center p-[2px]"
        >
          <Plus size={22} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#1C1C1E] m-0 flex-1 tracking-[-0.3px]">
          {getTitle()}
        </h2>

        {/* Navigation arrows + Today */}
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="bg-transparent border border-[#D1D1D6] rounded-[7px_0_0_7px] cursor-pointer px-[10px] py-[5px] text-[#007AFF] flex items-center">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} className="bg-transparent border border-[#D1D1D6] border-l-0 rounded-[0_7px_7px_0] cursor-pointer px-[10px] py-[5px] text-[#007AFF] flex items-center">
            <ChevronRight size={16} />
          </button>
          <button onClick={goToToday} className="bg-transparent border border-[#D1D1D6] rounded-lg cursor-pointer px-[13px] py-[5px] text-[#007AFF] text-[13px] font-medium ml-[6px]">
            Hoy
          </button>
        </div>

        {/* View toggle */}
        <div className="flex border border-[#D1D1D6] rounded-lg overflow-hidden">
          {(["day", "week", "month", "year"] as ViewType[]).map((v, i) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn("px-3 py-[5px] border-none cursor-pointer text-[13px]", i > 0 ? "border-l border-[#D1D1D6]" : "", view === v ? "bg-[#007AFF] text-white font-semibold" : "bg-white text-[#1C1C1E] font-normal")}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>

        {/* Search */}
        <button className="bg-transparent border-none cursor-pointer text-[#8E8E93] p-[2px] flex">
          <Search size={18} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div className="w-[198px] border-r border-[#E5E5EA] bg-[#F2F2F7] shrink-0 overflow-y-auto flex flex-col">
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
            <div className="h-[1px] bg-[#E5E5EA] mx-[10px]" />

            {/* Calendar list */}
            <div className="p-[10px_12px] flex-1">
              {calGroups.map(group => (
                <div key={group} className="mb-[14px]">
                  <div className="text-[11px] font-bold text-[#8E8E93] tracking-[0.6px] uppercase mb-[6px]">
                    {group}
                  </div>
                  {calendars.filter(c => c.group === group).map(cal => (
                    <div key={cal.id} onClick={() => toggleCalendar(cal.id)} className="flex items-center gap-2 py-[3px] cursor-pointer">
                      <div
                        className="w-[14px] h-[14px] rounded-[3px] shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: cal.enabled ? cal.color : "transparent", border: `2px solid ${cal.color}` }}
                      >
                        {cal.enabled && <Check size={9} color="#fff" strokeWidth={3} />}
                      </div>
                      <span className="text-[13px] text-[#1C1C1E] select-none">{cal.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
