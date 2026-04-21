"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Power, Trash2 } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";

interface ProgramPhase {
  id: string;
  name: string;
  weekStart: number;
  weekEnd: number;
  targetRpeMin: number | null;
  targetRpeMax: number | null;
  targetSetsPerMuscle: number | null;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  type: string;
  goal: string | null;
  durationWeeks: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  daysPerWeek: number;
  schedule: Array<{
    dayOfWeek: number;
    templateName: string;
    exercises: Array<{ name: string; sets: number; repRange: [number, number]; targetRpe?: number }>;
  }>;
  phases: ProgramPhase[];
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function currentWeekOfProgram(startDate: string): number {
  const start = new Date(startDate + "T00:00:00Z");
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

function findActivePhase(phases: ProgramPhase[], week: number): ProgramPhase | null {
  return phases.find((p) => week >= p.weekStart && week <= p.weekEnd) ?? null;
}

export default function ActivePlan({ reloadKey = 0 }: { reloadKey?: number }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const list = await api.get<Program[]>("/fitness/programs");
      setPrograms(list);
    } catch {
      toast.error("No se pudieron cargar los programas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [reloadKey]);

  async function toggleActive(p: Program) {
    try {
      await api.patch(`/fitness/programs/${p.id}`, { active: !p.active });
      toast.success(p.active ? "Programa desactivado" : "Programa activado");
      refresh();
    } catch {
      toast.error("Error actualizando");
    }
  }

  async function remove(p: Program) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    try {
      await api.delete(`/fitness/programs/${p.id}`);
      toast.success("Eliminado");
      refresh();
    } catch {
      toast.error("Error eliminando");
    }
  }

  if (loading) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
        Cargando programas…
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-dark font-semibold m-0">Sin programas todavía</p>
        <p className="text-brand-warm text-xs mt-1 m-0">
          Elige uno de la <strong>Biblioteca</strong> o créalo con el <strong>Builder</strong>.
        </p>
      </Card>
    );
  }

  const active = programs.find((p) => p.active);
  const inactive = programs.filter((p) => !p.active);

  return (
    <div className="flex flex-col gap-5">
      {active && <ActiveProgramCard program={active} onToggle={toggleActive} onRemove={remove} />}

      {inactive.length > 0 && (
        <div>
          <h3 className="font-serif text-base text-brand-dark m-0 mb-3">
            Programas guardados
          </h3>
          <div className="flex flex-col gap-2">
            {inactive.map((p) => (
              <Card key={p.id} variant="default" padding="md" className="border-brand-light-tan">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-serif text-base text-brand-dark m-0">{p.name}</p>
                    <p className="text-brand-warm text-xs m-0 mt-0.5">
                      {p.durationWeeks} semanas · {p.goal ?? "general"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleActive(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:opacity-90 transition"
                    >
                      <Power size={14} /> Activar
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="p-2 rounded hover:bg-danger-light hover:text-danger text-brand-warm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveProgramCard({
  program,
  onToggle,
  onRemove,
}: {
  program: Program;
  onToggle: (p: Program) => void;
  onRemove: (p: Program) => void;
}) {
  const week = currentWeekOfProgram(program.startDate);
  const weekClamped = Math.min(week, program.durationWeeks);
  const phase = findActivePhase(program.phases, weekClamped);
  const todayDow = new Date().getDay();
  const todayWorkout = program.schedule.find((d) => d.dayOfWeek === todayDow);
  const nextWorkout =
    todayWorkout ??
    program.schedule.find((d) => d.dayOfWeek > todayDow) ??
    program.schedule[0];

  const progressPct = Math.round((weekClamped / program.durationWeeks) * 100);

  return (
    <Card variant="default" padding="md" className="border-accent bg-accent/5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-accent font-semibold m-0">
            Programa activo
          </p>
          <h3 className="font-serif text-2xl text-brand-dark m-0 mt-0.5">
            {program.name}
          </h3>
          {program.description && (
            <p className="text-brand-warm text-sm m-0 mt-1 max-w-3xl">
              {program.description}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onToggle(program)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-brand-cream text-brand-dark text-xs hover:bg-brand-light-tan transition"
          >
            <Power size={14} /> Desactivar
          </button>
          <button
            onClick={() => onRemove(program)}
            className="p-2 rounded hover:bg-danger-light hover:text-danger text-brand-warm"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline text-xs text-brand-warm mb-1">
          <span>Semana {weekClamped} de {program.durationWeeks}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-brand-light-cream overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Fase actual */}
      {phase && (
        <div className="bg-brand-paper rounded-lg p-3 border border-brand-light-cream mb-4">
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
            Fase actual
          </p>
          <p className="font-serif text-lg text-brand-dark m-0 mt-0.5 capitalize">
            {phase.name}
          </p>
          <p className="text-xs text-brand-warm m-0 mt-0.5">
            Semana {phase.weekStart}{phase.weekStart !== phase.weekEnd && `–${phase.weekEnd}`}
            {phase.targetRpeMin && ` · target RPE ${phase.targetRpeMin}-${phase.targetRpeMax}`}
            {phase.targetSetsPerMuscle && ` · ${phase.targetSetsPerMuscle} sets/músculo`}
          </p>
        </div>
      )}

      {/* Hoy o próximo */}
      {nextWorkout && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
            {todayWorkout ? "Hoy" : `Próximo (${DAY_NAMES[nextWorkout.dayOfWeek]})`}
          </p>
          <div className="bg-brand-paper rounded-lg p-4 border border-brand-light-cream">
            <p className="font-serif text-base text-brand-dark m-0 mb-2">
              {nextWorkout.templateName}
            </p>
            <ul className="text-sm text-brand-dark m-0 list-none pl-0">
              {nextWorkout.exercises.map((e) => (
                <li key={e.name} className="py-1 border-b border-brand-light-cream last:border-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">{e.name}</span>
                    <span className="text-xs text-brand-warm font-mono">
                      {e.sets}×{e.repRange[0]}-{e.repRange[1]}
                      {e.targetRpe && ` @ RPE ${e.targetRpe}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Timeline de fases */}
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
          Periodización
        </p>
        <div className="flex gap-1 w-full">
          {program.phases.map((p) => {
            const widthPct = ((p.weekEnd - p.weekStart + 1) / program.durationWeeks) * 100;
            const isCurrent = weekClamped >= p.weekStart && weekClamped <= p.weekEnd;
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded px-2 py-1 text-[10px] text-center truncate",
                  isCurrent ? "bg-accent text-white font-semibold" : "bg-brand-cream text-brand-medium",
                )}
                style={{ width: `${widthPct}%` }}
                title={`${p.name} sem ${p.weekStart}-${p.weekEnd}`}
              >
                {p.name.slice(0, 8)}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
