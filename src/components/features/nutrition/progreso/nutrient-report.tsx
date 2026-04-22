"use client";

/**
 * Nutrient Report — matriz de micronutrientes con promedio diario N días
 * y top sources por nutriente.
 *
 * Muestra:
 *   - KPIs del rango (# días loggeados, # con data insuficiente)
 *   - Tabla de nutrientes: nombre · %DV barra · clasificación · expandible
 *     para ver top 5 fuentes de ese nutriente en el período
 *
 * Deficient <50% DV → rojo (falta suplementar/ajustar)
 * Low 50-75% → amarillo
 * Adequate 75-100% → verde
 * Excess 100-120% → cyan
 * Very high >120% → rojo (ej. sodio en exceso)
 */

import { useEffect, useState } from "react";
import { ChevronDown, Info, Loader2 } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";

type Classification = "deficient" | "low" | "adequate" | "excess" | "very_high";

interface TopSource {
  foodItemId: string;
  name: string;
  brand: string | null;
  amountPerDay: number;
  pctOfTotal: number;
}

interface ReportRow {
  nutrient: string;
  dailyAverage: number;
  dailyTarget: number;
  pctDv: number;
  classification: Classification;
  topSources: TopSource[];
}

interface ReportData {
  from: string;
  to: string;
  days: number;
  loggedDays: number;
  customTargetsUsed: boolean;
  reports: ReportRow[];
}

const NUTRIENT_LABELS: Record<string, { label: string; unit: string; group: string }> = {
  protein:      { label: "Proteína",      unit: "g",  group: "Macros" },
  carbs:        { label: "Carbohidratos", unit: "g",  group: "Macros" },
  fat:          { label: "Grasas",        unit: "g",  group: "Macros" },
  fiber:        { label: "Fibra",         unit: "g",  group: "Macros" },
  saturatedFat: { label: "Grasa saturada",unit: "g",  group: "Macros" },
  cholesterol:  { label: "Colesterol",    unit: "mg", group: "Macros" },
  sodium:       { label: "Sodio",         unit: "mg", group: "Macros" },
  addedSugar:   { label: "Azúcar añadida",unit: "g",  group: "Macros" },
  potassium:    { label: "Potasio",       unit: "mg", group: "Minerales" },
  calcium:      { label: "Calcio",        unit: "mg", group: "Minerales" },
  iron:         { label: "Hierro",        unit: "mg", group: "Minerales" },
  magnesium:    { label: "Magnesio",      unit: "mg", group: "Minerales" },
  zinc:         { label: "Zinc",          unit: "mg", group: "Minerales" },
  phosphorus:   { label: "Fósforo",       unit: "mg", group: "Minerales" },
  vitaminA:     { label: "Vitamina A",    unit: "μg", group: "Vitaminas" },
  vitaminC:     { label: "Vitamina C",    unit: "mg", group: "Vitaminas" },
  vitaminD:     { label: "Vitamina D",    unit: "μg", group: "Vitaminas" },
  vitaminE:     { label: "Vitamina E",    unit: "mg", group: "Vitaminas" },
  vitaminK:     { label: "Vitamina K",    unit: "μg", group: "Vitaminas" },
  thiamin:      { label: "B1 Tiamina",    unit: "mg", group: "Vitaminas" },
  riboflavin:   { label: "B2 Riboflavina",unit: "mg", group: "Vitaminas" },
  niacin:       { label: "B3 Niacina",    unit: "mg", group: "Vitaminas" },
  vitaminB6:    { label: "B6",            unit: "mg", group: "Vitaminas" },
  folate:       { label: "B9 Folato",     unit: "μg", group: "Vitaminas" },
  vitaminB12:   { label: "B12",           unit: "μg", group: "Vitaminas" },
  leucine:      { label: "Leucina",       unit: "mg", group: "Aminos" },
};

const CLASS_META: Record<
  Classification,
  { label: string; color: string; bar: string; barBg: string }
