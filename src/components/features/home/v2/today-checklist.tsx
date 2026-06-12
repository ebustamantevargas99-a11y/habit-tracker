"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Flame,
  Moon,
  Sparkles,
  ListTodo,
  UtensilsCrossed,
  Droplet,
  Dumbbell,
  CalendarDays,
} from "lucide-react";
import { useHabitStore } from "@/stores/habit-store";
import { useUserStore } from "@/stores/user-store";
import { api } from "@/lib/api-client";
import { todayLocal, parseLocalDateStr } from "@/lib/date/local";
import SectionHeader from "./primitives/section-header";

interface DueTask {
  id: string;
  projectId: string;
  title: string;
}
interface DaySummary {
  meals: number;
  workoutDone: boolean;
  events: number;
  waterMl: number;
  waterGoalMl: number;
}

/**
 * "Tu día de hoy" — centro de acción del inicio. Reúne TODO lo del día:
 * hábitos programados (marcables), tareas con vencimiento hoy (marcables),
 * y un resumen de comidas/agua/entreno/eventos. Los hábitos que no tocan
 * hoy se muestran como "descanso" y no afectan la racha.
 */
export default function TodayChecklist() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const isLoaded = useHabitStore((s) => s.isLoaded);
  const toggleHabitToday = useHabitStore((s) => s.toggleHabitToday);
  const refresh = useHabitStore((s) => s.refresh);
  const user = useUserStore((s) => s.user);
  const tz = user?.profile?.timezone ?? null;
  const enabled = user?.profile?.enabledModules ?? [];
  const has = (k: string) => enabled.includes(k);

  const [busy, setBusy] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DueTask[]>([]);
  const [summary, setSummary] = useState<DaySummary | null>(null);

  const today = useMemo(() => todayLocal(tz), [tz]);
  const dayOfWeek = useMemo(() => parseLocalDateStr(today).getDay(), [today]);

  const completedToday = useMemo(
    () => new Set(logs.filter((l) => l.date === today && l.completed).map((l) => l.habitId)),
    [logs, today],
  );

  const { scheduled, resting } = useMemo(() => {
    const active = habits.filter((h) => h.isActive);
    const isScheduled = (h: (typeof active)[number]) =>
      h.frequency === "daily" || (h.targetDays ?? []).includes(dayOfWeek);
    return {
      scheduled: active.filter(isScheduled),
      resting: active.filter((h) => !isScheduled(h)),
    };
  }, [habits, dayOfWeek]);

  // Cargar tareas de hoy + resumen del día (eventos/comidas/entreno/agua).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Tareas con vencimiento hoy, pendientes.
      if (has("projects") || has("tasks")) {
        const projects = await api
          .get<Array<{ id: string; tasks?: Array<{ id: string; title: string; status: string; dueDate: string | null }> }>>(
            "/productivity/projects",
          )
          .catch(() => []);
        if (!cancelled) {
          const due: DueTask[] = [];
          for (const p of projects ?? []) {
            for (const t of p.tasks ?? []) {
              if (t.dueDate === today && t.status !== "done") {
                due.push({ id: t.id, projectId: p.id, title: t.title });
              }
            }
          }
          setTasks(due);
        }
      }

      // Resumen del día: eventos + comidas + entreno (de la agenda) + agua.
      const [day, hydration] = await Promise.all([
        api
          .get<{ events?: unknown[]; agenda?: { meals?: unknown[]; workouts?: Array<{ completed: boolean }> } }>(
            `/calendar/day/${today}`,
          )
          .catch(() => null),
        has("nutrition")
          ? api
              .get<Array<{ date: string; amountMl: number; goalMl: number }>>("/nutrition/hydration?days=1")
              .catch(() => [])
          : Promise.resolve([]),
      ]);
      if (cancelled) return;
      const water = (hydration ?? []).find((h) => h.date === today);
      setSummary({
        meals: day?.agenda?.meals?.length ?? 0,
        workoutDone: (day?.agenda?.workouts ?? []).some((w) => w?.completed) || (day?.agenda?.workouts?.length ?? 0) > 0,
        events: day?.events?.length ?? 0,
        waterMl: water?.amountMl ?? 0,
        waterGoalMl: water?.goalMl ?? 2500,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = scheduled.filter((h) => completedToday.has(h.id)).length;
  const total = scheduled.length;
  const pendingTasks = tasks.length;
  const allHabitsDone = total > 0 && doneCount === total;

  async function toggleHabit(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      await toggleHabitToday(id);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function completeTask(t: DueTask) {
    if (busy) return;
    setBusy(t.id);
    try {
      await api.patch(`/productivity/projects/${t.projectId}/tasks`, {
        tasks: [{ id: t.id, status: "done" }],
      });
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
    } catch {
      /* noop — se reintenta al recargar */
    } finally {
      setBusy(null);
    }
  }

  if (!isLoaded) return null;
  const nothing =
    scheduled.length === 0 && resting.length === 0 && pendingTasks === 0;
  if (nothing && !summary) return null;

  return (
    <section>
      <SectionHeader
        eyebrow="Para hoy"
        title="Tu día de hoy"
        subtitle="Todo lo del día en un lugar. Marca lo que completes; lo que no toca hoy queda en descanso y no afecta tu racha."
        right={
          total > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 font-semibold rounded-full"
              style={{
                padding: "4px 12px",
                fontSize: 12,
                color: allHabitsDone ? "var(--color-success, #1D9E75)" : "var(--color-accent)",
                background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-warm-white))",
                border: "1px solid color-mix(in oklab, var(--color-accent) 28%, transparent)",
                whiteSpace: "nowrap",
              }}
            >
              {allHabitsDone ? <Sparkles size={13} strokeWidth={2} /> : null}
              {doneCount}/{total} hábitos
            </span>
          ) : null
        }
      />

      <div className="ht-card mt-5" style={{ padding: 20, animation: "ht-fadeUp .55s 60ms both" }}>
        {/* Progreso de hábitos */}
        {total > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 8, borderRadius: 6, background: "var(--color-cream)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round((doneCount / total) * 100)}%`,
                  borderRadius: 6,
                  background: allHabitsDone ? "var(--color-success, #1D9E75)" : "var(--color-accent)",
                  transition: "width .4s cubic-bezier(.2,.7,.2,1)",
                }}
              />
            </div>
            {allHabitsDone && (
              <p className="ht-serif" style={{ fontSize: 13, color: "var(--color-success, #1D9E75)", margin: "10px 0 0" }}>
                🎉 Día perfecto en hábitos.
              </p>
            )}
          </div>
        )}

        {/* Hábitos de hoy */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          {scheduled.map((h) => {
            const done = completedToday.has(h.id);
            return (
              <Row
                key={h.id}
                done={done}
                busy={busy === h.id}
                icon={<span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>{h.icon}</span>}
                label={h.name}
                right={
                  h.streakCurrent > 0 ? (
                    <span className="shrink-0 flex items-center gap-1" style={{ fontSize: 12, color: "var(--color-warm)" }}>
                      <Flame size={12} strokeWidth={1.75} color="var(--color-accent)" />
                      <span className="ht-mono">{h.streakCurrent}d</span>
                    </span>
                  ) : null
                }
                onClick={() => toggleHabit(h.id)}
              />
            );
          })}
        </div>

        {/* Tareas con vencimiento hoy */}
        {pendingTasks > 0 && (
          <div style={{ marginTop: scheduled.length > 0 ? 14 : 0 }}>
            <SubLabel icon={<ListTodo size={12} strokeWidth={1.75} />}>
              Tareas para hoy
            </SubLabel>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {tasks.map((t) => (
                <Row
                  key={t.id}
                  done={false}
                  busy={busy === t.id}
                  icon={<ListTodo size={16} strokeWidth={1.75} color="var(--color-warm)" />}
                  label={t.title}
                  onClick={() => completeTask(t)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Resumen del día: comidas / agua / entreno / eventos */}
        {summary && (
          <div
            className="flex flex-wrap"
            style={{ gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-cream)" }}
          >
            {has("nutrition") && (
              <SummaryChip
                icon={<UtensilsCrossed size={13} strokeWidth={1.75} />}
                label={`${summary.meals} ${summary.meals === 1 ? "comida" : "comidas"}`}
              />
            )}
            {has("nutrition") && (
              <SummaryChip
                icon={<Droplet size={13} strokeWidth={1.75} />}
                label={`${(summary.waterMl / 1000).toFixed(1)}/${(summary.waterGoalMl / 1000).toFixed(1)} L`}
                done={summary.waterGoalMl > 0 && summary.waterMl >= summary.waterGoalMl}
              />
            )}
            {has("fitness") && (
              <SummaryChip
                icon={<Dumbbell size={13} strokeWidth={1.75} />}
                label={summary.workoutDone ? "Entrenaste hoy" : "Sin entreno"}
                done={summary.workoutDone}
              />
            )}
            <SummaryChip
              icon={<CalendarDays size={13} strokeWidth={1.75} />}
              label={`${summary.events} ${summary.events === 1 ? "evento" : "eventos"}`}
            />
          </div>
        )}

        {/* Descanso hoy */}
        {resting.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-cream)" }}>
            <SubLabel icon={<Moon size={12} strokeWidth={1.75} />}>
              Descanso hoy · no afecta tu racha
            </SubLabel>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {resting.map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1.5 rounded-full"
                  style={{ padding: "5px 11px", fontSize: 12.5, background: "var(--color-cream)", color: "var(--color-warm)" }}
                  title="Hoy es día de descanso para este hábito — tu racha se mantiene"
                >
                  <span aria-hidden>{h.icon}</span>
                  {h.name}
                  {h.streakCurrent > 0 && (
                    <span className="ht-mono" style={{ opacity: 0.7 }}>· {h.streakCurrent}d</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({
  done,
  busy,
  icon,
  label,
  right,
  onClick,
}: {
  done: boolean;
  busy: boolean;
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={done}
      className="flex items-center gap-3 text-left rounded-xl transition"
      style={{
        padding: "10px 12px",
        background: done
          ? "color-mix(in oklab, var(--color-success, #1D9E75) 10%, var(--color-warm-white))"
          : "var(--color-warm-white)",
        border: `1px solid ${done ? "color-mix(in oklab, var(--color-success, #1D9E75) 35%, transparent)" : "var(--color-cream)"}`,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      <span
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 30,
          height: 30,
          border: `2px solid ${done ? "var(--color-success, #1D9E75)" : "var(--color-tan)"}`,
          background: done ? "var(--color-success, #1D9E75)" : "transparent",
          color: done ? "#fff" : "var(--color-tan)",
          transition: "all .2s",
        }}
      >
        <Check size={16} strokeWidth={3} />
      </span>
      {icon}
      <span
        className="flex-1 min-w-0"
        style={{
          fontWeight: 500,
          fontSize: 14.5,
          color: "var(--color-dark)",
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.65 : 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {right}
    </button>
  );
}

function SubLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-1.5"
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--color-warm)",
        margin: "0 0 8px",
      }}
    >
      {icon} {children}
    </p>
  );
}

function SummaryChip({
  icon,
  label,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  done?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        padding: "6px 12px",
        fontSize: 12.5,
        background: done
          ? "color-mix(in oklab, var(--color-success, #1D9E75) 14%, var(--color-warm-white))"
          : "var(--color-warm-white)",
        border: `1px solid ${done ? "color-mix(in oklab, var(--color-success, #1D9E75) 30%, transparent)" : "var(--color-cream)"}`,
        color: done ? "var(--color-success, #1D9E75)" : "var(--color-warm)",
      }}
    >
      {icon}
      {label}
    </span>
  );
}
