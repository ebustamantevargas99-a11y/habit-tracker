"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Loader2, ShieldOff } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/components/ui";
import type { ResetScope } from "@/lib/validation";

// ─── Definición de scopes con lo que incluye cada uno ────────────────────────

interface ScopeDef {
  id: ResetScope;
  emoji: string;
  label: string;
  description: string;
  includes: string[];
}

const SCOPES: ScopeDef[] = [
  {
    id: "habits",
    emoji: "✅",
    label: "Hábitos",
    description: "Todos tus hábitos + historial de completados",
    includes: ["Habit", "HabitLog"],
  },
  {
    id: "fitness",
    emoji: "💪",
    label: "Fitness (gym)",
    description: "Workouts, PRs, volumen, métricas corporales, programas, fotos, ayuno y meditación",
    includes: [
      "Workout, WorkoutExercise, WorkoutSet",
      "PersonalRecord · BodyMetric · WeightLog · StepsLog",
      "TrainingProgram, ProgramPhase, ReadinessCheck",
      "BodyComposition · BodyPhoto · FitnessChallenge",
      "FastingSession · MeditationSession",
    ],
  },
  {
    id: "cardio",
    emoji: "🏃",
    label: "Cardio / Correr",
    description: "Sesiones de cardio y zapatillas (preserva tu fitness de gym)",
    includes: ["CardioSession", "Shoe"],
  },
  {
    id: "finance",
    emoji: "💰",
    label: "Finanzas",
    description: "Transacciones, cuentas, metas, deudas, inversiones, presupuestos",
    includes: [
      "Transaction · Budget · FinancialAccount",
      "RecurringTransaction · SavingsGoal · Debt · Investment",
      "NetWorthSnapshot",
    ],
  },
  {
    id: "nutrition",
    emoji: "🥗",
    label: "Nutrición",
    description: "Alimentos, comidas, recetas, meta nutricional",
    includes: [
      "MealLog (+ items), MealTemplate, Recipe",
      "FoodItem · NutritionGoal",
    ],
  },
  {
    id: "productivity",
    emoji: "⚡",
    label: "Productividad",
    description: "Proyectos, tareas, subtareas, pomodoros, planner diario, Deep Work",
    includes: [
      "Project, ProjectTask, ProjectSubtask",
      "PomodoroSession · DailyPlan, TimeBlock",
      "FocusSession",
    ],
  },
  {
    id: "organization",
    emoji: "📚",
    label: "Organización",
    description: "Notas, áreas de vida, weekly reviews",
    includes: ["Note · LifeArea · WeeklyReview"],
  },
  {
    id: "calendar",
    emoji: "📅",
    label: "Calendario",
    description: "Eventos, grupos de calendarios, plantillas de día",
    includes: ["CalendarEvent · CalendarGroup · DayTemplate"],
  },
  {
    id: "reading",
    emoji: "📖",
    label: "Lectura",
    description: "Libros + sesiones de lectura",
    includes: ["Book · ReadingSession"],
  },
  {
    id: "cycle",
    emoji: "🌙",
    label: "Ciclo menstrual",
    description: "Ciclos y logs de período",
    includes: ["MenstrualCycle · PeriodLog"],
  },
  {
    id: "milestones",
    emoji: "🏆",
    label: "Milestones",
    description: "Logros automáticos (PRs, streaks, libros terminados…)",
    includes: ["Milestone"],
  },
  {
    id: "gamification",
    emoji: "🎮",
    label: "Gamificación",
    description: "XP, nivel, insignias, snapshots de Puntuación de Vida",
    includes: [
      "Gamification (reset a nivel 1, 0 XP)",
      "UserBadge · LifeScoreSnapshot",
    ],
  },
];

