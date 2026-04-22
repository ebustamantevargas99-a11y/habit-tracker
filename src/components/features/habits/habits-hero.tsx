"use client";
import { todayLocal } from "@/lib/date/local";

import { Flame, Target, Trophy, Clock, Sparkles } from "lucide-react";
import { cn } from "@/components/ui";
import type { Habit, HabitLog } from "@/types";
import { phaseFromStreak, PHASE_META } from "./phase-utils";

/**
 * Hero con agregación del día — reemplaza al viejo DailyCommandCenter.
 * Se muestra arriba de la vista de hábitos.
 */
export default function HabitsHero({
  habits,
  logs,
  greeting,
  displayName,
}: {
  habits: Habit[];
  logs: HabitLog[];
  greeting: string;
  displayName: string;
}) {
  const today = todayLocal();
  const completedTodayIds = new Set(
    logs.filter((l) => l.date === today && l.completed).map((l) => l.habitId)
  );
  const todayDow = new Date().getDay();

  const activeToday = habits.filter((h) => {
    if (!h.isActive) return false;
    if (h.frequency === "daily") return true;
    return h.targetDays?.includes(todayDow);
  });

  const completedToday = activeToday.filter((h) => completedTodayIds.has(h.id)).length;
  const pct = activeToday.length > 0 ? (completedToday / activeToday.length) * 100 : 0;

  const totalStreak = habits.reduce((s, h) => s + h.streakCurrent, 0);
  const bestStreak = Math.max(0, ...habits.map((h) => h.streakCurrent));
  const rootedCount = habits.filter((h) => phaseFromStreak(h.streakCurrent) === "rooted").length;

  const totalHoursInvested = habits.reduce((sum, h) => {
    if (!h.estimatedMinutes || !h.streakCurrent) return sum;
    return sum + (h.estimatedMinutes * h.streakCurrent) / 60;
  }, 0);

  let insight = "";
  if (activeToday.length === 0) {
    insight = "No hay hábitos programados hoy. Agrega uno para empezar.";
  } else if (completedToday === activeToday.length) {
    insight = "🎉 Día perfecto. Todos los hábitos completados.";
  } else if (completedToday === 0) {
    insight = "Empieza por el más fácil. Un solo check y la bola rueda.";
  } else {
    insight = `Vas ${completedToday}/${activeToday.length}. Completa los ${activeToday.length - completedToday} restantes antes de dormir.`;
  }

  return (
    <div className="bg-gradient-to-br from-brand-dark via-brand-brown to-accent rounded-2xl p-6 text-brand-paper">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
            {greeting}
          </p>
          <h1 className="font-display text-3xl font-bold text-accent-glow m-0">
            {displayName}
          </h1>
          <p className="text-sm text-brand-light-cream mt-3 italic max-w-md">
            {insight}
          </p>
        </div>

        {/* Ring de progreso del día */}
        <div className="shrink-0 relative w-28 h-28">
          <svg width="112" height="112" className="-rotate-90">
            <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle
              cx="56"
              cy="56"
              r="46"
              fill="none"
              stroke="#F0D78C"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-accent-glow leading-none">
              {Math.round(pct)}%
            </span>
            <span className="text-[10px] text-brand-light-tan mt-0.5">
              {completedToday}/{activeToday.length}
            </span>
          </div>
        </div>
      </div>

      {/* Micro-stats */}
      <div className="grid grid-cols-4 gap-3 mt-5">
        <MiniStat icon={<Flame size={14} />} label="Mejor racha" value={bestStreak} />
        <MiniStat icon={<Target size={14} />} label="Hábitos" value={habits.length} />
        <MiniStat icon={<Trophy size={14} />} label="Arraigados" value={rootedCount} />
        <MiniStat
          icon={<Clock size={14} />}
          label="Horas invertidas"
          value={totalHoursInvested > 0 ? `${Math.round(totalHoursInvested)}h` : "—"}
        />
      </div>

      {/* At-risk warning chips (chips suaves, el banner prominente es un componente aparte) */}
      {(() => {
        const atRiskHabits = habits
          .filter((h) => {
            if (completedTodayIds.has(h.id)) return false;
            if (h.streakCurrent <= 0) return false;
            if (!h.lastCompletedDate) return false;
            const last = new Date(h.lastCompletedDate + "T00:00:00");
            const diff = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
            return diff >= 1;
          })
          .slice(0, 3);
        if (atRiskHabits.length === 0) return null;
        return (
          <div className="mt-4 bg-black/20 rounded-lg p-3 flex items-start gap-2">
            <Sparkles size={14} className="text-accent-glow shrink-0 mt-0.5" />
            <div className="text-xs text-brand-light-cream">
              <b className="text-accent-glow">Protege tus rachas:</b>{" "}
              {atRiskHabits.map((h, i) => (
                <span key={h.id}>
                  {i > 0 && " · "}
                  {h.icon} {h.name} ({h.streakCurrent}d)
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-black/20 rounded-lg p-2.5">
      <div className="flex items-center gap-1 text-accent-glow mb-1">
        {icon}
        <span className="text-[9px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-lg font-bold text-brand-paper leading-none">{value}</div>
    </div>
  );
}
