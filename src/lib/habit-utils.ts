import { prisma } from "@/lib/prisma";

// ─── Sistema de arraigo ──────────────────────────────────────────────────────

export const ROOTING_PHASES = {
  not_started:   { min: 0,  max: 0,   label: "Sin iniciar",     emoji: "🌰", next: 1 },
  starting:      { min: 1,  max: 7,   label: "Iniciando",       emoji: "🌱", next: 8 },
  forming:       { min: 8,  max: 21,  label: "Formándose",      emoji: "🌿", next: 22 },
  strengthening: { min: 22, max: 66,  label: "Fortaleciéndose", emoji: "🌳", next: 67 },
  near_rooted:   { min: 67, max: 91,  label: "Casi arraigado",  emoji: "🔥", next: 92 },
  rooted:        { min: 92, max: Infinity, label: "Arraigado", emoji: "🏆", next: null },
} as const;

export type PhaseKey = keyof typeof ROOTING_PHASES;

export const ROOTED_THRESHOLD = 92;
export const GRACE_DAYS_PER_WEEK = 1;

export function phaseFromStreak(streak: number): PhaseKey {
  if (streak <= 0) return "not_started";
  if (streak <= 7) return "starting";
  if (streak <= 21) return "forming";
  if (streak <= 66) return "strengthening";
  if (streak <= 91) return "near_rooted";
  return "rooted";
}

/** Días hasta la próxima fase. Null si ya arraigado. */
export function daysToNextPhase(streak: number): number | null {
  const phase = phaseFromStreak(streak);
  const meta = ROOTING_PHASES[phase];
  if (meta.next === null) return null;
  return meta.next - streak;
}

/** Lunes (YYYY-MM-DD) de la semana de la fecha dada. */
export function mondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

/**
 * Detecta si un hábito acaba de cruzar un hito (7/21/66/92/100/365/500/1000).
 */
export function crossedMilestone(prev: number, now: number): number | null {
  const MILESTONES = [7, 21, 66, 92, 100, 365, 500, 1000];
  for (const m of MILESTONES) {
    if (prev < m && now >= m) return m;
  }
  return null;
}

// ─── Streak con 1 día de gracia semanal ──────────────────────────────────────

export type StreakResult = {
  streakCurrent: number;
  streakBest: number;
  phase: PhaseKey;
  rootedStreak: number;
  rootedAtFirst: Date | null;
  graceDaysAvailable: number;     // 0 o 1 para la semana actual
  graceWeekStart: string;         // YYYY-MM-DD del lunes actual
  graceUsedThisWeek: boolean;
  lastCompletedDate: string | null;
  atRisk: boolean;
  atRiskCritical: boolean;
  hoursInvested: number;
};

/**
 * Recalcula streak + fase + gracia a partir de los logs.
 *
 * Política:
 * - 1 día de gracia disponible por semana (resetea cada lunes).
 * - Si en la semana actual faltaste 1 día programado, gracia se usa y la racha
 *   continúa. Si faltas un segundo día programado, la racha se rompe.
 * - La gracia se cuenta por la SEMANA del día que se está evaluando, así
 *   cuando iteramos hacia atrás para computar streakBest, cada semana tiene
 *   su propia bolsa de gracia.
 */
