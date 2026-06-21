"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { shiftDaysLocal } from "@/lib/date/local";
import { VOLUME_LANDMARKS, volumeZone } from "@/lib/fitness/calculations";
import {
  MUSCLE_ORDER,
  MUSCLE_LABEL_ES,
  plannedVolumeByMuscle,
  doneVolumeByMuscle,
  roundHalf,
} from "@/lib/fitness/muscle-volume";

interface ScheduleDay {
  dayOfWeek: number;
  templateName: string;
  exercises: { name: string; sets: number; repRange: [number, number] }[];
}
interface Program {
  id: string;
  name: string;
  active: boolean;
  schedule: ScheduleDay[];
}

interface WorkoutLike {
  date: string;
  exercises?: {
    exerciseName: string;
    muscleGroup?: string;
    sets?: { weight: number; reps: number; rpe?: number | null }[];
  }[];
}

const PLAN_COLOR = "#C0DD97"; // verde claro = planificado
const DONE_COLOR = "#639922"; // verde fuerte = hecho

function planStatus(slug: string, plan: number): { label: string; cls: string } {
  if (plan <= 0) return { label: "sin programar", cls: "text-brand-warm" };
  const z = volumeZone(slug, plan);
  if (z === "under_mv" || z === "between_mv_mev")
    return { label: "plan bajo MEV", cls: "text-danger" };
  if (z === "optimal") return { label: "plan óptimo", cls: "text-success" };
  if (z === "approaching_mrv")
    return { label: "cerca de MRV", cls: "text-warning" };
  return { label: "plan sobre MRV", cls: "text-danger" };
}

export default function VolumePlanVsDone({ workouts }: { workouts: WorkoutLike[] }) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Program[]>("/fitness/programs")
      .then((ps) => {
        if (!cancelled) setProgram(ps.find((p) => p.active) ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const planned = useMemo(
    () => plannedVolumeByMuscle(program?.schedule ?? []),
    [program],
  );
  const done = useMemo(
    () => doneVolumeByMuscle(workouts, shiftDaysLocal(-6)),
    [workouts],
  );

  const uncategorized = useMemo(
    () => Array.from(new Set([...planned.uncategorized, ...done.uncategorized])),
    [planned, done],
  );

  return (
    <div className="bg-brand-paper rounded-xl border border-brand-cream p-6">
      <header className="mb-4">
        <h3 className="font-display text-xl font-semibold text-brand-dark m-0">
          Volumen semanal · plan vs. hecho
        </h3>
        <p className="text-sm text-brand-warm mt-1">
          Series efectivas por músculo (compuestos cuentan fraccional) sobre los
          landmarks MEV/MAV/MRV de Mike Israetel.
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-brand-warm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: DONE_COLOR }} />
            Hecho esta semana
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: PLAN_COLOR }} />
            Plan de tu rutina
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-[2px] h-3.5 bg-brand-warm/50" />
            MEV · MAV · MRV
          </span>
        </div>
      </header>

      {loaded && !program && (
        <div className="mb-4 rounded-lg border border-brand-light-tan bg-brand-warm-white px-4 py-2.5 text-xs text-brand-warm">
          No tienes una rutina activa. Las barras claras (plan) aparecerán cuando
          crees tu rutina en <strong>Rutinas</strong>; abajo ves lo ya entrenado.
        </div>
      )}

      <div className="space-y-3.5">
        {MUSCLE_ORDER.map((slug) => {
          const l = VOLUME_LANDMARKS[slug];
          const plan = planned.byMuscle[slug] ?? 0;
          const dn = done.byMuscle[slug] ?? 0;
          const planR = roundHalf(plan);
          const doneR = roundHalf(dn);
          const status = planStatus(slug, plan);
          const remaining = roundHalf(Math.max(0, plan - dn));

          const pct = (v: number) => Math.min(100, (v / l.mrv) * 100);

          return (
            <div key={slug}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-semibold text-brand-dark">
                  {MUSCLE_LABEL_ES[slug]}
                </span>
                <span className="text-[13px] text-brand-warm">
                  <b className="text-brand-dark font-semibold">{doneR}</b> / {planR} series
                </span>
              </div>

              <div className="relative h-[18px] bg-brand-light-cream rounded-md overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full"
                  style={{ width: `${pct(plan)}%`, background: PLAN_COLOR }}
                />
                <div
                  className="absolute left-0 top-0 h-full"
                  style={{ width: `${pct(dn)}%`, background: DONE_COLOR }}
                />
                <Marker pct={(l.mev / l.mrv) * 100} />
                <Marker pct={(l.mavLow / l.mrv) * 100} />
                <Marker pct={(l.mavHigh / l.mrv) * 100} />
              </div>

              <div className="flex justify-between mt-1 text-[11px]">
                <span className={status.cls}>{status.label}</span>
                <span
                  className={
                    plan <= 0
                      ? "text-brand-warm/60"
                      : dn >= plan
                        ? "text-success"
                        : "text-warning"
                  }
                >
                  {plan > 0 && (dn >= plan ? "✓ completo" : `faltan ${remaining}`)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {uncategorized.length > 0 && (
        <p className="mt-4 pt-3 border-t border-brand-cream text-[11px] text-brand-warm">
          Sin músculo asignado (no cuentan al volumen):{" "}
          <span className="text-brand-dark">{uncategorized.join(", ")}</span>
        </p>
      )}
    </div>
  );
}

function Marker({ pct }: { pct: number }) {
  return (
    <div
      className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-brand-warm/45"
      style={{ left: `${pct}%` }}
    />
  );
}