> = {
  deficient: { label: "Deficiente", color: "text-danger",  bar: "bg-danger",  barBg: "bg-danger-light/20" },
  low:       { label: "Bajo",       color: "text-warning", bar: "bg-warning", barBg: "bg-warning-light/30" },
  adequate:  { label: "Adecuado",   color: "text-success", bar: "bg-success", barBg: "bg-success/10" },
  excess:    { label: "Exceso",     color: "text-info",    bar: "bg-info",    barBg: "bg-info/10" },
  very_high: { label: "Muy alto",   color: "text-danger",  bar: "bg-danger",  barBg: "bg-danger-light/20" },
};

const RANGE_OPTIONS = [
  { days: 7,  label: "7 días"   },
  { days: 30, label: "30 días"  },
  { days: 90, label: "90 días"  },
];

export default function NutrientReport() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const r = await api.get<ReportData>(
          `/nutrition/nutrient-report?days=${days}`,
        );
        if (!cancelled) setData(r);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Error cargando");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const filtered = data
    ? data.reports.filter(
        (r) => !groupFilter || NUTRIENT_LABELS[r.nutrient]?.group === groupFilter,
      )
    : [];

  const deficient = data?.reports.filter(
    (r) => r.classification === "deficient" || r.classification === "low",
  );
  const veryHigh = data?.reports.filter((r) => r.classification === "very_high");

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="font-serif text-lg text-brand-dark m-0">
              Reporte de nutrientes
            </h3>
            <p className="text-xs text-brand-warm m-0 mt-0.5">
              Promedio diario últimos {days} días vs{" "}
              {data?.customTargetsUsed
                ? "tus targets personalizados"
                : "Daily Values FDA 2020"}
              .
            </p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs transition",
                  days === opt.days
                    ? "bg-brand-dark text-brand-cream"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por grupo */}
        <div className="flex gap-1 flex-wrap">
          {["", "Macros", "Minerales", "Vitaminas", "Aminos"].map((g) => (
            <button
              key={g || "all"}
              onClick={() => setGroupFilter(g)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] transition",
                groupFilter === g
                  ? "bg-accent text-white"
                  : "bg-brand-paper text-brand-medium border border-brand-light-cream hover:bg-brand-cream",
              )}
            >
              {g || "Todos"}
            </button>
          ))}
        </div>
      </Card>

      {/* Resumen ejecutivo */}
      {data && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiSummary
            label="Días loggeados"
            value={`${data.loggedDays}/${data.days}`}
            sub={
              data.loggedDays < data.days * 0.5
                ? "Loggear más días da data más precisa"
                : "Buena cobertura"
            }
            color={data.loggedDays >= data.days * 0.5 ? "success" : "warning"}
          />
          <KpiSummary
            label="Deficiencias detectadas"
            value={String(deficient?.length ?? 0)}
            sub={
              deficient && deficient.length > 0
                ? deficient
                    .slice(0, 3)
                    .map((d) => NUTRIENT_LABELS[d.nutrient]?.label ?? d.nutrient)
                    .join(", ")
                : "Ningún nutriente por debajo del 75%"
            }
            color={deficient && deficient.length > 0 ? "warning" : "success"}
          />
          <KpiSummary
            label="Excesos / toxicidad"
            value={String(veryHigh?.length ?? 0)}
            sub={
              veryHigh && veryHigh.length > 0
                ? veryHigh
                    .slice(0, 3)
                    .map((d) => NUTRIENT_LABELS[d.nutrient]?.label ?? d.nutrient)
                    .join(", ")
                : "Ningún nutriente >120% DV"
            }
            color={veryHigh && veryHigh.length > 0 ? "danger" : "success"}
          />
        </div>
      )}

      {loading && (
        <Card variant="default" padding="md" className="text-center border-brand-light-tan">
          <Loader2 size={14} className="inline animate-spin mr-2" />
          <span className="text-sm text-brand-warm">Calculando reporte…</span>
        </Card>
      )}

      {error && (
        <Card variant="default" padding="sm" className="border-danger bg-danger-light/20">
          <p className="text-sm text-danger m-0 flex items-center gap-2">
            <Info size={14} /> {error}
          </p>
        </Card>
      )}

      {/* Tabla */}
      {data && !loading && filtered.length > 0 && (
        <Card variant="default" padding="none" className="border-brand-light-tan overflow-hidden">
          <div className="flex flex-col">
            {filtered.map((r) => (
              <NutrientRow
                key={r.nutrient}
                row={r}
                expanded={expanded === r.nutrient}
                onToggle={() =>
                  setExpanded((prev) => (prev === r.nutrient ? null : r.nutrient))
                }
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── NutrientRow ──────────────────────────────────────────────────────────────

function NutrientRow({
  row,
  expanded,
  onToggle,
}: {
  row: ReportRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const def = NUTRIENT_LABELS[row.nutrient];
  const meta = CLASS_META[row.classification];
  const unit = def?.unit ?? "";
  const label = def?.label ?? row.nutrient;
  const barWidth = Math.min(100, row.pctDv);

  return (
    <div className="border-b border-brand-light-cream last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-warm-white transition"
        type="button"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-sm text-brand-dark font-semibold m-0">
              {label}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-brand-warm">
                {row.dailyAverage.toFixed(1)} / {row.dailyTarget} {unit}
              </span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  meta.color,
                )}
              >
                {row.pctDv}%
              </span>
            </div>
          </div>
          {/* Barra */}
          <div
            className={cn(
              "relative w-full h-2 rounded-full overflow-hidden",
              meta.barBg,
            )}
          >
            <div
              className={cn("absolute top-0 left-0 h-full rounded-full transition-all", meta.bar)}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <p className={cn("text-[10px] m-0 mt-1 font-semibold", meta.color)}>
            {meta.label}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-brand-warm shrink-0 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && row.topSources.length > 0 && (
        <div className="px-4 pb-3 bg-brand-warm-white border-t border-brand-light-cream">
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2 mt-2">
            Top fuentes de {label.toLowerCase()}
          </p>
          <div className="flex flex-col gap-1">
            {row.topSources.map((s) => (
              <div
                key={s.foodItemId}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-8 text-right font-mono text-brand-warm shrink-0">
                  {s.pctOfTotal}%
                </span>
                <div className="flex-1 relative h-4 bg-brand-cream rounded overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-accent/60"
                    style={{ width: `${s.pctOfTotal}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[11px] text-brand-dark truncate">
                    {s.name}
                    {s.brand && (
                      <span className="text-brand-warm ml-1">({s.brand})</span>
                    )}
                  </span>
                </div>
                <span className="font-mono text-brand-warm shrink-0 w-20 text-right">
                  {s.amountPerDay} {unit}/día
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && row.topSources.length === 0 && (
        <div className="px-4 py-2 bg-brand-warm-white border-t border-brand-light-cream">
          <p className="text-xs text-brand-warm m-0 italic">
            No hay fuentes registradas — los alimentos que loggeaste en este
            rango no tienen {label.toLowerCase()} en sus datos.
          </p>
        </div>
      )}
    </div>
  );
}

function KpiSummary({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "success" | "warning" | "danger";
}) {
  return (
    <Card
      variant="default"
      padding="sm"
      className={cn(
        "border",
        color === "success" && "border-success bg-success/5",
        color === "warning" && "border-warning bg-warning-light/20",
        color === "danger" && "border-danger bg-danger-light/20",
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
        {label}
      </p>
      <p className="font-mono text-2xl text-brand-dark m-0 mt-0.5">
        {value}
      </p>
      <p className="text-[11px] text-brand-warm m-0 mt-1">{sub}</p>
    </Card>
  );
}
