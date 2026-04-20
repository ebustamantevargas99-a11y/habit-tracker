"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { api } from "@/lib/api-client";

type CatalogExercise = {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string;
  muscleGroup: string;
  category: string;
  equipment: string;
  isCustom: boolean;
  source: "seed" | "user" | "shared";
};

const MUSCLE_OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "chest", label: "Pecho" },
  { key: "back", label: "Espalda" },
  { key: "shoulders", label: "Hombros" },
  { key: "biceps", label: "Bíceps" },
  { key: "triceps", label: "Tríceps" },
  { key: "quads", label: "Cuádriceps" },
  { key: "hamstrings", label: "Isquiotibiales" },
  { key: "glutes", label: "Glúteos" },
  { key: "core", label: "Core" },
  { key: "calves", label: "Gemelos" },
  { key: "forearms", label: "Antebrazos" },
  { key: "full_body", label: "Full body" },
] as const;

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Mancuernas",
  machine: "Máquina",
  cable: "Polea",
  bodyweight: "Peso corporal",
  kettlebell: "Kettlebell",
  band: "Banda",
  smith: "Smith",
  other: "Otro",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: CatalogExercise) => void;
  excludeIds?: string[];
};

export default function ExerciseSelector({ open, onClose, onPick, excludeIds = [] }: Props) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState<CatalogExercise[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ exercises: CatalogExercise[] }>(
          "/fitness/exercises-catalog"
        );
        if (!cancelled) setAll(res.exercises);
      } catch {
        // silent: lista vacía, user puede añadir custom
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const excluded = new Set(excludeIds);
    return all.filter((ex) => {
      if (excluded.has(ex.id)) return false;
      if (muscle !== "all" && ex.muscleGroup !== muscle) return false;
      if (!q) return true;
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.nameEn?.toLowerCase().includes(q) ||
        ex.slug?.includes(q)
      );
    });
  }, [all, query, muscle, excludeIds]);

  const byMuscle = useMemo(() => {
    const groups = new Map<string, CatalogExercise[]>();
    for (const ex of filtered) {
      if (!groups.has(ex.muscleGroup)) groups.set(ex.muscleGroup, []);
      groups.get(ex.muscleGroup)!.push(ex);
    }
    return groups;
  }, [filtered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col shadow-warm-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-brand-cream">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-dark m-0">
              Selecciona un ejercicio
            </h2>
            <p className="text-xs text-brand-warm mt-0.5">
              {filtered.length} ejercicios disponibles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-warm hover:bg-brand-cream rounded-full"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-3 border-b border-brand-cream">
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-warm pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {MUSCLE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMuscle(opt.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                  muscle === opt.key
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <p className="text-sm text-brand-warm text-center py-8">
              Cargando catálogo…
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-brand-warm text-center py-8">
              Sin resultados. Prueba otro filtro o añade un ejercicio custom.
            </p>
          )}
          {!loading &&
            Array.from(byMuscle.entries()).map(([muscleKey, exercises]) => (
              <div key={muscleKey} className="mb-5 last:mb-0">
                <h3 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
                  {MUSCLE_OPTIONS.find((m) => m.key === muscleKey)?.label ?? muscleKey}
                </h3>
                <div className="space-y-1.5">
                  {exercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        onPick(ex);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-cream hover:border-accent hover:bg-accent/5 transition text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate">
                          {ex.name}
                        </p>
                        <p className="text-xs text-brand-warm">
                          {EQUIPMENT_LABELS[ex.equipment] ?? ex.equipment}
                          {ex.category === "compound" ? " · compuesto" : " · aislado"}
                          {ex.source === "user" && " · tuyo"}
                        </p>
                      </div>
                      <Plus size={16} className="text-brand-warm shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export type { CatalogExercise };
