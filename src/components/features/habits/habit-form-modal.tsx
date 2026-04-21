"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui";
import type { Habit } from "@/types";
import { api } from "@/lib/api-client";

const EMOJIS = ["✅", "🏋️", "📚", "🧘", "💧", "🥗", "🏃", "😴", "📝", "💊", "🎵", "🎨", "🧠", "❤️", "🌱", "⏰"];
const CATEGORIES = ["Bienestar", "Fitness", "Nutrición", "Productividad", "Aprendizaje", "Finanzas", "Creatividad", "Mindfulness"];
const TIME_OPTIONS: { val: Habit["timeOfDay"]; label: string }[] = [
  { val: "all", label: "Todo el día" },
  { val: "morning", label: "Mañana" },
  { val: "afternoon", label: "Tarde" },
  { val: "evening", label: "Noche" },
];
const FREQ_OPTIONS: { val: Habit["frequency"]; label: string }[] = [
  { val: "daily", label: "Todos los días" },
  { val: "weekly", label: "Días específicos" },
];
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ESTIMATE_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90];

export default function HabitFormModal({
  habit,
  onClose,
  onSaved,
}: {
  habit?: Habit | null;
  onClose: () => void;
  onSaved: (h: Habit) => void;
}) {
  const isEdit = !!habit;
  const [name, setName] = useState(habit?.name ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? "✅");
  const [category, setCategory] = useState(habit?.category ?? "Bienestar");
  const [timeOfDay, setTimeOfDay] = useState<Habit["timeOfDay"]>(habit?.timeOfDay ?? "all");
  const [frequency, setFrequency] = useState<Habit["frequency"]>(habit?.frequency ?? "daily");
  const [targetDays, setTargetDays] = useState<number[]>(
    habit?.targetDays ?? [0, 1, 2, 3, 4, 5, 6]
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(
    habit?.estimatedMinutes ?? null
  );
  const [saving, setSaving] = useState(false);

  function toggleDay(dow: number) {
    setTargetDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort()
    );
  }

  async function save() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (frequency === "weekly" && targetDays.length === 0) {
      toast.error("Selecciona al menos 1 día");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        icon,
        category,
        timeOfDay,
        frequency,
        targetDays: frequency === "daily" ? [0, 1, 2, 3, 4, 5, 6] : targetDays,
        estimatedMinutes,
      };
      const result = isEdit && habit
        ? await api.patch<Habit>(`/habits/${habit.id}`, payload)
        : await api.post<Habit>("/habits", payload);
      onSaved(result);
      toast.success(isEdit ? "Hábito actualizado" : "Hábito creado");
      onClose();
    } catch {
      toast.error("Error guardando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">
            {isEdit ? "Editar hábito" : "Nuevo hábito"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full"
          >
            <X size={16} />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Meditar, leer, entrenar..."
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Icono
            </label>
            <div className="flex gap-1 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={cn(
                    "w-9 h-9 text-xl rounded-lg transition",
                    icon === e
                      ? "bg-accent/20 ring-2 ring-accent"
                      : "bg-brand-cream hover:bg-brand-light-tan"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Momento del día
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.val}
                  onClick={() => setTimeOfDay(t.val)}
                  className={cn(
                    "px-2 py-1.5 rounded text-[10px] font-medium transition",
                    timeOfDay === t.val
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              Frecuencia
            </label>
            <div className="flex gap-1.5 mb-2">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f.val}
                  onClick={() => setFrequency(f.val)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded text-xs font-medium transition",
                    frequency === f.val
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {frequency === "weekly" && (
              <div className="grid grid-cols-7 gap-1 mt-2">
                {DAY_LABELS.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      "py-1.5 rounded text-[10px] font-semibold transition",
                      targetDays.includes(idx)
                        ? "bg-accent text-white"
                        : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ESTIMATED MINUTES */}
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-1.5 block">
              ¿Cuánto tiempo te toma? <span className="text-brand-tan normal-case tracking-normal font-normal">(para calcular tu progreso invertido)</span>
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {ESTIMATE_PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setEstimatedMinutes(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition",
                    estimatedMinutes === m
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {m} min
                </button>
              ))}
              <button
                onClick={() => setEstimatedMinutes(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs transition",
                  estimatedMinutes === null
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                )}
              >
                No aplica
              </button>
            </div>
            <input
              type="number"
              min="1"
              max="1440"
              value={estimatedMinutes ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setEstimatedMinutes(v === "" ? null : parseInt(v, 10));
              }}
              placeholder="O escribe otra cantidad en minutos"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            {estimatedMinutes && (
              <p className="text-[11px] text-brand-warm mt-1">
                💡 A los {92 * estimatedMinutes / 60 >= 1 ? Math.round(92 * estimatedMinutes / 60) : 1}h invertidas,
                tu hábito estará arraigado (día 92).
              </p>
            )}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-brand-cream flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="px-6 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear hábito"}
          </button>
        </footer>
      </div>
    </div>
  );
}
