"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
  ReferenceLine,
} from "recharts";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import type { TrainingLoadPoint, FormClassification } from "@/lib/fitness/training-load";

interface TrainingLoadResponse {
  days: number;
  since: string;
  today: string;
  series: TrainingLoadPoint[];
  current: {
    atl: number;
    ctl: number;
    tsb: number;
    classification: FormClassification;
  } | null;
  inputs: {
    restingHr: number | null;
    maxHr: number | null;
    workouts: number;
    cardioSessions: number;
  };
}

const COLOR_BY_STATUS: Record<FormClassification["color"], string> = {
  danger:      "bg-danger text-white",
  warning:     "bg-warning text-white",
  info:        "bg-info text-white",
  success:     "bg-success text-white",
  "brand-warm": "bg-brand-warm text-white",
};

const RANGE_OPTIONS = [
  { days: 30,  label: "30 días" },
  { days: 90,  label: "90 días" },
  { days: 180, label: "6 meses" },
];

export default function TrainingLoadChart() {
  const [data, setData] = useState<TrainingLoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(90);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<TrainingLoadResponse>(`/fitness/training-load?days=${days}`)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar training load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-lg text-brand-dark m-0">
              Training Load (Banister)
            </h3>
            <p className="text-brand-warm text-xs m-0 mt-0.5">
              ATL (fatiga aguda, τ=7d) · CTL (fitness, τ=42d) · TSB (balance = CTL − ATL).
              Los workouts de gym usan TRIMP Foster (RPE×min); cardio usa Banister HR-based si hay datos.
            </p>
          </div>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition",
                  days === opt.days
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
          Calculando serie ATL/CTL/TSB…
        </Card>
      ) : error ? (
        <Card variant="default" padding="md" className="border-danger text-danger text-sm">
          {error}
        </Card>
      ) : !data || data.series.length === 0 ? (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center">
          <p className="text-brand-dark font-semibold m-0">Sin entrenamientos suficientes</p>
          <p className="text-brand-warm text-xs mt-1 m-0">
            Registra al menos unos workouts (gym o cardio) para ver tu carga de entrenamiento.
          </p>
        </Card>
      ) : (
        <>
          {/* KPIs + clasificación */}
          <Card variant="default" padding="md" className="border-brand-light-tan">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                  ATL (fatiga 7d)
                </p>
                <p className="font-mono text-3xl text-brand-dark m-0">
                  {data.current?.atl.toFixed(0) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                  CTL (fitness 42d)
                </p>
                <p className="font-mono text-3xl text-brand-dark m-0">
                  {data.current?.ctl.toFixed(0) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                  TSB (forma)
                </p>
                <p
                  className={cn(
                    "font-mono text-3xl m-0",
                    (data.current?.tsb ?? 0) > 5
                      ? "text-success"
                      : (data.current?.tsb ?? 0) < -10
                        ? "text-danger"
                        : "text-brand-dark",
                  )}
                >
                  {data.current?.tsb != null
                    ? (data.current.tsb > 0 ? "+" : "") + data.current.tsb.toFixed(0)
                    : "—"}
                </p>
              </div>
              {data.current?.classification && (
                <div
                  className={cn(
                    "rounded-xl px-4 py-3",
                    COLOR_BY_STATUS[data.current.classification.color],
                  )}
                >
                  <p className="text-[10px] uppercase tracking-widest opacity-80 m-0">
                    Estado actual
                  </p>
                  <p className="font-semibold text-lg m-0 mt-0.5">
                    {data.current.classification.label}
                  </p>
                </div>
              )}
            </div>
            {data.current?.classification && (
              <p className="text-sm text-brand-dark mt-4 m-0">
                {data.current.classification.description}
              </p>
            )}
          </Card>

          {/* Chart */}
          <Card variant="default" padding="md" className="border-brand-light-tan">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data.series}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
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
                    labelFormatter={(d) => d as string}
                    formatter={(v: number, name: string) => [v.toFixed(1), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="var(--color-brand-tan)" strokeDasharray="3 3" />
                  <Bar dataKey="trimp" name="TRIMP diario" fill="var(--color-brand-tan)" opacity={0.35} />
                  <Line
                    type="monotone"
                    dataKey="atl"
                    name="ATL (fatiga)"
                    stroke="var(--color-danger, #dc2626)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ctl"
                    name="CTL (fitness)"
                    stroke="var(--color-accent, #b8860b)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="tsb"
                    name="TSB (forma)"
                    stroke="var(--color-success, #16a34a)"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-brand-warm mt-2 m-0">
              Fuentes: {data.inputs.workouts} workouts de gym · {data.inputs.cardioSessions} sesiones de cardio.
              {data.inputs.restingHr != null && (
                <span> HR reposo: {data.inputs.restingHr} bpm.</span>
              )}
              {data.inputs.maxHr != null && <span> HR máx (Tanaka): {data.inputs.maxHr} bpm.</span>}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
