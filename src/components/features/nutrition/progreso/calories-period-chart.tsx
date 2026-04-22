"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Flame, Award } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { colors } from "@/lib/colors";

interface PeriodSummary {
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    withinTarget: boolean | null;
  }>;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  logged: number;
  totalDays: number;
  goal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  adherenceRate: number | null;
  streak: number;
  weekdayVsWeekend: {
    weekdayAvgKcal: number;
    weekendAvgKcal: number;
    deltaKcal: number;
  } | null;
}

const RANGE_OPTIONS = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
];

function formatDate(d: string): string {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function CaloriesPeriodChart() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<PeriodSummary>(`/nutrition/weekly-summary?days=${days}`)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
        <Loader2 size={14} className="inline animate-spin mr-2" />
        Cargando calorías…
      </Card>
    );
  }
  if (!data) {
    return null;
  }
  if (data.logged === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-dark font-semibold m-0">Sin comidas registradas</p>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Empieza loggeando comidas en <strong>Hoy</strong> para ver gráficas.
        </p>
      </Card>
    );
  }

  const goalCal = data.goal?.calories ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs + toggle rango */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h3 className="font-serif text-lg text-brand-dark m-0">
              Calorías y adherencia
            </h3>
            <p className="text-brand-warm text-xs m-0 mt-0.5">
              Últimos {days} días — {data.logged}/{data.totalDays} registrados.
              &quot;Dentro de meta&quot; = ±10% de tu objetivo calórico.
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Promedio" value={`${data.averages.calories}`} unit="kcal/día" />
          {goalCal > 0 && (
            <Kpi
              label="vs meta"
              value={`${data.averages.calories - goalCal >= 0 ? "+" : ""}${data.averages.calories - goalCal}`}
              unit={`kcal (${goalCal})`}
              color={
                Math.abs(data.averages.calories - goalCal) < goalCal * 0.1
                  ? "success"
                  : "warning"
              }
            />
          )}
          {data.adherenceRate != null && (
            <Kpi
              label="Adherencia"
              value={`${data.adherenceRate}%`}
              icon={<Award size={12} className="text-accent" />}
              color={
                data.adherenceRate >= 80
                  ? "success"
                  : data.adherenceRate >= 50
                    ? "warning"
                    : "danger"
              }
            />
          )}
          <Kpi
            label="Streak"
            value={`${data.streak}`}
            unit="días en meta"
            icon={<Flame size={12} className="text-warning" />}
            color={data.streak >= 3 ? "success" : undefined}
          />
        </div>
      </Card>

      {/* Gráfica */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data.days}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: colors.warm }}
                tickFormatter={formatDate}
                minTickGap={30}
              />
              <YAxis tick={{ fontSize: 11, fill: colors.warm }} width={44} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(d) => formatDate(d as string)}
                formatter={(v: number, name: string) => {
                  if (typeof v !== "number") return [v, name];
                  return [`${Math.round(v)} kcal`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {goalCal > 0 && (
                <ReferenceLine
                  y={goalCal}
                  stroke={colors.accent}
                  strokeDasharray="4 4"
                  label={{
                    value: `Meta ${goalCal}`,
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: colors.accent,
                  }}
                />
              )}
              <Bar
                dataKey="calories"
                name="Calorías"
                fill={colors.accent}
                opacity={0.6}
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weekday vs Weekend */}
      {data.weekdayVsWeekend && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-base text-brand-dark m-0 mb-2">
            Semana vs fin de semana
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                Lunes-Viernes
              </p>
              <p className="font-mono text-xl text-brand-dark m-0 mt-0.5">
                {data.weekdayVsWeekend.weekdayAvgKcal} kcal
              </p>
            </div>
            <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                Sáb-Dom
              </p>
              <p className="font-mono text-xl text-brand-dark m-0 mt-0.5">
                {data.weekdayVsWeekend.weekendAvgKcal} kcal
              </p>
              {Math.abs(data.weekdayVsWeekend.deltaKcal) >= 100 && (
                <p
                  className={cn(
                    "text-[10px] font-semibold m-0 mt-0.5",
                    data.weekdayVsWeekend.deltaKcal > 0 ? "text-warning" : "text-success",
                  )}
                >
                  {data.weekdayVsWeekend.deltaKcal > 0
                    ? `+${data.weekdayVsWeekend.deltaKcal} kcal en fin de semana`
                    : `${data.weekdayVsWeekend.deltaKcal} kcal en fin de semana`}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
  color?: "success" | "warning" | "danger";
}) {
  return (
    <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream">
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-xl m-0 mt-0.5",
          color === "success" && "text-success",
          color === "warning" && "text-warning",
          color === "danger" && "text-danger",
          !color && "text-brand-dark",
        )}
      >
        {value}
      </p>
      {unit && <p className="text-[10px] text-brand-warm m-0">{unit}</p>}
    </div>
  );
}
