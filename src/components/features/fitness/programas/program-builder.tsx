"use client";
import { todayLocal } from "@/lib/date/local";

import React, { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui";
import { api } from "@/lib/api-client";

const PROGRAM_TYPES = [
  { id: "linear",     label: "Linear" },
  { id: "dup",        label: "DUP (daily undulating)" },
  { id: "block",      label: "Block" },
  { id: "conjugate",  label: "Conjugate" },
  { id: "custom",     label: "Custom" },
];

const GOALS = [
  { id: "hypertrophy", label: "Hipertrofia" },
  { id: "strength",    label: "Fuerza" },
  { id: "power",       label: "Potencia" },
  { id: "endurance",   label: "Resistencia" },
  { id: "general",     label: "General" },
];

export default function ProgramBuilder({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("Mi programa custom");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("linear");
  const [goal, setGoal] = useState("general");
  const [durationWeeks, setDurationWeeks] = useState("8");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [activateNow, setActivateNow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/fitness/programs", {
        name: name.trim(),
        description: description.trim() || null,
        type,
        goal,
        durationWeeks: parseInt(durationWeeks, 10) || 8,
        daysPerWeek: parseInt(daysPerWeek, 10) || 4,
        startDate: todayLocal(),
        active: activateNow,
        schedule: [],
      });
      toast.success("Programa creado");
      onCreated?.();
      setName("Mi programa custom");
      setDescription("");
      setActivateNow(false);
    } catch {
      toast.error("Error creando el programa");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
        Builder custom
      </h3>
      <p className="text-brand-warm text-xs m-0 mb-4">
        Crea un programa desde cero. Por ahora solo metadatos — el editor de
        schedule + phases visual llega en una próxima iteración.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué persigue este bloque, notas de programación…"
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm h-20"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          >
            {PROGRAM_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Objetivo
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          >
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Duración (semanas)
          </label>
          <input
            type="number"
            min="1"
            max="52"
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Días por semana
          </label>
          <input
            type="number"
            min="1"
            max="7"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-dark mt-4">
        <input
          type="checkbox"
          checked={activateNow}
          onChange={(e) => setActivateNow(e.target.checked)}
          className="accent-accent"
        />
        Activar inmediatamente (desactiva el programa activo actual)
      </label>

      <div className="flex justify-end mt-4">
        <button
          onClick={create}
          disabled={submitting}
          className="px-6 py-2.5 rounded-button bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition"
        >
          {submitting ? "Creando…" : "Crear programa"}
        </button>
      </div>
    </Card>
  );
}
