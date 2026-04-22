"use client";

/**
 * Análisis automático de progreso de composición corporal.
 *
 * Compara dos mediciones (earliest vs latest dentro del rango elegido) con
 * analyzeProgress() → clasifica el patrón (recomp / hypertrophy / fat_loss /
 * muscle_loss / fat_gain / stable) y muestra los deltas con texto explicativo.
 *
 * Incluye bloque FFMI (Fat-Free Mass Index, Kouri 1995) si hay LBM + altura:
 * valor normalizado + clasificación (below_average → suspicious >25).
 */

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, cn } from "@/components/ui";
import {
  analyzeProgress,
  classifyFFMI,
  ffmi,
  type BodyCompositionPoint,
  type ProgressPattern,
  type Sex,
} from "@/lib/nutrition/body-composition";

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
  notes: string | null;
}

interface Props {
  rows: BodyCompositionRow[];
  sex: Sex;
  heightCm: number | null;
}

const WINDOWS: Array<{ id: string; days: number | null; label: string }> = [
  { id: "all", days: null, label: "Todo el historial" },
  { id: "1y",  days: 365,  label: "Último año"        },
  { id: "6m",  days: 180,  label: "Últimos 6 meses"   },
  { id: "3m",  days: 90,   label: "Últimos 3 meses"   },
  { id: "1m",  days: 30,   label: "Último mes"        },
];

const PATTERN_META: Record<
  ProgressPattern,
  {
    label: string;
    icon: typeof Sparkles;
    color: "success" | "warning" | "danger" | "info";
    tint: string;
    desc: string;
  }
> = {
  recomp: {
    label: "Recomposición",
    icon: Sparkles,
    color: "success",
    tint: "bg-success/10 border-success",
    desc: "Ganas masa magra mientras pierdes grasa manteniendo el peso. El santo grial — raro pero posible en principiantes, retornados o en déficit moderado con alta proteína.",
  },
  hypertrophy: {
    label: "Hipertrofia (bulk limpio)",
    icon: TrendingUp,
    color: "success",
    tint: "bg-success/10 border-success",
    desc: "Subes peso y la mayor parte es masa magra. Superávit calórico bien ejecutado — la proporción LBM/peso muestra que la mayor parte del exceso se convirtió en músculo.",
  },
  fat_loss: {
    label: "Cut efectivo (pérdida de grasa)",
    icon: TrendingDown,
    color: "success",
    tint: "bg-success/10 border-success",
    desc: "Bajas peso y la mayor parte es grasa. Déficit calórico bien ejecutado — preservaste músculo gracias a proteína alta y/o entreno de fuerza.",
  },
  fat_gain: {
    label: "Ganancia de grasa",
    icon: AlertTriangle,
    color: "warning",
    tint: "bg-warning-light/40 border-warning",
    desc: "Subes peso pero la mayor parte es grasa. Considera: reducir superávit a ~200-300 kcal, priorizar proteína (≥2 g/kg) y revisar intensidad/volumen del entreno.",
  },
  muscle_loss: {
    label: "Pérdida de músculo",
    icon: AlertTriangle,
    color: "danger",
    tint: "bg-danger-light/40 border-danger",
    desc: "Bajas peso pero una parte importante es músculo. Señal de alarma en cut: sube proteína (≥2.2 g/kg), reduce déficit, añade entreno de fuerza o considera semana de descarga.",
  },
  stable: {
    label: "Estable",
    icon: Activity,
    color: "info",
    tint: "bg-info/10 border-info",
    desc: "Peso y composición sin cambios relevantes. Si tu meta era mantener, perfecto. Si buscabas avanzar (cut/bulk/recomp), revisa calorías, proteína o consistencia.",
  },
  insufficient: {
    label: "Datos insuficientes",
    icon: Info,
    color: "info",
    tint: "bg-brand-cream border-brand-light-tan",
    desc: "Necesitas al menos dos mediciones con peso registrado en el rango seleccionado.",
  },
};

