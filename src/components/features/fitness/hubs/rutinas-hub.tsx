"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Save, Wand2, BedDouble } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { todayLocal } from "@/lib/date/local";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ExerciseState {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
}
interface DayState {
  dayOfWeek: number; // 0=Dom..6=Sáb
  templateName: string;
  exercises: ExerciseState[];
}
interface ScheduleExercise {
  name: string;
  sets: number;
  repRange: [number, number];
}
interface ScheduleDay {
  dayOfWeek: number;
  templateName: string;
  exercises: ScheduleExercise[];
}
interface Program {
  id: string;
  name: string;
  active: boolean;
  type: string;
  schedule: ScheduleDay[];
}

// Lun..Dom para mostrar (la semana arranca en lunes).
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DOW_FULL: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo",
};

const COMMON_EXERCISES = [
  "Press banca", "Press inclinado", "Press militar", "Press mancuernas",
  "Sentadilla", "Peso muerto", "Peso muerto rumano", "Prensa",
  "Dominadas", "Jalón al pecho", "Remo con barra", "Remo mancuerna",
  "Curl bíceps", "Curl martillo", "Extensión tríceps", "Fondos",
  "Elevaciones laterales", "Pájaros", "Curl femoral", "Extensión cuádriceps",
  "Elevación de gemelos", "Hip thrust", "Zancadas", "Face pull", "Plancha",
];

const ex = (name: string, sets: number, repMin: number, repMax: number): ExerciseState => ({
  name, sets, repMin, repMax,
});

const PUSH = [
  ex("Press banca", 4, 6, 10), ex("Press militar", 3, 8, 12),
  ex("Press inclinado", 3, 8, 12), ex("Fondos", 3, 8, 12),
  ex("Elevaciones laterales", 3, 12, 20), ex("Extensión tríceps", 3, 10, 15),
];
const PULL = [
  ex("Dominadas", 4, 6, 10), ex("Remo con barra", 4, 8, 12),
  ex("Jalón al pecho", 3, 10, 15), ex("Remo mancuerna", 3, 10, 12),
  ex("Curl bíceps", 3, 8, 12), ex("Curl martillo", 3, 10, 15),
];
const LEGS = [
  ex("Sentadilla", 4, 6, 10), ex("Peso muerto rumano", 3, 8, 12),
  ex("Prensa", 3, 10, 15), ex("Curl femoral", 3, 10, 15),
  ex("Extensión cuádriceps", 3, 12, 15), ex("Elevación de gemelos", 4, 12, 20),
];
const FULLBODY = [
  ex("Sentadilla", 3, 5, 8), ex("Press banca", 3, 6, 10),
  ex("Remo con barra", 3, 8, 12), ex("Press militar", 3, 8, 12),
  ex("Curl bíceps", 2, 10, 15), ex("Elevación de gemelos", 3, 12, 20),
];
const UPPER = [
  ex("Press banca", 4, 6, 10), ex("Remo con barra", 4, 8, 12),
  ex("Press militar", 3, 8, 12), ex("Jalón al pecho", 3, 10, 15),
  ex("Curl bíceps", 3, 10, 15), ex("Extensión tríceps", 3, 10, 15),
];
const LOWER = [
  ex("Sentadilla", 4, 6, 10), ex("Peso muerto rumano", 3, 8, 12),
  ex("Prensa", 3, 10, 15), ex("Curl femoral", 3, 10, 15),
  ex("Elevación de gemelos", 4, 12, 20),
];

const clone = (arr: ExerciseState[]) => arr.map((e) => ({ ...e }));

function emptyWeek(): DayState[] {
  return DOW_ORDER.map((d) => ({ dayOfWeek: d, templateName: "", exercises: [] }));
}

type TemplateKey = "ppl" | "fullbody" | "upperlower";
function buildTemplate(key: TemplateKey): DayState[] {
  const wk = emptyWeek();
  const set = (dow: number, name: string, exs: ExerciseState[]) => {
    const day = wk.find((d) => d.dayOfWeek === dow)!;
    day.templateName = name;
    day.exercises = clone(exs);
  };
  if (key === "ppl") {
    set(1, "Push", PUSH); set(2, "Pull", PULL); set(3, "Pierna", LEGS);
    set(4, "Push", PUSH); set(5, "Pull", PULL); set(6, "Pierna", LEGS);
  } else if (key === "fullbody") {
    set(1, "Full Body", FULLBODY); set(3, "Full Body", FULLBODY); set(5, "Full Body", FULLBODY);
  } else {
    set(1, "Upper", UPPER); set(2, "Lower", LOWER);
    set(4, "Upper", UPPER); set(5, "Lower", LOWER);
  }
  return wk;
}

