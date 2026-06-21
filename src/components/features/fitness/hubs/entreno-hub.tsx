"use client";

import React, { useMemo, useState } from "react";
import { Tabs } from "@/components/ui";
import { useFitnessStore } from "@/stores/fitness-store";
import { LivePR } from "../fitness-engine";
import RecordsTab from "../records-tab";
import WorkoutLoggerV2 from "@/components/features/fitness-v2/workout-logger";
import VolumeDashboard from "@/components/features/fitness-v2/volume-dashboard";

// Map muscleGroup español → slug inglés para VolumeDashboard v2
function mapMuscleToEn(muscleEs: string): string {
  const m = muscleEs.toLowerCase();
  if (m.includes("pecho") || m.includes("chest")) return "chest";
  if (m.includes("espalda") || m.includes("back")) return "back";
  if (m.includes("hombro") || m.includes("shoulder")) return "shoulders";
  if (m.includes("bíceps") || m.includes("biceps")) return "biceps";
  if (m.includes("tríceps") || m.includes("triceps")) return "triceps";
  if (m.includes("cuád") || m.includes("quad")) return "quads";
  if (m.includes("isquio") || m.includes("hamstring")) return "hamstrings";
  if (m.includes("glúteo") || m.includes("glute")) return "glutes";
  if (m.includes("core") || m.includes("abdom")) return "core";
  if (m.includes("pantorr") || m.includes("calve")) return "calves";
  return muscleEs;
}

const ENTRENO_SUBTABS = [
  { id: "hoy",        label: "🏋️ Hoy" },
  { id: "volumen",    label: "📊 Volumen" },
  { id: "records",    label: "🏆 Récords" },
  { id: "historial",  label: "📜 Historial" },
];

export default function EntrenoHub() {
  const [subTab, setSubTab] = useState<string>("hoy");

  const { personalRecords, workouts, getTonelageHistory } = useFitnessStore();

  // PRs para la tabla de récords — derivados directo de DB (sin auto-detección
  // aquí: el logger v2 es la única fuente que escribe PRs). prevOneRM = oneRM
  // hace que "cambio mensual" sea 0 (no inventamos un delta falso).
  const livePRs: LivePR[] = useMemo(
    () =>
      personalRecords.map((r) => ({
        exercise: r.exercise,
        oneRM: r.oneRM,
        fiveRM: r.fiveRM,
        tenRM: r.tenRM,
        date: r.date,
        prevOneRM: r.oneRM,
        isNewPR: false,
      })),
    [personalRecords],
  );

  const tonelageHistory = useMemo(
    () => getTonelageHistory(),
    [workouts], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Series de la última semana para el dashboard de volumen (datos reales).
  const weekSets = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workouts
      .filter((w) => new Date(w.date) >= weekAgo)
      .flatMap((w) =>
        (w.exercises ?? []).flatMap((e) =>
          (e.sets ?? []).map((s) => ({
            muscleGroup: mapMuscleToEn(e.muscleGroup ?? ""),
            reps: s.reps,
            rpe: s.rpe ?? null,
          })),
        ),
      );
  }, [workouts]);

  return (
    <section>
      <Tabs
        tabs={ENTRENO_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "hoy" && <WorkoutLoggerV2 />}

      {subTab === "volumen" && <VolumeDashboard weekSets={weekSets} />}

      {subTab === "records" && (
        <RecordsTab liveRecords={livePRs} tonelageHistory={tonelageHistory} />
      )}

      {subTab === "historial" && <WorkoutHistorial workouts={workouts} />}
    </section>
  );
}

// ─── Historial ──────────────────────────────────────────────────────────────

interface WorkoutRow {
  id: string;
  date: string;
  name: string;
  durationMinutes?: number;
  totalVolume?: number;
  exercises?: Array<{ exerciseName: string; sets?: Array<{ weight: number; reps: number }> }>;
}

function WorkoutHistorial({ workouts }: { workouts: WorkoutRow[] }) {
  if (workouts.length === 0) {
    return (
      <div className="bg-brand-paper rounded-xl p-8 border border-brand-light-tan text-center">
        <p className="text-brand-dark font-semibold m-0">Sin entrenamientos registrados todavía</p>
        <p className="text-brand-warm text-xs mt-1 m-0">
          Registra una sesión en <strong>Hoy</strong> y aparecerá aquí.
        </p>
      </div>
    );
  }
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((w) => {
        const totalSets =
          w.exercises?.reduce((sum, e) => sum + (e.sets?.length ?? 0), 0) ?? 0;
        return (
          <div
            key={w.id}
            className="bg-brand-paper rounded-lg p-4 border border-brand-light-tan flex items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-baseline gap-2">
                <h4 className="font-serif text-base text-brand-dark m-0">{w.name}</h4>
                <span className="text-brand-warm text-xs">{w.date}</span>
              </div>
              <p className="text-brand-warm text-xs mt-1 m-0">
                {w.exercises?.length ?? 0} ejercicio
                {(w.exercises?.length ?? 0) === 1 ? "" : "s"} · {totalSets} sets
                {w.totalVolume
                  ? ` · ${Math.round(w.totalVolume).toLocaleString()} kg·rep`
                  : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