export async function recalculateStreak(
  habitId: string,
  targetDays: number[],
  options?: { estimatedMinutes?: number | null; currentRootedAt?: Date | null }
): Promise<StreakResult> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
    take: 730,
    select: { date: true, completed: true },
  });

  const logMap = new Map(logs.map((l) => [l.date, l.completed]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeDays = targetDays.length > 0 ? targetDays : [0, 1, 2, 3, 4, 5, 6];
  const thisWeekMonday = mondayOfWeek(today);

  // ── streakCurrent ─────────────────────────────────────────────────────
  let streakCurrent = 0;
  let lastCompletedDate: string | null = null;
  {
    let currentWeek = thisWeekMonday;
    let graceUsed = false;
    for (let i = 0; i < 730; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dow = d.getDay();
      const weekM = mondayOfWeek(d);
      if (weekM !== currentWeek) {
        currentWeek = weekM;
        graceUsed = false;
      }
      const completed = logMap.get(dateStr);
      if (completed === true) {
        streakCurrent++;
        if (!lastCompletedDate) lastCompletedDate = dateStr;
        continue;
      }
      if (!activeDays.includes(dow)) continue;
      if (i === 0 && completed === undefined) continue;
      if (!graceUsed) {
        graceUsed = true;
        continue;
      }
      break;
    }
  }

  // ── streakBest (histórico) ────────────────────────────────────────────
  let streakBest = streakCurrent;
  {
    let tempStreak = 0;
    let graceUsedB = false;
    let currentWeekB = thisWeekMonday;
    for (let i = 0; i < 730; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dow = d.getDay();
      const weekM = mondayOfWeek(d);
      if (weekM !== currentWeekB) {
        currentWeekB = weekM;
        graceUsedB = false;
      }
      const completed = logMap.get(dateStr);
      if (completed === true) {
        tempStreak++;
        continue;
      }
      if (!activeDays.includes(dow)) continue;
      if (i === 0 && completed === undefined) continue;
      if (!graceUsedB) {
        graceUsedB = true;
        continue;
      }
      if (tempStreak > streakBest) streakBest = tempStreak;
      tempStreak = 0;
    }
    if (tempStreak > streakBest) streakBest = tempStreak;
  }

  // ── Gracia de la semana actual ────────────────────────────────────────
  const graceUsedThisWeek = checkGraceUsedThisWeek(logMap, today, activeDays);

  // ── at risk ──────────────────────────────────────────────────────────
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const yDow = yesterday.getDay();
  const todayStr = today.toISOString().split("T")[0];
  const todayDow = today.getDay();
  const yCompleted = logMap.get(yStr);
  const tCompleted = logMap.get(todayStr);

  const yesterdayMissed = activeDays.includes(yDow) && yCompleted !== true;
  const todayPending = activeDays.includes(todayDow) && tCompleted !== true;

  const atRisk = yesterdayMissed && todayPending && streakCurrent > 0;
  const atRiskCritical = atRisk && graceUsedThisWeek;

  // ── fase + rooted ────────────────────────────────────────────────────
  const phase = phaseFromStreak(streakCurrent);
  const rootedStreak =
    streakCurrent >= ROOTED_THRESHOLD ? streakCurrent - (ROOTED_THRESHOLD - 1) : 0;
  const rootedAtFirst =
    phase === "rooted" && !options?.currentRootedAt
      ? today
      : options?.currentRootedAt ?? null;

  // ── horas invertidas ─────────────────────────────────────────────────
  const completedCount = logs.filter((l) => l.completed).length;
  const minutesPerSession = options?.estimatedMinutes ?? 0;
  const hoursInvested = +((completedCount * minutesPerSession) / 60).toFixed(1);

  return {
    streakCurrent,
    streakBest,
    phase,
    rootedStreak,
    rootedAtFirst,
    graceDaysAvailable: graceUsedThisWeek ? 0 : GRACE_DAYS_PER_WEEK,
    graceWeekStart: thisWeekMonday,
    graceUsedThisWeek,
    lastCompletedDate,
    atRisk,
    atRiskCritical,
    hoursInvested,
  };
}

function checkGraceUsedThisWeek(
  logMap: Map<string, boolean>,
  today: Date,
  activeDays: number[]
): boolean {
  const monday = new Date(today);
  const dow = monday.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  monday.setDate(monday.getDate() + diff);
  for (let d = new Date(monday); d < today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    if (!activeDays.includes(d.getDay())) continue;
    const completed = logMap.get(dateStr);
    if (completed !== true) return true;
  }
  return false;
}
