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
  normExerciseName,
  type MuscleContribution,
} from "@/lib/fitness/muscle-volume";
// MUSCLE_ORDER se usa en MesocyclePanel (suggestions); DISPLAY_SECTIONS maneja el render principal
import {
  mesocycleWeek,
  suggestProgression,
  weeklyVolumeHistory,
  type ProgressionSuggestion,
  type WeekVolumePoint,
} from "@/lib/fitness/mesocycle";
import {
  isDeloadActive,
  setDeloadActive,
  deloadTarget,
  DELOAD_LOAD_REDUCTION_PCT,
} from "@/lib/fitness/deload";

interface ScheduleDay {
  dayOfWeek: number;
  templateName: string;
  exercises: { name: string; sets: number; repRange: [number, number] }[];
}
interface Program {
  id: string;
  name: string;
  active: boolean;
  startDate: string;
  durationWeeks: number;
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

// Agrupación visual de los músculos finos — header opcional + slugs del grupo
const DISPLAY_SECTIONS: { header?: string; slugs: string[] }[] = [
  { slugs: ["chest"] },
  { header: "Espalda", slugs: ["lats", "traps", "lower_back"] },
  { header: "Hombros", slugs: ["delt_ant", "delt_lat", "delt_post"] },
  { slugs: ["biceps", "triceps"] },
  { header: "Piernas", slugs: ["quads", "hamstrings", "glutes"] },
  { slugs: ["core", "calves"] },
];

const PLAN_COLOR = "#C0DD97"; // verde claro = planificado
const DONE_COLOR = "#639922"; // verde fuerte = hecho
const DELOAD_PLAN_COLOR = "#FAC775"; // ámbar claro = objetivo de descarga
const DELOAD_DONE_COLOR = "#BA7517"; // ámbar fuerte = hecho en descarga

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
  const [deload, setDeload] = useState(false);
  // Fase D: mapeos custom usuario → contribuciones fraccionales
  const [customMap, setCustomMap] = useState<Record<string, MuscleContribution[]>>({});
  const [mapTarget, setMapTarget] = useState<string | null>(null);

  useEffect(() => {
    setDeload(isDeloadActive());
    let cancelled = false;

    Promise.all([
      api.get<Program[]>("/fitness/programs"),
      api.get<{ exerciseName: string; contributions: MuscleContribution[] }[]>(
        "/fitness/exercise-mappings",
      ),
    ])
      .then(([programs, mappings]) => {
        if (cancelled) return;
        setProgram(programs.find((p) => p.active) ?? null);
        const m: Record<string, MuscleContribution[]> = {};
        for (const mapping of mappings) m[mapping.exerciseName] = mapping.contributions;
        setCustomMap(m);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDeload = () => {
    const next = !deload;
    setDeloadActive(next);
    setDeload(next);
  };

  const planned = useMemo(
    () => plannedVolumeByMuscle(program?.schedule ?? [], customMap),
    [program, customMap],
  );
  const done = useMemo(
    () => doneVolumeByMuscle(workouts, shiftDaysLocal(-6), customMap),
    [workouts, customMap],
  );

  const uncategorized = useMemo(
    () => Array.from(new Set([...planned.uncategorized, ...done.uncategorized])),
    [planned, done],
  );

  // ── Mesociclo (Fase 2) ──────────────────────────────────────────────────────
  const week = program ? mesocycleWeek(program.startDate) : null;
  const weeklyTrend = useMemo(() => weeklyVolumeHistory(workouts, 6), [workouts]);
  const suggestions = useMemo(() => {
    if (!week) return [] as ProgressionSuggestion[];
    const order: Record<string, number> = { raise_to_mev: 0, deload: 1, add_set: 2, hold: 3 };
    return MUSCLE_ORDER.map((slug) => suggestProgression(slug, planned.byMuscle[slug] ?? 0, week))
      .filter((s): s is ProgressionSuggestion => s != null && s.action !== "hold")
      .sort((a, b) => order[a.action] - order[b.action]);
  }, [planned, week]);
  const mesoComplete = program != null && week != null && week > program.durationWeeks;
  // Aviso automático de descarga: bloque completo o algún músculo en MRV.
  const suggestDeload = !deload && (mesoComplete || suggestions.some((s) => s.action === "deload"));

  const planColor = deload ? DELOAD_PLAN_COLOR : PLAN_COLOR;
  const doneColor = deload ? DELOAD_DONE_COLOR : DONE_COLOR;

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
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: doneColor }} />
            Hecho esta semana
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: planColor }} />
            {deload ? "Objetivo descarga" : "Plan de tu rutina"}
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

