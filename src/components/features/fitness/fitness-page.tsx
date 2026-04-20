'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tabs, ErrorBanner } from '@/components/ui';
import { useAppStore } from '@/stores/app-store';
import { useFitnessStore } from '@/stores/fitness-store';
import {
  EngineExercise, EnginePlanDay, LivePR,
  epley1RM, epleyNRM, computeFractionalVolume, makeDefaultExercises,
  WEEKLY_PLAN_DEFAULT, INITIAL_PRS, INITIAL_TONELAGE,
} from './fitness-engine';
import WorkoutTab from './workout-tab';
import VolumeTab from './volume-tab';
import WeeklyPlanTab from './weekly-plan-tab';
import RecordsTab from './records-tab';
import BodyMetricsTab from './body-metrics-tab';
import WeightTab from './weight-tab';
import StepsTab from './steps-tab';
import FastingTab from './fasting-tab';
import ChallengesTab from './challenges-tab';
import PhotosTab from './photos-tab';
import WorkoutLoggerV2 from '@/components/features/fitness-v2/workout-logger';
import VolumeDashboard from '@/components/features/fitness-v2/volume-dashboard';

const DRAFT_KEY = 'fitness_draft_exercises';

// Mapea nombres de grupo muscular en español (existente) al slug en inglés que usan
// las nuevas calculaciones (VOLUME_LANDMARKS en calculations.ts).
function mapMuscleToEn(muscleEs: string): string {
  const m = muscleEs.toLowerCase();
  if (m.includes('pecho') || m.includes('chest')) return 'chest';
  if (m.includes('espalda') || m.includes('back')) return 'back';
  if (m.includes('hombro') || m.includes('shoulder')) return 'shoulders';
  if (m.includes('bíceps') || m.includes('biceps')) return 'biceps';
  if (m.includes('tríceps') || m.includes('triceps')) return 'triceps';
  if (m.includes('cuád') || m.includes('quad')) return 'quads';
  if (m.includes('isquio') || m.includes('hamstring')) return 'hamstrings';
  if (m.includes('glúteo') || m.includes('glute')) return 'glutes';
  if (m.includes('core') || m.includes('abdom')) return 'core';
  if (m.includes('pantorr') || m.includes('calve')) return 'calves';
  return muscleEs;
}

const TABS = [
  { id: 'nuevo',         label: '🏋️ Nueva Sesión (Pro)' },
  { id: 'volumen-pro',   label: '📊 Volumen Pro'        },
  { id: 'entrenamiento', label: 'Entrenamiento Activo' },
  { id: 'volumen',       label: 'Volumen Muscular'     },
  { id: 'plan',          label: 'Plan Semanal'         },
  { id: 'records',       label: 'Récords Personales'   },
  { id: 'metricas',      label: 'Métricas del Cuerpo'  },
  { id: 'peso',          label: 'Peso'                 },
  { id: 'pasos',         label: 'Pasos'                },
  { id: 'ayuno',         label: 'Ayuno'                },
  { id: 'retos',         label: 'Retos'                },
  { id: 'fotos',         label: 'Fotos de Progreso'    },
];

