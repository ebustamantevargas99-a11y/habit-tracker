"use client";

/**
 * Blood markers panel — glucosa, presión arterial, lípidos, A1C, ketones.
 *
 * Feature avanzado que Cronometer tiene para integrar con CGMs. Por ahora
 * manual entry, con contexto (fasting/post-comida), gráficas de evolución
 * y clasificación según referencias médicas estándar (ACC/AHA/ADA).
 *
 * Estados:
 *   - Form para nuevo marcador (inputs agrupados por tipo: metabólico · BP · lípidos)
 *   - Gráfica de línea con selector de marcador + rango 30/90/365d
 *   - Historial tabular con delete
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Droplet,
  HeartPulse,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { Card, cn } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { todayLocal } from "@/lib/date/local";
import { useUserStore } from "@/stores/user-store";

interface BloodMarker {
  id: string;
  date: string;
  measuredAt: string | null;
  context: string | null;
  glucoseMgDl: number | null;
  a1cPercent: number | null;
  ketonesMmolL: number | null;
  insulinMuIml: number | null;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  totalCholesterol: number | null;
  hdl: number | null;
  ldl: number | null;
  triglycerides: number | null;
  source: string | null;
  notes: string | null;
}

const CONTEXT_LABELS: Record<string, string> = {
  fasting: "En ayunas",
  postprandial: "Postprandial (2h post-comida)",
  random: "Aleatorio",
  pre_meal: "Antes de comer",
  post_meal: "Después de comer",
};

const SOURCE_LABELS: Record<string, string> = {
  cgm: "CGM (continuo)",
  home_meter: "Medidor casero",
  lab: "Laboratorio",
  smartwatch: "Smartwatch",
  other: "Otro",
};

// Clasificación según ADA/AHA estándar
interface MarkerDef {
  key: keyof BloodMarker;
  label: string;
  unit: string;
  icon: typeof Droplet;
  // Rango "normal" — para ReferenceArea en gráfica
  normalMin: number;
  normalMax: number;
  decimals: number;
}

const MARKERS: MarkerDef[] = [
  { key: "glucoseMgDl",      label: "Glucosa",       unit: "mg/dL", icon: Droplet,     normalMin: 70,  normalMax: 100, decimals: 0 },
  { key: "a1cPercent",       label: "HbA1c",         unit: "%",     icon: Droplet,     normalMin: 4,   normalMax: 5.7, decimals: 1 },
  { key: "ketonesMmolL",     label: "Ketones",       unit: "mmol/L",icon: Droplet,     normalMin: 0.5, normalMax: 3,   decimals: 1 },
  { key: "insulinMuIml",     label: "Insulina",      unit: "μU/mL", icon: Droplet,     normalMin: 2,   normalMax: 25,  decimals: 1 },
  { key: "systolic",         label: "Sistólica",     unit: "mmHg",  icon: HeartPulse,  normalMin: 90,  normalMax: 120, decimals: 0 },
  { key: "diastolic",        label: "Diastólica",    unit: "mmHg",  icon: HeartPulse,  normalMin: 60,  normalMax: 80,  decimals: 0 },
  { key: "heartRate",        label: "Freq. cardíaca",unit: "bpm",   icon: HeartPulse,  normalMin: 60,  normalMax: 100, decimals: 0 },
  { key: "totalCholesterol", label: "Colesterol total",unit:"mg/dL",icon: Activity,   normalMin: 125, normalMax: 200, decimals: 0 },
  { key: "hdl",              label: "HDL",           unit: "mg/dL", icon: Activity,    normalMin: 40,  normalMax: 80,  decimals: 0 },
  { key: "ldl",              label: "LDL",           unit: "mg/dL", icon: Activity,    normalMin: 0,   normalMax: 100, decimals: 0 },
  { key: "triglycerides",    label: "Triglicéridos", unit: "mg/dL", icon: Activity,    normalMin: 0,   normalMax: 150, decimals: 0 },
];

const RANGE_OPTIONS = [
  { days: 30,  label: "30 días"  },
  { days: 90,  label: "90 días"  },
  { days: 365, label: "1 año"    },
];

export default function BloodMarkersPanel() {
  const tz = useUserStore((s) => s.user?.profile?.timezone);
  const [markers, setMarkers] = useState<BloodMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [chartMarker, setChartMarker] = useState<keyof BloodMarker>("glucoseMgDl");
  const [days, setDays] = useState(90);

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.get<BloodMarker[]>(
        `/nutrition/blood-markers?days=${days}`,
      );
      setMarkers(list ?? []);
    } catch {
      toast.error("Error cargando marcadores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function remove(id: string) {
    if (!confirm("¿Borrar este registro?")) return;
    try {
      await api.delete(`/nutrition/blood-markers/${id}`);
      setMarkers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Borrado");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error";
      toast.error(msg);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-lg text-brand-dark m-0">
            Marcadores sanguíneos
          </h3>
          <p className="text-xs text-brand-warm m-0 mt-0.5">
            Trackea glucosa, presión arterial, lípidos, A1C y ketones.
            Ingresa datos de labs, medidor casero, CGM o smartwatch.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:opacity-90 transition"
          type="button"
        >
          <Plus size={14} /> {showForm ? "Cancelar" : "Nuevo registro"}
        </button>
      </div>

      {showForm && (
        <BloodMarkerForm
          tz={tz}
          onSaved={(created) => {
            setShowForm(false);
            setMarkers((prev) => [created, ...prev]);
          }}
        />
      )}

      <LatestSummary markers={markers} />

      {/* Chart */}
      <ChartPanel
        markers={markers}
        chartMarker={chartMarker}
        setChartMarker={setChartMarker}
        days={days}
        setDays={setDays}
      />

      {/* Historial */}
      {loading ? (
        <Card
          variant="default"
          padding="sm"
          className="text-center text-brand-warm text-xs border-brand-light-tan"
        >
          <Loader2 size={12} className="inline animate-spin mr-2" /> Cargando…
        </Card>
      ) : markers.length === 0 ? (
        <Card
          variant="default"
          padding="md"
          className="border-brand-light-tan text-center"
        >
          <p className="text-sm text-brand-warm m-0">
            Sin registros aún. Añade tu primera medición con el botón
            &ldquo;Nuevo registro&rdquo;.
          </p>
        </Card>
      ) : (
        <HistoryTable markers={markers} onDelete={remove} />
      )}
    </div>
  );
}