export default function RutinasHub() {
  const [name, setName] = useState("Mi rutina");
  const [days, setDays] = useState<DayState[]>(emptyWeek);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar rutina activa (si existe) al montar.
  useEffect(() => {
    let cancelled = false;
    api
      .get<Program[]>("/fitness/programs")
      .then((programs) => {
        if (cancelled) return;
        const active = programs.find((p) => p.active) ?? null;
        if (active) {
          setLoadedId(active.id);
          setName(active.name);
          const wk = emptyWeek();
          for (const sd of active.schedule ?? []) {
            const day = wk.find((d) => d.dayOfWeek === sd.dayOfWeek);
            if (!day) continue;
            day.templateName = sd.templateName ?? "";
            day.exercises = (sd.exercises ?? []).map((e) => ({
              name: e.name,
              sets: e.sets,
              repMin: e.repRange?.[0] ?? 8,
              repMax: e.repRange?.[1] ?? 12,
            }));
          }
          setDays(wk);
        }
      })
      .catch(() => {
        /* arranca con semana vacía */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (fn: (draft: DayState[]) => void) => {
    setDays((prev) => {
      const next = prev.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) }));
      fn(next);
      return next;
    });
  };

  const setLabel = (dow: number, label: string) =>
    update((d) => {
      const day = d.find((x) => x.dayOfWeek === dow)!;
      day.templateName = label;
    });

  const addExercise = (dow: number) =>
    update((d) => {
      const day = d.find((x) => x.dayOfWeek === dow)!;
      day.exercises.push(ex("", 3, 8, 12));
    });

  const removeExercise = (dow: number, idx: number) =>
    update((d) => {
      const day = d.find((x) => x.dayOfWeek === dow)!;
      day.exercises.splice(idx, 1);
    });

  const editExercise = (dow: number, idx: number, patch: Partial<ExerciseState>) =>
    update((d) => {
      const day = d.find((x) => x.dayOfWeek === dow)!;
      day.exercises[idx] = { ...day.exercises[idx], ...patch };
    });

  const markRest = (dow: number) =>
    update((d) => {
      const day = d.find((x) => x.dayOfWeek === dow)!;
      day.templateName = "";
      day.exercises = [];
    });

  const applyTemplate = (key: TemplateKey) => {
    setDays(buildTemplate(key));
    toast.success("Plantilla aplicada — ajústala y guarda");
  };

  const totalExercises = days.reduce(
    (s, d) => s + d.exercises.filter((e) => e.name.trim()).length,
    0,
  );

  async function save() {
    const schedule = days
      .filter((d) => d.exercises.some((e) => e.name.trim()))
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        templateName: d.templateName.trim() || "Entreno",
        exercises: d.exercises
          .filter((e) => e.name.trim())
          .map((e) => {
            const sets = Math.min(20, Math.max(1, Math.round(e.sets) || 1));
            const lo = Math.min(100, Math.max(1, Math.round(e.repMin) || 1));
            const hi = Math.min(100, Math.max(lo, Math.round(e.repMax) || lo));
            return {
              name: e.name.trim(),
              sets,
              repRange: [lo, hi] as [number, number],
            };
          }),
      }));

    if (schedule.length === 0) {
      toast.error("Añade al menos un ejercicio a algún día");
      return;
    }

    const payload = {
      name: name.trim() || "Mi rutina",
      type: "custom",
      goal: "general",
      durationWeeks: 12,
      daysPerWeek: schedule.length,
      startDate: todayLocal(),
      active: true,
      schedule,
    };

    setSaving(true);
    try {
      if (loadedId) {
        await api.patch(`/fitness/programs/${loadedId}`, payload);
      } else {
        const created = await api.post<Program>("/fitness/programs", payload);
        setLoadedId(created.id);
      }
      toast.success("Rutina guardada ✓ — la verás en Resumen");
    } catch {
      toast.error("Error al guardar la rutina");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-brand-warm text-sm">
        Cargando tu rutina…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Encabezado + acciones */}
      <div className="bg-brand-paper rounded-xl border border-brand-light-tan p-5">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Nombre de la rutina
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-warm-white text-base font-serif text-brand-dark"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition"
          >
            <Save size={16} />
            {saving ? "Guardando…" : "Guardar rutina"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-brand-warm flex items-center gap-1.5">
            <Wand2 size={14} /> Plantillas rápidas:
          </span>
          <TemplateButton onClick={() => applyTemplate("ppl")} label="Push / Pull / Pierna" />
          <TemplateButton onClick={() => applyTemplate("upperlower")} label="Torso / Pierna" />
          <TemplateButton onClick={() => applyTemplate("fullbody")} label="Full Body 3×" />
          <span className="text-xs text-brand-warm ml-auto">
            {totalExercises} ejercicios · {days.filter((d) => d.exercises.some((e) => e.name.trim())).length} días
          </span>
        </div>
      </div>

      {/* Días */}
      <datalist id="common-exercises">
        {COMMON_EXERCISES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DOW_ORDER.map((dow) => {
          const day = days.find((d) => d.dayOfWeek === dow)!;
          const isRest = day.exercises.length === 0;
          return (
            <div
              key={dow}
              className="bg-brand-paper rounded-xl border border-brand-light-tan p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif text-base text-brand-dark w-[92px] shrink-0">
                  {DOW_FULL[dow]}
                </span>
                <input
                  value={day.templateName}
                  onChange={(e) => setLabel(dow, e.target.value)}
                  placeholder={isRest ? "Descanso" : "Push, Pierna…"}
                  className="flex-1 px-2.5 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-sm text-brand-dark"
                />
                {!isRest && (
                  <button
                    onClick={() => markRest(dow)}
                    title="Marcar como descanso"
                    className="p-1.5 text-brand-warm hover:text-danger transition"
                  >
                    <BedDouble size={16} />
                  </button>
                )}
              </div>

              {isRest ? (
                <button
                  onClick={() => addExercise(dow)}
                  className="w-full py-2.5 rounded-lg border border-dashed border-brand-light-tan text-brand-warm text-sm hover:bg-brand-warm-white transition flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} /> Añadir ejercicio
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {day.exercises.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        list="common-exercises"
                        value={e.name}
                        onChange={(ev) => editExercise(dow, idx, { name: ev.target.value })}
                        placeholder="Ejercicio"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-sm text-brand-dark"
                      />
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={e.sets}
                        onChange={(ev) => editExercise(dow, idx, { sets: +ev.target.value })}
                        className="w-12 px-1.5 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-sm text-center text-brand-dark"
                        title="Series"
                      />
                      <span className="text-brand-warm text-xs">×</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={e.repMin}
                        onChange={(ev) => editExercise(dow, idx, { repMin: +ev.target.value })}
                        className="w-11 px-1.5 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-sm text-center text-brand-dark"
                        title="Reps mín"
                      />
                      <span className="text-brand-warm text-xs">–</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={e.repMax}
                        onChange={(ev) => editExercise(dow, idx, { repMax: +ev.target.value })}
                        className="w-11 px-1.5 py-1.5 rounded border border-brand-cream bg-brand-warm-white text-sm text-center text-brand-dark"
                        title="Reps máx"
                      />
                      <button
                        onClick={() => removeExercise(dow, idx)}
                        className="p-1.5 text-brand-warm hover:text-danger transition shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addExercise(dow)}
                    className="self-start mt-1 text-accent text-sm font-medium flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Añadir ejercicio
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-brand-warm text-xs text-center">
        Tu rutina activa alimenta el <strong>Resumen</strong>: cada día verás qué
        toca entrenar y podrás empezar la sesión con un toque.
      </p>
    </section>
  );
}

function TemplateButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full border border-brand-light-tan bg-brand-warm-white text-xs text-brand-dark font-medium hover:border-accent hover:text-accent transition"
    >
      {label}
    </button>
  );
}
