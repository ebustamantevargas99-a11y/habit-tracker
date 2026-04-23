"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import { estimate1RMFromRpe } from "@/lib/fitness/rir-rpe";

interface WorkoutHistoryRow {
  id: string;
  date: string;
  exercises: Array<{
    exerciseName: string;
    sets: Array<{ weight: number; reps: number; rpe: number | null; isWarmup?: boolean }>;
  }>;
}

function epley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function bestE1RMOfSession(
  sets: Array<{ weight: number; reps: number; rpe: number | null; isWarmup?: boolean }>,
): number | null {
  let best = 0;
  for (const s of sets) {
    if (s.isWarmup) continue;
    let est: number;
    if (s.rpe != null && s.rpe >= 6 && s.rpe <= 10) {
      est = estimate1RMFromRpe(s.weight, s.reps, s.rpe) ?? epley(s.weight, s.reps);
    } else {
      est = epley(s.weight, s.reps);
    }
    if (est > best) best = est;
  }
  return best > 0 ? Math.round(best * 10) / 10 : null;
}

export default function OneRMProjections() {
  const [workouts, setWorkouts] = useState<WorkoutHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEx, setSelectedEx] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<WorkoutHistoryRow[]>("/fitness/workouts?limit=120")
      .then((list) => setWorkouts(list))
      .catch(() => setWorkouts([]))
      .finally(() => setLoading(false));
  }, []);

  // Lista de ejercicios únicos
  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    for (const w of workouts) for (const e of w.exercises) set.add(e.exerciseName);
    return Array.from(set).sort();
  }, [workouts]);

  // Seleccionar automático el primer ejercicio con 2+ sesiones
  useEffect(() => {
    if (selectedEx || exerciseNames.length === 0) return;
    for (const name of exerciseNames) {
      const sessionsWithEx = workouts.filter((w) =>
        w.exercises.some((e) => e.exerciseName === name && e.sets.length > 0),
      );
      if (sessionsWithEx.length >= 2) {
        setSelectedEx(name);
        return;
      }
    }
    setSelectedEx(exerciseNames[0]);
  }, [exerciseNames, workouts, selectedEx]);

  const chartData = useMemo(() => {
    if (!selectedEx) return [];
    const points: Array<{ date: string; e1rm: number }> = [];
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
    for (const w of sorted) {
      const ex = w.exercises.find((e) => e.exerciseName === selectedEx);
      if (!ex) continue;
      const e1rm = bestE1RMOfSession(ex.sets);
      if (e1rm != null) {
        points.push({ date: w.date, e1rm });
      }
    }
    return points;
  }, [workouts, selectedEx]);

  // Proyección lineal simple: últimos 4 puntos → ajusta una recta
  const projection = useMemo(() => {
    if (chartData.length < 3) return null;
    const recent = chartData.slice(-6);
    const n = recent.length;
    const xs = recent.map((_, i) => i);
    const ys = recent.map((p) => p.e1rm);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    if (den === 0) return null;
    const slope = num / den;
    const intercept = meanY - slope * meanX;
    // Proyecta 4, 8, 12 sesiones hacia adelante
    const project = (stepsAhead: number) =>
      Math.round((slope * (n - 1 + stepsAhead) + intercept) * 10) / 10;
    return {
      slope: Math.round(slope * 100) / 100,
      current: Math.round(ys[ys.length - 1] * 10) / 10,
      in4: project(4),
      in8: project(8),
      in12: project(12),
      trend: slope > 0.5 ? "up" : slope < -0.5 ? "down" : "flat",
    };
  }, [chartData]);

  if (loading) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
        Cargando histórico…
      </Card>
    );
  }

  if (exerciseNames.length === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-dark font-semibold m-0">Sin histórico de ejercicios</p>
        <p className="text-brand-warm text-xs mt-1 m-0">
          Registra algunos entrenamientos en <strong>Gym</strong> para ver la proyección de tu 1RM.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
          Proyección de 1RM
        </h3>
        <p className="text-brand-warm text-xs m-0 mb-3">
          Usa RPE-based estimation (Helms/Zourdos) cuando hay RPE; fallback Epley.
          La línea tendencia ajusta los últimos 6 puntos.
        </p>
        <select
          value={selectedEx ?? ""}
          onChange={(e) => setSelectedEx(e.target.value)}
          className="px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Card>

      {projection && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                Actual e1RM
              </p>
              <p className="font-mono text-2xl text-brand-dark m-0">
                {projection.current} kg
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                En 4 sesiones
              </p>
              <p
                className={cn(
                  "font-mono text-2xl m-0",
                  projection.trend === "up" ? "text-success" : projection.trend === "down" ? "text-danger" : "text-brand-dark",
                )}
              >
                {projection.in4} kg
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                En 8 sesiones
              </p>
              <p
                className={cn(
                  "font-mono text-2xl m-0",
                  projection.trend === "up" ? "text-success" : projection.trend === "down" ? "text-danger" : "text-brand-dark",
                )}
              >
                {projection.in8} kg
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                En 12 sesiones
              </p>
              <p
                className={cn(
                  "font-mono text-2xl m-0",
                  projection.trend === "up" ? "text-success" : projection.trend === "down" ? "text-danger" : "text-brand-dark",
                )}
              >
                {projection.in12} kg
              </p>
            </div>
          </div>
          <p className="text-xs text-brand-warm mt-3 m-0">
            Pendiente: <strong>{projection.slope >= 0 ? "+" : ""}{projection.slope} kg/sesión</strong> ·
            Tendencia:{" "}
            <span
              className={cn(
                "font-semibold",
                projection.trend === "up" ? "text-success" : projection.trend === "down" ? "text-danger" : "text-brand-warm",
              )}
            >
              {projection.trend === "up" ? "↗ progresando" : projection.trend === "down" ? "↘ bajando" : "→ estable"}
            </span>
          </p>
        </Card>
      )}

      {chartData.length >= 2 && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-light-cream)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(1)} kg`, "e1RM"]}
                />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  stroke="var(--color-accent, #b8860b)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
