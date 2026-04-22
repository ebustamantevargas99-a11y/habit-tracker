"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  ReferenceLine,
  ReferenceDot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingDown, TrendingUp, Minus, Target } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { colors } from "@/lib/colors";

interface WeightProjectionResponse {
  days: number;
  points: Array<{ date: string; weightKg: number }>;
  smoothed: Array<{ date: string; weightKg: number }>;
  trend: {
    slopeKgPerDay: number;
    weeklyRateKg: number;
    intercept: number;
    r2: number;
    fromDate: string;
    toDate: string;
    points: number;
  } | null;
  current: { date: string; weightKg: number } | null;
  goal: {
    targetWeightKg: number | null;
    startWeightKg: number | null;
    startDate: string | null;
    targetDate: string | null;
    weeklyRateKg: number | null;
    goalType: string | null;
  } | null;
  projection: {
    etaDays: number | null;
    etaDate: string | null;
    adherenceRatio: number | null;
    pace: string | null;
  };
}

const RANGE_OPTIONS = [
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 180, label: "6m" },
  { days: 365, label: "1 año" },
];

const PACE_LABEL: Record<string, { label: string; color: string }> = {
  aggressive:   { label: "Agresivo",     color: "text-danger"    },
  moderate:     { label: "Moderado",     color: "text-success"   },
  conservative: { label: "Conservador",  color: "text-info"      },
  very_slow:    { label: "Muy lento",    color: "text-brand-warm" },
};

