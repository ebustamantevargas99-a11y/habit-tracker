"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/components/ui";
import type { Habit } from "@/types";
import { PHASE_META, phaseFromStreak } from "./phase-utils";

/**
 * Banner de alerta crítica: se muestra cuando el hábito tiene atRiskCritical
 * (faltó ayer + hoy pendiente + gracia ya usada → mañana rompe).
 */
export default function RiskBanner({
  habit,
  onMarkDone,
  onDismiss,
}: {
  habit: Habit;
  onMarkDone: () => void;
  onDismiss: () => void;
}) {
  const phase = phaseFromStreak(habit.streakCurrent);
  const phaseMeta = PHASE_META[phase];
  const hoursLost =
    habit.estimatedMinutes
      ? +((habit.estimatedMinutes * habit.streakCurrent) / 60).toFixed(1)
      : null;
  const daysToRoot = Math.max(0, 92 - habit.streakCurrent);

  return (
    <div className="relative bg-gradient-to-br from-danger/20 via-warning/15 to-brand-paper border-2 border-danger rounded-2xl p-5 shadow-warm-lg">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1.5 text-brand-warm hover:bg-brand-cream rounded-full"
        title="Cerrar"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-danger text-white flex items-center justify-center animate-pulse">
          <AlertTriangle size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-danger font-bold mb-1">
            Tu racha está en peligro
          </p>
          <h3 className="font-display text-xl font-bold text-brand-dark m-0 flex items-center gap-2">
            <span>{habit.icon}</span>
            {habit.name}
          </h3>
          <p className="text-sm text-brand-medium mt-1">
            <b className="text-accent">{habit.streakCurrent} días</b> · Fase{" "}
            <span className={cn("font-semibold", phaseMeta.colorClass)}>
              {phaseMeta.emoji} {phaseMeta.label}
            </span>
          </p>

          <div className="mt-3 bg-brand-paper/80 rounded-lg p-3 border border-danger/30">
            <p className="text-xs font-semibold text-brand-dark mb-2">
              Faltaste ayer y ya usaste tu día de gracia. Si HOY no lo haces, perderás:
            </p>
            <ul className="text-xs text-brand-dark space-y-0.5 ml-3">
              <li>❌ <b>{habit.streakCurrent} días</b> de racha consecutiva</li>
              {hoursLost !== null && (
                <li>❌ <b>{hoursLost}h</b> invertidas volverán a contar desde cero</li>
              )}
              {phase === "rooted" ? (
                <li>❌ <b>Perderás tu arraigo</b> (día {habit.streakCurrent - 91} arraigado) · necesitarás 92 días más para re-arraigar</li>
              ) : (
                <li>❌ Tendrás que empezar de nuevo (92 días para arraigar, faltaban <b>{daysToRoot}</b>)</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onMarkDone}
          className="flex-1 px-5 py-3 rounded-button bg-success text-white text-sm font-bold hover:bg-success/90 flex items-center justify-center gap-2"
        >
          <Check size={16} /> Lo hago ahora mismo
        </button>
        <button
          onClick={onDismiss}
          className="px-5 py-3 rounded-button border border-brand-cream text-brand-warm text-sm hover:bg-brand-cream"
        >
          Ya lo haré
        </button>
      </div>
    </div>
  );
}
