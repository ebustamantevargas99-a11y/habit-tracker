"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, CheckSquare, Square, Plus, Trash2, Pill } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type Ritual = {
  date: string;
  sleepTime: string | null;
  reflection: string | null;
  gratitude: string[];
  tomorrowTop3: string[];
  medsDone: boolean;
};

export default function EveningRitualPanel() {
  const today = new Date().toISOString().split("T")[0];
  const [ritual, setRitual] = useState<Ritual>({
    date: today,
    sleepTime: null,
    reflection: null,
    gratitude: [],
    tomorrowTop3: [],
    medsDone: false,
  });
  const [newGratitude, setNewGratitude] = useState("");
  const [newTop3, setNewTop3] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Ritual | null>(`/lifeos/evening-ritual?date=${today}`)
      .then((d) => {
        if (d) setRitual(d);
      })
      .catch(() => {});
  }, [today]);

  async function save(patch: Partial<Ritual>) {
    const next = { ...ritual, ...patch };
    setRitual(next);
    setSaving(true);
    try {
      await api.put<Ritual>("/lifeos/evening-ritual", { date: today, ...patch });
    } catch {
      toast.error("Error guardando");
    } finally {
      setSaving(false);
    }
  }

  function addGratitude() {
    if (!newGratitude.trim() || ritual.gratitude.length >= 10) return;
    void save({ gratitude: [...ritual.gratitude, newGratitude.trim()] });
    setNewGratitude("");
  }

  function addTop3() {
    if (!newTop3.trim() || ritual.tomorrowTop3.length >= 3) return;
    void save({ tomorrowTop3: [...ritual.tomorrowTop3, newTop3.trim()] });
    setNewTop3("");
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-brand-dark to-brand-brown text-brand-paper rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Moon size={26} className="text-accent-glow" />
          <div>
            <h2 className="font-display text-xl font-bold text-accent-glow m-0">
              Cierre del día 🌙
            </h2>
            <p className="text-xs text-brand-light-tan">
              Prepárate para descansar. Reflexiona. Agradece.
            </p>
          </div>
          {saving && <span className="text-[11px] text-brand-light-tan ml-auto">guardando…</span>}
        </div>
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Reflexión del día
        </label>
        <textarea
          value={ritual.reflection ?? ""}
          onChange={(e) => setRitual({ ...ritual, reflection: e.target.value })}
          onBlur={(e) => void save({ reflection: e.target.value })}
          rows={4}
          placeholder="¿Cómo te fue hoy? ¿Qué aprendiste? ¿Qué cambiarías?"
          className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          3 gratitudes
        </label>
        <div className="space-y-2 mb-3">
          {ritual.gratitude.map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-brand-warm-white rounded-lg px-3 py-2"
            >
              <span className="text-accent">✨</span>
              <span className="flex-1 text-sm text-brand-dark">{g}</span>
              <button
                onClick={() =>
                  void save({ gratitude: ritual.gratitude.filter((_, idx) => idx !== i) })
                }
                className="p-1 text-brand-warm hover:text-danger"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        {ritual.gratitude.length < 10 && (
          <div className="flex gap-2">
            <input
              value={newGratitude}
              onChange={(e) => setNewGratitude(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGratitude()}
              placeholder="Algo bueno de hoy…"
              className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            <button
              onClick={addGratitude}
              className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Top 3 para mañana
        </label>
        <div className="space-y-2 mb-3">
          {ritual.tomorrowTop3.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-brand-warm-white rounded-lg px-3 py-2"
            >
              <span className="text-accent font-bold">{i + 1}.</span>
              <span className="flex-1 text-sm text-brand-dark">{t}</span>
              <button
                onClick={() =>
                  void save({
                    tomorrowTop3: ritual.tomorrowTop3.filter((_, idx) => idx !== i),
                  })
                }
                className="p-1 text-brand-warm hover:text-danger"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        {ritual.tomorrowTop3.length < 3 && (
          <div className="flex gap-2">
            <input
              value={newTop3}
              onChange={(e) => setNewTop3(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTop3()}
              placeholder="Una tarea prioritaria de mañana…"
              className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            <button
              onClick={addTop3}
              className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      <label
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition",
          ritual.medsDone
            ? "bg-success/10 border-success text-success"
            : "bg-brand-paper border-brand-cream hover:border-success/50"
        )}
      >
        <input
          type="checkbox"
          checked={ritual.medsDone}
          onChange={(e) => void save({ medsDone: e.target.checked })}
          className="sr-only"
        />
        {ritual.medsDone ? <CheckSquare size={22} /> : <Square size={22} />}
        <Pill size={18} />
        <div>
          <p className="text-sm font-semibold">Medicamentos tomados</p>
          <p className="text-[11px] opacity-70">Si aplica</p>
        </div>
      </label>
    </div>
  );
}