// ─── LatestSummary ───────────────────────────────────────────────────────────

function LatestSummary({ markers }: { markers: BloodMarker[] }) {
  // Para cada tipo, busca el último valor registrado (puede estar en distintos rows)
  const latest = useMemo(() => {
    const out: Partial<Record<keyof BloodMarker, { value: number; date: string }>> = {};
    for (const m of markers) {
      for (const def of MARKERS) {
        const v = m[def.key];
        if (typeof v === "number" && Number.isFinite(v) && !out[def.key]) {
          out[def.key] = { value: v, date: m.date };
        }
      }
    }
    return out;
  }, [markers]);

  const filled = MARKERS.filter((m) => latest[m.key] != null);
  if (filled.length === 0) return null;

  return (
    <Card variant="default" padding="md" className="border-accent bg-accent/5">
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
        Últimos valores registrados
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {filled.map((def) => {
          const v = latest[def.key]!;
          const inRange = v.value >= def.normalMin && v.value <= def.normalMax;
          return (
            <div
              key={def.key}
              className="bg-brand-paper rounded-lg p-2 border border-brand-light-cream"
            >
              <p className="text-[10px] text-brand-warm m-0">{def.label}</p>
              <p
                className={cn(
                  "font-mono text-base m-0 mt-0.5",
                  inRange ? "text-success" : "text-warning",
                )}
              >
                {v.value.toFixed(def.decimals)}{" "}
                <span className="text-[10px] text-brand-warm">{def.unit}</span>
              </p>
              <p className="text-[9px] text-brand-tan m-0 mt-0.5">
                {v.date}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── ChartPanel ──────────────────────────────────────────────────────────────

function ChartPanel({
  markers,
  chartMarker,
  setChartMarker,
  days,
  setDays,
}: {
  markers: BloodMarker[];
  chartMarker: keyof BloodMarker;
  setChartMarker: (k: keyof BloodMarker) => void;
  days: number;
  setDays: (d: number) => void;
}) {
  const def = MARKERS.find((m) => m.key === chartMarker)!;

  const points = useMemo(() => {
    return markers
      .map((m) => ({
        date: m.date,
        value: m[chartMarker] as number | null,
      }))
      .filter(
        (p): p is { date: string; value: number } =>
          typeof p.value === "number" && Number.isFinite(p.value),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [markers, chartMarker]);

  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h4 className="font-serif text-base text-brand-dark m-0">
            Evolución — {def.label}
          </h4>
          <p className="text-xs text-brand-warm m-0 mt-0.5">
            Zona verde = rango normal {def.normalMin}-{def.normalMax} {def.unit}.
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] transition",
                days === r.days
                  ? "bg-brand-dark text-brand-cream"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de marcador */}
      <div className="flex gap-1 flex-wrap mb-4">
        {MARKERS.map((m) => (
          <button
            key={m.key as string}
            onClick={() => setChartMarker(m.key)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] transition",
              chartMarker === m.key
                ? "bg-accent text-white"
                : "bg-brand-paper text-brand-medium border border-brand-light-cream hover:bg-brand-cream",
            )}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>

      {points.length < 2 ? (
        <div className="text-center py-10 text-brand-warm text-sm bg-brand-warm-white rounded-lg border border-brand-light-cream">
          Necesitas ≥2 puntos de {def.label} para graficar la evolución.
        </div>
      ) : (
        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD1" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#8B6F4A", fontSize: 11 }}
                stroke="#D4C5AD"
              />
              <YAxis
                tick={{ fill: "#8B6F4A", fontSize: 11 }}
                stroke="#D4C5AD"
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FEFCF7",
                  border: "1px solid #E8DFD1",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [
                  `${v.toFixed(def.decimals)} ${def.unit}`,
                  def.label,
                ]}
              />
              <ReferenceArea
                y1={def.normalMin}
                y2={def.normalMax}
                fill="#5B8D5B"
                fillOpacity={0.08}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#B8864A"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#B8864A" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ─── HistoryTable ────────────────────────────────────────────────────────────

function HistoryTable({
  markers,
  onDelete,
}: {
  markers: BloodMarker[];
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      variant="default"
      padding="none"
      className="border-brand-light-tan overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-brand-light-cream bg-brand-warm-white">
        <h3 className="font-serif text-base text-brand-dark m-0">
          Historial ({markers.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-cream">
              <Th>Fecha</Th>
              <Th>Contexto</Th>
              <Th align="right">Glucosa</Th>
              <Th align="right">BP</Th>
              <Th align="right">FC</Th>
              <Th align="right">LDL</Th>
              <Th align="right">HDL</Th>
              <Th align="right">A1C</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {markers.map((m) => (
              <tr
                key={m.id}
                className="border-t border-brand-light-cream hover:bg-brand-warm-white"
              >
                <td className="px-3 py-2 font-mono text-xs text-brand-dark">
                  {m.date}
                </td>
                <td className="px-2 py-2 text-xs text-brand-warm">
                  {m.context ? CONTEXT_LABELS[m.context] ?? m.context : "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-brand-dark">
                  {m.glucoseMgDl ?? "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-brand-dark">
                  {m.systolic != null && m.diastolic != null
                    ? `${m.systolic}/${m.diastolic}`
                    : "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-brand-dark">
                  {m.heartRate ?? "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-brand-dark">
                  {m.ldl ?? "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-brand-dark">
                  {m.hdl ?? "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-brand-dark">
                  {m.a1cPercent != null ? `${m.a1cPercent}%` : "—"}
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => onDelete(m.id)}
                    className="p-1 rounded hover:bg-danger-light/40 text-brand-warm hover:text-danger"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-2 py-2 text-[10px] uppercase tracking-widest text-brand-medium",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

// ─── BloodMarkerForm ─────────────────────────────────────────────────────────

function BloodMarkerForm({
  tz,
  onSaved,
}: {
  tz?: string;
  onSaved: (m: BloodMarker) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    date: todayLocal(tz),
    context: "",
    source: "",
    glucoseMgDl: "",
    a1cPercent: "",
    ketonesMmolL: "",
    insulinMuIml: "",
    systolic: "",
    diastolic: "",
    heartRate: "",
    totalCholesterol: "",
    hdl: "",
    ldl: "",
    triglycerides: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function numOrNull(k: string): number | null {
    const v = form[k];
    if (!v) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  function intOrNull(k: string): number | null {
    const v = form[k];
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        context: form.context || null,
        source: form.source || null,
        notes: form.notes.trim() || null,
        glucoseMgDl: numOrNull("glucoseMgDl"),
        a1cPercent: numOrNull("a1cPercent"),
        ketonesMmolL: numOrNull("ketonesMmolL"),
        insulinMuIml: numOrNull("insulinMuIml"),
        systolic: intOrNull("systolic"),
        diastolic: intOrNull("diastolic"),
        heartRate: intOrNull("heartRate"),
        totalCholesterol: numOrNull("totalCholesterol"),
        hdl: numOrNull("hdl"),
        ldl: numOrNull("ldl"),
        triglycerides: numOrNull("triglycerides"),
      };
      const created = await api.post<BloodMarker>(
        "/nutrition/blood-markers",
        payload,
      );
      toast.success("Registro guardado");
      onSaved(created);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card variant="default" padding="md" className="border-accent">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-serif text-base text-brand-dark m-0">
          Nuevo registro
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Field label="Fecha">
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={INP}
          />
        </Field>
        <Field label="Contexto">
          <select
            value={form.context}
            onChange={(e) => set("context", e.target.value)}
            className={INP}
          >
            <option value="">—</option>
            {Object.entries(CONTEXT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fuente">
          <select
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className={INP}
          >
            <option value="">—</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <FormGroup title="Glucosa + metabolismo">
        <Field label="Glucosa (mg/dL)">
          <NumIn value={form.glucoseMgDl} onChange={(v) => set("glucoseMgDl", v)} placeholder="95" />
        </Field>
        <Field label="A1C (%)">
          <NumIn value={form.a1cPercent} onChange={(v) => set("a1cPercent", v)} step="0.1" placeholder="5.4" />
        </Field>
        <Field label="Ketones (mmol/L)">
          <NumIn value={form.ketonesMmolL} onChange={(v) => set("ketonesMmolL", v)} step="0.1" />
        </Field>
        <Field label="Insulina (μU/mL)">
          <NumIn value={form.insulinMuIml} onChange={(v) => set("insulinMuIml", v)} step="0.1" />
        </Field>
      </FormGroup>

      <FormGroup title="Presión arterial">
        <Field label="Sistólica (mmHg)">
          <NumIn value={form.systolic} onChange={(v) => set("systolic", v)} placeholder="120" />
        </Field>
        <Field label="Diastólica (mmHg)">
          <NumIn value={form.diastolic} onChange={(v) => set("diastolic", v)} placeholder="80" />
        </Field>
        <Field label="FC reposo (bpm)">
          <NumIn value={form.heartRate} onChange={(v) => set("heartRate", v)} placeholder="68" />
        </Field>
      </FormGroup>

      <FormGroup title="Perfil lipídico">
        <Field label="Total (mg/dL)">
          <NumIn value={form.totalCholesterol} onChange={(v) => set("totalCholesterol", v)} placeholder="180" />
        </Field>
        <Field label="HDL">
          <NumIn value={form.hdl} onChange={(v) => set("hdl", v)} placeholder="60" />
        </Field>
        <Field label="LDL">
          <NumIn value={form.ldl} onChange={(v) => set("ldl", v)} placeholder="90" />
        </Field>
        <Field label="Triglicéridos">
          <NumIn value={form.triglycerides} onChange={(v) => set("triglycerides", v)} placeholder="100" />
        </Field>
      </FormGroup>

      <div className="mb-3">
        <Field label="Notas">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="— post-ayuno, post-comida alta en carbs, tras ejercicio, etc."
            className={cn(INP, "resize-none")}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
          type="button"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Card>
  );
}

function FormGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
        {title}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumIn({
  value,
  onChange,
  placeholder,
  step = "1",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INP}
    />
  );
}

const INP =
  "w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm text-brand-dark box-border";
