"use client";

/**
 * Hub "Composición" — bioimpedancia como feature estrella del rediseño.
 *
 * Tres sub-tabs:
 *   - Registro: form + última medición destacada + tabla del historial
 *   - Evolución: gráficas de línea por métrica (peso, %grasa, LBM, etc.)
 *   - Análisis: detección de patrón (recomp / hipertrofia / fat_loss /
 *     muscle_loss / fat_gain / stable) + FFMI con clasificación Kouri
 *
 * Infra ya lista:
 *   - Modelo Prisma BodyComposition con 9 campos (weight, %grasa, LBM,
 *     fatMass, water, visceral, bone, BMR, method)
 *   - GET/POST /api/nutrition/body-composition (derivación automática de LBM
 *     y fatMass desde peso + %grasa)
 *   - PATCH/DELETE /api/nutrition/body-composition/[id]
 *   - src/lib/nutrition/body-composition.ts (classifyBodyFat ACE, visceral
 *     scale, Navy tape, analyzeProgress 7 patrones, FFMI)
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, Tabs, cn } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { todayLocal } from "@/lib/date/local";
import { useUserStore } from "@/stores/user-store";
import {
  classifyBodyFat,
  bodyFatLabel,
  classifyVisceralFat,
  type Sex,
} from "@/lib/nutrition/body-composition";
import BodyEvolutionChart from "../composicion/body-evolution-chart";
import BodyProgressAnalysis from "../composicion/body-progress-analysis";

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

const METHOD_LABELS: Record<string, string> = {
  dexa: "DEXA (gold standard)",
  bia: "Bioimpedancia (BIA)",
  caliper: "Plicómetro / Caliper",
  navy_tape: "Navy tape (cintura)",
  photo_estimate: "Estimación por foto",
  scale: "Báscula inteligente",
};

const SUB_TABS = [
  { id: "registro",  label: "📋 Registro"  },
  { id: "evolucion", label: "📈 Evolución" },
  { id: "analisis",  label: "🧠 Análisis"  },
];

export default function ComposicionHub() {
  const { user } = useUserStore();
  const sex: Sex = user?.profile?.biologicalSex === "female" ? "female" : "male";
  const tz = user?.profile?.timezone;
  const heightCm = user?.profile?.heightCm ?? null;

  const [rows, setRows] = useState<BodyCompositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<string>("registro");
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.get<BodyCompositionRow[]>(
        "/nutrition/body-composition?days=365",
      );
      setRows(list);
    } catch {
      toast.error("Error cargando mediciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function remove(id: string) {
    if (!confirm("¿Borrar esta medición?")) return;
    try {
      await api.delete(`/nutrition/body-composition/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Borrada");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error";
      toast.error(msg);
    }
  }

  const latest = rows[0] ?? null;

  return (
    <section>
      <header className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-[24px] text-brand-dark m-0">
            Composición corporal
          </h2>
          <p className="text-brand-warm text-sm m-0 mt-1">
            Registros de bioimpedancia (BIA), DEXA, plicómetro o Navy tape.
            La app deriva masa magra y grasa automáticamente si das peso +
            % grasa, detecta patrones de progreso y calcula tu FFMI.
          </p>
        </div>
        {subTab === "registro" && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus size={14} /> {showForm ? "Cancelar" : "Nueva medición"}
          </button>
        )}
      </header>

      <Tabs
        tabs={SUB_TABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "registro" && (
        <div className="flex flex-col gap-6">
          {showForm && (
            <NewMeasurementForm
              tz={tz}
              onSaved={(created) => {
                setShowForm(false);
                setRows((prev) =>
                  [created, ...prev.filter((r) => r.id !== created.id)].sort(
                    (a, b) => b.date.localeCompare(a.date),
                  ),
                );
              }}
            />
          )}

          {latest && <LatestSummary row={latest} sex={sex} />}

          {loading && rows.length === 0 ? (
            <Card
              variant="default"
              padding="md"
              className="border-brand-light-tan text-center text-brand-warm text-sm"
            >
              <Loader2 size={14} className="inline animate-spin mr-2" />
              Cargando…
            </Card>
          ) : rows.length === 0 ? (
            <EmptyStateCard sex={sex} />
          ) : (
            <HistoryTable rows={rows} sex={sex} onDelete={remove} />
          )}

          <MetricsExplainer />
        </div>
      )}

      {subTab === "evolucion" && <BodyEvolutionChart rows={rows} />}

      {subTab === "analisis" && (
        <BodyProgressAnalysis rows={rows} sex={sex} heightCm={heightCm} />
      )}
    </section>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function LatestSummary({
  row,
  sex,
}: {
  row: BodyCompositionRow;
  sex: Sex;
}) {
  const bfCat =
    row.bodyFatPercent != null ? bodyFatLabel(row.bodyFatPercent, sex) : null;
  const visceralCat =
    row.visceralFat != null ? classifyVisceralFat(row.visceralFat) : null;

  const kpis: Array<{ label: string; value: string; sub?: string; color?: string }> = [];
  if (row.weightKg != null)
    kpis.push({ label: "Peso", value: `${row.weightKg.toFixed(1)} kg` });
  if (row.bodyFatPercent != null) {
    kpis.push({
      label: "% Grasa",
      value: `${row.bodyFatPercent.toFixed(1)}%`,
      sub: bfCat?.label,
      color: bfCat?.color,
    });
  }
  if (row.leanMassKg != null)
    kpis.push({ label: "Masa magra", value: `${row.leanMassKg.toFixed(1)} kg` });
  if (row.fatMassKg != null)
    kpis.push({ label: "Masa grasa", value: `${row.fatMassKg.toFixed(1)} kg` });
  if (row.waterPercent != null)
    kpis.push({ label: "Agua", value: `${row.waterPercent.toFixed(1)}%` });
  if (row.visceralFat != null) {
    kpis.push({
      label: "Visceral",
      value: `${row.visceralFat}`,
      sub:
        visceralCat === "healthy"
          ? "Saludable"
          : visceralCat === "elevated"
            ? "Elevado"
            : "Alto",
      color:
        visceralCat === "healthy"
          ? "success"
          : visceralCat === "elevated"
            ? "warning"
            : "danger",
    });
  }
  if (row.boneMassKg != null)
    kpis.push({ label: "Masa ósea", value: `${row.boneMassKg.toFixed(2)} kg` });
  if (row.bmr != null) kpis.push({ label: "BMR", value: `${row.bmr} kcal` });

  return (
    <Card variant="default" padding="md" className="border-accent bg-accent/5">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-serif text-lg text-brand-dark m-0">
          Última medición
        </h3>
        <p className="text-xs text-brand-warm m-0">
          {row.date}{" "}
          {row.method && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-cream text-brand-medium">
              {METHOD_LABELS[row.method] ?? row.method}
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-brand-paper rounded-lg p-3 border border-brand-light-cream"
          >
            <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
              {k.label}
            </p>
            <p className="font-mono text-xl text-brand-dark m-0 mt-0.5">
              {k.value}
            </p>
            {k.sub && (
              <p
                className={cn(
                  "text-[10px] font-semibold m-0 mt-0.5",
                  k.color === "success" && "text-success",
                  k.color === "warning" && "text-warning",
                  k.color === "danger" && "text-danger",
                  k.color === "info" && "text-info",
                )}
              >
                {k.sub}
              </p>
            )}
          </div>
        ))}
      </div>
      {row.notes && (
        <p className="text-xs text-brand-warm italic m-0 mt-3">{row.notes}</p>
      )}
    </Card>
  );
}

function HistoryTable({
  rows,
  sex,
  onDelete,
}: {
  rows: BodyCompositionRow[];
  sex: Sex;
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
          Historial ({rows.length} medicion{rows.length === 1 ? "" : "es"})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-cream">
              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-brand-medium">Fecha</th>
              <th className="text-right px-2 py-2 text-[10px] uppercase tracking-widest text-brand-medium">Peso</th>
              <th className="text-right px-2 py-2 text-[10px] uppercase tracking-widest text-brand-medium">% Grasa</th>
              <th className="text-right px-2 py-2 text-[10px] uppercase tracking-widest text-brand-medium">LBM</th>
              <th className="text-right px-2 py-2 text-[10px] uppercase tracking-widest text-brand-medium">Visceral</th>
              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-widest text-brand-medium">Método</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const bfCat =
                r.bodyFatPercent != null
                  ? classifyBodyFat(r.bodyFatPercent, sex)
                  : null;
              return (
                <tr
                  key={r.id}
                  className="border-t border-brand-light-cream hover:bg-brand-warm-white"
                >
                  <td className="px-3 py-2 text-brand-dark font-mono text-xs">
                    {r.date}
                  </td>
                  <td className="px-2 py-2 text-right text-brand-dark font-mono">
                    {r.weightKg != null ? `${r.weightKg.toFixed(1)}` : "—"}
                  </td>
                  <td className="px-2 py-2 text-right text-brand-dark font-mono">
                    {r.bodyFatPercent != null
                      ? `${r.bodyFatPercent.toFixed(1)}%`
                      : "—"}
                    {bfCat && (
                      <span className="ml-1 text-[9px] text-brand-warm uppercase">
                        {bfCat.slice(0, 3)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-brand-dark font-mono">
                    {r.leanMassKg != null ? `${r.leanMassKg.toFixed(1)}` : "—"}
                  </td>
                  <td className="px-2 py-2 text-right text-brand-dark font-mono">
                    {r.visceralFat ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-brand-warm text-xs">
                    {r.method
                      ? METHOD_LABELS[r.method]?.split(" ")[0] ?? r.method
                      : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => onDelete(r.id)}
                      className="p-1 rounded hover:bg-danger-light/40 text-brand-warm hover:text-danger"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EmptyStateCard({ sex: _sex }: { sex: Sex }) {
  return (
    <Card
      variant="default"
      padding="md"
      className="border-brand-light-tan text-center"
    >
      <h3 className="font-serif text-lg text-brand-dark m-0">
        Registra tu primera medición
      </h3>
      <p className="text-brand-warm text-sm m-0 mt-2 max-w-md mx-auto">
        Si tienes báscula de bioimpedancia (Tanita, Omron, InBody, Xiaomi Mi
        Body) anota peso + % grasa — la app deriva masa magra y grasa
        automáticamente. Si no, usa Navy tape (cintura + cuello + altura)
        desde el form.
      </p>
    </Card>
  );
}

function MetricsExplainer() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-3">
        ¿Qué significa cada métrica?
      </h3>
      <ul className="text-sm text-brand-dark list-none p-0 m-0 flex flex-col gap-2">
        <li>
          <strong>% Grasa corporal</strong> — porcentaje del peso total que es
          tejido adiposo. Clasificación ACE:{" "}
          <em>atleta 6-13% (♂)/14-20% (♀)</em>,{" "}
          <em>fitness 14-17%/21-24%</em>, <em>promedio 18-24%/25-31%</em>.
        </li>
        <li>
          <strong>Masa magra (LBM)</strong> — todo lo que no es grasa: músculo,
          huesos, órganos, agua. Subirla en cut = recomposición excelente.
        </li>
        <li>
          <strong>Masa grasa</strong> — peso × (% grasa / 100). Bajarla es el
          objetivo real del cut (no bajar &quot;peso&quot; sin distinguir).
        </li>
        <li>
          <strong>% Agua</strong> — hidratación corporal total. Baja con
          deshidratación o glicógeno bajo. Rango sano: 50-65% (♂) · 45-60%
          (♀).
        </li>
        <li>
          <strong>Grasa visceral</strong> — índice 1-60 que refleja grasa
          alrededor de órganos internos. &lt;10 saludable · 10-14 elevado ·
          ≥15 alto riesgo metabólico. La más dañina para la salud.
        </li>
        <li>
          <strong>BMR (Basal Metabolic Rate)</strong> — calorías que quema tu
          cuerpo en reposo absoluto (~60-70% de tu gasto diario total).
        </li>
      </ul>
    </Card>
  );
}

function NewMeasurementForm({
  tz,
  onSaved,
}: {
  tz?: string;
  onSaved: (row: BodyCompositionRow) => void;
}) {
  const [date, setDate] = useState(() => todayLocal(tz));
  const [weightKg, setWeightKg] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [waterPercent, setWaterPercent] = useState("");
  const [boneMass, setBoneMass] = useState("");
  const [bmr, setBmr] = useState("");
  const [method, setMethod] = useState<string>("bia");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        date,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        bodyFatPercent: bodyFat ? parseFloat(bodyFat) : null,
        visceralFat: visceralFat ? parseFloat(visceralFat) : null,
        waterPercent: waterPercent ? parseFloat(waterPercent) : null,
        boneMassKg: boneMass ? parseFloat(boneMass) : null,
        bmr: bmr ? parseInt(bmr, 10) : null,
        method,
        notes: notes.trim() || null,
      };
      const created = await api.post<BodyCompositionRow>(
        "/nutrition/body-composition",
        payload,
      );
      toast.success("Medición guardada");
      onSaved(created);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error guardando";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card variant="default" padding="md" className="border-accent">
      <h3 className="font-serif text-base text-brand-dark m-0 mb-3">
        Nueva medición
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Fecha">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>
        <Field label="Método">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          >
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <div />

        <Field label="Peso (kg)">
          <input
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="80.5"
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>
        <Field label="% Grasa corporal">
          <input
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="15.2"
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>
        <Field label="Grasa visceral (1-60)">
          <input
            type="number"
            value={visceralFat}
            onChange={(e) => setVisceralFat(e.target.value)}
            placeholder="8"
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>

        <Field label="% Agua corporal">
          <input
            type="number"
            step="0.1"
            value={waterPercent}
            onChange={(e) => setWaterPercent(e.target.value)}
            placeholder="55"
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>
        <Field label="Masa ósea (kg)">
          <input
            type="number"
            step="0.01"
            value={boneMass}
            onChange={(e) => setBoneMass(e.target.value)}
            placeholder="3.2"
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>
        <Field label="BMR (kcal)">
          <input
            type="number"
            value={bmr}
            onChange={(e) => setBmr(e.target.value)}
            placeholder="1800"
            className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </Field>

        <div className="sm:col-span-3">
          <Field label="Notas">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="— tras entreno, post ducha, en ayunas…"
              rows={2}
              className="w-full mt-1 px-2 py-1.5 rounded border border-brand-cream bg-brand-paper text-sm resize-none"
            />
          </Field>
        </div>
      </div>

      <p className="text-[11px] text-brand-tan mt-3 m-0">
        💡 Masa magra y grasa se calculan automáticamente si das{" "}
        <strong>peso + % grasa</strong>.
      </p>

      <div className="flex justify-end mt-4">
        <button
          onClick={save}
          disabled={saving || !weightKg}
          className="px-6 py-2 rounded-button bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition"
        >
          {saving ? "Guardando…" : "Guardar medición"}
        </button>
      </div>
    </Card>
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
