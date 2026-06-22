"use client";

import React, { useMemo, useState } from "react";
import { Tabs } from "@/components/ui";
import { useFitnessStore } from "@/stores/fitness-store";
import { LivePR } from "../fitness-engine";
import RecordsTab from "../records-tab";
import WorkoutLoggerV2 from "@/components/features/fitness-v2/workout-logger";
import VolumePlanVsDone from "../volume-plan-vs-done";

const ENTRENO_SUBTABS = [
  { id: "hoy",        label: "Hoy" },
  { id: "volumen",    label: "Volumen" },
  { id: "records",    label: "Récords" },
  { id: "historial",  label: "Historial" },
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

  return (
    <section>
      <Tabs
        tabs={ENTRENO_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        variant="pill"
        className="mb-6"
      />

      {subTab === "hoy" && <WorkoutLoggerV2 />}

      {subTab === "volumen" && <VolumePlanVsDone workouts={workouts} />}

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