export default function BodyProgressAnalysis({ rows, sex, heightCm }: Props) {
  const [windowId, setWindowId] = useState<string>("all");

  const windowDef = WINDOWS.find((w) => w.id === windowId)!;

  const { earlier, later } = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return { earlier: null, later: null };
    const latest = sorted[sorted.length - 1]!;
    if (windowDef.days == null) {
      return { earlier: sorted[0] ?? null, later: latest };
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDef.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const inRange = sorted.filter((r) => r.date >= cutoffStr);
    return {
      earlier: inRange[0] ?? null,
      later: inRange[inRange.length - 1] ?? latest,
    };
  }, [rows, windowDef.days]);

  const analysis = useMemo(() => {
    if (!earlier || !later) return null;
    if (earlier.id === later.id) return null;
    const e: BodyCompositionPoint = {
      date: earlier.date,
      weightKg: earlier.weightKg,
      bodyFatPercent: earlier.bodyFatPercent,
      leanMassKg: earlier.leanMassKg,
      fatMassKg: earlier.fatMassKg,
      waterPercent: earlier.waterPercent,
      visceralFat: earlier.visceralFat,
      boneMassKg: earlier.boneMassKg,
      bmr: earlier.bmr,
      method: earlier.method,
    };
    const l: BodyCompositionPoint = {
      date: later.date,
      weightKg: later.weightKg,
      bodyFatPercent: later.bodyFatPercent,
      leanMassKg: later.leanMassKg,
      fatMassKg: later.fatMassKg,
      waterPercent: later.waterPercent,
      visceralFat: later.visceralFat,
      boneMassKg: later.boneMassKg,
      bmr: later.bmr,
      method: later.method,
    };
    return analyzeProgress(e, l);
  }, [earlier, later]);

  // FFMI — toma la última medición con LBM
  const latestWithLean = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.find((r) => r.leanMassKg != null && r.leanMassKg > 0) ?? null;
  }, [rows]);

  const ffmiValue = useMemo(() => {
    if (!latestWithLean || latestWithLean.leanMassKg == null || heightCm == null) {
      return null;
    }
    return ffmi(latestWithLean.leanMassKg, heightCm);
  }, [latestWithLean, heightCm]);

  const ffmiClass = ffmiValue != null ? classifyFFMI(ffmiValue, sex) : null;

  if (rows.length === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-warm text-sm m-0">
          Registra al menos una medición para analizar tu progreso.
        </p>
      </Card>
    );
  }

  if (rows.length === 1) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-brand-dark m-0 font-semibold">
              Una sola medición en el historial.
            </p>
            <p className="text-xs text-brand-warm m-0 mt-1">
              Registra una nueva en 4-6 semanas para ver tu primer análisis
              de patrón (recomp / hipertrofia / cut efectivo / etc.).
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de ventana */}
      <Card variant="default" padding="sm" className="border-brand-light-tan">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-brand-warm font-semibold uppercase tracking-widest">
            Rango de análisis:
          </span>
          {WINDOWS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWindowId(w.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs transition",
                windowId === w.id
                  ? "bg-brand-dark text-brand-cream"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Análisis de patrón */}
      {analysis && earlier && later ? (
        <PatternCard
          analysis={analysis}
          earlier={earlier}
          later={later}
        />
      ) : (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center">
          <p className="text-brand-warm text-sm m-0">
            No hay dos mediciones distintas en este rango.
          </p>
        </Card>
      )}

      {/* FFMI */}
      {ffmiValue != null && ffmiClass && latestWithLean && (
        <FFMICard
          value={ffmiValue}
          classification={ffmiClass}
          sex={sex}
          leanMassKg={latestWithLean.leanMassKg!}
          heightCm={heightCm!}
          date={latestWithLean.date}
        />
      )}

      {heightCm == null && (
        <Card variant="default" padding="sm" className="border-brand-light-tan">
          <p className="text-xs text-brand-warm m-0 flex items-center gap-2">
            <Info size={12} /> Añade tu altura en Configuración → Perfil para
            ver tu FFMI (Fat-Free Mass Index).
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function PatternCard({
  analysis,
  earlier,
  later,
}: {
  analysis: ReturnType<typeof analyzeProgress>;
  earlier: BodyCompositionRow;
  later: BodyCompositionRow;
}) {
  const meta = PATTERN_META[analysis.pattern];
  const Icon = meta.icon;

  return (
    <Card
      variant="default"
      padding="md"
      className={cn("border-l-4", meta.tint)}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            "rounded-full w-10 h-10 flex items-center justify-center shrink-0",
            meta.color === "success" && "bg-success text-white",
            meta.color === "warning" && "bg-warning text-white",
            meta.color === "danger" && "bg-danger text-white",
            meta.color === "info" && "bg-info text-white",
          )}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
            Patrón detectado · {analysis.daysBetween} día{analysis.daysBetween === 1 ? "" : "s"}
          </p>
          <h3 className="font-serif text-xl text-brand-dark m-0">
            {meta.label}
          </h3>
          <p className="text-sm text-brand-dark m-0 mt-1.5">
            {analysis.summary}
          </p>
        </div>
      </div>

      {/* Deltas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <DeltaKpi
          label="Peso"
          delta={analysis.weightDeltaKg}
          unit="kg"
          decimals={1}
          goodDirection="neutral"
        />
        <DeltaKpi
          label="% Grasa"
          delta={analysis.bodyFatDeltaPct}
          unit="%"
          decimals={1}
          goodDirection="down"
        />
        <DeltaKpi
          label="Masa magra"
          delta={analysis.leanDeltaKg}
          unit="kg"
          decimals={1}
          goodDirection="up"
        />
        <DeltaKpi
          label="Masa grasa"
          delta={analysis.fatDeltaKg}
          unit="kg"
          decimals={1}
          goodDirection="down"
        />
      </div>

      <p className="text-xs text-brand-warm m-0 border-t border-brand-light-cream pt-3">
        {meta.desc}
      </p>

      <p className="text-[10px] text-brand-tan m-0 mt-2">
        Comparando {earlier.date} → {later.date}
      </p>
    </Card>
  );
}

function DeltaKpi({
  label,
  delta,
  unit,
  decimals,
  goodDirection,
}: {
  label: string;
  delta: number | null;
  unit: string;
  decimals: number;
  goodDirection: "up" | "down" | "neutral";
}) {
  const color =
    delta == null || Math.abs(delta) < 0.05
      ? "text-brand-warm"
      : goodDirection === "neutral"
        ? "text-brand-dark"
        : (delta > 0 && goodDirection === "up") ||
            (delta < 0 && goodDirection === "down")
          ? "text-success"
          : "text-danger";

  const isUp = delta != null && delta > 0;
  const isDown = delta != null && delta < 0;

  return (
    <div className="bg-brand-paper rounded-lg p-3 border border-brand-light-cream">
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
        {label}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {delta != null && isUp && <ArrowUp size={12} className={color} />}
        {delta != null && isDown && <ArrowDown size={12} className={color} />}
        <p className={cn("font-mono text-lg m-0", color)}>
          {delta == null
            ? "—"
            : `${delta > 0 ? "+" : ""}${delta.toFixed(decimals)}${unit}`}
        </p>
      </div>
    </div>
  );
}

const FFMI_META: Record<
  "below_average" | "average" | "above_average" | "excellent" | "suspicious",
  { label: string; color: string; desc: string }
> = {
  below_average: {
    label: "Por debajo del promedio",
    color: "text-info",
    desc: "Espacio amplio para ganar masa magra con entreno de fuerza + superávit moderado + proteína alta.",
  },
  average: {
    label: "Promedio",
    color: "text-brand-dark",
    desc: "Nivel estándar de población activa. Puedes progresar con consistencia en el entreno.",
  },
  above_average: {
    label: "Por encima del promedio",
    color: "text-success",
    desc: "Nivel de alguien entrenado. Buen progreso sostenido — sigue con sobrecarga progresiva.",
  },
  excellent: {
    label: "Excelente (nivel avanzado)",
    color: "text-success",
    desc: "Nivel de atleta experimentado. Cerca del límite natural sin sustancias exógenas.",
  },
  suspicious: {
    label: "Extraordinario (≥ límite natural)",
    color: "text-warning",
    desc: "FFMI ≥25 (♂) / ≥21 (♀) es estadísticamente sospechoso sin enhancement según Kouri 1995. Posible error en LBM/altura o genética excepcional.",
  },
};

function FFMICard({
  value,
  classification,
  sex,
  leanMassKg,
  heightCm,
  date,
}: {
  value: number;
  classification: "below_average" | "average" | "above_average" | "excellent" | "suspicious";
  sex: Sex;
  leanMassKg: number;
  heightCm: number;
  date: string;
}) {
  const meta = FFMI_META[classification];

  const scaleMax = sex === "male" ? 27 : 23;
  const percent = Math.min(100, (value / scaleMax) * 100);

  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
            FFMI · Fat-Free Mass Index
          </p>
          <h3 className="font-serif text-2xl text-brand-dark m-0">
            {value.toFixed(1)}
          </h3>
          <p className={cn("text-sm font-semibold m-0 mt-0.5", meta.color)}>
            {meta.label}
          </p>
        </div>
        <div className="text-right text-xs text-brand-warm">
          <p className="m-0">LBM {leanMassKg.toFixed(1)} kg</p>
          <p className="m-0">Altura {(heightCm / 100).toFixed(2)} m</p>
          <p className="m-0 text-[10px] text-brand-tan">Medición {date}</p>
        </div>
      </div>

      {/* Barra de escala */}
      <div className="relative h-3 rounded-full bg-brand-cream overflow-hidden mb-2">
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full",
            classification === "suspicious" ? "bg-warning" : "bg-accent",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-brand-warm font-mono mb-3">
        <span>0</span>
        <span>{sex === "male" ? "18 prom" : "14 prom"}</span>
        <span>{sex === "male" ? "22 buen" : "19 buen"}</span>
        <span>{sex === "male" ? "25 límite" : "21 límite"}</span>
      </div>

      <p className="text-xs text-brand-warm m-0 mt-1">{meta.desc}</p>

      <p className="text-[10px] text-brand-tan m-0 mt-2 border-t border-brand-light-cream pt-2">
        FFMI ajustado a altura 1.80 m según Kouri et al. 1995:
        <code className="ml-1 bg-brand-cream px-1 py-0.5 rounded">
          LBM/h² + 6.1 × (1.8 − h)
        </code>
      </p>
    </Card>
  );
}
