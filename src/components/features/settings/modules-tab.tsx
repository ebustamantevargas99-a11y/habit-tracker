"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user-store";
import {
  INTEREST_LABELS,
  MODULE_ACTIVATION,
  SEX_GATED_MODULES,
  type ModuleKey,
  type BiologicalSex,
} from "@/lib/onboarding-constants";

type ModuleMeta = { label: string; emoji: string; description: string };

// Los módulos listados aquí corresponden 1:1 con los items togglables del
// sidebar. Módulos sin UI propia (journal, pregnancy, fasting, projects)
// no aparecen — fueron descontinuados o son sub-tabs de otro módulo.
const MODULE_META: Partial<Record<ModuleKey, ModuleMeta>> = {
  fitness: {
    label: "Fitness",
    emoji: "💪",
    description: "Rutinas, series, PRs, volumen, proyecciones",
  },
  nutrition: {
    label: "Nutrición",
    emoji: "🍎",
    description: "Macros, log de comidas, metas, bioimpedancia, blood markers",
  },
  finance: {
    label: "Finanzas",
    emoji: "💰",
    description: "Transacciones, presupuestos, metas",
  },
  planner: {
    label: "Calendar",
    emoji: "📅",
    description: "Hoy / Semana / Mes",
  },
  meditation: {
    label: "Meditación",
    emoji: "🧘",
    description: "Sesiones y mindfulness",
  },
  reading: {
    label: "Lectura",
    emoji: "📖",
    description: "Tracker de libros",
  },
  menstrualCycle: {
    label: "Ciclo menstrual",
    emoji: "🌙",
    description: "Ciclo, síntomas, fertilidad",
  },
  organization: {
    label: "Organización",
    emoji: "📚",
    description: "Notas, life areas, weekly reviews",
  },
};

const OPTIONAL_MODULES = Object.keys(MODULE_META) as ModuleKey[];

function toModuleSet(list: readonly string[] | undefined): Set<ModuleKey> {
  const s = new Set<ModuleKey>();
  (list ?? []).forEach((k) => s.add(k as ModuleKey));
  return s;
}

export default function ModulesTab() {
  const { user, setEnabledModules, isSaving } = useUserStore();
  const enabled = useMemo<Set<ModuleKey>>(
    () => toModuleSet(user?.profile?.enabledModules),
    [user?.profile?.enabledModules]
  );
  const [pending, setPending] = useState<Set<ModuleKey>>(() =>
    toModuleSet(user?.profile?.enabledModules)
  );
  const biologicalSex = (user?.profile?.biologicalSex ?? null) as BiologicalSex | null;

  function toggle(key: ModuleKey) {
    setPending((prev) => {
      const next = new Set<ModuleKey>();
      prev.forEach((k) => next.add(k));
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    const list: ModuleKey[] = [];
    pending.forEach((k) => list.push(k));
    try {
      await setEnabledModules(list);
      toast.success("Módulos actualizados");
    } catch {
      toast.error("Error guardando cambios");
    }
  }

  const isSexGated = (key: ModuleKey): boolean => {
    const gate = SEX_GATED_MODULES[key];
    if (!gate) return false;
    if (!biologicalSex) return true;
    return !gate.includes(biologicalSex);
  };

  const hasChanges = useMemo(() => {
    if (pending.size !== enabled.size) return true;
    let diff = false;
    pending.forEach((k) => {
      if (!enabled.has(k)) diff = true;
    });
    return diff;
  }, [pending, enabled]);

  const interestDerived = useMemo(() => {
    const interests = new Set(user?.profile?.interests ?? []);
    const derived = new Set<ModuleKey>();
    for (const [mod, requiredInterests] of Object.entries(MODULE_ACTIVATION) as [
      ModuleKey,
      Array<keyof typeof INTEREST_LABELS>,
    ][]) {
      if (requiredInterests.some((i) => interests.has(i))) derived.add(mod);
    }
    return derived;
  }, [user?.profile?.interests]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <h3 className="font-serif text-brand-dark text-xl m-0 mb-1">Módulos activos</h3>
        <p className="text-sm text-brand-warm m-0 mb-6">
          Activa o desactiva los módulos que quieras usar. Los módulos{" "}
          <strong>Home, Hábitos, Productividad y Configuración</strong> siempre
          están disponibles. Los cambios se reflejan al momento en el sidebar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OPTIONAL_MODULES.map((key) => {
            const meta = MODULE_META[key];
            if (!meta) return null;
            const active = pending.has(key);
            const gated = isSexGated(key);
            const autoDerived = interestDerived.has(key);

            return (
              <button
                key={key}
                type="button"
                disabled={gated}
                onClick={() => !gated && toggle(key)}
                className={`text-left p-4 rounded-lg border transition ${
                  gated
                    ? "border-brand-cream bg-brand-light-cream/30 opacity-40 cursor-not-allowed"
                    : active
                      ? "border-accent bg-accent/10"
                      : "border-brand-cream hover:border-brand-tan"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{meta.label}</p>
                      <p className="text-xs text-brand-warm mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                      active
                        ? "bg-accent border-accent text-white"
                        : "border-brand-tan"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {gated && (
                    <span className="text-[10px] uppercase tracking-wide text-brand-warm bg-brand-light-cream px-2 py-0.5 rounded">
                      No aplica
                    </span>
                  )}
                  {autoDerived && !gated && (
                    <span className="text-[10px] uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded">
                      Sugerido por tu perfil
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3 items-center">
          <button
            type="button"
            onClick={save}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:bg-brand-brown transition"
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </button>
          {hasChanges && (
            <button
              type="button"
              onClick={() => setPending(toModuleSet(user?.profile?.enabledModules))}
              className="text-sm text-brand-warm hover:text-brand-dark"
            >
              Descartar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
