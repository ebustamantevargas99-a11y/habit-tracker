"use client";
import { todayLocal } from "@/lib/date/local";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Timer, Trash2, GripVertical, Zap } from "lucide-react";
import ExerciseSelector, { type CatalogExercise } from "./exercise-selector";
import RestTimer from "./rest-timer";
import SetRow, { type WorkoutSet, type SetType } from "./set-row";
import { oneRMEstimate } from "@/lib/fitness/calculations";
import { api } from "@/lib/api-client";
import { useFitnessStore } from "@/stores/fitness-store";
import { resolveExerciseMuscles } from "@/lib/fitness/muscle-volume";

type PreviousBest = { weight: number; reps: number } | null;

// Tipo de carga del ejercicio:
//  - weight: peso externo normal (barra, mancuerna, máquina)
//  - bodyweight: peso corporal (dominadas, fondos) — carga = peso corporal + lastre
//  - isometric: sostén por tiempo (plancha) — "reps" = segundos
export type ExerciseKind = "weight" | "bodyweight" | "assisted" | "isometric";

function normName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Detecta el tipo de carga por nombre/equipo (override manual disponible en UI). */
function detectKind(name: string, equipment?: string): ExerciseKind {
  const n = normName(name);
  if (/(asistid|assisted|asistenc|gravitron|con ayuda)/.test(n)) return "assisted";
  if (/(planch|plank|hollow|wall ?sit|isom|vacuum|sosten|puente isom)/.test(n))
    return "isometric";
  if (
    /(dominad|pull[- ]?up|chin[- ]?up|fondo|dip|flexion|push[- ]?up|lagartija|muscle[- ]?up|pistol)/.test(n)
  )
    return "bodyweight";
  if (equipment && normName(equipment).includes("bodyweight")) return "bodyweight";
  return "weight";
}

// Carga efectiva (kg) que mueve el m\u00fasculo, seg\u00fan el tipo de ejercicio:
//  - weight: el peso externo tal cual.
//  - bodyweight / isometric: peso corporal + lastre (campo = lastre, 0 = puro).
//  - assisted: peso corporal \u2212 ayuda (campo = ayuda de la m\u00e1quina).
function effectiveLoad(kind: ExerciseKind, field: number, bw: number): number {
  if (kind === "assisted") return Math.max(0, Math.round((bw - field) * 2) / 2);
  if (kind === "bodyweight" || kind === "isometric")
    return Math.round((bw + field) * 2) / 2;
  return field;
}

// Inverso: dado un efectivo (del hist\u00f3rico), el valor a mostrar en el campo.
function fieldFromEffective(kind: ExerciseKind, effective: number, bw: number): number {
  if (kind === "assisted") return Math.max(0, Math.round((bw - effective) * 2) / 2);
  if (kind === "bodyweight" || kind === "isometric")
    return Math.max(0, Math.round((effective - bw) * 2) / 2);
  return effective;
}

type LoggedExercise = {
  uid: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  kind: ExerciseKind;
  sets: WorkoutSet[];
  restSeconds: number;
  isLowerBody: boolean;
  notes?: string;
  /** Mejor set previo (para mostrar como ref en cada SetRow) */
  previousBest: PreviousBest;
  /** Sugerencia de smart progression calculada al agregar o bajo demanda */
  suggestion?: {
    weight: number;
    reps: number;
    reason: string;
    confidence: number;
    plateau: boolean;
    needsDeload: boolean;
  };
};

const DEFAULT_REST: Record<string, number> = {
  compound_lower: 180,
  compound_upper: 120,
  isolation: 75,
  default: 90,
};

let _uidCounter = 0;
const uid = () => `${Date.now()}-${++_uidCounter}`;

// ─── API contract types ──────────────────────────────────────────────────────
type ProgressionResponse = {
  exercise: { id: string; name: string };
  historyCount: number;
  estimated1RM: number | null;
  suggestion: {
    suggestedWeight: number;
    suggestedReps: number;
    reason: string;
    confidence: number;
    plateauDetected: boolean;
    needsDeload: boolean;
  };
};

type DetectedPR = {
  exerciseId: string;
  exerciseName: string;
  oldOneRM: number | null;
  newOneRM: number;
  delta: number;
};

type WorkoutCreateResponse = {
  id: string;
  detectedPRs?: DetectedPR[];
};

type ExerciseHistoryRow = {
  date: string;
  exercises: Array<{
    exerciseName: string;
    sets: Array<{ weight: number; reps: number; isWarmup?: boolean }>;
  }>;
};