export default function FitnessPage() {
  const activeTab = useAppStore((s) => s.fitnessTab);
  const setActiveTab = useAppStore((s) => s.setFitnessTab);

  const {
    initialize: initFitness,
    personalRecords,
    workouts,
    weeklyPlan: storedWeeklyPlan,
    weightLog,
    stepsLog,
    isLoaded,
    saveWeeklyPlanDay,
    addWorkout,
    updatePR,
    addBodyMetric,
    addWeight,
    addSteps,
    getTonelageHistory,
    error,
    clearError,
  } = useFitnessStore();

  useEffect(() => { initFitness(); }, [initFitness]);

  // ── Session exercises (draft-persisted) ──────────────────────────────────────
  const [sessionExercises, setSessionExercises] = useState<EngineExercise[]>(() => {
    if (typeof window === 'undefined') return makeDefaultExercises();
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft) as EngineExercise[];
    } catch { /* ignore */ }
    return makeDefaultExercises();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(sessionExercises)); } catch { /* ignore */ }
  }, [sessionExercises]);

  // ── Live PRs ─────────────────────────────────────────────────────────────────
  const [livePRs, setLivePRs] = useState<LivePR[]>(INITIAL_PRS);
  const prsSyncedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || prsSyncedRef.current) return;
    prsSyncedRef.current = true;
    if (personalRecords.length > 0) {
      setLivePRs((prev) =>
        prev.map((pr) => {
          const stored = personalRecords.find((s) => s.exercise === pr.exercise);
          if (!stored) return pr;
          if (stored.oneRM >= pr.oneRM) return { ...pr, ...stored, prevOneRM: stored.oneRM, isNewPR: false };
          return pr;
        })
      );
    }
  }, [isLoaded, personalRecords]);

  // ── Weekly plan ──────────────────────────────────────────────────────────────
  const [weeklyPlan, setWeeklyPlan] = useState<EnginePlanDay[]>(WEEKLY_PLAN_DEFAULT);
  const planSyncedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || planSyncedRef.current || storedWeeklyPlan.length === 0) return;
    planSyncedRef.current = true;
    setWeeklyPlan((prev) =>
      prev.map((day, i) => {
        const stored = (storedWeeklyPlan as unknown as Array<{ _dayOfWeek?: number; exercises: typeof day.exercises }>)
          .find((r) => r._dayOfWeek === i);
        return stored ? { ...day, exercises: stored.exercises } : day;
      })
    );
  }, [isLoaded, storedWeeklyPlan]);

  // ── Tonelage history ─────────────────────────────────────────────────────────
  const tonelageHistory = useMemo(() => {
    const derived = getTonelageHistory();
    return Object.keys(derived).length > 0 ? derived : INITIAL_TONELAGE;
  }, [workouts, getTonelageHistory]);

  // ── Motor 1: fractional volume ───────────────────────────────────────────────
  const sessionVolume = useMemo(() => computeFractionalVolume(sessionExercises), [sessionExercises]);

  // ── Motor 2: auto-1RM ────────────────────────────────────────────────────────
  useEffect(() => {
    setLivePRs((prev) =>
      prev.map((record) => {
        const ex = sessionExercises.find((e) => e.name === record.exercise);
        if (!ex) return record;
        const best = ex.sets.reduce((max, s) => Math.max(max, epley1RM(s.weight, s.reps)), 0);
        if (best > record.oneRM) {
          const updated = {
            ...record, prevOneRM: record.oneRM, oneRM: best,
            fiveRM: epleyNRM(best, 5), tenRM: epleyNRM(best, 10),
            date: new Date().toISOString().split('T')[0], isNewPR: true,
          };
          updatePR({ exercise: updated.exercise, oneRM: updated.oneRM, fiveRM: updated.fiveRM, tenRM: updated.tenRM, date: updated.date }).catch(() => {});
          return updated;
        }
        return record;
      })
    );
  }, [sessionExercises]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Plan change handler ──────────────────────────────────────────────────────
  const handleWeeklyPlanChange = (newPlan: EnginePlanDay[]) => {
    setWeeklyPlan(newPlan);
    newPlan.forEach((day, i) => {
      if (JSON.stringify(weeklyPlan[i]) !== JSON.stringify(day)) saveWeeklyPlanDay(i, day);
    });
  };

  // ── Finish session ───────────────────────────────────────────────────────────
  const [isSavingSession, setIsSavingSession] = useState(false);
  const handleFinishSession = async () => {
    const hasData = sessionExercises.some((ex) => ex.sets.some((s) => s.weight > 0 && s.reps > 0));
    if (!hasData) return;
    setIsSavingSession(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const totalVolume = sessionExercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
      await addWorkout({
        date: today, name: `Sesión ${today}`, duration: 0, totalVolume,
        prsHit: livePRs.filter((pr) => pr.isNewPR).length,
        exercises: sessionExercises.map((ex) => ({
          id: String(ex.id), exerciseName: ex.name, muscleGroup: ex.muscleGroup,
          sets: ex.sets.filter((s) => s.weight > 0 && s.reps > 0).map((s) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe })),
        })),
      });
      if (typeof window !== 'undefined') sessionStorage.removeItem(DRAFT_KEY);
      setSessionExercises(makeDefaultExercises());
    } finally {
      setIsSavingSession(false);
    }
  };

  return (
    <div className="p-6 bg-brand-warm-white min-h-screen">
      <ErrorBanner error={error} onDismiss={clearError} />
      <div className="mb-8">
        <h1 className="font-serif text-[36px] text-brand-dark m-0">Fitness</h1>
        <p className="text-brand-warm text-sm m-0 mt-2">Tu progreso hacia tus objetivos de entrenamiento</p>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab ?? 'entrenamiento'} onChange={(id) => setActiveTab(id as Parameters<typeof setActiveTab>[0])} className="mb-8 flex-wrap border-brand-light-tan" />

      <div>
        {activeTab === 'nuevo' && <WorkoutLoggerV2 />}
        {activeTab === 'volumen-pro' && (
          <VolumeDashboard
            weekSets={workouts
              .filter((w) => {
                const d = new Date(w.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return d >= weekAgo;
              })
              .flatMap((w) =>
                (w.exercises ?? []).flatMap((e) =>
                  (e.sets ?? []).map((s) => ({
                    muscleGroup: mapMuscleToEn(e.muscleGroup ?? ''),
                    reps: s.reps,
                    rpe: s.rpe ?? null,
                  }))
                )
              )}
          />
        )}
        {activeTab === 'entrenamiento' && (
          <WorkoutTab
            exercises={sessionExercises}
            onExercisesChange={setSessionExercises}
            isSaving={isSavingSession}
            onFinish={handleFinishSession}
          />
        )}
        {activeTab === 'volumen'       && <VolumeTab sessionVolume={sessionVolume} />}
        {activeTab === 'plan'          && <WeeklyPlanTab plan={weeklyPlan} onPlanChange={handleWeeklyPlanChange} />}
        {activeTab === 'records'       && <RecordsTab liveRecords={livePRs} tonelageHistory={tonelageHistory} />}
        {activeTab === 'metricas'      && <BodyMetricsTab onSave={addBodyMetric} />}
        {activeTab === 'peso'          && <WeightTab weightLog={weightLog} onAddWeight={addWeight} />}
        {activeTab === 'pasos'         && <StepsTab stepsLog={stepsLog} onAddSteps={addSteps} />}
        {activeTab === 'ayuno'         && <FastingTab />}
        {activeTab === 'retos'         && <ChallengesTab />}
        {activeTab === 'fotos'         && <PhotosTab />}
      </div>
    </div>
  );
}
