"use client";
import React, { useState, useMemo } from "react";
import { useHabitStore } from "@/stores/habit-store";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useOKRStore } from "@/stores/okr-store";
import type { Habit, HabitLog } from "@/types";
import { Check, Zap, Target, TrendingUp, AlertTriangle, ChevronRight, Star, Flame } from "lucide-react";

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

const TIME_OF_DAY_CONFIG = {
  morning:   { label: "Mañana",    emoji: "☀️", color: C.warning },
  afternoon: { label: "Tarde",     emoji: "🌤️", color: C.accent },
  evening:   { label: "Noche",     emoji: "🌙", color: C.info },
  all:       { label: "Todo el día", emoji: "📅", color: C.medium },
};

interface KanbanCard {
  id: string; title: string; priority: "Alta" | "Media" | "Baja";
  dueDate?: string; category: string; objectiveId?: string; weight: number;
}

// ─── Insight Engine ───────────────────────────────────────────────────────────
function useDailyInsight(habits: Habit[], logs: HabitLog[], completedIds: Set<string>) {
  return useMemo(() => {
    const total = habits.length;
    const done = habits.filter(h => completedIds.has(h.id)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const streakKing = habits.reduce((best, h) => h.streakCurrent > (best?.streakCurrent ?? 0) ? h : best, habits[0]);
    const atRisk = habits.filter(h => !completedIds.has(h.id) && h.streakCurrent > 3);

    if (pct === 100) return { icon: "🏆", color: C.success, text: "¡Día perfecto! Todos los hábitos completados. Tu consistencia construye el futuro." };
    if (pct >= 70)  return { icon: "🔥", color: C.warning, text: `${done}/${total} hábitos completados. ¡Casi ahí! ${atRisk[0] ? `Protege la racha de ${atRisk[0].name} (${atRisk[0].streakCurrent}d).` : ""}` };
    if (atRisk.length > 0) return { icon: "⚠️", color: C.danger, text: `${atRisk[0].name} tiene ${atRisk[0].streakCurrent} días de racha — complétalo hoy para no perderla.` };
    if (streakKing?.streakCurrent > 0) return { icon: "⚡", color: C.accent, text: `Tu mejor racha: ${streakKing?.name} con ${streakKing?.streakCurrent} días. ¡Mantén el impulso!` };
    return { icon: "🌱", text: "Cada hábito completado hoy es un voto por la persona que quieres ser.", color: C.medium };
  }, [habits, completedIds]);
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 80 ? C.success : pct >= 50 ? C.warning : C.danger;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.lightCream} strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%", fontSize: size * 0.22, fontWeight: 700, fill: color, fontFamily: "Georgia, serif" }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DailyCommandCenter() {
  const { habits, logs, toggleHabitToday } = useHabitStore();
  const { objectives } = useOKRStore();
  const [kanban, setKanban] = useLocalStorage<{ [col: string]: KanbanCard[] }>("productivity_kanban", { todo: [], inProgress: [], done: [] });
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.date === todayStr && l.completed);
  const completedIds = new Set(todayLogs.map(l => l.habitId));

  const activeHabits = useMemo(() => {
    const dow = new Date().getDay();
    return habits.filter(h => {
      if (h.isActive === false) return false;
      if (h.frequency === "daily" || !h.targetDays?.length) return true;
      return h.targetDays.includes(dow);
    });
  }, [habits]);

  const groupedHabits = useMemo(() => {
    const order = ["morning", "afternoon", "evening", "all"] as const;
    return order
      .map(tod => ({ tod, items: activeHabits.filter(h => h.timeOfDay === tod) }))
      .filter(g => g.items.length > 0);
  }, [activeHabits]);

  const donePct = activeHabits.length > 0
    ? Math.round((activeHabits.filter(h => completedIds.has(h.id)).length / activeHabits.length) * 100)
    : 0;

  const insight = useDailyInsight(activeHabits, logs, completedIds);

  // Today's kanban cards (due today or in progress)
  const todayCards = useMemo(() => {
    const inProg = kanban.inProgress ?? [];
    const todo = (kanban.todo ?? []).filter(c => c.dueDate === todayStr);
    return [...inProg, ...todo];
  }, [kanban, todayStr]);

  const handleHabitToggle = async (habitId: string) => {
    if (toggling.has(habitId)) return;
    setToggling(prev => new Set(prev).add(habitId));
    try { await toggleHabitToday(habitId); }
    finally { setToggling(prev => { const n = new Set(prev); n.delete(habitId); return n; }); }
  };

  const moveCardDone = (cardId: string) => {
    setKanban(prev => {
      const card = [...(prev.inProgress ?? []), ...(prev.todo ?? [])].find(c => c.id === cardId);
      if (!card) return prev;
      return {
        ...prev,
        todo: (prev.todo ?? []).filter(c => c.id !== cardId),
        inProgress: (prev.inProgress ?? []).filter(c => c.id !== cardId),
        done: [...(prev.done ?? []), { ...card }],
      };
    });
  };

  const dateLabel = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const atRiskObjectives = objectives.filter(o => o.progress < 30 && o.type !== "yearly");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

      {/* ── Left column ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.dark}, ${C.brown})`, borderRadius: "16px", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: C.lightTan, textTransform: "capitalize", letterSpacing: "0.5px" }}>{dateLabel}</p>
            <h1 style={{ margin: 0, fontSize: "26px", fontFamily: "Georgia, serif", color: C.accentGlow, fontWeight: "normal" }}>Centro de Comando</h1>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: C.tan }}>Tu día completo en un vistazo</p>
          </div>
          <ScoreRing pct={donePct} size={88} />
        </div>

        {/* Insight banner */}
        <div style={{ backgroundColor: insight.color + "18", border: `1.5px solid ${insight.color}40`, borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px", flexShrink: 0 }}>{insight.icon}</span>
          <p style={{ margin: 0, fontSize: "14px", color: C.dark, lineHeight: 1.5 }}>{insight.text}</p>
        </div>

        {/* Habits by time-of-day */}
        {groupedHabits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: C.warm, backgroundColor: C.warmWhite, borderRadius: "12px", border: `2px dashed ${C.tan}` }}>
            <p style={{ fontSize: "32px", margin: "0 0 8px 0" }}>🌱</p>
            <p style={{ margin: 0, fontSize: "14px" }}>No tienes hábitos aún. Agrégalos en Habit Tracker.</p>
          </div>
        ) : (
          groupedHabits.map(({ tod, items }) => {
            const cfg = TIME_OF_DAY_CONFIG[tod];
            const groupDone = items.filter(h => completedIds.has(h.id)).length;
            return (
              <div key={tod} style={{ backgroundColor: C.paper, border: `1.5px solid ${C.lightCream}`, borderRadius: "14px", overflow: "hidden" }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 12px", borderBottom: `1px solid ${C.lightCream}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{cfg.emoji}</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: C.dark, fontFamily: "Georgia, serif" }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: groupDone === items.length ? C.success : C.warm, fontWeight: "600", backgroundColor: groupDone === items.length ? C.successLight : C.lightCream, padding: "3px 10px", borderRadius: "20px" }}>
                    {groupDone}/{items.length}
                  </span>
                </div>
                {/* Habit rows */}
                <div style={{ padding: "8px 0" }}>
                  {items.map(habit => {
                    const done = completedIds.has(habit.id);
                    const isToggling = toggling.has(habit.id);
                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleHabitToggle(habit.id)}
                        disabled={isToggling}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: "14px",
                          padding: "12px 18px", border: "none", cursor: isToggling ? "wait" : "pointer",
                          backgroundColor: done ? C.successLight + "60" : "transparent",
                          transition: "background 0.2s",
                          textAlign: "left",
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                          border: `2.5px solid ${done ? C.success : C.tan}`,
                          backgroundColor: done ? C.success : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s",
                        }}>
                          {done && <Check size={14} color={C.paper} strokeWidth={3} />}
                        </div>
                        {/* Icon + name */}
                        <span style={{ fontSize: "22px", flexShrink: 0 }}>{habit.icon || "⭐"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: done ? C.medium : C.dark, textDecoration: done ? "line-through" : "none" }}>
                            {habit.name}
                          </p>
                          <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: C.warm }}>{habit.category}</p>
                        </div>
                        {/* Streak */}
                        {habit.streakCurrent > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                            <Flame size={13} color={habit.streakCurrent >= 7 ? C.danger : C.warning} />
                            <span style={{ fontSize: "12px", fontWeight: "700", color: habit.streakCurrent >= 7 ? C.danger : C.warning }}>{habit.streakCurrent}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Today's tasks */}
        {todayCards.length > 0 && (
          <div style={{ backgroundColor: C.paper, border: `1.5px solid ${C.lightCream}`, borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${C.lightCream}`, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>📋</span>
              <span style={{ fontSize: "15px", fontWeight: "700", color: C.dark, fontFamily: "Georgia, serif" }}>Tareas de Hoy</span>
              <span style={{ fontSize: "12px", color: C.warm, backgroundColor: C.lightCream, padding: "2px 8px", borderRadius: "12px", marginLeft: "auto" }}>{todayCards.length}</span>
            </div>
            <div style={{ padding: "8px 0" }}>
              {todayCards.map(card => {
                const isDone = (kanban.done ?? []).some(c => c.id === card.id);
                const linkedObj = card.objectiveId ? objectives.find(o => o.id === card.objectiveId) : null;
                return (
                  <div key={card.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 18px" }}>
                    <button
                      onClick={() => moveCardDone(card.id)}
                      style={{
                        width: "24px", height: "24px", borderRadius: "6px", border: `2px solid ${isDone ? C.success : C.tan}`,
                        backgroundColor: isDone ? C.success : "transparent", cursor: "pointer", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {isDone && <Check size={13} color={C.paper} strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "14px", color: isDone ? C.medium : C.dark, textDecoration: isDone ? "line-through" : "none", fontWeight: "500" }}>{card.title}</p>
                      <div style={{ display: "flex", gap: "6px", marginTop: "3px" }}>
                        <span style={{ fontSize: "11px", color: C.warm }}>{card.category}</span>
                        {linkedObj && <span style={{ fontSize: "11px", color: linkedObj.color, backgroundColor: linkedObj.color + "20", padding: "1px 6px", borderRadius: "8px" }}>→ {linkedObj.emoji} {linkedObj.title.slice(0, 24)}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "8px", flexShrink: 0,
                      backgroundColor: card.priority === "Alta" ? C.dangerLight : card.priority === "Media" ? C.warningLight : C.successLight,
                      color: card.priority === "Alta" ? C.danger : card.priority === "Media" ? C.warning : C.success,
                    }}>{card.priority}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px", position: "sticky", top: "20px" }}>

        {/* Progress summary */}
        <div style={{ backgroundColor: C.paper, border: `1.5px solid ${C.lightCream}`, borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: C.dark, display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={16} color={C.accent} /> Resumen del Día
          </h3>
          {[
            { label: "Hábitos completados", value: `${activeHabits.filter(h => completedIds.has(h.id)).length}/${activeHabits.length}`, color: C.success },
            { label: "Racha más larga", value: `${Math.max(0, ...habits.map(h => h.streakCurrent))}d`, color: C.warning },
            { label: "Tareas de hoy", value: `${(kanban.done ?? []).length + todayCards.length}`, color: C.info },
            { label: "Score del día", value: `${donePct}%`, color: donePct >= 80 ? C.success : donePct >= 50 ? C.warning : C.danger },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.lightCream}` }}>
              <span style={{ fontSize: "13px", color: C.warm }}>{item.label}</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* OKR snapshot */}
        <div style={{ backgroundColor: C.paper, border: `1.5px solid ${C.lightCream}`, borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: C.dark, display: "flex", alignItems: "center", gap: "8px" }}>
            <Target size={16} color={C.accent} /> Objetivos Activos
          </h3>
          {objectives.filter(o => o.type !== "yearly").slice(0, 4).map(obj => (
            <div key={obj.id} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "12px", color: C.dark, fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>{obj.emoji}</span> {obj.title.slice(0, 28)}{obj.title.length > 28 ? "…" : ""}
                </span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: obj.color }}>{obj.progress}%</span>
              </div>
              <div style={{ height: "6px", backgroundColor: C.lightCream, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${obj.progress}%`, backgroundColor: obj.color, borderRadius: "3px", transition: "width 0.4s ease" }} />
              </div>
            </div>
          ))}
          {objectives.length === 0 && <p style={{ fontSize: "13px", color: C.warm, margin: 0, textAlign: "center" }}>Sin objetivos aún</p>}
        </div>

        {/* At-risk alerts */}
        {atRiskObjectives.length > 0 && (
          <div style={{ backgroundColor: C.dangerLight, border: `1.5px solid ${C.danger}40`, borderRadius: "14px", padding: "16px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", color: C.danger, display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={14} /> Objetivos en Riesgo
            </h3>
            {atRiskObjectives.map(obj => (
              <div key={obj.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px" }}>{obj.emoji}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: C.dark, fontWeight: "600" }}>{obj.title.slice(0, 32)}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: C.danger }}>Solo {obj.progress}% completado</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motivational streak */}
        {habits.some(h => h.streakCurrent >= 7) && (
          <div style={{ background: `linear-gradient(135deg, ${C.accent}20, ${C.accentGlow}40)`, border: `1.5px solid ${C.accent}50`, borderRadius: "14px", padding: "16px", textAlign: "center" }}>
            <span style={{ fontSize: "28px" }}>🔥</span>
            <p style={{ margin: "8px 0 4px", fontSize: "13px", fontWeight: "700", color: C.dark }}>
              {Math.max(...habits.map(h => h.streakCurrent))} días de racha
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: C.warm }}>
              {habits.find(h => h.streakCurrent === Math.max(...habits.map(h2 => h2.streakCurrent)))?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
