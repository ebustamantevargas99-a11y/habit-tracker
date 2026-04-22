"use client";
import { todayLocal } from "@/lib/date/local";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, ChevronRight } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import type { ProgramTemplate } from "@/lib/fitness/program-templates";

const GOAL_COLOR: Record<string, string> = {
  hypertrophy: "bg-info/15 text-info",
  strength: "bg-accent/15 text-accent",
  power: "bg-danger/15 text-danger",
  endurance: "bg-success/15 text-success",
  general: "bg-brand-cream text-brand-dark",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export default function TemplateLibrary({ onActivated }: { onActivated?: () => void }) {
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProgramTemplate[]>("/fitness/programs/templates")
      .then((list) => setTemplates(list))
      .catch(() => toast.error("No se pudieron cargar los templates"))
      .finally(() => setLoading(false));
  }, []);

  async function activateFromTemplate(t: ProgramTemplate) {
    if (!confirm(`Activar "${t.name}" (${t.durationWeeks} semanas)? Esto desactivará cualquier programa activo.`)) return;
    setActivating(t.id);
    try {
      const today = todayLocal();
      await api.post(`/fitness/programs?fromTemplate=1`, {
        templateId: t.id,
        startDate: today,
        activateNow: true,
      });
      toast.success(`Programa "${t.name}" activado`);
      onActivated?.();
    } catch {
      toast.error("Error activando el programa");
    } finally {
      setActivating(null);
    }
  }

  if (loading) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
        Cargando biblioteca…
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {templates.map((t) => {
        const isOpen = expanded === t.id;
        return (
          <Card key={t.id} variant="default" padding="md" className="border-brand-light-tan">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-brand-dark m-0">{t.name}</h3>
                <p className="text-brand-warm text-xs m-0 mt-0.5">
                  {t.author} · {t.durationWeeks} semanas · {t.daysPerWeek} días/semana
                </p>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-semibold", GOAL_COLOR[t.goal] ?? GOAL_COLOR.general)}>
                    {t.goal}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-cream text-brand-medium uppercase tracking-widest font-semibold">
                    {DIFFICULTY_LABEL[t.difficulty]}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-cream text-brand-medium uppercase tracking-widest font-semibold">
                    {t.type}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-brand-cream text-brand-dark text-xs hover:bg-brand-light-tan transition"
                >
                  <ChevronRight size={14} className={cn("transition-transform", isOpen && "rotate-90")} />
                  {isOpen ? "Ocultar" : "Ver detalle"}
                </button>
                <button
                  onClick={() => activateFromTemplate(t)}
                  disabled={activating === t.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition"
                >
                  <Play size={14} />
                  {activating === t.id ? "Activando…" : "Usar este"}
                </button>
              </div>
            </div>
            <p className="text-sm text-brand-dark mt-3 mb-0">{t.description}</p>

            {isOpen && (
              <div className="mt-4 pt-4 border-t border-brand-light-cream flex flex-col gap-4">
                <div>
                  <h4 className="font-serif text-sm text-brand-dark m-0 mb-2">
                    Puntos clave
                  </h4>
                  <ul className="text-xs text-brand-warm list-disc pl-5 m-0">
                    {t.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif text-sm text-brand-dark m-0 mb-2">
                    Periodización
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {t.phases.map((p) => (
                      <div
                        key={`${p.name}-${p.weekStart}`}
                        className="bg-brand-warm-white rounded-md px-2 py-1 text-[11px] text-brand-dark border border-brand-light-cream"
                      >
                        <strong>Sem {p.weekStart}{p.weekStart !== p.weekEnd ? `–${p.weekEnd}` : ""}:</strong> {p.name}
                        {p.targetRpeMin && <span className="text-brand-warm"> · RPE {p.targetRpeMin}-{p.targetRpeMax}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-serif text-sm text-brand-dark m-0 mb-2">
                    Estructura semanal
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {t.schedule.map((d) => (
                      <div key={`${t.id}-${d.dayOfWeek}`} className="bg-brand-warm-white rounded-md p-3 border border-brand-light-cream">
                        <p className="font-semibold text-sm text-brand-dark m-0 mb-1">
                          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.dayOfWeek]} — {d.templateName}
                        </p>
                        <ul className="text-[11px] text-brand-warm m-0 list-none pl-0">
                          {d.exercises.map((e) => (
                            <li key={e.name} className="py-0.5">
                              <strong className="text-brand-dark">{e.name}</strong> · {e.sets}×{e.repRange[0]}-{e.repRange[1]}
                              {e.targetRpe && <span> @ RPE {e.targetRpe}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
