"use client";

import { useMemo } from "react";
import { VOLUME_LANDMARKS, volumeZone, type VolumeZone } from "@/lib/fitness/calculations";

type WeeklySet = {
  muscleGroup: string;
  reps: number;
  rpe?: number | null;
};

type Props = {
  weekSets: WeeklySet[];
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Cuádriceps",
  hamstrings: "Isquios",
  glutes: "Glúteos",
  core: "Core",
  calves: "Gemelos",
};

const ZONE_META: Record<VolumeZone, { label: string; color: string; textColor: string }> = {
  under_mv: { label: "Bajo MV", color: "#F5D0CE", textColor: "#C0544F" },
  between_mv_mev: { label: "Entre MV-MEV", color: "#F5E0C0", textColor: "#D4943A" },
  optimal: { label: "Óptimo", color: "#D4E6B5", textColor: "#7A9E3E" },
  approaching_mrv: { label: "Cerca MRV", color: "#F5E0C0", textColor: "#D4943A" },
  over_mrv: { label: "Sobre MRV", color: "#F5D0CE", textColor: "#C0544F" },
};

export default function VolumeDashboard({ weekSets }: Props) {
  const perMuscle = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of weekSets) {
      const isEffective = s.reps >= 3 && (s.rpe == null || s.rpe >= 6);
      if (!isEffective) continue;
      counts[s.muscleGroup] = (counts[s.muscleGroup] ?? 0) + 1;
    }
    return counts;
  }, [weekSets]);

  const muscles = Object.keys(VOLUME_LANDMARKS);

  return (
    <div className="bg-brand-paper rounded-xl border border-brand-cream p-6">
      <header className="mb-5">
        <h3 className="font-display text-xl font-semibold text-brand-dark m-0">
          Volumen semanal por grupo muscular
        </h3>
        <p className="text-sm text-brand-warm mt-1">
          Series efectivas (reps ≥ 3, RPE ≥ 6) · zonas basadas en landmarks de Mike Israetel (RP).
        </p>
      </header>

      <div className="space-y-3">
        {muscles.map((muscle) => {
          const sets = perMuscle[muscle] ?? 0;
          const landmarks = VOLUME_LANDMARKS[muscle];
          const zone = volumeZone(muscle, sets);
          const meta = ZONE_META[zone];
          const pct = Math.min(100, (sets / landmarks.mrv) * 100);
          const mevMark = (landmarks.mev / landmarks.mrv) * 100;
          const mavLowMark = (landmarks.mavLow / landmarks.mrv) * 100;
          const mavHighMark = (landmarks.mavHigh / landmarks.mrv) * 100;

          return (
            <div key={muscle} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-brand-dark">
                  {MUSCLE_LABELS[muscle] ?? muscle}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-brand-dark font-semibold">
                    {sets}{" "}
                    <span className="text-brand-warm font-normal">/ {landmarks.mrv}</span>
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: meta.color, color: meta.textColor }}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>

              <div className="relative h-3 bg-brand-cream rounded-full overflow-visible">
                {/* MEV marker */}
                <div
                  className="absolute top-[-4px] bottom-[-4px] w-[1px] bg-brand-warm/40"
                  style={{ left: `${mevMark}%` }}
                  title={`MEV: ${landmarks.mev}`}
                />
                {/* MAV low */}
                <div
                  className="absolute top-[-4px] bottom-[-4px] w-[1px] bg-success/50"
                  style={{ left: `${mavLowMark}%` }}
                  title={`MAV low: ${landmarks.mavLow}`}
                />
                {/* MAV high */}
                <div
                  className="absolute top-[-4px] bottom-[-4px] w-[1px] bg-success/50"
                  style={{ left: `${mavHighMark}%` }}
                  title={`MAV high: ${landmarks.mavHigh}`}
                />
                {/* Fill */}
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: meta.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-5 pt-4 border-t border-brand-cream text-[11px] text-brand-warm flex gap-4 flex-wrap">
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: ZONE_META.optimal.color }}/> Óptimo (MAV)</span>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: ZONE_META.between_mv_mev.color }}/> Insuficiente</span>
        <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: ZONE_META.over_mrv.color }}/> Sobreentrenamiento</span>
      </footer>
    </div>
  );
}