function formatDate(d: string): string {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function WeightProgressionChart() {
  const [days, setDays] = useState(90);
  const [data, setData] = useState<WeightProjectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<WeightProjectionResponse>(`/nutrition/weight-projection?days=${days}`)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la proyección de peso");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  // Data combinada: puntos crudos + suavizado + extensión de proyección hacia meta
  const chartData = useMemo(() => {
    if (!data) return [];
    const map = new Map<
      string,
      { date: string; raw?: number; smooth?: number; projected?: number }
    >();
    for (const p of data.points) {
      map.set(p.date, { date: p.date, raw: p.weightKg });
    }
    for (const p of data.smoothed) {
      const entry = map.get(p.date) ?? { date: p.date };
      entry.smooth = p.weightKg;
      map.set(p.date, entry);
    }
    // Extender proyección hacia meta si existe
    if (
      data.trend &&
      data.current &&
      data.goal?.targetWeightKg != null &&
      data.projection.etaDate
    ) {
      // Generar puntos diarios de proyección desde hoy hasta etaDate
      const startDate = new Date(data.current.date + "T12:00:00Z");
      const endDate = new Date(data.projection.etaDate + "T12:00:00Z");
      const dayMs = 86_400_000;
      const totalDays = Math.min(
        365,
        Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs),
      );
      for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 30))) {
        const d = new Date(startDate.getTime() + i * dayMs);
        const dateStr = d.toISOString().split("T")[0];
        const w =
          data.current.weightKg + data.trend.slopeKgPerDay * i;
        const entry = map.get(dateStr) ?? { date: dateStr };
        entry.projected = Math.round(w * 100) / 100;
        map.set(dateStr, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (loading) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
        <Loader2 size={14} className="inline animate-spin mr-2" />
        Calculando tendencia de peso…
      </Card>
    );
  }
  if (error) {
    return (
      <Card variant="default" padding="md" className="border-danger text-danger text-sm">
        {error}
      </Card>
    );
  }
  if (!data || data.points.length === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-dark font-semibold m-0">Sin registros de peso</p>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Registra tu peso en <strong>Cuerpo → Peso</strong> (módulo Fitness) o
          al guardar una medición de composición. Necesitas ≥ 2 registros para
          ver la tendencia.
        </p>
      </Card>
    );
  }

  const { trend, goal, projection, current } = data;
  const hasGoal = goal?.targetWeightKg != null;
  const pace = projection.pace ? PACE_LABEL[projection.pace] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header con rango + KPIs */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h3 className="font-serif text-lg text-brand-dark m-0">
              Tendencia de peso
            </h3>
            <p className="text-brand-warm text-xs m-0 mt-0.5">
              Regresión lineal sobre tus últimos {days} días · media móvil
              7d para suavizar fluctuaciones
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

        {/* KPIs de tendencia */}
        {trend && current && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                Peso actual
              </p>
              <p className="font-mono text-xl text-brand-dark m-0 mt-0.5">
                {current.weightKg} kg
              </p>
            </div>
            <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 flex items-center gap-1">
                {trend.weeklyRateKg > 0.05 ? (
                  <TrendingUp size={10} className="text-warning" />
                ) : trend.weeklyRateKg < -0.05 ? (
                  <TrendingDown size={10} className="text-success" />
                ) : (
                  <Minus size={10} className="text-brand-warm" />
                )}
                Tendencia
              </p>
              <p
                className={cn(
                  "font-mono text-xl m-0 mt-0.5",
                  trend.weeklyRateKg < 0
                    ? "text-success"
                    : trend.weeklyRateKg > 0
                      ? "text-warning"
                      : "text-brand-dark",
                )}
              >
                {trend.weeklyRateKg >= 0 ? "+" : ""}
                {trend.weeklyRateKg.toFixed(2)} kg/sem
              </p>
              {pace && (
                <p className={cn("text-[10px] font-semibold m-0 mt-0.5", pace.color)}>
                  {pace.label}
                </p>
              )}
            </div>
            {hasGoal ? (
              <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
                <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 flex items-center gap-1">
                  <Target size={10} /> ETA a meta
                </p>
                <p className="font-mono text-xl text-accent m-0 mt-0.5">
                  {projection.etaDays != null
                    ? `${projection.etaDays} días`
                    : "—"}
                </p>
                {projection.etaDate && (
                  <p className="text-[10px] text-brand-warm m-0 mt-0.5">
                    → {formatDate(projection.etaDate)}
                  </p>
                )}
                {projection.etaDays == null && (
                  <p className="text-[10px] text-danger m-0 mt-0.5">
                    Tendencia contraria
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream flex items-center justify-center">
                <p className="text-[11px] text-brand-warm m-0 text-center">
                  Configura meta en
                  <br />
                  <strong>Alimentos → Metas</strong>
                </p>
              </div>
            )}
            {projection.adherenceRatio != null && (
              <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
                <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                  Adherencia
                </p>
                <p className="font-mono text-xl text-brand-dark m-0 mt-0.5">
                  {Math.round(projection.adherenceRatio * 100)}%
                </p>
                <p className="text-[10px] text-brand-warm m-0 mt-0.5">
                  {projection.adherenceRatio >= 0.8
                    ? "al plan"
                    : projection.adherenceRatio > 0
                      ? "por debajo"
                      : "en contra"}
                </p>
              </div>
            )}
          </div>
        )}

        {trend && trend.r2 < 0.5 && (
          <p className="text-[11px] text-brand-warm mt-3 m-0">
            ⚠️ La tendencia tiene R²={trend.r2} (mucha variación). Registra el
            peso a la misma hora del día (ideal: mañana en ayunas) para
            reducir ruido.
          </p>
        )}
      </Card>

      {/* Gráfica */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: colors.warm }}
                tickFormatter={formatDate}
                minTickGap={40}
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 11, fill: colors.warm }}
                tickFormatter={(v: number) => `${v.toFixed(1)}`}
                width={44}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(d) => formatDate(d as string)}
                formatter={(v: number | string, name: string) => {
                  if (typeof v !== "number") return [v, name];
                  return [`${v.toFixed(1)} kg`, name];
                }}
              />
              {/* Meta como línea de referencia */}
              {hasGoal && goal.targetWeightKg != null && (
                <ReferenceLine
                  y={goal.targetWeightKg}
                  stroke={colors.accent}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta ${goal.targetWeightKg}kg`,
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: colors.accent,
                  }}
                />
              )}
              {/* Peso crudo (puntos) */}
              <Line
                type="monotone"
                dataKey="raw"
                name="Peso registrado"
                stroke={colors.tan}
                strokeWidth={1}
                dot={{ r: 2, fill: colors.tan }}
                connectNulls={false}
              />
              {/* Suavizado 7d */}
              <Line
                type="monotone"
                dataKey="smooth"
                name="Media móvil 7d"
                stroke={colors.accent}
                strokeWidth={2.5}
                dot={false}
                connectNulls={true}
              />
              {/* Proyección (futuro) */}
              <Line
                type="monotone"
                dataKey="projected"
                name="Proyección"
                stroke={colors.success}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={true}
              />
              {/* Punto meta */}
              {hasGoal && goal.targetWeightKg != null && projection.etaDate && (
                <ReferenceDot
                  x={projection.etaDate}
                  y={goal.targetWeightKg}
                  r={5}
                  fill={colors.success}
                  stroke={colors.paper}
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-brand-warm mt-2 m-0">
          Línea dorada: media móvil 7 días (elimina ruido diario) · Línea verde
          punteada: proyección lineal si mantienes la tendencia actual
          {hasGoal ? " · Línea punteada dorada: tu meta" : ""}
        </p>
      </Card>
    </div>
  );
}
