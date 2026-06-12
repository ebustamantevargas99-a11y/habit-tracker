"use client";

import { useMemo, useState } from "react";
import { Check, Flame, Moon, Sparkles } from "lucide-react";
import { useHabitStore } from "@/stores/habit-store";
import { useUserStore } from "@/stores/user-store";
import { todayLocal, parseLocalDateStr } from "@/lib/date/local";
import SectionHeader from "./primitives/section-header";

/**
 * "Tu día de hoy" — checklist accionable en el inicio. Reúne los hábitos
 * programados para HOY y permite marcarlos sin salir del dashboard. Los
 * hábitos que no tocan hoy (no están en sus targetDays) se muestran como
 * "descanso" y NO cuentan contra la racha (la lógica de racha ya los salta).
 */
export default function TodayChecklist() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const isLoaded = useHabitStore((s) => s.isLoaded);
  const toggleHabitToday = useHabitStore((s) => s.toggleHabitToday);
  const refresh = useHabitStore((s) => s.refresh);
  const tz = useUserStore((s) => s.user?.profile?.timezone ?? null);

  const [busy, setBusy] = useState<string | null>(null);

  const today = useMemo(() => todayLocal(tz), [tz]);
  const dayOfWeek = useMemo(() => parseLocalDateStr(today).getDay(), [today]); // 0=Dom

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

  const doneCount = scheduled.filter((h) => completedToday.has(h.id)).length;
  const total = scheduled.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  async function toggle(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      await toggleHabitToday(id);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!isLoaded) return null;
  // Sin hábitos activos → no mostramos la sección (el usuario aún no creó).
  if (scheduled.length === 0 && resting.length === 0) return null;

  return (
    <section>
      <SectionHeader
        eyebrow="Para hoy"
        title="Tu día de hoy"
        subtitle="Marca lo que completes. Lo que no toca hoy queda en descanso y no afecta tu racha."
        right={
          total > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 font-semibold rounded-full"
              style={{
                padding: "4px 12px",
                fontSize: 12,
                color: allDone ? "var(--color-success, #1D9E75)" : "var(--color-accent)",
                background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-warm-white))",
                border: "1px solid color-mix(in oklab, var(--color-accent) 28%, transparent)",
                whiteSpace: "nowrap",
              }}
            >
              {allDone ? <Sparkles size={13} strokeWidth={2} /> : null}
              {doneCount}/{total} hoy
            </span>
          ) : null
        }
      />

      <div
        className="ht-card mt-5"
        style={{ padding: 20, animation: "ht-fadeUp .55s 60ms both" }}
      >
        {/* Barra de progreso del día */}
        {total > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                height: 8,
                borderRadius: 6,
                background: "var(--color-cream)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: 6,
                  background: allDone ? "var(--color-success, #1D9E75)" : "var(--color-accent)",
                  transition: "width .4s cubic-bezier(.2,.7,.2,1)",
                }}
              />
            </div>
            {allDone && (
              <p
                className="ht-serif"
                style={{ fontSize: 13, color: "var(--color-success, #1D9E75)", margin: "10px 0 0" }}
              >
                🎉 Día perfecto. Completaste todo lo de hoy.
              </p>
            )}
          </div>
        )}

        {/* Hábitos programados hoy — accionables */}
        <div className="flex flex-col" style={{ gap: 8 }}>
          {scheduled.map((h) => {
            const done = completedToday.has(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggle(h.id)}
                disabled={busy === h.id}
                className="flex items-center gap-3 text-left rounded-xl transition"
                style={{
                  padding: "10px 12px",
                  background: done
                    ? "color-mix(in oklab, var(--color-success, #1D9E75) 10%, var(--color-warm-white))"
                    : "var(--color-warm-white)",
                  border: `1px solid ${
                    done
                      ? "color-mix(in oklab, var(--color-success, #1D9E75) 35%, transparent)"
                      : "var(--color-cream)"
                  }`,
                  cursor: busy === h.id ? "wait" : "pointer",
                  opacity: busy === h.id ? 0.6 : 1,
                }}
              >
                <span
                  className="shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: 30,
                    height: 30,
                    border: `2px solid ${
                      done ? "var(--color-success, #1D9E75)" : "var(--color-tan)"
                    }`,
                    background: done ? "var(--color-success, #1D9E75)" : "transparent",
                    color: done ? "#fff" : "var(--color-tan)",
                    transition: "all .2s",
                  }}
                >
                  <Check size={16} strokeWidth={3} />
                </span>
                <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
                  {h.icon}
                </span>
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
                  {h.name}
                </span>
                {h.streakCurrent > 0 && (
                  <span
                    className="shrink-0 flex items-center gap-1"
                    style={{ fontSize: 12, color: "var(--color-warm)" }}
                  >
                    <Flame size={12} strokeWidth={1.75} color="var(--color-accent)" />
                    <span className="ht-mono">{h.streakCurrent}d</span>
                  </span>
                )}
              </button>
            );
          })}

          {total === 0 && (
            <p style={{ fontSize: 13, color: "var(--color-warm)", margin: 0, padding: "4px 2px" }}>
              Hoy no tienes hábitos programados. Disfruta tu descanso.
            </p>
          )}
        </div>

        {/* Hábitos en descanso hoy — no rompen la racha */}
        {resting.length > 0 && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid var(--color-cream)",
            }}
          >
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
              <Moon size={12} strokeWidth={1.75} /> Descanso hoy · no afecta tu racha
            </p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {resting.map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1.5 rounded-full"
                  style={{
                    padding: "5px 11px",
                    fontSize: 12.5,
                    background: "var(--color-cream)",
                    color: "var(--color-warm)",
                  }}
                  title="Hoy es día de descanso para este hábito — tu racha se mantiene"
                >
                  <span aria-hidden>{h.icon}</span>
                  {h.name}
                  {h.streakCurrent > 0 && (
                    <span className="ht-mono" style={{ opacity: 0.7 }}>
                      · {h.streakCurrent}d
                    </span>
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