const ALL_SCOPE: ScopeDef = {
  id: "all",
  emoji: "☠️",
  label: "Resetear TODO (wipe absoluto)",
  description:
    "Borra TODOS los datos de TODOS los apartados. Conserva solo tu cuenta, perfil y ajustes.",
  includes: ["Ejecuta todos los resets anteriores en secuencia"],
};

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ResetDataTab() {
  const [confirmingScope, setConfirmingScope] = useState<ScopeDef | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso general */}
      <div className="bg-danger-light/40 border-2 border-danger rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-danger shrink-0 mt-1" />
          <div>
            <h3 className="font-serif text-danger m-0 text-lg">
              Zona de peligro — acciones irreversibles
            </h3>
            <p className="text-brand-dark text-sm m-0 mt-1">
              Estos botones eliminan datos permanentemente. No hay undo, no hay
              papelera, no hay backup automático. Si dudas,{" "}
              <strong>exporta primero</strong> desde la pestaña &quot;Datos&quot;.
            </p>
            <p className="text-brand-warm text-xs m-0 mt-2">
              Cada acción pedirá que escribas{" "}
              <code className="font-mono bg-danger-light px-1 rounded">RESETEAR</code>{" "}
              para confirmar.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de scopes por categoría */}
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <h3 className="font-serif text-brand-dark m-0 mb-1 text-lg">
          Resetear por categoría
        </h3>
        <p className="text-xs text-brand-warm m-0 mb-5">
          Elige qué parte de tus datos quieres vaciar. El resto permanece intacto.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCOPES.map((scope) => (
            <ScopeCard
              key={scope.id}
              scope={scope}
              onResetClick={() => setConfirmingScope(scope)}
            />
          ))}
        </div>
      </div>

      {/* Reset TODO */}
      <div className="bg-gradient-hero rounded-xl p-6 text-hero">
        <div className="flex items-start gap-3">
          <ShieldOff size={24} className="text-danger-light shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-serif m-0 text-lg text-accent-glow">
              {ALL_SCOPE.emoji} Resetear TODO
            </h3>
            <p className="text-sm m-0 mt-1 text-hero-subtle">
              {ALL_SCOPE.description}
            </p>
            <p className="text-[11px] m-0 mt-2 text-hero-subtle opacity-70">
              Tu cuenta, email, contraseña y preferencias permanecen intactas.
              Solo se borran los datos de los módulos.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setConfirmingScope(ALL_SCOPE)}
            className="px-6 py-2.5 rounded-button bg-danger text-white font-semibold text-sm hover:opacity-90 transition flex items-center gap-2"
          >
            <Trash2 size={14} />
            Resetear TODO
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmingScope && (
        <ConfirmResetModal
          scope={confirmingScope}
          onCancel={() => setConfirmingScope(null)}
          onDone={() => setConfirmingScope(null)}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function ScopeCard({
  scope,
  onResetClick,
}: {
  scope: ScopeDef;
  onResetClick: () => void;
}) {
  const [showIncludes, setShowIncludes] = useState(false);

  return (
    <div className="bg-brand-warm-white rounded-lg p-4 border border-brand-light-cream flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0">{scope.emoji}</span>
          <div>
            <h4 className="font-serif text-sm text-brand-dark m-0">
              {scope.label}
            </h4>
            <p className="text-[11px] text-brand-warm m-0 mt-0.5">
              {scope.description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto gap-2">
        <button
          onClick={() => setShowIncludes((v) => !v)}
          className="text-[10px] text-brand-tan hover:text-brand-warm underline"
        >
          {showIncludes ? "Ocultar detalle" : "¿Qué se borra?"}
        </button>
        <button
          onClick={onResetClick}
          className="px-3 py-1.5 rounded-button border border-danger text-danger text-xs font-semibold hover:bg-danger-light/40 transition flex items-center gap-1"
        >
          <Trash2 size={12} /> Resetear
        </button>
      </div>
      {showIncludes && (
        <ul className="mt-2 pl-4 list-disc text-[10px] text-brand-warm m-0 border-t border-brand-light-cream pt-2">
          {scope.includes.map((item) => (
            <li key={item} className="font-mono">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfirmResetModal({
  scope,
  onCancel,
  onDone,
}: {
  scope: ScopeDef;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canConfirm = input === "RESETEAR";

  async function confirm() {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; counts: Record<string, number> }>(
        "/user/reset-data",
        { scope: scope.id, confirmation: "RESETEAR" },
      );
      const total = Object.values(res.counts).reduce((s, n) => s + n, 0);
      toast.success(
        scope.id === "all"
          ? `Reset completo: ${total} registros eliminados.`
          : `"${scope.label}" reseteado: ${total} registros eliminados.`,
      );

      // Limpia caches del browser que sobreviven al reload (drafts sessionStorage,
      // estado de UI en localStorage). Los drafts de fitness session son los más
      // visibles — sin esto el "logger clásico" sigue mostrando datos fantasma.
      try {
        // Drafts y estados volátiles
        sessionStorage.removeItem("fitness_draft_exercises");
        sessionStorage.removeItem("habit_draft");
        sessionStorage.removeItem("finance_draft_txn");
      } catch {
        /* ignore (private mode / storage denegado) */
      }

      onDone();
      // Recarga dura para que todos los Zustand stores vuelvan a inicializar
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo resetear";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 bg-danger-light/30 border-b-2 border-danger">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-danger shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-danger m-0 text-lg">
                Confirmar reset: {scope.label}
              </h3>
              <p className="text-xs text-brand-dark m-0 mt-1">
                Esta acción es <strong>irreversible</strong>. No hay forma de
                recuperar los datos después.
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-5 flex flex-col gap-3">
          <div>
            <p className="text-sm text-brand-dark m-0 mb-2">
              Se eliminarán los siguientes datos:
            </p>
            <ul className="pl-5 list-disc text-xs text-brand-warm m-0">
              {scope.includes.map((item) => (
                <li key={item} className="font-mono">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {scope.id === "all" && (
            <div className="bg-danger-light/40 border border-danger rounded-md p-3 text-xs text-danger">
              <strong>⚠️ Wipe absoluto</strong> — Ejecuta los {SCOPES.length}{" "}
              resets en secuencia. Tus datos de todos los módulos se eliminan.
              Solo quedan tu cuenta, email, contraseña y ajustes.
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-brand-dark block mb-1">
              Para confirmar, escribe{" "}
              <code className="font-mono bg-brand-cream px-1 rounded">RESETEAR</code>
            </label>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="RESETEAR"
              className={cn(
                "w-full px-3 py-2 rounded-md border text-sm font-mono focus:outline-none",
                canConfirm
                  ? "border-success bg-success-light/40 text-success"
                  : "border-brand-tan bg-brand-warm-white text-brand-dark focus:border-danger",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canConfirm) void confirm();
                if (e.key === "Escape") onCancel();
              }}
            />
          </div>
        </div>

        <footer className="px-6 py-3 border-t border-brand-cream flex justify-end gap-2 bg-brand-warm-white">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-button text-sm text-brand-dark hover:bg-brand-cream disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!canConfirm || submitting}
            className={cn(
              "px-5 py-2 rounded-button text-sm font-semibold text-white transition flex items-center gap-2",
              canConfirm && !submitting
                ? "bg-danger hover:opacity-90"
                : "bg-brand-tan cursor-not-allowed opacity-60",
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Reseteando…
              </>
            ) : (
              <>
                <Trash2 size={14} /> Confirmar reset
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
