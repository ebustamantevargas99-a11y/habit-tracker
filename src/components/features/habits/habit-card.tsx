"use client";

import {
  Check,
  Flame,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/components/ui";
import type { Habit } from "@/types";
import PhaseProgressBar from "./phase-progress-bar";
import {
  PHASE_META,
  phaseFromStreak,
  daysToNextPhase,
  nextPhaseLabel,
} from "./phase-utils";

export default function HabitCard({
  habit,
  completedToday,
  onToggle,
  onEdit,
  onDelete,
  atRisk,
  atRiskCritical,
}: {
  habit: Habit;
  completedToday: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  atRisk?: boolean;
  atRiskCritical?: boolean;
}) {
  const phase = phaseFromStreak(habit.streakCurrent);
  const phaseMeta = PHASE_META[phase];
  const daysLeft = daysToNextPhase(habit.streakCurrent);
  const nextLabel = nextPhaseLabel(habit.streakCurrent);
  const rootedDay = phase === "rooted" ? habit.streakCurrent - 91 : null;
  const graceUsed = habit.graceDaysAvailable === 0 && phase !== "not_started";
  const hoursInvested =
    habit.estimatedMinutes && habit.streakBest
      ? +((habit.estimatedMinutes * habit.streakBest) / 60).toFixed(1)
      : null;

  return (
    <div
      className={cn(
        "bg-brand-paper border rounded-xl p-4 transition",
        completedToday ? "border-success shadow-sm" : "border-brand-cream hover:border-accent/40",
        atRiskCritical && "border-danger ring-2 ring-danger/40"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Toggle circular */}
        <button
          onClick={onToggle}
          className={cn(
            "shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition",
            completedToday
              ? "bg-success border-success text-white"
              : "border-brand-cream hover:border-accent bg-brand-paper"
          )}
          title={completedToday ? "Marcar como no hecho" : "Marcar como hecho"}
        >
          {completedToday ? <Check size={20} strokeWidth={3} /> : <span className="text-2xl">{habit.icon}</span>}
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-serif text-base font-semibold text-brand-dark m-0 truncate">
                {habit.name}
              </h4>
              <p className="text-[11px] text-brand-warm truncate">
                {habit.category}
                {habit.estimatedMinutes ? ` · ${habit.estimatedMinutes} min` : ""}
                {habit.timeOfDay !== "all" ? ` · ${labelTime(habit.timeOfDay)}` : ""}
              </p>
            </div>

            {/* Streak pill */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <Flame size={14} className={habit.streakCurrent > 0 ? "text-accent" : "text-brand-tan"} />
                <span
                  className={cn(
                    "text-xl font-bold leading-none",
                    habit.streakCurrent > 0 ? "text-accent" : "text-brand-tan"
                  )}
                >
                  {habit.streakCurrent}
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-brand-warm mt-0.5">
                {rootedDay !== null ? `Día ${rootedDay} arraigado` : "días"}
              </p>
            </div>
          </div>

          {/* Phase label */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                phaseMeta.bgClass,
                phase === "rooted" ? "text-white" : phaseMeta.colorClass
              )}
            >
              <span>{phaseMeta.emoji}</span>
              {phaseMeta.label}
            </span>
            {phase !== "rooted" && daysLeft !== null && daysLeft > 0 && (
              <span className="text-[11px] text-brand-warm">
                faltan <b className="text-accent">{daysLeft}</b> días para <b>{nextLabel}</b>
              </span>
            )}
            {graceUsed && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-warning/20 text-warning font-medium"
                title="Ya usaste tu día de gracia de esta semana"
              >
                <ShieldCheck size={10} /> Gracia usada
              </span>
            )}
            {!graceUsed && habit.streakCurrent > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-info/10 text-info font-medium"
                title="Tienes 1 día de gracia esta semana"
              >
                <ShieldCheck size={10} /> Gracia disponible
              </span>
            )}
            {atRiskCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-danger text-white font-bold">
                <AlertTriangle size={10} /> EN RIESGO
              </span>
            )}
            {atRisk && !atRiskCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-warning/20 text-warning font-medium">
                <AlertTriangle size={10} /> Atención
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <PhaseProgressBar streak={habit.streakCurrent} />
          </div>

          {/* Sub-stats */}
          <div className="flex items-center justify-between gap-3 mt-3 text-[11px] text-brand-warm">
            <span>Mejor racha: <b>{habit.streakBest}d</b></span>
            {hoursInvested !== null && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> <b>{hoursInvested}h</b> invertidas
              </span>
            )}
            <div className="flex gap-0.5 ml-auto">
              <button
                onClick={onEdit}
                className="p-1 text-brand-warm hover:text-accent hover:bg-brand-cream rounded"
                title="Editar"
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-brand-warm hover:text-danger hover:bg-danger-light/30 rounded"
                title="Borrar"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelTime(t: string): string {
  switch (t) {
    case "morning": return "Mañana";
    case "afternoon": return "Tarde";
    case "evening": return "Noche";
    default: return t;
  }
}
