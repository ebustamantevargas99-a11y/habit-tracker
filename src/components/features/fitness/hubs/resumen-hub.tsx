"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  TrendingUp,
  Calendar,
  Weight,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useFitnessStore } from "@/stores/fitness-store";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api-client";
import { todayLocal, shiftDaysLocal, parseLocalDateStr } from "@/lib/date/local";
import {
  computeExerciseProgress,
  type ExerciseProgress,
  type ProgressPoint,
} from "@/lib/fitness/progress";

// ─── Tipos del programa activo (schedule JSON) ───────────────────────────────
interface ScheduleExercise {
  name: string;
  sets: number;
  repRange: [number, number];
  targetRpe?: number;
  notes?: string;
}
interface ScheduleDay {
  dayOfWeek: number; // 0=Dom..6=Sáb
  templateName: string;
  exercises: ScheduleExercise[];
}
interface Program {
  id: string;
  name: string;
  active: boolean;
  schedule: ScheduleDay[];
}

const DOW_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function ResumenHub() {
  const { workouts, weightLog, totalWorkouts } = useFitnessStore();
  const setFitnessTab = useAppStore((s) => s.setFitnessTab);

  const [activeProgram, setActiveProgram] = useState<Program | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Program[]>("/fitness/programs")
      .then((programs) => {
        if (cancelled) return;
        setActiveProgram(programs.find((p) => p.active) ?? null);
      })
      .catch(() => {
        /* no bloquea el resto del dashboard */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Progresión de carga ─────────────────────────────────────────────────────
  const progression = useMemo(
    () => computeExerciseProgress(workouts),
    [workouts],
  );
  const [selected, setSelected] = useState<string>("");
  const selectedProgress =
    progression.find((p) => p.exercise === selected) ?? progression[0] ?? null;

  // ── Métricas clave (últimos 7 días) ─────────────────────────────────────────
  const metrics = useMemo(() => {
    const weekAgo = shiftDaysLocal(-6); // hoy + 6 días atrás = 7 días
    const last7 = workouts.filter((w) => w.date >= weekAgo);
    const vol7 = last7.reduce((s, w) => s + (w.totalVolume ?? 0), 0);

    const sortedWeight = [...weightLog].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const latestW = sortedWeight[sortedWeight.length - 1] ?? null;
    const firstW = sortedWeight[0] ?? null;
    const weightTrend =
      latestW && firstW && latestW.date !== firstW.date
        ? Math.round((latestW.weight - firstW.weight) * 10) / 10
        : null;

    return {
      sessions7: last7.length,
      vol7,
      latestWeight: latestW?.weight ?? null,
      weightTrend,
    };
  }, [workouts, weightLog]);

  // ── Rutina de hoy (del programa activo) ──────────────────────────────────────
  const todayDow = parseLocalDateStr(todayLocal()).getDay();
  const todaySchedule =
    activeProgram?.schedule?.find((d) => d.dayOfWeek === todayDow) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Métricas clave ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<Calendar size={18} />}
          label="Sesiones (7 días)"
          value={String(metrics.sessions7)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Volumen (7 días)"
          value={
            metrics.vol7 >= 1000
              ? `${(metrics.vol7 / 1000).toFixed(1)}k`
              : String(Math.round(metrics.vol7))
          }
          suffix="kg·rep"
        />
        <MetricCard
          icon={<Dumbbell size={18} />}
          label="Sesiones totales"
          value={String(totalWorkouts)}
        />
        <MetricCard
          icon={<Weight size={18} />}
          label="Peso actual"
          value={metrics.latestWeight != null ? `${metrics.latestWeight}` : "—"}
          suffix={metrics.latestWeight != null ? "kg" : undefined}
          trend={
            metrics.weightTrend != null && metrics.weightTrend !== 0
              ? metrics.weightTrend
              : undefined
          }
        />
      </div>

      {/* ── Rutina de hoy ── */}
      <section className="bg-brand-paper rounded-xl border border-brand-light-tan p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-serif text-lg text-brand-dark m-0">
              Rutina de hoy · {DOW_LABEL[todayDow]}
            </h3>
            {todaySchedule && todaySchedule.exercises.length > 0 && (
              <p className="text-brand-warm text-xs m-0 mt-0.5">
                {activeProgram?.name} · {todaySchedule.templateName}
              </p>
            )}
          </div>
          {todaySchedule && todaySchedule.exercises.length > 0 && (
            <button
              onClick={() => setFitnessTab("entreno")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90 transition shrink-0"
            >
              Empezar sesión <ArrowRight size={15} />
            </button>
          )}
        </div>

        {!activeProgram ? (
          <EmptyRoutine onCreate={() => setFitnessTab("rutinas")} />
        ) : !todaySchedule || todaySchedule.exercises.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-brand-dark font-semibold m-0">
              Hoy toca descanso 😴
            </p>
            <p className="text-brand-warm text-xs m-0 mt-1">
              Recuperar es parte de progresar. Mañana volvemos.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-brand-light-cream">
            {todaySchedule.exercises.map((ex, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-brand-dark font-medium">{ex.name}</span>
                <span className="text-brand-warm font-mono text-xs">
                  {ex.sets} × {ex.repRange[0]}–{ex.repRange[1]}
                  {ex.targetRpe ? ` · RPE ${ex.targetRpe}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Progresión de carga ── */}
      <section className="bg-brand-paper rounded-xl border border-brand-light-tan p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-lg text-brand-dark m-0">
            Progresión de carga
          </h3>
          {progression.length > 1 && (
            <select
              value={selectedProgress?.exercise ?? ""}
              onChange={(e) => setSelected(e.target.value)}
              className="px-3 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-sm text-brand-dark"
            >
              {progression.map((p) => (
                <option key={p.exercise} value={p.exercise}>
                  {p.exercise}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="text-brand-warm text-xs m-0 mb-4">
          Tu peso tope ahora vs. semanas anteriores y tu punto de partida.
        </p>

        {!selectedProgress ? (
          <div className="text-center py-8">
            <p className="text-brand-dark font-semibold m-0">
              Aún no hay datos de progreso
            </p>
            <p className="text-brand-warm text-xs m-0 mt-1">
              Registra sesiones en <strong>Entreno → Hoy</strong> y aquí verás
              cómo sube el peso de cada ejercicio.
            </p>
          </div>
        ) : (
          <>
            <ProgressDetail p={selectedProgress} />
            {progression.length > 1 && (
              <AllExercisesTable
                items={progression}
                selected={selectedProgress.exercise}
                onSelect={setSelected}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  suffix,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  trend?: number;
}) {
  return (
    <div className="bg-brand-paper rounded-xl border border-brand-light-tan p-4">
      <div className="flex items-center gap-2 text-brand-warm mb-2">
        {icon}
        <span className="text-[11px] uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-2xl text-brand-dark">{value}</span>
        {suffix && <span className="text-brand-warm text-xs">{suffix}</span>}
        {trend != null && (
          <span
            className={`text-xs font-semibold ml-1 ${
              trend > 0 ? "text-success" : "text-danger"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}kg
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyRoutine({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-6">
      <p className="text-brand-dark font-semibold m-0">
        Aún no tienes una rutina semanal
      </p>
      <p className="text-brand-warm text-xs m-0 mt-1 mb-3">
        Crea tu rutina y aquí verás qué te toca cada día.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90 transition"
      >
        Crear mi rutina <ArrowRight size={15} />
      </button>
    </div>
  );
}

function ProgressDetail({ p }: { p: ExerciseProgress }) {
  const refs: { label: string; pt: ProgressPoint | null; isNow?: boolean }[] = [
    { label: "Inicio", pt: p.start },
    { label: "1 mes", pt: p.refs.m1 },
    { label: "3 sem", pt: p.refs.w3 },
    { label: "2 sem", pt: p.refs.w2 },
    { label: "1 sem", pt: p.refs.w1 },
    { label: "Ahora", pt: p.current, isNow: true },
  ];
  // Evitar duplicar "Inicio" si coincide con una ventana (pocas sesiones).
  const seen = new Set<string>();
  const chips = refs.filter((r) => {
    if (!r.pt) return r.isNow; // null sólo se descarta si no es "Ahora"
    if (r.isNow) return true;
    const key = r.pt.date;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="bg-brand-warm-white rounded-lg border border-brand-light-cream p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-lg text-brand-dark">{p.exercise}</span>
          {p.muscleGroup && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-light-cream text-brand-warm font-semibold">
              {p.muscleGroup}
            </span>
          )}
          <span className="text-brand-warm text-xs">· {p.sessions} sesiones</span>
        </div>
        {p.gain !== 0 && (
          <span
            className={`text-sm font-bold ${
              p.gain > 0 ? "text-success" : "text-danger"
            }`}
          >
            {p.gain > 0 ? "+" : ""}
            {p.gain}kg desde el inicio
            {p.gainPct !== 0 && (
              <span className="font-normal">
                {" "}
                ({p.gainPct > 0 ? "+" : ""}
                {p.gainPct}%)
              </span>
            )}
          </span>
        )}
      </div>

      {/* Sparkline */}
      <Sparkline points={p.points} />

      {/* Timeline chips */}
      <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
        {chips.map((r, i) => {
          const deltaToNow =
            r.pt && !r.isNow
              ? Math.round((p.current.topWeight - r.pt.topWeight) * 10) / 10
              : null;
          return (
            <div
              key={i}
              className={`shrink-0 rounded-lg px-3 py-2 min-w-[78px] text-center border ${
                r.isNow
                  ? "bg-accent/10 border-accent"
                  : "bg-brand-paper border-brand-light-cream"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-brand-warm font-semibold">
                {r.label}
              </div>
              <div className="font-serif text-base text-brand-dark mt-0.5">
                {r.pt ? `${r.pt.topWeight}kg` : "—"}
              </div>
              {r.pt && (
                <div className="text-[10px] text-brand-warm">
                  {r.isNow
                    ? `× ${r.pt.reps}`
                    : deltaToNow != null && deltaToNow !== 0
                      ? `${deltaToNow > 0 ? "+" : ""}${deltaToNow}`
                      : "="}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: ProgressPoint[] }) {
  const W = 600;
  const H = 56;
  const pad = 4;
  if (points.length < 2) {
    return (
      <div className="text-brand-warm text-xs italic">
        Necesitas al menos 2 sesiones para ver la curva.
      </div>
    );
  }
  const ws = points.map((p) => p.topWeight);
  const min = Math.min(...ws);
  const max = Math.max(...ws);
  const range = max - min || 1;
  const stepX = (W - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (H - pad * 2) * (1 - (p.topWeight - min) / range);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-14"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={3.5} fill="var(--color-accent)" />
    </svg>
  );
}

function AllExercisesTable({
  items,
  selected,
  onSelect,
}: {
  items: ExerciseProgress[];
  selected: string;
  onSelect: (ex: string) => void;
}) {
  return (
    <div className="border border-brand-light-cream rounded-lg overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-brand-light-cream text-brand-warm">
            <th className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wider">
              Ejercicio
            </th>
            <th className="text-center px-3 py-2 font-semibold text-xs uppercase tracking-wider">
              Inicio
            </th>
            <th className="text-center px-3 py-2 font-semibold text-xs uppercase tracking-wider">
              Ahora
            </th>
            <th className="text-right px-3 py-2 font-semibold text-xs uppercase tracking-wider">
              Progreso
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.exercise}
              onClick={() => onSelect(p.exercise)}
              className={`border-t border-brand-light-cream cursor-pointer transition-colors ${
                p.exercise === selected
                  ? "bg-accent/10"
                  : "hover:bg-brand-warm-white"
              }`}
            >
              <td className="px-3 py-2 text-brand-dark font-medium">
                <span className="flex items-center gap-1">
                  {p.exercise === selected && (
                    <ChevronRight size={13} className="text-accent" />
                  )}
                  {p.exercise}
                </span>
              </td>
              <td className="px-3 py-2 text-center text-brand-warm">
                {p.start.topWeight}kg
              </td>
              <td className="px-3 py-2 text-center text-brand-dark font-semibold">
                {p.current.topWeight}kg
              </td>
              <td
                className={`px-3 py-2 text-right font-semibold ${
                  p.gain > 0
                    ? "text-success"
                    : p.gain < 0
                      ? "text-danger"
                      : "text-brand-warm"
                }`}
              >
                {p.gain > 0 ? "+" : ""}
                {p.gain}kg
                {p.gainPct !== 0 && (
                  <span className="font-normal text-xs">
                    {" "}
                    ({p.gainPct > 0 ? "+" : ""}
                    {p.gainPct}%)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
