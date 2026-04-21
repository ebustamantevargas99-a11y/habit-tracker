"use client";

import { cn } from "@/components/ui";
import { PHASE_META, PHASE_MILESTONES, phaseFromStreak } from "./phase-utils";

/**
 * Barra segmentada con milestones 1 → 8 → 22 → 67 → 92.
 * Progreso del segmento actual se llena. Segmentos anteriores completos.
 */
export default function PhaseProgressBar({
  streak,
  showLabels = true,
  height = 10,
}: {
  streak: number;
  showLabels?: boolean;
  height?: number;
}) {
  const phase = phaseFromStreak(streak);
  const meta = PHASE_META[phase];
  const isRooted = phase === "rooted";

  // Segmentos entre milestones: 0-1, 1-8, 8-22, 22-67, 67-92
  const ranges = [
    [0, 1],
    [1, 8],
    [8, 22],
    [22, 67],
    [67, 92],
  ];
  const segmentFills = ranges.map(([start, end]) => {
    if (streak >= end) return 1;
    if (streak <= start) return 0;
    return (streak - start) / (end - start);
  });

  return (
    <div className="w-full">
      <div
        className="w-full rounded-full bg-brand-cream overflow-hidden flex gap-[2px]"
        style={{ height }}
      >
        {isRooted ? (
          <div className={cn("flex-1 rounded-full", meta.bgClass)} />
        ) : (
          segmentFills.map((fill, i) => (
            <div key={i} className="flex-1 rounded-full bg-brand-cream relative overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all",
                  fill > 0 ? PHASE_META[Object.keys(PHASE_META)[i + 1] as keyof typeof PHASE_META].bgClass : ""
                )}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          ))
        )}
      </div>
      {showLabels && (
        <div className="flex justify-between text-[9px] text-brand-tan mt-1 font-mono">
          {PHASE_MILESTONES.map((m) => (
            <span key={m} className={streak >= m ? "text-accent font-bold" : ""}>
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
