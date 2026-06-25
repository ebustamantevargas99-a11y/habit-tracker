"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Bell,
  BellOff,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs } from "@/components/ui";
import TodayView from "./today-view";
import WeekView from "./week-view";
import MonthView from "./month-view";
import YearReviewModal from "./year-review-modal";
import CalendarGroupsSidebar from "./calendar-groups-sidebar";
import type { CalendarGroup } from "./types";
import { useAppStore, type PlanTab } from "@/stores/app-store";
import { useUserStore } from "@/stores/user-store";
import { todayLocal } from "@/lib/date/local";

const VIEWS: { id: PlanTab; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week",  label: "Semana" },
  { id: "month", label: "Mes" },
];

const LS_COLLAPSED_KEY = "calendar.sidebarCollapsed";

export default function CalendarPage() {
  const view = useAppStore((s) => s.planTab);
  const setView = useAppStore((s) => s.setPlanTab);
  const tz = useUserStore((s) => s.user?.profile?.timezone);
  const [selectedDate, setSelectedDate] = useState(() => todayLocal(tz));
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [showYearReview, setShowYearReview] = useState(false);

  // Sidebar state
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [groups, setGroups] = useState<CalendarGroup[]>([]);
  // Se incrementa tras sincronizar Google → remonta las vistas para refetch.
  const [syncKey, setSyncKey] = useState(0);

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
    <div className="flex gap-0 -mx-4 md:-mx-8 -my-4 md:-my-8 min-h-[calc(100vh-80px)]">
      {/* Sidebar (retráctil) */}
      <CalendarGroupsSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onGroupsChange={handleGroupsChange}
        onGoogleSynced={() => setSyncKey((k) => k + 1)}
      />

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 px-4 py-4 md:px-6 md:py-6 space-y-5">
        {/* View switcher + actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Tabs
            tabs={VIEWS}
            activeTab={view}
            onChange={(id) => setView(id as PlanTab)}
            variant="segmented"
          />
          <div className="flex gap-2 flex-wrap">
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
              <Download size={12} /> Exportar
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
          <TodayView key={syncKey} selectedDate={selectedDate} onDateChange={setSelectedDate} />
        )}
        {view === "week" && <WeekView key={syncKey} groups={groups} />}
        {view === "month" && (
          <MonthView
            key={syncKey}
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
