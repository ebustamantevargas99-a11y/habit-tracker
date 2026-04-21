"use client";

import { useMemo } from "react";
import type { Habit, HabitLog } from "@/types";
import { cn } from "@/components/ui";

/**
 * Heatmap estilo GitHub — 52 semanas × 7 días.
 * Intensidad según % de hábitos programados que se completaron ese día.
 */
export default function GlobalHeatmap({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: HabitLog[];
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const grid = useMemo(() => {
    const completedMap = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!l.completed) continue;
      if (!completedMap.has(l.date)) completedMap.set(l.date, new Set());
      completedMap.get(l.date)!.add(l.habitId);
    }

    // 371 días hacia atrás (alineados a lunes)
    const cells: Array<{ date: string; ratio: number; scheduled: number; completed: number }> = [];
    const totalCells = 371;
    for (let i = totalCells - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dow = d.getDay();
      const dateStr = d.toISOString().split("T")[0];

      const scheduled = habits.filter((h) => {
        if (h.frequency === "daily") return true;
        return h.targetDays?.includes(dow);
      }).length;
      const completed = completedMap.get(dateStr)?.size ?? 0;
      const ratio = scheduled > 0 ? Math.min(1, completed / scheduled) : 0;

      cells.push({ date: dateStr, ratio, scheduled, completed });
    }
    return cells;
  }, [habits, logs, today]);

  const firstDayDow = new Date(grid[0].date + "T00:00:00").getDay();
  const leadingEmpty = (firstDayDow + 6) % 7; // align to Monday
  const months = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    grid.forEach((cell, idx) => {
      const d = new Date(cell.date + "T00:00:00");
      const m = d.getMonth();
      if (m !== lastMonth && d.getDate() <= 7) {
        labels.push({
          label: d.toLocaleDateString("es-MX", { month: "short" }),
          col: Math.floor((leadingEmpty + idx) / 7),
        });
        lastMonth = m;
      }
    });
    return labels;
  }, [grid, leadingEmpty]);

  function colorForRatio(r: number): string {
    if (r === 0) return "bg-brand-cream";
    if (r < 0.25) return "bg-accent-glow/40";
    if (r < 0.5) return "bg-accent-glow";
    if (r < 0.75) return "bg-accent-light";
    if (r < 1) return "bg-accent";
    return "bg-success";
  }

  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-serif text-base font-semibold text-brand-dark m-0">
            Mapa del año
          </h3>
          <p className="text-xs text-brand-warm mt-0.5">
            Intensidad según % de hábitos completados ese día
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-brand-warm">
          <span>Menos</span>
          <span className="inline-block w-3 h-3 rounded bg-brand-cream" />
          <span className="inline-block w-3 h-3 rounded bg-accent-glow/40" />
          <span className="inline-block w-3 h-3 rounded bg-accent-glow" />
          <span className="inline-block w-3 h-3 rounded bg-accent-light" />
          <span className="inline-block w-3 h-3 rounded bg-accent" />
          <span className="inline-block w-3 h-3 rounded bg-success" />
          <span>Más</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-6 pr-2 text-[9px] text-brand-warm">
            {Array.from({ length: 53 }).map((_, col) => {
              const monthHere = months.find((m) => m.col === col);
              return (
                <div key={col} style={{ width: 11 }} className="shrink-0">
                  {monthHere?.label}
                </div>
              );
            })}
          </div>
          <div className="flex gap-[3px]">
            {/* DOW labels */}
            <div className="flex flex-col gap-[3px] text-[9px] text-brand-warm pr-1">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <div key={i} className="h-[11px] leading-none flex items-center">
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
              {Array.from({ length: leadingEmpty }).map((_, i) => (
                <div key={`empty-${i}`} className="w-[11px] h-[11px]" />
              ))}
              {grid.map((c) => (
                <div
                  key={c.date}
                  className={cn(
                    "w-[11px] h-[11px] rounded-[2px] hover:ring-2 hover:ring-accent transition cursor-default",
                    colorForRatio(c.ratio)
                  )}
                  title={`${c.date}: ${c.completed}/${c.scheduled} hábitos`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
