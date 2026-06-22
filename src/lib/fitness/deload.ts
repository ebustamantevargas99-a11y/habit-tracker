/**
 * Semana de descarga (deload).
 *
 * Una descarga es una SEMANA en la que se baja el volumen ~50% y la carga
 * ~10% para disipar fatiga y "realizar" las ganancias (Israetel/RP). Aquí se
 * gestiona como un estado por-semana en localStorage (no toca la BD): activarla
 * marca la semana actual; al cambiar de semana expira sola.
 */

import {
  todayLocal,
  startOfWeekLocal,
  toLocalDateStr,
  parseLocalDateStr,
} from "@/lib/date/local";

export const DELOAD_VOLUME_FACTOR = 0.5; // ~50% del volumen normal
export const DELOAD_LOAD_REDUCTION_PCT = 10; // ~10% menos carga

const KEY = "ut-fitness-deload-week";

/** Clave de la semana actual = lunes de la semana (YYYY-MM-DD). */
export function currentWeekKey(today: string = todayLocal()): string {
  return toLocalDateStr(startOfWeekLocal(parseLocalDateStr(today)));
}

export function isDeloadActive(today: string = todayLocal()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === currentWeekKey(today);
  } catch {
    return false;
  }
}

export function setDeloadActive(active: boolean, today: string = todayLocal()): void {
  if (typeof window === "undefined") return;
  try {
    if (active) window.localStorage.setItem(KEY, currentWeekKey(today));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* sin localStorage: no crítico */
  }
}

/** Objetivo de series en semana de descarga (~50% del plan normal, a media serie). */
export function deloadTarget(plannedSets: number): number {
  return Math.round(plannedSets * DELOAD_VOLUME_FACTOR * 2) / 2;
}
