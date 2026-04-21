"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, LayoutGrid, Map as MapIcon, List } from "lucide-react";
import { useHabitStore } from "@/stores/habit-store";
import { useUserStore } from "@/stores/user-store";
import { cn, ErrorBanner } from "@/components/ui";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";
import AIExportButton from "@/components/features/ai-export/ai-export-button";
import type { Habit } from "@/types";
import HabitCard from "./habit-card";
import HabitsHero from "./habits-hero";
import HabitFormModal from "./habit-form-modal";
import RiskBanner from "./risk-banner";
import RootedCelebrationModal from "./rooted-celebration-modal";
import GlobalHeatmap from "./global-heatmap";
import PerHabitHeatmap from "./per-habit-heatmap";
import { phaseFromStreak } from "./phase-utils";

type ViewMode = "list" | "heatmap-global" | "heatmap-per";

const VIEWS: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: "list",           label: "Lista",        icon: LayoutGrid },
  { id: "heatmap-global", label: "Mapa del año", icon: MapIcon },
  { id: "heatmap-per",    label: "Por hábito",   icon: List },
];

export default function HabitTrackerPage() {
  const {
    habits,
    logs,
    isLoaded,
    error,
    clearError,
    initialize,
    refresh,
    toggleHabitToday,
    removeHabit,
  } = useHabitStore();
  const { user } = useUserStore();
  const displayName = user?.name ?? "Usuario";

  const [view, setView] = useState<ViewMode>("list");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [dismissedRisks, setDismissedRisks] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<{ habit: Habit; milestone: number } | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const completedTodayIds = useMemo(
    () =>
      new Set(
        logs.filter((l) => l.date === todayStr && l.completed).map((l) => l.habitId)
      ),
    [logs, todayStr]
  );

  // Riesgo crítico: faltó ayer (día programado) + hoy pendiente + gracia usada
  const criticalRisks = useMemo<Habit[]>(() => {
    const todayDow = new Date().getDay();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    const yDow = yesterday.getDay();

    return habits.filter((h) => {
      if (!h.isActive) return false;
      if (completedTodayIds.has(h.id)) return false;
      if (h.streakCurrent <= 0) return false;
      if (dismissedRisks.has(h.id)) return false;

      const yesterdayScheduled =
        h.frequency === "daily" || h.targetDays?.includes(yDow);
      const todayScheduled =
        h.frequency === "daily" || h.targetDays?.includes(todayDow);
      if (!yesterdayScheduled || !todayScheduled) return false;

      const yesterdayLog = logs.find((l) => l.habitId === h.id && l.date === yStr);
      const yesterdayMissed = !yesterdayLog || !yesterdayLog.completed;
      if (!yesterdayMissed) return false;

      // Gracia ya usada esta semana (graceDaysAvailable === 0)
      return h.graceDaysAvailable === 0;
    });
  }, [habits, completedTodayIds, logs, dismissedRisks]);

  async function handleToggle(habit: Habit) {
    const prevStreak = habit.streakCurrent;
    await toggleHabitToday(habit.id);
    await refresh();
    const updated = useHabitStore.getState().habits.find((h) => h.id === habit.id);
    if (updated && updated.streakCurrent > prevStreak) {
      const MILESTONES = [7, 21, 66, 92, 100, 365, 500, 1000];
      for (const m of MILESTONES) {
        if (prevStreak < m && updated.streakCurrent >= m) {
          setCelebration({ habit: updated, milestone: m });
          fireConfettiCelebration();
          break;
        }
      }
    }
  }

  async function handleDelete(habit: Habit) {
    if (!confirm(`¿Borrar "${habit.name}"?`)) return;
    await removeHabit(habit.id);
  }

  const activeHabits = habits.filter((h) => h.isActive);
  const sortedHabits = useMemo(() => {
    return [...activeHabits].sort((a, b) => {
      // Arraigados al final
      const aRooted = phaseFromStreak(a.streakCurrent) === "rooted" ? 1 : 0;
      const bRooted = phaseFromStreak(b.streakCurrent) === "rooted" ? 1 : 0;
      if (aRooted !== bRooted) return aRooted - bRooted;
      return b.streakCurrent - a.streakCurrent;
    });
  }, [activeHabits]);

  if (!isLoaded) {
    return (
      <div className="text-center py-16 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando hábitos…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ErrorBanner error={error} onDismiss={clearError} />

      <HabitsHero
        habits={activeHabits}
        logs={logs}
        greeting={greeting}
        displayName={displayName}
      />

      {criticalRisks.map((h) => (
        <RiskBanner
          key={h.id}
          habit={h}
          onMarkDone={() => {
            void handleToggle(h);
            setDismissedRisks((prev) => {
              const next = new Set(prev);
              next.add(h.id);
              return next;
            });
          }}
          onDismiss={() => {
            setDismissedRisks((prev) => {
              const next = new Set(prev);
              next.add(h.id);
              return next;
            });
          }}
        />
      ))}

      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-brand-cream pb-2">
        <div className="flex gap-1">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium transition",
                  view === v.id
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                )}
              >
                <Icon size={13} />
                {v.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <AIExportButton scope="habits" label="Analizar con IA" variant="outline" size="sm" />
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown"
          >
            <Plus size={13} /> Nuevo hábito
          </button>
        </div>
      </div>

      {view === "list" && (
        <>
          {sortedHabits.length === 0 ? (
            <EmptyState onAdd={() => setShowForm(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedHabits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  completedToday={completedTodayIds.has(h.id)}
                  onToggle={() => void handleToggle(h)}
                  onEdit={() => {
                    setEditing(h);
                    setShowForm(true);
                  }}
                  onDelete={() => void handleDelete(h)}
                  atRisk={criticalRisks.some((r) => r.id === h.id)}
                  atRiskCritical={criticalRisks.some((r) => r.id === h.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === "heatmap-global" && (
        <GlobalHeatmap habits={activeHabits} logs={logs} />
      )}

      {view === "heatmap-per" && (
        <div className="space-y-3">
          {sortedHabits.length === 0 ? (
            <EmptyState onAdd={() => setShowForm(true)} />
          ) : (
            sortedHabits.map((h) => (
              <PerHabitHeatmap key={h.id} habit={h} logs={logs} />
            ))
          )}
        </div>
      )}

      {showForm && (
        <HabitFormModal
          habit={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async () => {
            await refresh();
          }}
        />
      )}

      {celebration && (
        <RootedCelebrationModal
          habitName={celebration.habit.name}
          habitIcon={celebration.habit.icon}
          milestone={celebration.milestone}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-brand-warm-white flex items-center justify-center mb-4">
        <span className="text-2xl">🌱</span>
      </div>
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
        Sin hábitos todavía
      </h3>
      <p className="text-sm text-brand-warm mb-4">
        Empieza con uno. Lo más importante es la consistencia.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown inline-flex items-center gap-2"
      >
        <Plus size={14} /> Crear mi primer hábito
      </button>
    </div>
  );
}