      <MesocyclePanel
        week={week}
        durationWeeks={program?.durationWeeks ?? null}
        mesoComplete={mesoComplete}
        trend={weeklyTrend}
        suggestions={suggestions}
        deload={deload}
        suggestDeload={suggestDeload}
        onToggleDeload={toggleDeload}
      />

      <div className="space-y-5">
        {DISPLAY_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.header && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-warm/50 mb-2.5 mt-0.5">
                {section.header}
              </p>
            )}
            <div className="space-y-3.5">
              {section.slugs.map((slug) => {
                const l = VOLUME_LANDMARKS[slug];
                if (!l) return null;
                const plan = planned.byMuscle[slug] ?? 0;
                const target = deload ? deloadTarget(plan) : plan;
                const dn = done.byMuscle[slug] ?? 0;
                const targetR = roundHalf(target);
                const doneR = roundHalf(dn);
                const status = deload
                  ? { label: "objetivo descarga", cls: "text-warning" }
                  : planStatus(slug, plan);
                const remaining = roundHalf(Math.max(0, target - dn));
                const pct = (v: number) => Math.min(100, (v / l.mrv) * 100);

                return (
                  <div key={slug}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-sm font-semibold text-brand-dark">
                        {MUSCLE_LABEL_ES[slug]}
                      </span>
                      <span className="text-[13px] text-brand-warm">
                        <b className="text-brand-dark font-semibold">{doneR}</b> / {targetR} series
                      </span>
                    </div>

                    <div className="relative h-[18px] bg-brand-light-cream rounded-md overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full"
                        style={{ width: `${pct(target)}%`, background: planColor }}
                      />
                      <div
                        className="absolute left-0 top-0 h-full"
                        style={{ width: `${pct(dn)}%`, background: doneColor }}
                      />
                      <Marker pct={(l.mev / l.mrv) * 100} />
                      <Marker pct={(l.mavLow / l.mrv) * 100} />
                      <Marker pct={(l.mavHigh / l.mrv) * 100} />
                    </div>

                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className={status.cls}>{status.label}</span>
                      <span
                        className={
                          target <= 0
                            ? "text-brand-warm/60"
                            : dn >= target
                              ? "text-success"
                              : "text-warning"
                        }
                      >
                        {target > 0 && (dn >= target ? "✓ completo" : `faltan ${remaining}`)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {uncategorized.length > 0 && (
        <div className="mt-4 pt-3 border-t border-brand-cream">
          <p className="text-[11px] text-brand-warm mb-2">
            Sin músculo asignado — no cuentan al volumen:
          </p>
          <div className="flex flex-wrap gap-2">
            {uncategorized.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setMapTarget(name)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-brand-light-tan hover:border-accent hover:text-accent text-brand-warm transition"
              >
                {name}{" "}
                <span className="opacity-50 text-[10px]">+ definir</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mapTarget && (
        <MuscleContributionModal
          exerciseName={mapTarget}
          existing={customMap[normExerciseName(mapTarget)]}
          onSave={(contributions) => {
            const key = normExerciseName(mapTarget);
            setCustomMap((prev) => ({ ...prev, [key]: contributions }));
            api
              .put("/fitness/exercise-mappings", { exerciseName: mapTarget, contributions })
              .catch(() => {});
            setMapTarget(null);
          }}
          onClose={() => setMapTarget(null)}
        />
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

// ─── Mesociclo + descarga (Fase 2/3) ──────────────────────────────────────────

function MesocyclePanel({
  week,
  durationWeeks,
  mesoComplete,
  trend,
  suggestions,
  deload,
  suggestDeload,
  onToggleDeload,
}: {
  week: number | null;
  durationWeeks: number | null;
  mesoComplete: boolean;
  trend: WeekVolumePoint[];
  suggestions: ProgressionSuggestion[];
  deload: boolean;
  suggestDeload: boolean;
  onToggleDeload: () => void;
}) {
  const hasTrend = trend.some((t) => t.totalSets > 0);
  if (week == null && !hasTrend) return null;

  return (
    <div className="mb-5 rounded-xl border border-brand-light-tan bg-brand-warm-white p-4">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h4 className="font-serif text-base text-brand-dark m-0">
          Mesociclo · progresión
        </h4>
        <div className="flex items-center gap-2">
          {week != null && (
            <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold">
              Semana {week}
              {durationWeeks ? ` de ${durationWeeks}` : ""}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleDeload}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition ${
              deload
                ? "bg-warning-light/70 border-warning/50 text-brand-dark"
                : "border-brand-light-tan text-brand-warm hover:text-brand-dark hover:border-brand-warm"
            }`}
          >
            {deload ? "Salir de descarga" : "Descarga"}
          </button>
        </div>
      </div>

      {/* Estado de descarga (Fase 3) */}
      {deload ? (
        <div className="mb-3 rounded-lg border border-warning/40 bg-warning-light/40 px-3 py-2 text-xs text-brand-dark">
          <strong>Semana de descarga activa.</strong> Objetivos al ~50% del
          volumen y ~{DELOAD_LOAD_REDUCTION_PCT}% menos carga. Deja 2–3 reps en
          reserva: el objetivo es recuperar, no fallar. La próxima semana
          reanudas el mesociclo un poco más alto.
        </div>
      ) : suggestDeload ? (
        <div className="mb-3 rounded-lg border border-warning/40 bg-warning-light/40 px-3 py-2 text-xs text-brand-dark flex items-center justify-between gap-3 flex-wrap">
          <span>
            {mesoComplete
              ? `Completaste el bloque (${durationWeeks} semanas).`
              : "Tienes músculos en el tope (MRV)."}{" "}
            Toca una <strong>semana de descarga</strong>.
          </span>
          <button
            type="button"
            onClick={onToggleDeload}
            className="shrink-0 px-3 py-1.5 rounded-button bg-accent text-white font-semibold text-[11px] hover:opacity-90 transition"
          >
            Activar descarga
          </button>
        </div>
      ) : null}

      {hasTrend && (
        <div className="mb-3">
          <p className="text-[11px] text-brand-warm mb-1.5">
            Volumen semanal (series efectivas totales)
          </p>
          <TrendBars data={trend} deload={deload} />
        </div>
      )}

      {/* Sugerencias de progresión — ocultas en descarga (esta semana se baja) */}
      {!deload &&
        week != null &&
        (suggestions.length > 0 ? (
          <div>
            <p className="text-[11px] text-brand-warm mb-1.5">
              Para la próxima semana
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <SuggestionChip key={s.slug} s={s} />
              ))}
            </div>
          </div>
        ) : !suggestDeload ? (
          <p className="text-xs text-success">
            Tu plan está en el objetivo de volumen de esta semana 👌
          </p>
        ) : null)}
    </div>
  );
}

function TrendBars({ data, deload }: { data: WeekVolumePoint[]; deload: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.totalSets));
  return (
    <div className="flex items-end gap-2">
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = Math.max(4, Math.round((d.totalSets / max) * 64));
        const color = isLast
          ? deload
            ? DELOAD_DONE_COLOR
            : DONE_COLOR
          : PLAN_COLOR;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${d.label}: ${d.totalSets} series`}
          >
            <span className="text-[10px] text-brand-warm h-3">
              {d.totalSets || ""}
            </span>
            <div
              className="w-full rounded-t"
              style={{ height: `${h}px`, background: color }}
            />
            <span className="text-[9px] text-brand-warm/70">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal: definir contribuciones para un ejercicio no categorizado (Fase D) ─

const FRACTIONS: { label: string; value: number }[] = [
  { label: "Principal (1.0)", value: 1 },
  { label: "Fuerte (0.5)", value: 0.5 },
  { label: "Asistente (0.25)", value: 0.25 },
];

function MuscleContributionModal({
  exerciseName,
  existing,
  onSave,
  onClose,
}: {
  exerciseName: string;
  existing?: MuscleContribution[];
  onSave: (contributions: MuscleContribution[]) => void;
  onClose: () => void;
}) {
  const [primary, setPrimary] = useState(existing?.[0]?.muscle ?? "");
  const [secondaries, setSecondaries] = useState<{ muscle: string; fraction: number }[]>(
    existing?.slice(1).map((c) => ({ muscle: c.muscle, fraction: c.fraction })) ?? [],
  );

  const allMuscles = MUSCLE_ORDER as readonly string[];

  const addSecondary = () => {
    if (secondaries.length < 3)
      setSecondaries((prev) => [...prev, { muscle: "", fraction: 0.5 }]);
  };

  const removeSecondary = (i: number) =>
    setSecondaries((prev) => prev.filter((_, j) => j !== i));

  const updateSecondary = (i: number, field: "muscle" | "fraction", val: string | number) =>
    setSecondaries((prev) => prev.map((s, j) => (j === i ? { ...s, [field]: val } : s)));

  const handleSave = () => {
    if (!primary) return;
    const contributions: MuscleContribution[] = [
      { muscle: primary, fraction: 1 },
      ...secondaries.filter((s) => s.muscle).map((s) => ({ muscle: s.muscle, fraction: s.fraction })),
    ];
    onSave(contributions);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-brand-paper rounded-2xl border border-brand-cream shadow-xl p-6">
        <h3 className="font-display text-lg font-semibold text-brand-dark mb-0.5">
          Definir músculos
        </h3>
        <p className="text-[12px] text-brand-warm mb-5 truncate">"{exerciseName}"</p>

        {/* Músculo principal */}
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-warm/70 mb-1.5">
          Músculo principal (1.0)
        </label>
        <select
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="w-full rounded-lg border border-brand-light-tan bg-brand-warm-white px-3 py-2 text-sm text-brand-dark focus:outline-none focus:border-accent mb-4"
        >
          <option value="">— seleccionar —</option>
          {allMuscles.map((slug) => (
            <option key={slug} value={slug}>
              {MUSCLE_LABEL_ES[slug] ?? slug}
            </option>
          ))}
        </select>

        {/* Secundarios */}
        {secondaries.length > 0 && (
          <div className="space-y-2 mb-3">
            {secondaries.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={s.muscle}
                  onChange={(e) => updateSecondary(i, "muscle", e.target.value)}
                  className="flex-1 rounded-lg border border-brand-light-tan bg-brand-warm-white px-3 py-1.5 text-sm text-brand-dark focus:outline-none focus:border-accent"
                >
                  <option value="">— músculo —</option>
                  {allMuscles
                    .filter((slug) => slug !== primary)
                    .map((slug) => (
                      <option key={slug} value={slug}>
                        {MUSCLE_LABEL_ES[slug] ?? slug}
                      </option>
                    ))}
                </select>
                <select
                  value={s.fraction}
                  onChange={(e) => updateSecondary(i, "fraction", Number(e.target.value))}
                  className="w-28 rounded-lg border border-brand-light-tan bg-brand-warm-white px-2 py-1.5 text-[11px] text-brand-dark focus:outline-none focus:border-accent"
                >
                  {FRACTIONS.slice(1).map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSecondary(i)}
                  className="text-brand-warm hover:text-danger transition text-sm px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {secondaries.length < 3 && (
          <button
            type="button"
            onClick={addSecondary}
            className="text-[11px] text-brand-warm hover:text-accent transition mb-5"
          >
            + añadir músculo secundario
          </button>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-button border border-brand-light-tan py-2 text-sm text-brand-warm hover:text-brand-dark transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!primary}
            onClick={handleSave}
            className="flex-1 rounded-button bg-accent py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ s }: { s: ProgressionSuggestion }) {
  const label = MUSCLE_LABEL_ES[s.slug] ?? s.slug;
  let text: string;
  let cls: string;
  if (s.action === "raise_to_mev") {
    text = `${label}: sube a ${s.target} (MEV)`;
    cls = "bg-danger/10 text-danger border-danger/30";
  } else if (s.action === "deload") {
    text = `${label}: tope MRV — descarga`;
    cls = "bg-warning-light/60 text-brand-dark border-warning/40";
  } else {
    text = `${label}: sube a ${s.target}`;
    cls = "bg-accent/10 text-accent border-accent/30";
  }
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full border ${cls}`}>
      {text}
    </span>
  );
}
