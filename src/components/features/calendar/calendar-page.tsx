"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/components/ui";
import TodayView from "./today-view";
import { useAppStore, type PlanTab } from "@/stores/app-store";

const VIEWS: { id: PlanTab; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "Hoy",    icon: CalendarIcon },
  { id: "week",  label: "Semana", icon: CalendarDays },
  { id: "month", label: "Mes",    icon: CalendarRange },
];

export default function CalendarPage() {
  const view = useAppStore((s) => s.planTab);
  const setView = useAppStore((s) => s.setPlanTab);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div className="space-y-5">
      {/* View switcher */}
      <div className="flex gap-1 border-b-2 border-brand-cream">
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

      {view === "today" && (
        <TodayView selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}
      {view === "week" && (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-16 text-center">
          <CalendarDays size={32} className="inline text-brand-warm mb-3" />
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
            Vista Semana — próximamente
          </h3>
          <p className="text-sm text-brand-warm">
            Grid 7 días × 24 horas con drag-and-drop. Llegará en Fase 2.
          </p>
          <button
            onClick={() => setView("today")}
            className="mt-4 px-4 py-2 rounded-button bg-accent text-white text-sm hover:bg-brand-brown"
          >
            Volver a Hoy
          </button>
        </div>
      )}
      {view === "month" && (
        <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-16 text-center">
          <CalendarRange size={32} className="inline text-brand-warm mb-3" />
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
            Vista Mes — próximamente
          </h3>
          <p className="text-sm text-brand-warm">
            Calendario mensual con heatmap de densidad. Llegará en Fase 3.
          </p>
          <button
            onClick={() => setView("today")}
            className="mt-4 px-4 py-2 rounded-button bg-accent text-white text-sm hover:bg-brand-brown"
          >
            Volver a Hoy
          </button>
        </div>
      )}
    </div>
  );
}
