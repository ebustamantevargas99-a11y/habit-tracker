"use client";
import { todayLocal } from "@/lib/date/local";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import {
  computeReadiness,
  type ReadinessInputs,
  type Recommendation,
} from "@/lib/fitness/training-load";

const SLIDER_DEFS: Array<{
  key: keyof ReadinessInputs;
  label: string;
  hint: string;
  min: number;
  max: number;
  invert?: boolean;
  step?: number;
}> = [
  { key: "sleepHours",   label: "Horas de sueño",  hint: "anoche",                         min: 0, max: 12, step: 0.5 },
  { key: "sleepQuality", label: "Calidad del sueño", hint: "1 pésimo · 10 excelente",      min: 1, max: 10 },
  { key: "soreness",     label: "Dolor muscular",   hint: "1 nada · 10 muy adolorido",    min: 1, max: 10, invert: true },
  { key: "stress",       label: "Estrés",           hint: "1 calmado · 10 muy estresado", min: 1, max: 10, invert: true },
  { key: "mood",         label: "Humor",            hint: "1 mal · 10 excelente",         min: 1, max: 10 },
  { key: "energy",       label: "Energía",          hint: "1 agotado · 10 lleno",         min: 1, max: 10 },
  { key: "motivation",   label: "Motivación",       hint: "1 nada · 10 total",            min: 1, max: 10 },
];

interface ReadinessRow {
  id: string;
  date: string;
  score: number | null;
  recommendation: Recommendation | null;
}

const COLOR_BY_REC: Record<Recommendation, string> = {
  go_hard:  "bg-success text-white",
  moderate: "bg-info text-white",
  light:    "bg-warning text-white",
  rest:     "bg-danger text-white",
};

export default function ReadinessCheck({ onSaved }: { onSaved?: () => void }) {
  const [values, setValues] = useState<ReadinessInputs>({
    sleepHours: 7,
    sleepQuality: 7,
    soreness: 3,
    stress: 4,
    mood: 7,
    energy: 7,
    motivation: 7,
  });
  const [restingHr, setRestingHr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [recentChecks, setRecentChecks] = useState<ReadinessRow[]>([]);

  useEffect(() => {
    // Precargar check de hoy si ya existe
    const today = todayLocal();
    api
      .get<ReadinessRow[]>(`/fitness/readiness?days=14`)
      .then((rows) => {
        setRecentChecks(rows);
        const todayRow = rows.find((r) => r.date === today);
        if (todayRow) {
          api
            .get<ReadinessRow & ReadinessInputs & { restingHr: number | null; notes: string | null }>(
              `/fitness/readiness?days=1`,
            )
            .then((list) => {
              const extended = (list as unknown as Array<
                ReadinessRow & ReadinessInputs & { restingHr: number | null; notes: string | null }
              >).find((r) => r.date === today);
              if (!extended) return;
              setValues({
                sleepHours: extended.sleepHours ?? 7,
                sleepQuality: extended.sleepQuality ?? 7,
                soreness: extended.soreness ?? 3,
                stress: extended.stress ?? 4,
                mood: extended.mood ?? 7,
                energy: extended.energy ?? 7,
                motivation: extended.motivation ?? 7,
              });
              setRestingHr(extended.restingHr != null ? String(extended.restingHr) : "");
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const result = useMemo(() => computeReadiness(values), [values]);

  async function save() {
    setSubmitting(true);
    try {
      const today = todayLocal();
      await api.post("/fitness/readiness", {
        date: today,
        sleepHours: values.sleepHours ?? null,
        sleepQuality: values.sleepQuality ?? null,
        soreness: values.soreness ?? null,
        stress: values.stress ?? null,
        mood: values.mood ?? null,
        energy: values.energy ?? null,
        motivation: values.motivation ?? null,
        restingHr: restingHr ? parseInt(restingHr, 10) : null,
        notes: notes.trim() || null,
      });
      toast.success(`Readiness: ${result.score}/100 · ${result.label}`);
      onSaved?.();
      // Refresh historial
      api.get<ReadinessRow[]>(`/fitness/readiness?days=14`).then(setRecentChecks).catch(() => {});
    } catch {
      toast.error("Error guardando readiness");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-serif text-lg text-brand-dark m-0">
              ¿Cómo estás hoy?
            </h3>
            <p className="text-brand-warm text-xs m-0 mt-0.5">
              5 sliders + calidad de sueño. La app ajusta la intensidad sugerida
              del día según el score resultante.
            </p>
          </div>
          <div className={cn("rounded-xl px-4 py-3 text-right min-w-[160px]", COLOR_BY_REC[result.recommendation])}>
            <p className="text-[10px] uppercase tracking-widest opacity-80 m-0">
              Recomendación
            </p>
            <p className="font-mono text-2xl m-0">{result.score}</p>
            <p className="text-sm font-semibold m-0 mt-1">{result.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SLIDER_DEFS.map((def) => {
            const v = values[def.key];
            const numV = typeof v === "number" ? v : 0;
            return (
              <div key={String(def.key)}>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold text-brand-dark">
                    {def.label}
                  </label>
                  <span className="font-mono text-sm text-accent">
                    {numV}
                    {def.key === "sleepHours" ? "h" : "/10"}
                  </span>
                </div>
                <p className="text-[11px] text-brand-warm mt-0.5 mb-1">{def.hint}</p>
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step ?? 1}
                  value={numV}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [def.key]: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-accent"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              HR en reposo (opcional)
            </label>
            <input
              type="number"
              value={restingHr}
              onChange={(e) => setRestingHr(e.target.value)}
              placeholder="bpm"
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Notas
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="— p.ej. sueño interrumpido"
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            />
          </div>
        </div>

        <p className="text-sm text-brand-dark mt-4 m-0">{result.description}</p>

        <div className="flex justify-end mt-4">
          <button
            onClick={save}
            disabled={submitting}
            className="px-6 py-2.5 rounded-button bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition"
          >
            {submitting ? "Guardando…" : "Guardar readiness"}
          </button>
        </div>
      </Card>

      {recentChecks.length > 0 && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-base text-brand-dark m-0 mb-3">
            Últimos 14 días
          </h3>
          <div className="flex gap-2 flex-wrap">
            {recentChecks
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs min-w-[80px] text-center",
                    c.recommendation ? COLOR_BY_REC[c.recommendation] : "bg-brand-cream text-brand-warm",
                  )}
                  title={`${c.date} · ${c.score ?? "—"}/100`}
                >
                  <p className="m-0 text-[10px] opacity-80">
                    {c.date.slice(5)}
                  </p>
                  <p className="m-0 font-mono text-base">{c.score ?? "—"}</p>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
