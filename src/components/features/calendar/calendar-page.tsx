"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  Download,
  Bell,
  BellOff,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui";
import TodayView from "./today-view";
import WeekView from "./week-view";
import MonthView from "./month-view";
import YearReviewModal from "./year-review-modal";
import CalendarGroupsSidebar from "./calendar-groups-sidebar";
import type { CalendarGroup } from "./types";
import { useAppStore, type PlanTab } from "@/stores/app-store";

const VIEWS: { id: PlanTab; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "Hoy",    icon: CalendarIcon },
  { id: "week",  label: "Semana", icon: CalendarDays },
  { id: "month", label: "Mes",    icon: CalendarRange },
];

const LS_COLLAPSED_KEY = "calendar.sidebarCollapsed";

export default function CalendarPage() {
  const view = useAppStore((s) => s.planTab);
  const setView = useAppStore((s) => s.setPlanTab);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [showYearReview, setShowYearReview] = useState(false);

  // Sidebar state
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [groups, setGroups] = useState<CalendarGroup[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_COLLAPSED_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotifPermission("unsupported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const handleGroupsChange = useCallback((g: CalendarGroup[]) => {
    setGroups(g);
  }, []);

  async function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        toast.success("Recordatorios activados ✨");
        new Notification("Ultimate TRACKER", {
          body: "Los recordatorios están activados. Te avisaremos antes de cada evento.",
          icon: "/favicon.ico",
        });
      } else {
        toast.info("Permiso denegado");
      }
    } catch {
      toast.error("Error pidiendo permiso");
    }
  }

  function exportICal() {
    const link = document.createElement("a");
    link.href = "/api/calendar/export";
    link.download = `ultimate-tracker-${new Date().toISOString().slice(0, 10)}.ics`;
    link.click();
    toast.success("Descargando .ics · impórtalo en Google Calendar o Apple Calendar");
  }

  return (
    <div className="flex gap-0 -mx-6 -my-6 min-h-[calc(100vh-80px)]">
      {/* Sidebar (retráctil) */}
      <CalendarGroupsSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onGroupsChange={handleGroupsChange}
      />

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 px-6 py-6 space-y-5">
        {/* View switcher + actions */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-brand-cream">
          <div className="flex gap-1">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 border-b-2 -mb-[2px] text-sm transition-colors whitespace-nowrap",
                    view === v.id
                      ? "border-b-accent text-accent font-semibold"
                      : "border-b-transparent text-brand-medium hover:text-brand-dark"
                  )}
                >
                  <Icon size={15} />
                  {v.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pb-1.5 flex-wrap">
            {notifPermission !== "unsupported" && notifPermission !== "granted" && (
              <button
                onClick={requestNotifPermission}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-brand-cream text-xs text-brand-medium hover:bg-brand-cream"
                title="Activar recordatorios push del navegador"
              >
                <BellOff size={12} /> Activar recordatorios
              </button>
            )}
            {notifPermission === "granted" && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs text-success"
                title="Recordatorios activos"
              >
                <Bell size={12} /> Recordatorios ✓
              </span>
            )}
            <button
              onClick={exportICal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-brand-cream text-xs text-brand-medium hover:bg-brand-cream"
              title="Descargar .ics para Google/Apple Calendar"
            >
              <Download size={12} /> Export
            </button>
            <button
              onClick={() => setShowYearReview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown"
              title="Revisión anual con análisis IA"
            >
              <Sparkles size={12} /> Revisión anual
            </button>
          </div>
        </div>

        {view === "today" && (
          <TodayView selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
        {view === "week" && <WeekView groups={groups} />}
        {view === "month" && (
          <MonthView
            groups={groups}
            onDrillDown={(date) => {
              setSelectedDate(date);
              setView("today");
            }}
          />
        )}

        {showYearReview && <YearReviewModal onClose={() => setShowYearReview(false)} />}
      </div>
    </div>
  );
}
