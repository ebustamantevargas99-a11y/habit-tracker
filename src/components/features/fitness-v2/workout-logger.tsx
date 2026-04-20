"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Timer, Trash2, GripVertical, MoreHorizontal } from "lucide-react";
import ExerciseSelector, { type CatalogExercise } from "./exercise-selector";
import RestTimer from "./rest-timer";
import SetRow, { type WorkoutSet } from "./set-row";
import { oneRMEstimate, setVolume } from "@/lib/fitness/calculations";
import { api } from "@/lib/api-client";

type LoggedExercise = {
  uid: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  restSeconds: number;
  isLowerBody: boolean;
  notes?: string;
};

const DEFAULT_REST: Record<string, number> = {
  compound_lower: 180,
  compound_upper: 120,
  isolation: 75,
  default: 90,
};

let _uidCounter = 0;
const uid = () => `${Date.now()}-${++_uidCounter}`;

export default function WorkoutLogger() {
  const [workoutName, setWorkoutName] = useState(() => {
    const d = new Date();
    const hour = d.getHours();
    if (hour < 11) return "Entreno de mañana";
    if (hour < 17) return "Entreno de tarde";
    return "Entreno de noche";
  });
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(new Date());

  function addExercise(ex: CatalogExercise) {
    const isLower = ["quads", "hamstrings", "glutes", "calves"].includes(ex.muscleGroup);
    const restKey =
      ex.category === "isolation"
        ? "isolation"
        : isLower
          ? "compound_lower"
          : "compound_upper";

    setExercises((prev) => [
      ...prev,
      {
        uid: uid(),
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: [
          {
            id: uid(),
            setNumber: 1,
            weight: 0,
            reps: 0,
            rpe: null,
            completed: false,
          },
        ],
        restSeconds: DEFAULT_REST[restKey] ?? DEFAULT_REST.default,
        isLowerBody: isLower,
      },
    ]);
  }

  function removeExercise(exUid: string) {
    setExercises((prev) => prev.filter((e) => e.uid !== exUid));
  }

  function addSet(exUid: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.uid !== exUid) return e;
        const last = e.sets[e.sets.length - 1];
        const next: WorkoutSet = {
          id: uid(),
          setNumber: e.sets.filter((s) => !s.isWarmup).length + 1,
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
          rpe: null,
          completed: false,
        };
        return { ...e, sets: [...e.sets, next] };
      })
    );
  }

  function patchSet(exUid: string, setId: string, patch: Partial<WorkoutSet>) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.uid !== exUid) return e;
        return {
          ...e,
          sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
        };
      })
    );
  }

  function deleteSet(exUid: string, setId: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.uid !== exUid) return e;
        return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
      })
    );
  }

  function completeSet(exUid: string, setId: string) {
    const ex = exercises.find((e) => e.uid === exUid);
    const set = ex?.sets.find((s) => s.id === setId);
    if (!ex || !set) return;

    const nowCompleted = !set.completed;
    patchSet(exUid, setId, { completed: nowCompleted });

    if (nowCompleted && set.weight > 0 && set.reps > 0) {
      setActiveTimer(ex.restSeconds);
    }
  }

  const totals = useMemo(() => {
    let volume = 0;
    let totalSets = 0;
    let completedSets = 0;
    let topSingle: { weight: number; reps: number; e1RM: number } | null = null;
    for (const ex of exercises) {
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        totalSets++;
        if (s.completed) {
          completedSets++;
          volume += setVolume(s);
          const e1RM = oneRMEstimate(s.weight, s.reps);
          if (!topSingle || e1RM > topSingle.e1RM) {
            topSingle = { weight: s.weight, reps: s.reps, e1RM };
          }
        }
      }
    }
    return { volume, totalSets, completedSets, topSingle };
  }, [exercises]);

  async function finishWorkout() {
    if (exercises.length === 0) {
      toast.error("Agrega al menos un ejercicio");
      return;
    }
    const hasCompletedSet = exercises.some((e) =>
      e.sets.some((s) => s.completed && s.weight > 0 && s.reps > 0)
    );
    if (!hasCompletedSet) {
      toast.error("Completa al menos una serie válida");
      return;
    }

    setSubmitting(true);
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime.getTime()) / 60000));
    const payload = {
      date: new Date().toISOString().split("T")[0],
      name: workoutName.trim() || "Entreno",
      duration: durationMinutes,
      totalVolume: totals.volume,
      prsHit: 0,
      exercises: exercises.map((ex) => ({
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        notes: ex.notes,
        sets: ex.sets
          .filter((s) => s.completed && s.weight > 0 && s.reps > 0)
          .map((s) => ({ weight: s.weight, reps: s.reps, rpe: s.rpe })),
      })),
    };

    try {
      await api.post("/fitness/workouts", payload);
      toast.success("Entreno guardado. +15 XP");
      setExercises([]);
      setActiveTimer(null);
    } catch {
      toast.error("Error guardando el entreno");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-brand-paper rounded-xl border border-brand-cream p-5 flex items-center justify-between gap-4">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="font-display text-xl font-semibold text-brand-dark bg-transparent border-none outline-none focus:ring-0 flex-1"
        />
        <div className="flex gap-3 text-xs text-brand-warm">
          <div className="text-right">
            <p className="font-mono text-sm text-brand-dark font-bold">{totals.completedSets}/{totals.totalSets}</p>
            <p>Series</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-brand-dark font-bold">
              {Math.round(totals.volume)}
            </p>
            <p>Volumen (kg)</p>
          </div>
          {totals.topSingle && (
            <div className="text-right">
              <p className="font-mono text-sm text-accent font-bold">
                {totals.topSingle.e1RM}
              </p>
              <p>e1RM top</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercises */}
      {exercises.length === 0 && (
        <div className="bg-brand-warm-white rounded-xl border-2 border-dashed border-brand-tan p-10 text-center">
          <p className="text-brand-warm text-sm">
            Agrega tu primer ejercicio para empezar a registrar.
          </p>
        </div>
      )}

      {exercises.map((ex) => (
        <div key={ex.uid} className="bg-brand-paper rounded-xl border border-brand-cream p-4">
          <header className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical size={16} className="text-brand-light-tan shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-brand-dark truncate">{ex.exerciseName}</p>
                <p className="text-xs text-brand-warm">
                  {ex.muscleGroup} · descanso {ex.restSeconds}s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTimer(ex.restSeconds)}
                className="p-2 rounded hover:bg-brand-cream text-brand-warm"
                aria-label="Iniciar timer descanso"
              >
                <Timer size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeExercise(ex.uid)}
                className="p-2 rounded hover:bg-danger-light hover:text-danger text-brand-warm"
                aria-label="Eliminar ejercicio"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-[32px_80px_1fr_1fr_1fr_32px_32px] gap-2 px-2 py-1 text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            <div className="text-center">#</div>
            <div className="text-center">Prev</div>
            <div className="text-center">Peso</div>
            <div className="text-center">Reps</div>
            <div className="text-center">RPE</div>
            <div></div>
            <div></div>
          </div>

          <div className="space-y-0.5">
            {ex.sets.map((s) => (
              <SetRow
                key={s.id}
                set={s}
                onChange={(patch) => patchSet(ex.uid, s.id, patch)}
                onComplete={() => completeSet(ex.uid, s.id)}
                onDelete={() => deleteSet(ex.uid, s.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => addSet(ex.uid)}
            className="mt-3 w-full py-2 rounded-button border border-dashed border-brand-tan text-brand-warm hover:bg-brand-cream hover:text-brand-dark text-sm font-medium transition"
          >
            + Añadir serie
          </button>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectorOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-button bg-brand-dark text-brand-cream hover:bg-brand-brown font-semibold text-sm transition"
        >
          <Plus size={16} /> Añadir ejercicio
        </button>

        <button
          type="button"
          onClick={finishWorkout}
          disabled={submitting || exercises.length === 0}
          className="flex-1 py-3 rounded-button bg-accent text-white hover:bg-brand-brown font-semibold text-sm disabled:opacity-40 transition"
        >
          {submitting ? "Guardando…" : "Terminar entreno"}
        </button>
      </div>

      <ExerciseSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onPick={addExercise}
      />

      {activeTimer != null && (
        <RestTimer
          initialSeconds={activeTimer}
          onDismiss={() => setActiveTimer(null)}
          onDone={() => toast.info("¡Descanso terminado!")}
          autoStart
        />
      )}
    </div>
  );
}
