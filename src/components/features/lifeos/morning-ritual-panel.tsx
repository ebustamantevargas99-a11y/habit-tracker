"use client";
import { todayLocal } from "@/lib/date/local";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Droplet, Wind, Sun, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";

type Ritual = {
  date: string;
  wakeTime: string | null;
  hydration: boolean;
  meditation: boolean;
  intention: string | null;
  gratitude: string[];
  energy: number | null;
};

export default function MorningRitualPanel() {
  const today = todayLocal();
  const [ritual, setRitual] = useState<Ritual>({
    date: today,
    wakeTime: null,
    hydration: false,
    meditation: false,
    intention: null,
    gratitude: [],
    energy: null,
  });
  const [newGratitude, setNewGratitude] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Ritual | null>(`/lifeos/morning-ritual?date=${today}`)
      .then((data) => {
        if (data) setRitual(data);
      })
      .catch(() => {});
  }, [today]);

  async function save(patch: Partial<Ritual>) {
    const next = { ...ritual, ...patch };
    setRitual(next);
    setSaving(true);
    try {
      await api.put<Ritual>("/lifeos/morning-ritual", { date: today, ...patch });
    } catch {
      toast.error("Error guardando");
    } finally {
      setSaving(false);
    }
  }

  function addGratitude() {
    if (!newGratitude.trim() || ritual.gratitude.length >= 10) return;
    const updated = [...ritual.gratitude, newGratitude.trim()];
    void save({ gratitude: updated });
    setNewGratitude("");
  }

  function removeGratitude(i: number) {
    const updated = ritual.gratitude.filter((_, idx) => idx !== i);
    void save({ gratitude: updated });
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-accent-glow/30 to-brand-paper border border-brand-cream rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sun size={26} className="text-accent" />
          <div>
            <h2 className="font-display text-xl font-bold text-brand-dark m-0">
              Buenos días ☀️
            </h2>
            <p className="text-xs text-brand-warm">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          {saving && <span className="text-[11px] text-brand-tan ml-auto">guardando…</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition",
            ritual.hydration
              ? "bg-info/10 border-info text-info"
              : "bg-brand-paper border-brand-cream hover:border-info/50"
          )}
        >
          <input
            type="checkbox"
            checked={ritual.hydration}
            onChange={(e) => void save({ hydration: e.target.checked })}
            className="sr-only"
          />
          <Droplet size={22} />
          <div>
            <p className="text-sm font-semibold">Hidratación</p>
            <p className="text-[11px] opacity-70">Primer vaso de agua al despertar</p>
          </div>
        </label>

        <label
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition",
            ritual.meditation
              ? "bg-success/10 border-success text-success"
              : "bg-brand-paper border-brand-cream hover:border-success/50"
          )}
        >
          <input
            type="checkbox"
            checked={ritual.meditation}
            onChange={(e) => void save({ meditation: e.target.checked })}
            className="sr-only"
          />
          <Wind size={22} />
          <div>
            <p className="text-sm font-semibold">Meditación</p>
            <p className="text-[11px] opacity-70">Al menos 5 minutos de mindfulness</p>
          </div>
        </label>
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Intención del día
        </label>
        <textarea
          value={ritual.intention ?? ""}
          onChange={(e) => setRitual({ ...ritual, intention: e.target.value })}
          onBlur={(e) => void save({ intention: e.target.value })}
          rows={2}
          placeholder="¿Cuál es tu foco hoy? Una oración."
          className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Gratitud (3 cosas)
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
                onClick={() => removeGratitude(i)}
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
              placeholder="Algo por lo que estés agradecido…"
              className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            <button
              onClick={addGratitude}
              className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown flex items-center gap-1"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
          Energía al despertar (1-10)
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => void save({ energy: ritual.energy === n ? null : n })}
              className={cn(
                "flex-1 py-2 rounded text-xs font-semibold transition",
                ritual.energy === n
                  ? "bg-accent text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
