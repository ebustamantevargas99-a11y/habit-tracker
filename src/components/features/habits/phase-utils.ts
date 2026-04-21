// Helpers de UI compartidos entre componentes de hábitos.
// Lógica pura — no toca DB.

import type { HabitPhase } from "@/types";

export const PHASE_META: Record<
  HabitPhase,
  { label: string; emoji: string; colorClass: string; bgClass: string }
> = {
  not_started:   { label: "Sin iniciar",     emoji: "🌰", colorClass: "text-brand-tan",    bgClass: "bg-brand-cream" },
  starting:      { label: "Iniciando",       emoji: "🌱", colorClass: "text-accent-glow",  bgClass: "bg-accent-glow/30" },
  forming:       { label: "Formándose",      emoji: "🌿", colorClass: "text-accent-light", bgClass: "bg-accent-light/40" },
  strengthening: { label: "Fortaleciéndose", emoji: "🌳", colorClass: "text-accent",       bgClass: "bg-accent/70" },
  near_rooted:   { label: "Casi arraigado",  emoji: "🔥", colorClass: "text-brand-brown",  bgClass: "bg-brand-brown/80" },
  rooted:        { label: "Arraigado",       emoji: "🏆", colorClass: "text-success",     bgClass: "bg-success" },
};

export const PHASE_MILESTONES = [1, 8, 22, 67, 92];

export function phaseFromStreak(streak: number): HabitPhase {
  if (streak <= 0) return "not_started";
  if (streak <= 7) return "starting";
  if (streak <= 21) return "forming";
  if (streak <= 66) return "strengthening";
  if (streak <= 91) return "near_rooted";
  return "rooted";
}

export function daysToNextPhase(streak: number): number | null {
  if (streak === 0) return 1;
  if (streak <= 7) return 8 - streak;
  if (streak <= 21) return 22 - streak;
  if (streak <= 66) return 67 - streak;
  if (streak <= 91) return 92 - streak;
  return null;
}

export function nextPhaseLabel(streak: number): string | null {
  if (streak <= 0) return "Iniciando";
  if (streak <= 7) return "Formándose";
  if (streak <= 21) return "Fortaleciéndose";
  if (streak <= 66) return "Casi arraigado";
  if (streak <= 91) return "Arraigado";
  return null;
}
