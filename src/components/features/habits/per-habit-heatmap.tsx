"use client";

import { useMemo } from "react";
import type { Habit, HabitLog } from "@/types";
import { cn } from "@/components/ui";
import { phaseFromStreak } from "./phase-utils";

/**
 * Heatmap de 365 días PARA UN HÁBITO específico con gradiente según fase.
 * Cada día completado refleja la fase en que estaba ese día — así el user
 * "ve" el crecimiento (de 🌱 claro a 🏆 sólido).
 */
export default function PerHabitHeatmap({
  habit,
  logs,
}: {
  habit: Habit;
  logs: HabitLog[];
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Map date → completed (para este hábito)
  const completedMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const l of logs) {
      if (l.habitId !== habit.id) continue;
      m.set(l.date, l.completed);
    }
    return m;
  }, [logs, habit.id]);

  /**
   * Calculamos la fase del hábito en cada fecha iterando desde el primer
   * log hacia adelante, manteniendo el streak running y su fase.
   */
  const grid = useMemo(() => {
    const totalCells = 371;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalCells - 1));

    // Streak running para cada día
    let runningStreak = 0;
    let graceUsedThisWeek = false;
    let currentWeekMondayStr = "";
    const cells: Array<{ date: string; completed: boolean; phase: string; streakAtDay: number }> = [];

    for (let i = 0; i < totalCells; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dow = d.getDay();

      // Reset gracia al inicio de semana
      const mondayOffset = (dow + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - mondayOffset);
      const mondayStr = monday.toISOString().split("T")[0];
      if (mondayStr !== currentWeekMondayStr) {
        currentWeekMondayStr = mondayStr;
        graceUsedThisWeek = false;
      }

      const isScheduled = habit.targetDays.length === 0 ||
        habit.targetDays.includes(dow) ||
        habit.frequency === "daily";

      const completed = completedMap.get(dateStr);

      if (completed === true) {
        runningStreak++;
      } else if (isScheduled) {
        if (!graceUsedThisWeek) {
          graceUsedThisWeek = true;
          // mantiene streak
        } else {
          runningStreak = 0;
        }
      }

      cells.push({
        date: dateStr,
        completed: completed === true,
        phase: phaseFromStreak(runningStreak),
        streakAtDay: runningStreak,
      });
    }
    return cells;
  }, [habit.targetDays, habit.frequency, completedMap, today]);

  const firstDayDow = new Date(grid[0].date + "T00:00:00").getDay();
  const leadingEmpty = (firstDayDow + 6) % 7;

  function colorForCell(c: typeof grid[number]): string {
    if (!c.completed) return "bg-brand-cream";
    switch (c.phase) {
      case "starting":      return "bg-accent-glow/60";
      case "forming":       return "bg-accent-light";
      case "strengthening": return "bg-accent";
      case "near_rooted":   return "bg-brand-brown";
      case "rooted":        return "bg-success";
      default:              return "bg-brand-cream";
    }
  }

  return (
    <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-cream">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-brand-dark flex items-center gap-1.5">
          <span>{habit.icon}</span>
          {habit.name}
        </span>
        <span className="text-[10px] text-brand-warm">
          {grid.filter((c) => c.completed).length} días completados
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[2px] min-w-fit">
          <div className="grid grid-flow-col grid-rows-7 gap-[2px]">
            {Array.from({ length: leadingEmpty }).map((_, i) => (
              <div key={`e-${i}`} className="w-[9px] h-[9px]" />
            ))}
            {grid.map((c) => (
              <div
                key={c.date}
                className={cn(
                  "w-[9px] h-[9px] rounded-[1px] hover:ring-1 hover:ring-accent transition",
                  colorForCell(c)
                )}
                title={`${c.date} · ${c.completed ? `día ${c.streakAtDay}` : "no hecho"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
