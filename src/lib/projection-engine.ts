/**
 * Projection Engine — calculates milestone trajectories for goals.
 * Supports logarithmic (endurance), linear, and block periodization (strength).
 */

import type { Milestone, ProjectionConfig, MilestoneStatus } from "@/stores/okr-store";

// ─── Core calculation ─────────────────────────────────────────────────────────

function weeksBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Logarithmic progression: fast gains early, plateau toward end
function logarithmicTarget(baseline: number, goal: number, week: number, totalWeeks: number): number {
  const delta = goal - baseline;
  const factor = Math.log(week + 1) / Math.log(totalWeeks + 1);
  return Number((baseline + delta * factor).toFixed(2));
}

// Linear progression: equal increments
function linearTarget(baseline: number, goal: number, week: number, totalWeeks: number): number {
  return Number((baseline + ((goal - baseline) / totalWeeks) * week).toFixed(2));
}

// Block periodization: 3 phases (adaptation → hypertrophy → strength)
function blockTarget(baseline: number, goal: number, week: number, totalWeeks: number): number {
  const delta = goal - baseline;
  const phase1 = Math.ceil(totalWeeks * 0.33);
  const phase2 = Math.ceil(totalWeeks * 0.66);
  let factor: number;
  if (week <= phase1) {
    factor = (week / phase1) * 0.25;            // 0-25% of delta in phase 1
  } else if (week <= phase2) {
    factor = 0.25 + ((week - phase1) / (phase2 - phase1)) * 0.45; // 25-70% in phase 2
  } else {
    factor = 0.70 + ((week - phase2) / (totalWeeks - phase2)) * 0.30; // 70-100% in phase 3
  }
  return Number((baseline + delta * factor).toFixed(2));
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateMilestones(cfg: ProjectionConfig, objectiveId: string): Milestone[] {
  const startDate = today();
  const totalWeeks = weeksBetween(startDate, cfg.endDate);
  const milestones: Milestone[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    let target: number;
    switch (cfg.progression) {
      case "logarithmic":       target = logarithmicTarget(cfg.baseline, cfg.goal, w, totalWeeks); break;
      case "block_periodization": target = blockTarget(cfg.baseline, cfg.goal, w, totalWeeks); break;
      default:                  target = linearTarget(cfg.baseline, cfg.goal, w, totalWeeks);
    }

    milestones.push({
      id: `ms_${objectiveId}_w${w}_${Date.now()}`,
      objectiveId,
      weekNumber: w,
      targetDate: addWeeks(startDate, w),
      targetValue: target,
      actualValue: 0,
      status: "pending" as MilestoneStatus,
      recalculated: false,
    });
  }

  return milestones;
}

// ─── Recalculation after a missed milestone ───────────────────────────────────

export function recalculateMilestones(
  existing: Milestone[],
  missedWeek: number,
  actualValue: number,
  cfg: ProjectionConfig
): { milestones: Milestone[]; atRisk: boolean } {
  const remaining = existing.filter(m => m.weekNumber > missedWeek);
  if (remaining.length === 0) return { milestones: existing, atRisk: false };

  const deficit = cfg.goal - actualValue;
  const weeklyIncrement = deficit / remaining.length;
  const maxSafeIncrement = (cfg.goal - cfg.baseline) / existing.length * 1.5;
  const atRisk = weeklyIncrement > maxSafeIncrement;

  const updatedRemaining = remaining.map((m, i) => ({
    ...m,
    targetValue: Number((actualValue + weeklyIncrement * (i + 1)).toFixed(2)),
    recalculated: true,
    status: "pending" as MilestoneStatus,
  }));

  return {
    milestones: [
      ...existing.filter(m => m.weekNumber <= missedWeek),
      ...updatedRemaining,
    ],
    atRisk,
  };
}

// ─── Status evaluator ─────────────────────────────────────────────────────────

export function evaluateMilestoneStatus(
  milestone: Milestone,
  cfg: ProjectionConfig
): MilestoneStatus {
  const isPast = milestone.targetDate <= today();
  if (!isPast) {
    if (milestone.actualValue > 0) {
      const ratio = milestone.actualValue / milestone.targetValue;
      return ratio >= 1 ? "hit" : ratio < (1 - cfg.alertThreshold) ? "at_risk" : "pending";
    }
    return "pending";
  }
  if (milestone.actualValue >= milestone.targetValue) return "hit";
  const deficit = (milestone.targetValue - milestone.actualValue) / milestone.targetValue;
  return deficit > cfg.alertThreshold ? "missed" : "at_risk";
}

// ─── Summary stats for dashboard ─────────────────────────────────────────────

export interface ProjectionSummary {
  totalWeeks: number;
  completedWeeks: number;
  hitCount: number;
  missedCount: number;
  atRiskCount: number;
  currentActual: number;
  projectedFinal: number;
  onTrack: boolean;
  completionPct: number;
}

export function getProjectionSummary(milestones: Milestone[], cfg: ProjectionConfig): ProjectionSummary {
  const past = milestones.filter(m => m.targetDate <= today());
  const hit = past.filter(m => m.status === "hit").length;
  const missed = past.filter(m => m.status === "missed").length;
  const atRisk = milestones.filter(m => m.status === "at_risk").length;
  const lastActual = past.length > 0 ? past[past.length - 1].actualValue : cfg.baseline;
  const remaining = milestones.filter(m => m.targetDate > today()).length;
  const projectedFinal = remaining > 0
    ? Number((lastActual + (cfg.goal - lastActual) * (hit / Math.max(1, past.length))).toFixed(2))
    : lastActual;

  return {
    totalWeeks: milestones.length,
    completedWeeks: past.length,
    hitCount: hit,
    missedCount: missed,
    atRiskCount: atRisk,
    currentActual: lastActual,
    projectedFinal,
    onTrack: missed === 0 && atRisk === 0,
    completionPct: milestones.length > 0 ? Math.round((hit / milestones.length) * 100) : 0,
  };
}

// ─── Chart data builder ───────────────────────────────────────────────────────

export interface ChartPoint {
  week: number;
  label: string;
  projected: number;
  actual: number | null;
  status: MilestoneStatus;
}

export function buildChartData(milestones: Milestone[], cfg: ProjectionConfig): ChartPoint[] {
  const todayStr = today();
  return [
    { week: 0, label: "Inicio", projected: cfg.baseline, actual: cfg.baseline, status: "hit" as MilestoneStatus },
    ...milestones.map(m => ({
      week: m.weekNumber,
      label: `S${m.weekNumber}`,
      projected: m.targetValue,
      actual: m.targetDate <= todayStr || m.actualValue > 0 ? m.actualValue : null,
      status: m.status,
    })),
  ];
}
