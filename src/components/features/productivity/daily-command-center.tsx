"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/components/ui";
import { useHabitStore } from "@/stores/habit-store";
import { useProductivityStore } from "@/stores/productivity-store";
import { useOKRStore } from "@/stores/okr-store";
import type { Habit, HabitLog } from "@/types";
import { Check, Zap, Target, AlertTriangle, Flame } from "lucide-react";

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
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.lightCream} strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" className="[transition:stroke-dashoffset_0.6s_ease]" />
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
  const { projects, moveTaskStatus } = useProductivityStore();
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.date === todayStr && l.completed);
  const completedIds = new Set(todayLogs.map(l => l.habitId));

  const allTasks = useMemo(
    () => projects.flatMap(p => p.tasks.map(t => ({ ...t, projectName: p.name }))),
    [projects]
  );

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

  const todayCards = useMemo(() => {
    const inProg = allTasks.filter(t => t.status === "inProgress");
    const todo = allTasks.filter(t => t.status === "todo" && t.dueDate === todayStr);
    return [...inProg, ...todo];
  }, [allTasks, todayStr]);

  const doneTasks = useMemo(() => allTasks.filter(t => t.status === "done"), [allTasks]);

  const handleHabitToggle = async (habitId: string) => {
    if (toggling.has(habitId)) return;
    setToggling(prev => new Set(prev).add(habitId));
    try { await toggleHabitToday(habitId); }
    finally { setToggling(prev => { const n = new Set(prev); n.delete(habitId); return n; }); }
  };

  const moveCardDone = async (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    await moveTaskStatus(task.projectId, taskId, "done");
  };

  const dateLabel = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const atRiskObjectives = objectives.filter(o => o.progress < 30 && o.type !== "yearly");

  return (
    <div className="grid gap-6 items-start [grid-template-columns:1fr_340px]">

      {/* ── Left column ── */}
      <div className="flex flex-col gap-5">

        {/* Header */}
        <div className="rounded-2xl px-7 py-6 flex items-center justify-between bg-[linear-gradient(135deg,#3D2B1F,#6B4226)]">
          <div>
            <p className="mb-1 text-[13px] capitalize tracking-[0.5px] text-brand-light-tan">{dateLabel}</p>
            <h1 className="m-0 text-[26px] font-normal font-serif text-accent-glow">Centro de Comando</h1>
            <p className="mt-1.5 mb-0 text-[13px] text-brand-tan">Tu día completo en un vistazo</p>
          </div>
          <ScoreRing pct={donePct} size={88} />
        </div>

        {/* Insight banner */}
        <div
          className="rounded-xl py-3.5 px-[18px] flex items-center gap-3"
          style={{ backgroundColor: insight.color + "18", border: `1.5px solid ${insight.color}40` }}
        >
          <span className="text-[22px] shrink-0">{insight.icon}</span>
          <p className="m-0 text-sm leading-[1.5] text-brand-dark">{insight.text}</p>
        </div>

        {/* Habits by time-of-day */}
        {groupedHabits.length === 0 ? (
          <div className="text-center p-10 rounded-xl border-2 border-dashed border-brand-tan text-brand-warm bg-brand-warm-white">
            <p className="text-[32px] mb-2">🌱</p>
            <p className="m-0 text-sm">No tienes hábitos aún. Agrégalos en Habit Tracker.</p>
          </div>
        ) : (
          groupedHabits.map(({ tod, items }) => {
            const cfg = TIME_OF_DAY_CONFIG[tod];
            const groupDone = items.filter(h => completedIds.has(h.id)).length;
            return (
              <div key={tod} className="rounded-[14px] overflow-hidden bg-brand-paper border-[1.5px] border-brand-light-cream">
                {/* Group header */}
                <div className="flex items-center justify-between px-[18px] pt-3.5 pb-3 border-b border-brand-light-cream">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">{cfg.emoji}</span>
                    <span className="text-[15px] font-bold text-brand-dark font-serif">{cfg.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-[3px] rounded-[20px]",
                    groupDone === items.length ? "text-success bg-success-light" : "text-brand-warm bg-brand-light-cream"
                  )}>
                    {groupDone}/{items.length}
                  </span>
                </div>
                {/* Habit rows */}
                <div className="py-2">
                  {items.map(habit => {
                    const done = completedIds.has(habit.id);
                    const isToggling = toggling.has(habit.id);
                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleHabitToggle(habit.id)}
                        disabled={isToggling}
                        className={cn(
                          "w-full flex items-center gap-3.5 px-[18px] py-3 border-none text-left transition-[background] duration-200",
                          isToggling ? "cursor-wait" : "cursor-pointer",
                          done ? "bg-[#D4E6B560]" : "bg-transparent"
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          "w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center transition-all duration-200 border-[2.5px]",
                          done ? "border-success bg-success" : "border-brand-tan bg-transparent"
                        )}>
                          {done && <Check size={14} color={C.paper} strokeWidth={3} />}
                        </div>
                        {/* Icon + name */}
                        <span className="text-[22px] shrink-0">{habit.icon || "⭐"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("m-0 text-sm font-semibold", done ? "text-brand-medium line-through" : "text-brand-dark")}>
                            {habit.name}
                          </p>
                          <p className="mt-0.5 mb-0 text-[11px] text-brand-warm">{habit.category}</p>
                        </div>
                        {/* Streak */}
                        {habit.streakCurrent > 0 && (
                          <div className="flex items-center gap-[3px] shrink-0">
                            <Flame size={13} color={habit.streakCurrent >= 7 ? C.danger : C.warning} />
                            <span className={cn("text-xs font-bold", habit.streakCurrent >= 7 ? "text-danger" : "text-warning")}>{habit.streakCurrent}</span>
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
          <div className="rounded-[14px] overflow-hidden bg-brand-paper border-[1.5px] border-brand-light-cream">
            <div className="px-[18px] pt-3.5 pb-3 flex items-center gap-2 border-b border-brand-light-cream">
              <span className="text-[18px]">📋</span>
              <span className="text-[15px] font-bold text-brand-dark font-serif">Tareas de Hoy</span>
              <span className="text-xs ml-auto px-2 py-0.5 rounded-xl text-brand-warm bg-brand-light-cream">{todayCards.length}</span>
            </div>
            <div className="py-2">
              {todayCards.map(card => {
                const isDone = card.status === "done";
                const linkedObj = card.objectiveId ? objectives.find(o => o.id === card.objectiveId) : null;
                return (
                  <div key={card.id} className="flex items-center gap-3 px-[18px] py-[11px]">
                    <button
                      onClick={() => moveCardDone(card.id)}
                      className={cn(
                        "w-6 h-6 rounded-md shrink-0 flex items-center justify-center cursor-pointer border-2",
                        isDone ? "border-success bg-success" : "border-brand-tan bg-transparent"
                      )}>
                      {isDone && <Check size={13} color={C.paper} strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("m-0 text-sm font-medium", isDone ? "text-brand-medium line-through" : "text-brand-dark")}>{card.title}</p>
                      <div className="flex gap-1.5 mt-[3px]">
                        <span className="text-[11px] text-brand-warm">{card.projectName}</span>
                        {linkedObj && (
                          <span
                            className="text-[11px] px-1.5 py-px rounded-lg"
                            style={{ color: linkedObj.color, backgroundColor: linkedObj.color + "20" }}
                          >→ {linkedObj.emoji} {linkedObj.title.slice(0, 24)}</span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0",
                      card.priority === "Alta" ? "bg-danger-light text-danger" :
                      card.priority === "Media" ? "bg-warning-light text-warning" : "bg-success-light text-success"
                    )}>{card.priority}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <div className="flex flex-col gap-[18px] sticky top-5">

        {/* Progress summary */}
        <div className="rounded-[14px] p-5 bg-brand-paper border-[1.5px] border-brand-light-cream">
          <h3 className="mb-4 text-sm font-bold flex items-center gap-2 text-brand-dark">
            <Zap size={16} color={C.accent} /> Resumen del Día
          </h3>
          {[
            { label: "Hábitos completados", value: `${activeHabits.filter(h => completedIds.has(h.id)).length}/${activeHabits.length}`, colorClass: "text-success" },
            { label: "Racha más larga", value: `${Math.max(0, ...habits.map(h => h.streakCurrent))}d`, colorClass: "text-warning" },
            { label: "Tareas de hoy", value: `${doneTasks.length + todayCards.length}`, colorClass: "text-info" },
            { label: "Score del día", value: `${donePct}%`, colorClass: donePct >= 80 ? "text-success" : donePct >= 50 ? "text-warning" : "text-danger" },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-brand-light-cream">
              <span className="text-[13px] text-brand-warm">{item.label}</span>
              <span className={cn("text-sm font-bold", item.colorClass)}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* OKR snapshot */}
        <div className="rounded-[14px] p-5 bg-brand-paper border-[1.5px] border-brand-light-cream">
          <h3 className="mb-4 text-sm font-bold flex items-center gap-2 text-brand-dark">
            <Target size={16} color={C.accent} /> Objetivos Activos
          </h3>
          {objectives.filter(o => o.type !== "yearly").slice(0, 4).map(obj => (
            <div key={obj.id} className="mb-3.5">
              <div className="flex justify-between mb-[5px]">
                <span className="text-xs font-semibold flex items-center gap-[5px] text-brand-dark">
                  <span>{obj.emoji}</span> {obj.title.slice(0, 28)}{obj.title.length > 28 ? "…" : ""}
                </span>
                <span className="text-xs font-bold" style={{ color: obj.color }}>{obj.progress}%</span>
              </div>
              <div className="h-1.5 rounded-[3px] overflow-hidden bg-brand-light-cream">
                <div style={{ height: "100%", width: `${obj.progress}%`, backgroundColor: obj.color, borderRadius: "3px", transition: "width 0.4s ease" }} />
              </div>
            </div>
          ))}
          {objectives.length === 0 && <p className="text-[13px] m-0 text-center text-brand-warm">Sin objetivos aún</p>}
        </div>

        {/* At-risk alerts */}
        {atRiskObjectives.length > 0 && (
          <div className="rounded-[14px] p-4 bg-danger-light border-[1.5px] border-[#C0544F40]">
            <h3 className="mb-3 text-[13px] font-bold flex items-center gap-1.5 text-danger">
              <AlertTriangle size={14} /> Objetivos en Riesgo
            </h3>
            {atRiskObjectives.map(obj => (
              <div key={obj.id} className="flex items-center gap-2 mb-2">
                <span className="text-sm">{obj.emoji}</span>
                <div>
                  <p className="m-0 text-xs font-semibold text-brand-dark">{obj.title.slice(0, 32)}</p>
                  <p className="m-0 text-[11px] text-danger">Solo {obj.progress}% completado</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motivational streak */}
        {habits.some(h => h.streakCurrent >= 7) && (
          <div className="rounded-[14px] p-4 text-center bg-[linear-gradient(135deg,#B8860B20,#F0D78C40)] border-[1.5px] border-[#B8860B50]">
            <span className="text-[28px]">🔥</span>
            <p className="mb-1 mt-2 text-[13px] font-bold text-brand-dark">
              {Math.max(...habits.map(h => h.streakCurrent))} días de racha
            </p>
            <p className="m-0 text-[11px] text-brand-warm">
              {habits.find(h => h.streakCurrent === Math.max(...habits.map(h2 => h2.streakCurrent)))?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
