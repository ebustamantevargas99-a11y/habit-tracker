"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs } from "@/components/ui";
import { useFitnessStore } from "@/stores/fitness-store";
import {
  EngineExercise,
  LivePR,
  epley1RM,
  epleyNRM,
  computeFractionalVolume,
  makeDefaultExercises,
  INITIAL_PRS,
} from "../fitness-engine";
import WorkoutTab from "../workout-tab";
import VolumeTab from "../volume-tab";
import RecordsTab from "../records-tab";
import WorkoutLoggerV2 from "@/components/features/fitness-v2/workout-logger";
import VolumeDashboard from "@/components/features/fitness-v2/volume-dashboard";

const DRAFT_KEY = "fitness_draft_exercises";

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

const GYM_SUBTABS = [
  { id: "hoy",        label: "🏋️ Hoy (sesión activa)" },
  { id: "volumen",    label: "📊 Volumen MEV/MAV/MRV" },
  { id: "records",    label: "🏆 Récords" },
  { id: "historial",  label: "📜 Historial" },
];

export default function GymHub() {
  const [subTab, setSubTab] = useState<string>("hoy");

  const {
    personalRecords,
    workouts,
    addWorkout,
    updatePR,
    getTonelageHistory,
  } = useFitnessStore();

  // ── Session exercises (draft persisted) ────────────────────────────────────
  const [sessionExercises, setSessionExercises] = useState<EngineExercise[]>(() => {
    if (typeof window === "undefined") return makeDefaultExercises();
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft) as EngineExercise[];
    } catch {
      /* ignore */
    }
    return makeDefaultExercises();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(sessionExercises));
    } catch {
      /* ignore */
    }
  }, [sessionExercises]);

  // ── Live PRs (merge de store persistidos con el seed inicial) ──────────────
  const [livePRs, setLivePRs] = useState<LivePR[]>(INITIAL_PRS);
  const prsSyncedRef = useRef(false);
  useEffect(() => {
    if (prsSyncedRef.current) return;
    prsSyncedRef.current = true;
    if (personalRecords.length > 0) {
      setLivePRs((prev) =>
        prev.map((pr) => {
          const stored = personalRecords.find((s) => s.exercise === pr.exercise);
          if (!stored) return pr;
          if (stored.oneRM >= pr.oneRM) {
            return { ...pr, ...stored, prevOneRM: stored.oneRM, isNewPR: false };
          }
          return pr;
        }),
      );
    }
  }, [personalRecords]);

  // ── Fractional session volume (motor 1) ────────────────────────────────────
  const sessionVolume = useMemo(
    () => computeFractionalVolume(sessionExercises),
    [sessionExercises],
  );

  // ── Auto-1RM detection (motor 2) ───────────────────────────────────────────
  useEffect(() => {
    setLivePRs((prev) =>
      prev.map((record) => {
        const ex = sessionExercises.find((e) => e.name === record.exercise);
        if (!ex) return record;
        const best = ex.sets.reduce(
          (max, s) => Math.max(max, epley1RM(s.weight, s.reps)),
          0,
        );
        if (best > record.oneRM) {
          const updated: LivePR = {
            ...record,
            prevOneRM: record.oneRM,
            oneRM: best,
            fiveRM: epleyNRM(best, 5),
            tenRM: epleyNRM(best, 10),
            date: new Date().toISOString().split("T")[0],
            isNewPR: true,
          };
          updatePR({
            exercise: updated.exercise,
            oneRM: updated.oneRM,
            fiveRM: updated.fiveRM,
            tenRM: updated.tenRM,
            date: updated.date,
          }).catch(() => {});
          return updated;
        }
        return record;
      }),
    );
  }, [sessionExercises]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tonelage history (real, del store — mock removido) ─────────────────────
  const tonelageHistory = useMemo(() => {
    const derived = getTonelageHistory();
    return derived;
  }, [workouts, getTonelageHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Finish session ─────────────────────────────────────────────────────────
  const [isSavingSession, setIsSavingSession] = useState(false);
  const handleFinishSession = async () => {
    const hasData = sessionExercises.some((ex) =>
      ex.sets.some((s) => s.weight > 0 && s.reps > 0),
    );
    if (!hasData) return;
    setIsSavingSession(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const totalVolume = sessionExercises.reduce(
        (sum, ex) =>
          sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
        0,
      );
      await addWorkout({
        date: today,
        name: `Sesión ${today}`,
        duration: 0,
        totalVolume,
        prsHit: livePRs.filter((pr) => pr.isNewPR).length,
        exercises: sessionExercises.map((ex) => ({
          id: String(ex.id),
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: ex.sets
            .filter((s) => s.weight > 0 && s.reps > 0)
            .map((s) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe })),
        })),
      });
      if (typeof window !== "undefined") sessionStorage.removeItem(DRAFT_KEY);
      setSessionExercises(makeDefaultExercises());
    } finally {
      setIsSavingSession(false);
    }
  };

  // Weekly sets para VolumeDashboard v2 (preserva la vista existente del v2)
  const weekSetsForV2 = useMemo(() => {
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
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Gym</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Entrenamiento de fuerza e hipertrofia — sesión, volumen semanal, PRs
          e historial.
        </p>
      </header>

      <Tabs
        tabs={GYM_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "hoy" && (
        <div className="flex flex-col gap-6">
          {/* Nuevo logger pro v2 — interfaz principal */}
          <WorkoutLoggerV2 />

          {/* Logger clásico, útil como rápido sketch + control de sesión */}
          <div className="mt-2">
            <h3 className="font-serif text-base text-brand-dark m-0 mb-3">
              Logger clásico (draft en vivo)
            </h3>
            <WorkoutTab
              exercises={sessionExercises}
              onExercisesChange={setSessionExercises}
              isSaving={isSavingSession}
              onFinish={handleFinishSession}
            />
          </div>
        </div>
      )}

      {subTab === "volumen" && (
        <div className="flex flex-col gap-6">
          <VolumeTab sessionVolume={sessionVolume} />
          <div>
            <h3 className="font-serif text-base text-brand-dark m-0 mb-3">
              Effective sets últimos 7 días (Pro)
            </h3>
            <VolumeDashboard weekSets={weekSetsForV2} />
          </div>
        </div>
      )}

      {subTab === "records" && (
        <RecordsTab
          liveRecords={livePRs}
          tonelageHistory={tonelageHistory}
        />
      )}

      {subTab === "historial" && (
        <WorkoutHistorial workouts={workouts} />
      )}
    </section>
  );
}

// ─── Historial (Fase 1 visual mínimo — se expande en Fase 3) ────────────────

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
                <h4 className="font-serif text-base text-brand-dark m-0">
                  {w.name}
                </h4>
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