// Dada la respuesta /fitness/workouts, encuentra el mejor set del ejercicio dado.
function findPreviousBest(
  workouts: ExerciseHistoryRow[],
  exerciseName: string,
): PreviousBest {
  let best: { weight: number; reps: number } | null = null;
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (e.exerciseName !== exerciseName) continue;
      for (const s of e.sets) {
        if (s.isWarmup) continue;
        if (!best || s.weight * s.reps > best.weight * best.reps) {
          best = { weight: s.weight, reps: s.reps };
        }
      }
    }
  }
  return best;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DRAFT_KEY = "ut-fitness-v2-draft";
const BW_KEY = "ut-fitness-bodyweight";

interface Draft {
  name: string;
  exercises: LoggedExercise[];
  startedAt: string;
}

function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!Array.isArray(d.exercises)) return null;
    return d;
  } catch {
    return null;
  }
}

export default function WorkoutLogger() {
  // Draft persistente: si recargas, vuelves a casa o se reinicia el dev
  // server, los sets ya registrados sobreviven hasta que guardes o cierres.
  const initialDraft = useRef<Draft | null>(loadDraft());

  const [workoutName, setWorkoutName] = useState(() => {
    if (initialDraft.current?.name) return initialDraft.current.name;
    const d = new Date();
    const hour = d.getHours();
    if (hour < 11) return "Entreno de mañana";
    if (hour < 17) return "Entreno de tarde";
    return "Entreno de noche";
  });
  const [exercises, setExercises] = useState<LoggedExercise[]>(() =>
    // Reclasifica drafts antiguos (sin `kind`) por nombre.
    (initialDraft.current?.exercises ?? []).map((e) => ({
      ...e,
      kind: e.kind ?? detectKind(e.exerciseName),
    })),
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(() =>
    initialDraft.current?.startedAt ? new Date(initialDraft.current.startedAt) : new Date(),
  );

  // ── Semilla desde la rutina ("Empezar sesión" en Resumen) ──────────────────
  const sessionSeed = useFitnessStore((s) => s.sessionSeed);
  const setSessionSeed = useFitnessStore((s) => s.setSessionSeed);
  const weightLog = useFitnessStore((s) => s.weightLog);
  const latestLoggedBw = useMemo(() => {
    const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[sorted.length - 1]?.weight ?? 0;
  }, [weightLog]);
  // Peso corporal para la matemática de calistenia. Override manual (localStorage)
  // o, si no hay, el último peso registrado en Cuerpo → Peso.
  const [bodyweight, setBodyweightState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const o = window.localStorage.getItem(BW_KEY);
        if (o) return parseFloat(o) || 0;
      } catch {
        /* ignore */
      }
    }
    return 0;
  });
  useEffect(() => {
    setBodyweightState((cur) => (cur === 0 && latestLoggedBw > 0 ? latestLoggedBw : cur));
  }, [latestLoggedBw]);
  const setBodyweight = (v: number) => {
    setBodyweightState(v);
    try {
      window.localStorage.setItem(BW_KEY, String(v));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!sessionSeed) return;
    let cancelled = false;
    (async () => {
      // Mejor set previo por ejercicio → referencia de carga (overload).
      const history = await api
        .get<ExerciseHistoryRow[]>("/fitness/workouts?limit=20")
        .catch(() => [] as ExerciseHistoryRow[]);
      if (cancelled) return;
      const built: LoggedExercise[] = sessionSeed.exercises.map((se) => {
        const prevBest = findPreviousBest(history, se.name);
        const slug = resolveExerciseMuscles(se.name)?.primary ?? "";
        const isLower = ["quads", "hamstrings", "glutes", "calves"].includes(slug);
        const restKey = isLower ? "compound_lower" : "compound_upper";
        const count = Math.max(1, Math.min(20, Math.round(se.sets) || 1));
        const kind = detectKind(se.name);
        // El campo guarda el "extra": lastre (peso corporal), ayuda (asistido)
        // o el peso (normal). Desde el histórico (efectivo) lo convertimos.
        const baseWeight = prevBest
          ? fieldFromEffective(kind, prevBest.weight, bodyweight)
          : kind === "assisted"
            ? Math.round(bodyweight * 0.4)
            : 0;
        const baseReps =
          prevBest?.reps ?? (kind === "isometric" ? 30 : se.repMin);
        return {
          uid: uid(),
          exerciseId: "",
          exerciseName: se.name,
          muscleGroup: slug || "—",
          kind,
          sets: Array.from({ length: count }, (_, i) => ({
            id: uid(),
            setNumber: i + 1,
            weight: baseWeight,
            reps: baseReps,
            rpe: null,
            completed: false,
            setType: "straight" as SetType,
          })),
          restSeconds: DEFAULT_REST[restKey] ?? DEFAULT_REST.default,
          isLowerBody: isLower,
          previousBest: prevBest,
        };
      });
      setExercises(built);
      setWorkoutName(sessionSeed.name);
      setSessionSeed(null); // consumida
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionSeed, setSessionSeed, bodyweight]);

  // Autosave del draft tras cada cambio relevante.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (exercises.length === 0) {
      // Sin ejercicios → no persistimos basura.
      window.localStorage.removeItem(DRAFT_KEY);
      return;
    }
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          name: workoutName,
          exercises,
          startedAt: startTime.toISOString(),
        } satisfies Draft),
      );
    } catch {
      /* sin localStorage o quota llena: el draft no persiste, no es crítico */
    }
  }, [workoutName, exercises, startTime]);

  // Aviso si intentas cerrar/recargar con un draft sin guardar.
  useEffect(() => {
    if (exercises.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [exercises.length]);

  async function addExercise(ex: CatalogExercise) {
    const isLower = ["quads", "hamstrings", "glutes", "calves"].includes(ex.muscleGroup);
    const restKey =
      ex.category === "isolation"
        ? "isolation"
        : isLower
          ? "compound_lower"
          : "compound_upper";

    // Fetch previous best + suggestion en paralelo, sin bloquear el UI.
    const [prevBest, suggestion] = await Promise.all([
      api
        .get<ExerciseHistoryRow[]>(`/fitness/workouts?limit=20`)
        .then((list) => findPreviousBest(list, ex.name))
        .catch(() => null),
      api
        .get<ProgressionResponse>(
          `/fitness/progression/suggest?exerciseId=${encodeURIComponent(ex.id)}&repMin=5&repMax=8&targetRpe=8`,
        )
        .catch(() => null),
    ]);

    const kind = detectKind(ex.name, ex.equipment);
    const effPrev = suggestion?.suggestion.suggestedWeight ?? prevBest?.weight ?? 0;
    // El campo guarda el "extra" (lastre / ayuda / peso). Convertimos desde el
    // histórico (efectivo) o partimos de 0 (puro) / ~40% PC de ayuda (asistido).
    const initialWeight =
      effPrev > 0
        ? fieldFromEffective(kind, effPrev, bodyweight)
        : kind === "assisted"
          ? Math.round(bodyweight * 0.4)
          : 0;
    let initialReps = suggestion?.suggestion.suggestedReps ?? prevBest?.reps ?? 0;
    if (kind === "isometric" && !initialReps) initialReps = 30; // segundos default

    setExercises((prev) => [
      ...prev,
      {
        uid: uid(),
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        kind,
        sets: [
          {
            id: uid(),
            setNumber: 1,
            weight: initialWeight,
            reps: initialReps,
            rpe: null,
            completed: false,
            setType: "straight",
          },
        ],
        restSeconds: DEFAULT_REST[restKey] ?? DEFAULT_REST.default,
        isLowerBody: isLower,
        previousBest: prevBest,
        suggestion: suggestion
          ? {
              weight: suggestion.suggestion.suggestedWeight,
              reps: suggestion.suggestion.suggestedReps,
              reason: suggestion.suggestion.reason,
              confidence: suggestion.suggestion.confidence,
              plateau: suggestion.suggestion.plateauDetected,
              needsDeload: suggestion.suggestion.needsDeload,
            }
          : undefined,
      },
    ]);
  }

  function setExerciseKind(exUid: string, kind: ExerciseKind) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.uid !== exUid || e.kind === kind) return e;
        // El campo cambia de significado (peso/lastre/ayuda) → resetea al
        // default del nuevo tipo: 0 (puro/lastre) o ~40% PC de ayuda.
        const def = kind === "assisted" ? Math.round(bodyweight * 0.4) : 0;
        const sets = e.sets.map((s) => ({ ...s, weight: def }));
        return { ...e, kind, sets };
      }),
    );
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
          setType: "straight",
        };
        return { ...e, sets: [...e.sets, next] };
      }),
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
      }),
    );
  }

  function deleteSet(exUid: string, setId: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.uid !== exUid) return e;
        return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
      }),
    );
  }

  function completeSet(exUid: string, setId: string) {
    const ex = exercises.find((e) => e.uid === exUid);
    const set = ex?.sets.find((s) => s.id === setId);
    if (!ex || !set) return;

    const nowCompleted = !set.completed;
    patchSet(exUid, setId, { completed: nowCompleted });

    // Solo timer para sets que cuentan (no warmups)
    const isCountingSet = !set.isWarmup && set.setType !== "warmup";
    if (nowCompleted && isCountingSet && set.weight > 0 && set.reps > 0) {
      setActiveTimer(ex.restSeconds);
    }
  }

  async function refetchSuggestion(exUid: string) {
    const ex = exercises.find((e) => e.uid === exUid);
    if (!ex) return;
    try {
      const r = await api.get<ProgressionResponse>(
        `/fitness/progression/suggest?exerciseId=${encodeURIComponent(ex.exerciseId)}&repMin=5&repMax=8&targetRpe=8`,
      );
      const sug = r.suggestion;
      setExercises((prev) =>
        prev.map((e) =>
          e.uid !== exUid
            ? e
            : {
                ...e,
                suggestion: {
                  weight: sug.suggestedWeight,
                  reps: sug.suggestedReps,
                  reason: sug.reason,
                  confidence: sug.confidence,
                  plateau: sug.plateauDetected,
                  needsDeload: sug.needsDeload,
                },
                sets: e.sets.map((s, i) =>
                  i === 0 && !s.completed
                    ? { ...s, weight: sug.suggestedWeight, reps: sug.suggestedReps }
                    : s,
                ),
              },
        ),
      );
      if (sug.needsDeload) {
        toast.warning(`Deload sugerido para ${ex.exerciseName}`, {
          description: sug.reason,
        });
      } else {
        toast.success(`${ex.exerciseName}: ${sug.suggestedWeight} kg × ${sug.suggestedReps}`, {
          description: sug.reason,
        });
      }
    } catch {
      toast.error("No se pudo calcular sugerencia");
    }
  }

  const totals = useMemo(() => {
    let volume = 0;
    let totalSets = 0;
    let completedSets = 0;
    let topSingle: { weight: number; reps: number; e1RM: number } | null = null;
    for (const ex of exercises) {
      const iso = ex.kind === "isometric";
      for (const s of ex.sets) {
        if (s.isWarmup || s.setType === "warmup") continue;
        totalSets++;
        if (s.completed) {
          completedSets++;
          // Isométricos guardan segundos en reps → no suman a volumen/e1RM.
          if (iso) continue;
          const eff = effectiveLoad(ex.kind, s.weight, bodyweight);
          volume += eff * s.reps;
          const e1RM = oneRMEstimate(eff, s.reps);
          if (!topSingle || e1RM > topSingle.e1RM) {
            topSingle = { weight: eff, reps: s.reps, e1RM };
          }
        }
      }
    }
    return { volume, totalSets, completedSets, topSingle };
  }, [exercises, bodyweight]);

  async function finishWorkout() {
    if (exercises.length === 0) {
      toast.error("Agrega al menos un ejercicio");
      return;
    }
    // reps > 0 basta (el peso puede ser 0 en peso corporal puro; en
    // isométricos "reps" son segundos).
    const hasCompletedSet = exercises.some((e) =>
      e.sets.some((s) => s.completed && s.reps > 0),
    );
    if (!hasCompletedSet) {
      toast.error("Completa al menos una serie válida");
      return;
    }

    setSubmitting(true);
    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - startTime.getTime()) / 60000),
    );
    const payload = {
      date: todayLocal(),
      name: workoutName.trim() || "Entreno",
      duration: durationMinutes,
      totalVolume: totals.volume,
      exercises: exercises.map((ex) => ({
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        notes: ex.notes,
        sets: ex.sets
          .filter((s) => s.completed && s.reps > 0)
          .map((s) => ({
            // Guardamos la carga EFECTIVA (peso corporal ± lastre/ayuda) para
            // que volumen, e1RM y PRs sean correctos.
            weight: effectiveLoad(ex.kind, s.weight, bodyweight),
            reps: s.reps,
            rpe: s.rpe,
            tempo: s.tempo ?? null,
            setType:
              s.isWarmup || s.setType === "warmup"
                ? "warmup"
                : ex.kind === "isometric"
                  ? "isometric"
                  : ex.kind === "bodyweight"
                    ? "bodyweight"
                    : ex.kind === "assisted"
                      ? "assisted"
                      : s.setType ?? "straight",
            groupId: s.groupId ?? null,
            isWarmup: s.isWarmup ?? s.setType === "warmup",
          })),
      })),
    };

    try {
      const res = await api.post<WorkoutCreateResponse>("/fitness/workouts", payload);
      const prs = res.detectedPRs ?? [];
      if (prs.length > 0) {
        // Celebración con confetti (cargado lazy) — uno por cada PR
        const { fireConfettiPR } = await import("@/lib/celebrations/confetti");
        for (const pr of prs) {
          fireConfettiPR();
          const deltaStr =
            pr.oldOneRM != null
              ? ` (+${pr.delta.toFixed(1)} kg)`
              : "";
          toast.success(
            `🏆 Nuevo PR: ${pr.exerciseName} ${pr.newOneRM.toFixed(1)} kg (e1RM)${deltaStr}`,
            { duration: 7000 },
          );
        }
      } else {
        toast.success("Entreno guardado. +15 XP");
      }
      setExercises([]);
      setActiveTimer(null);
      // Guardado OK → limpiar draft persistente.
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
      }
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
            <p className="font-mono text-sm text-brand-dark font-bold">
              {totals.completedSets}/{totals.totalSets}
            </p>
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

      {/* Peso corporal — base para dominadas, fondos, asistidas y planchas */}
      <div className="flex items-center gap-2 px-1 text-xs text-brand-warm flex-wrap">
        <span>Peso corporal:</span>
        <input
          type="number"
          step="0.5"
          value={bodyweight || ""}
          onChange={(e) => setBodyweight(parseFloat(e.target.value) || 0)}
          placeholder="kg"
          className="w-20 px-2 py-1 rounded border border-brand-cream text-center text-brand-dark bg-brand-paper focus:outline-none focus:border-accent"
        />
        <span className="text-brand-warm/80">
          kg — se usa para calcular la carga de peso corporal, asistidas y planchas.
        </span>
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
        <div
          key={ex.uid}
          className="bg-brand-paper rounded-xl border border-brand-cream p-4"
        >
          <header className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical size={16} className="text-brand-light-tan shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-brand-dark truncate">
                  {ex.exerciseName}
                </p>
                <p className="text-xs text-brand-warm">
                  {ex.muscleGroup} · descanso {ex.restSeconds}s
                </p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {(
                    [
                      ["weight", "Peso"],
                      ["bodyweight", "P. corporal"],
                      ["assisted", "Asistida"],
                      ["isometric", "Tiempo"],
                    ] as [ExerciseKind, string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setExerciseKind(ex.uid, k)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                        ex.kind === k
                          ? "bg-accent text-white border-accent font-semibold"
                          : "border-brand-cream text-brand-warm hover:text-brand-dark"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {ex.kind !== "weight" && (
                  <p className="text-[10px] text-brand-warm mt-1 leading-snug">
                    {ex.kind === "bodyweight"
                      ? `Carga = peso corporal (${bodyweight || "?"} kg) + lastre. Progresa con +reps o +lastre.`
                      : ex.kind === "assisted"
                        ? `Asistida = peso corporal (${bodyweight || "?"} kg) − ayuda. Progresa bajando la ayuda hasta 0.`
                        : "Sostén por tiempo (segundos). Progresa con +seg o +lastre."}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => refetchSuggestion(ex.uid)}
                className="p-2 rounded hover:bg-accent/10 text-accent flex items-center gap-1"
                aria-label="Sugerir peso inteligente"
                title="Sugerencia basada en tu histórico + RPE"
              >
                <Zap size={16} />
                <span className="text-xs font-semibold hidden sm:inline">
                  Sugerir
                </span>
              </button>
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

          {/* Suggestion banner */}
          {ex.suggestion && (
            <div
              className={`mb-3 px-3 py-2 rounded-md text-xs border ${
                ex.suggestion.needsDeload
                  ? "bg-warning-light/40 border-warning text-warning"
                  : ex.suggestion.plateau
                    ? "bg-info-light/40 border-info text-info"
                    : "bg-success-light/30 border-success/50 text-brand-dark"
              }`}
            >
              <p className="m-0">
                <strong>
                  {ex.suggestion.weight} kg × {ex.suggestion.reps}
                </strong>{" "}
                · {ex.suggestion.reason}
              </p>
            </div>
          )}

          <div className="grid grid-cols-[28px_64px_1fr_1fr_1fr_28px_28px_28px] gap-1.5 px-2 py-1 text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            <div className="text-center">#</div>
            <div className="text-center">Ant.</div>
            <div className="text-center">
              {ex.kind === "bodyweight" || ex.kind === "isometric"
                ? "Lastre"
                : ex.kind === "assisted"
                  ? "Ayuda"
                  : "Peso"}
            </div>
            <div className="text-center">{ex.kind === "isometric" ? "Seg" : "Reps"}</div>
            <div className="text-center">RPE</div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <div className="space-y-0.5">
            {ex.sets.map((s) => (
              <SetRow
                key={s.id}
                kind={ex.kind}
                set={s}
                previousBest={ex.previousBest}
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
