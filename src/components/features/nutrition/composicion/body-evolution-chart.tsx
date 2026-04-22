"use client";

/**
 * Gráficas de evolución por métrica de bioimpedancia.
 *
 * Métricas disponibles: peso total, % grasa, masa magra (LBM), masa grasa,
 * grasa visceral, % agua. El usuario elige cuál ver + rango temporal. Muestra
 * delta del primer vs último dato seleccionado y media.
 */

import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, cn } from "@/components/ui";

interface BodyCompositionRow {
  id: string;
  date: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  leanMassKg: number | null;
  fatMassKg: number | null;
  waterPercent: number | null;
  visceralFat: number | null;
  boneMassKg: number | null;
  bmr: number | null;
  method: string | null;
}

type MetricKey =
  | "weightKg"
  | "bodyFatPercent"
  | "leanMassKg"
  | "fatMassKg"
  | "waterPercent"
  | "visceralFat";

interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  decimals: number;
}

const METRICS: MetricDef[] = [
  { key: "weightKg",       label: "Peso",        unit: "kg", color: "#B8864A", decimals: 1 },
  { key: "bodyFatPercent", label: "% Grasa",     unit: "%",  color: "#E07A3C", decimals: 1 },
  { key: "leanMassKg",     label: "Masa magra",  unit: "kg", color: "#5B8D5B", decimals: 1 },
  { key: "fatMassKg",      label: "Masa grasa",  unit: "kg", color: "#C4684A", decimals: 2 },
  { key: "waterPercent",   label: "% Agua",      unit: "%",  color: "#4A89B8", decimals: 1 },
  { key: "visceralFat",    label: "Visceral",    unit: "",   color: "#7A4A8D", decimals: 0 },
];

const RANGES: Array<{ id: string; days: number | null; label: string }> = [
  { id: "1m",  days: 30,   label: "1 mes"  },
  { id: "3m",  days: 90,   label: "3 meses"},
  { id: "6m",  days: 180,  label: "6 meses"},
  { id: "1y",  days: 365,  label: "1 año"  },
  { id: "all", days: null, label: "Todo"   },
];

interface Props {
  rows: BodyCompositionRow[];
}

export default function BodyEvolutionChart({ rows }: Props) {
  const [metric, setMetric] = useState<MetricKey>("bodyFatPercent");
  const [rangeId, setRangeId] = useState<string>("6m");

  const def = METRICS.find((m) => m.key === metric)!;
  const range = RANGES.find((r) => r.id === rangeId)!;

  const filteredRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    if (range.days == null) return sorted;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return sorted.filter((r) => r.date >= cutoffStr);
  }, [rows, range.days]);

  const chartData = useMemo(
    () =>
      filteredRows
        .map((r) => ({
          date: r.date,
          value: r[metric] as number | null,
        }))
        .filter((p) => p.value != null && Number.isFinite(p.value)),
    [filteredRows, metric],
  );

  const first = chartData[0]?.value ?? null;
  const last = chartData[chartData.length - 1]?.value ?? null;
  const delta = first != null && last != null ? last - first : null;
  const avg =
    chartData.length > 0
      ? chartData.reduce((s, p) => s + (p.value as number), 0) / chartData.length
      : null;

  // Para % grasa y grasa visceral: baja = bueno. Para LBM: sube = bueno.
  const positiveIsGood: Record<MetricKey, "up" | "down" | "neutral"> = {
    weightKg: "neutral",
    bodyFatPercent: "down",
    leanMassKg: "up",
    fatMassKg: "down",
    waterPercent: "up",
    visceralFat: "down",
  };
  const goodDirection = positiveIsGood[metric];
  const deltaColor =
    delta == null || Math.abs(delta) < 0.05
      ? "text-brand-warm"
      : goodDirection === "neutral"
        ? "text-brand-dark"
        : (delta > 0 && goodDirection === "up") || (delta < 0 && goodDirection === "down")
          ? "text-success"
          : "text-danger";

  if (rows.length === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-warm text-sm m-0">
          Registra al menos una medición para ver tu evolución.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="font-serif text-lg text-brand-dark m-0">
            Evolución de {def.label.toLowerCase()}
          </h3>
          <p className="text-brand-warm text-xs m-0 mt-0.5">
            {chartData.length} registros · rango{" "}
            {range.id === "all" ? "completo" : range.label.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeId(r.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] transition",
                rangeId === r.id
                  ? "bg-brand-dark text-brand-cream"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de métrica */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-semibold transition border",
              metric === m.key
                ? "border-transparent text-white"
                : "bg-brand-paper border-brand-cream text-brand-medium hover:bg-brand-cream",
            )}
            style={metric === m.key ? { backgroundColor: m.color } : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* KPIs delta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KpiBox label="Primero" value={first != null ? `${first.toFixed(def.decimals)}${def.unit}` : "—"} />
        <KpiBox label="Último" value={last != null ? `${last.toFixed(def.decimals)}${def.unit}` : "—"} />
        <KpiBox
          label="Δ Cambio"
          value={
            delta != null
              ? `${delta > 0 ? "+" : ""}${delta.toFixed(def.decimals)}${def.unit}`
              : "—"
          }
          valueClassName={deltaColor}
        />
        <KpiBox label="Promedio" value={avg != null ? `${avg.toFixed(def.decimals)}${def.unit}` : "—"} />
      </div>

      {/* Gráfica */}
      {chartData.length < 2 ? (
        <div className="text-center py-8 text-brand-warm text-sm bg-brand-warm-white rounded-lg border border-brand-light-cream">
          Necesitas al menos 2 puntos en este rango para graficar.
        </div>
      ) : (
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD1" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                tick={{ fill: "#8B6F4A", fontSize: 11 }}
                stroke="#D4C5AD"
              />
              <YAxis
                tick={{ fill: "#8B6F4A", fontSize: 11 }}
                stroke="#D4C5AD"
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => v.toFixed(def.decimals)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FEFCF7",
                  border: "1px solid #E8DFD1",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [
                  `${value.toFixed(def.decimals)}${def.unit}`,
                  def.label,
                ]}
              />
              {avg != null && (
                <ReferenceLine
                  y={avg}
                  stroke={def.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{
                    value: `media ${avg.toFixed(def.decimals)}`,
                    position: "right",
                    fill: def.color,
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={def.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: def.color }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function KpiBox({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-brand-paper rounded-lg p-3 border border-brand-light-cream">
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
        {label}
      </p>
      <p className={cn("font-mono text-lg text-brand-dark m-0 mt-0.5", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function formatTick(v: string): string {
  // 2026-04-21 → 21 abr
  const [, m, d] = v.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const mi = parseInt(m ?? "1", 10) - 1;
  const mn = months[mi] ?? m ?? "";
  return `${parseInt(d ?? "1", 10)} ${mn}`;
}
