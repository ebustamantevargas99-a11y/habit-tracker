"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui";
import { colors } from "@/lib/colors";
import { api } from "@/lib/api-client";
import { todayLocal } from "@/lib/date/local";

interface Composition {
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

const METHODS: { id: string; label: string }[] = [
  { id: "scale", label: "Báscula simple" },
  { id: "bia", label: "Báscula bioimpedancia (BIA)" },
  { id: "dexa", label: "DEXA" },
  { id: "caliper", label: "Plicómetro" },
  { id: "navy_tape", label: "Cinta (Navy)" },
  { id: "photo_estimate", label: "Foto (estimado)" },
];
const METHOD_LABEL: Record<string, string> = Object.fromEntries(
  METHODS.map((m) => [m.id, m.label]),
);

const numOrNull = (s: string): number | null => {
  const v = parseFloat(s);
  return isFinite(v) ? v : null;
};

export default function BodyCompositionTab() {
  const [rows, setRows] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Form
  const [date, setDate] = useState(todayLocal());
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [method, setMethod] = useState("scale");
  const [water, setWater] = useState("");
  const [visceral, setVisceral] = useState("");
  const [bone, setBone] = useState("");
  const [bmr, setBmr] = useState("");
  const [notes, setNotes] = useState("");

  // BodyComposition es un modelo compartido; el endpoint vive bajo /nutrition
  // pero alimenta tanto Nutrición como Fitness/Cuerpo.
  const load = () => {
    api
      .get<Composition[]>("/nutrition/body-composition?days=365")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Masa magra / grasa derivadas de peso + % grasa.
  const derived = useMemo(() => {
    const w = numOrNull(weight);
    const bf = numOrNull(bodyFat);
    if (w == null || bf == null) return null;
    const fat = Math.round(w * (bf / 100) * 10) / 10;
    const lean = Math.round((w - fat) * 10) / 10;
    return { fat, lean };
  }, [weight, bodyFat]);

  const sortedAsc = useMemo(
    () => [...rows].sort((a, b) => a.date.localeCompare(b.date)),
    [rows],
  );
  const latest = rows[0] ?? null; // GET ya devuelve desc

  async function save() {
    const w = numOrNull(weight);
    const bf = numOrNull(bodyFat);
    if (w == null && bf == null) {
      toast.error("Ingresa al menos peso o % de grasa");
      return;
    }
    setSaving(true);
    try {
      // No mandamos masa magra/grasa: el servidor las deriva de peso + %grasa.
      await api.post("/nutrition/body-composition", {
        date,
        weightKg: w,
        bodyFatPercent: bf,
        waterPercent: numOrNull(water),
        visceralFat: numOrNull(visceral),
        boneMassKg: numOrNull(bone),
        bmr: bmr ? Math.round(parseFloat(bmr)) : null,
        method,
        notes: notes.trim() || null,
      });
      toast.success("Medición guardada ✓");
      setWeight(""); setBodyFat(""); setWater(""); setVisceral(""); setBone(""); setBmr(""); setNotes("");
      setLoading(true);
      load();
    } catch {
      toast.error("Error al guardar la medición");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    try {
      await api.delete(`/nutrition/body-composition/${id}`);
    } catch {
      toast.error("No se pudo eliminar");
      load();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Snapshot actual */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Snapshot label="% Grasa" value={latest?.bodyFatPercent} suffix="%" tone="text-warning" />
        <Snapshot label="Masa magra" value={latest?.leanMassKg} suffix="kg" tone="text-success" />
        <Snapshot label="Masa grasa" value={latest?.fatMassKg} suffix="kg" tone="text-accent" />
        <Snapshot label="Agua" value={latest?.waterPercent} suffix="%" tone="text-info" />
      </div>

      {/* Formulario */}
      <Card variant="warm" padding="md" className="border-brand-light-cream">
        <h3 className="text-sm font-semibold text-brand-dark m-0 mb-3">Nueva medición</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Fecha">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-full" />
          </Field>
          <Field label="Peso (kg)">
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="—" className="input w-full" />
          </Field>
          <Field label="% Grasa">
            <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="—" className="input w-full" />
          </Field>
          <Field label="Método">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input w-full">
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Derivados */}
        {derived && (
          <div className="flex gap-4 mt-3 text-xs text-brand-warm">
            <span>Masa magra estimada: <strong className="text-success">{derived.lean} kg</strong></span>
            <span>Masa grasa estimada: <strong className="text-accent">{derived.fat} kg</strong></span>
          </div>
        )}

        {/* Más campos */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1 text-xs text-brand-warm hover:text-brand-dark mt-3 transition"
        >
          {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showMore ? "Menos campos" : "Más campos (agua, visceral, ósea, BMR)"}
        </button>
        {showMore && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Field label="Agua (%)">
              <input type="number" step="0.1" value={water} onChange={(e) => setWater(e.target.value)} placeholder="—" className="input w-full" />
            </Field>
            <Field label="Grasa visceral">
              <input type="number" step="0.1" value={visceral} onChange={(e) => setVisceral(e.target.value)} placeholder="—" className="input w-full" />
            </Field>
            <Field label="Masa ósea (kg)">
              <input type="number" step="0.1" value={bone} onChange={(e) => setBone(e.target.value)} placeholder="—" className="input w-full" />
            </Field>
            <Field label="BMR (kcal)">
              <input type="number" value={bmr} onChange={(e) => setBmr(e.target.value)} placeholder="—" className="input w-full" />
            </Field>
            <div className="col-span-2 md:col-span-4">
              <Field label="Notas">
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="DEXA en clínica, ayunas…" className="input w-full" />
              </Field>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={save} disabled={saving} className="btn-primary px-6 py-2 disabled:opacity-40">
            {saving ? "Guardando…" : "Guardar medición"}
          </button>
        </div>
      </Card>

      {/* Evolución */}
      {sortedAsc.length >= 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="warm" padding="md" className="border-brand-light-cream">
            <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Evolución del % de grasa</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sortedAsc.map((r) => ({ label: r.date.slice(5), bf: r.bodyFatPercent }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: "8px" }} formatter={(v: number) => [`${v}%`, "% grasa"]} />
                <Line type="monotone" dataKey="bf" stroke={colors.warning} strokeWidth={3} dot={{ r: 3, fill: colors.warning }} name="% grasa" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card variant="warm" padding="md" className="border-brand-light-cream">
            <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Peso vs. masa magra</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sortedAsc.map((r) => ({ label: r.date.slice(5), peso: r.weightKg, magra: r.leanMassKg }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: "8px" }} />
                <Line type="monotone" dataKey="peso" stroke={colors.tan} strokeWidth={2} dot={false} name="Peso" connectNulls />
                <Line type="monotone" dataKey="magra" stroke={colors.success} strokeWidth={3} dot={false} name="Masa magra" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : !loading && (
        <Card variant="warm" padding="md" className="border-brand-light-cream text-center py-8">
          <p className="text-brand-dark font-semibold m-0">Registra 2+ mediciones para ver tu evolución</p>
          <p className="text-brand-warm text-xs m-0 mt-1">
            Mide cada 1–2 semanas con el mismo método para comparar bien.
          </p>
        </Card>
      )}

      {/* Historial */}
      {rows.length > 0 && (
        <Card variant="default" padding="none" className="border-brand-light-tan overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-light-cream text-brand-warm">
                {["Fecha", "Peso", "% Grasa", "Magra", "Método", ""].map((h, i) => (
                  <th key={h} className={`px-3 py-2 text-xs uppercase tracking-wider font-semibold ${i === 0 ? "text-left" : i === 5 ? "" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-brand-light-cream">
                  <td className="px-3 py-2 text-brand-dark font-medium">{r.date}</td>
                  <td className="px-3 py-2 text-center text-brand-dark">{r.weightKg != null ? `${r.weightKg}kg` : "—"}</td>
                  <td className="px-3 py-2 text-center text-brand-dark">{r.bodyFatPercent != null ? `${r.bodyFatPercent}%` : "—"}</td>
                  <td className="px-3 py-2 text-center text-brand-dark">{r.leanMassKg != null ? `${r.leanMassKg}kg` : "—"}</td>
                  <td className="px-3 py-2 text-center text-brand-warm text-xs">{r.method ? (METHOD_LABEL[r.method] ?? r.method) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(r.id)} className="p-1.5 text-brand-warm hover:text-danger transition" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Snapshot({ label, value, suffix, tone }: { label: string; value: number | null | undefined; suffix: string; tone: string }) {
  return (
    <Card variant="warm" padding="md" className="text-center border-brand-light-cream">
      <div className="text-[11px] text-brand-warm mb-1">{label}</div>
      <div className={`font-serif text-2xl font-bold ${value != null ? tone : "text-brand-warm"}`}>
        {value != null ? `${value}${suffix}` : "—"}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1">{label}</label>
      {children}
    </div>
  );
}
