import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate Habit Strength (0-100%)
 * Based on Phillippa Lally's research: 66 days average to form a habit
 * See PROJECT-BIBLE.md Section 5.10
 */
export function calculateHabitStrength(
  currentStreak: number,
  completedLast30Days: number,
  temporalConsistency: number = 0.8 // 0-1, how regularly at same time
): number {
  const streakFactor = Math.min(currentStreak / 66, 1) * 40;
  const completionFactor = (completedLast30Days / 30) * 40;
  const consistencyFactor = temporalConsistency * 20;
  return Math.round(streakFactor + completionFactor + consistencyFactor);
}

/**
 * Compound Effect calculation
 * 1% daily = 37.8x in a year
 * See PROJECT-BIBLE.md Section 5.8
 */
export function compoundEffect(dailyRate: number, days: number): number {
  return Math.pow(1 + dailyRate / 100, days);
}

/**
 * Estimate 1RM using Epley formula
 * See PROJECT-BIBLE.md Section 6.6.5
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Get percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Format number with sign prefix
 */
export function formatChange(value: number, suffix: string = "%"): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Format date in Spanish
 */
export function formatDateES(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get strength label based on percentage
 */
export function getStrengthLabel(strength: number): {
  label: string;
  color: string;
} {
  if (strength >= 80) return { label: "Arraigado", color: "#7A9E3E" };
  if (strength >= 60) return { label: "Formándose", color: "#B8860B" };
  if (strength >= 40) return { label: "En progreso", color: "#D4943A" };
  return { label: "Nuevo", color: "#C0544F" };
}

/**
 * Export data as CSV and trigger download
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as JSON and trigger download
 */
export function exportToJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
