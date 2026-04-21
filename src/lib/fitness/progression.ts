/**
 * Smart progression engine.
 *
 * Dado el histórico de sets de un ejercicio, sugiere el próximo peso de forma
 * inteligente usando:
 *
 *   1. **Double progression** clásica: primero llena el rango de reps, luego sube peso.
 *   2. **Ajuste por RPE**: si RPE bajó entre sesiones con mismo peso/reps → puede subir.
 *   3. **Plateau detection**: 3+ sesiones sin progreso → sugiere deload o cambio.
 *   4. **Proyección por RPE objetivo**: usa la chart de Helms/Zourdos.
 *
 * Las funciones son puras — no tocan DB. Recibe slices del histórico, devuelve
 * sugerencias con razón + confianza.
 *
 * Referencias:
 *   - Helms, E. (2017). The Muscle and Strength Pyramid — Training. 2nd ed.
 *   - Israetel, M. (2018). Scientific Principles of Strength Training.
 *   - Zourdos, M. et al. (2016). "Novel Resistance Training-Specific Rating
 *     of Perceived Exertion Scale Measuring Repetitions in Reserve."
 *     J Strength Cond Res 30(1):267-275.
 */

import { estimate1RMFromRpe, weightForTargetRpe, rpeToPercent1RM } from "./rir-rpe";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface HistorySet {
  weight: number;
  reps: number;
  rpe?: number | null;
  /** Fecha del workout al que pertenece el set (ISO YYYY-MM-DD) */
  date: string;
  /** Indica si es warmup — los warmups no cuentan para progresión */
  isWarmup?: boolean;
  setType?: string | null;
}

export interface ProgressionSuggestion {
  /** Peso sugerido (kg) para la próxima sesión */
  suggestedWeight: number;
  /** Reps sugeridas (target del rango) */
  suggestedReps: number;
  /** Razón human-readable que explica la sugerencia */
  reason: string;
  /** Confianza 0-1 (↑ más sesiones y RPE registrado) */
  confidence: number;
  /** Indicador de plateau/deload recomendado */
  plateauDetected: boolean;
  /** Deload recomendado (reduce peso ~10%) */
  needsDeload: boolean;
}

export interface ProgressionOptions {
  /** Rango de reps del bloque (ej. 5-8). Default 5-8. */
  repRange?: [number, number];
  /** RPE objetivo (default 8) */
  targetRpe?: number;
  /** Incremento mínimo (kg) para barbell lifts. Default 2.5 */
  minIncrement?: number;
  /** Incremento mínimo (kg) para dumbbell lifts. Default 1 — UI decide. */
  dumbbellIncrement?: number;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Agrupa sets por workout (fecha), ordenados descendente. */
function groupByWorkout(
  sets: HistorySet[],
): Array<{ date: string; sets: HistorySet[] }> {
  const byDate: Record<string, HistorySet[]> = {};
  for (const s of sets) {
    if (s.isWarmup || s.setType === "warmup") continue;
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }
  return Object.entries(byDate)
    .map(([date, sets]) => ({ date, sets }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Toma el top set (mejor peso × reps) de una sesión. */
function topSet(sets: HistorySet[]): HistorySet | null {
  if (sets.length === 0) return null;
  return sets.reduce((best, s) => {
    if (!best) return s;
    if (s.weight > best.weight) return s;
    if (s.weight === best.weight && s.reps > best.reps) return s;
    return best;
  }, null as HistorySet | null);
}

/** Promedio de RPE de las últimas N sesiones (ignora sin RPE). */
function avgRpeLastN(
  sessions: Array<{ sets: HistorySet[] }>,
  n: number,
): number | null {
  const rpes: number[] = [];
  for (const s of sessions.slice(0, n)) {
    const top = topSet(s.sets);
    if (top && top.rpe != null) rpes.push(top.rpe);
  }
  if (rpes.length === 0) return null;
  return rpes.reduce((a, b) => a + b, 0) / rpes.length;
}

// ─── Smart suggestion ─────────────────────────────────────────────────────────

/**
 * Sugiere el próximo peso + reps basado en histórico.
 *
 * Algoritmo:
 *   1. Si el histórico es corto (<2 sesiones) → mantén lo último.
 *   2. Si las últimas 3+ sesiones no progresaron → plateau, sugiere deload.
 *   3. Si la última sesión llegó al top del rango de reps con RPE ≤ target
 *      → sube peso al mínimo incremento, reset reps al bottom del rango.
 *   4. Si la última sesión no llenó el rango → mantén peso, sube 1 rep.
 *   5. Si el RPE promedio últimas 2 sesiones está 1+ pts debajo del target
 *      → sube peso 2× increment (señal de fuerza acumulada).
 */
export function suggestNextWeight(
  history: HistorySet[],
  opts: ProgressionOptions = {},
): ProgressionSuggestion {
  const { repRange = [5, 8], targetRpe = 8, minIncrement = 2.5 } = opts;
  const [minReps, maxReps] = repRange;

  const sessions = groupByWorkout(history);
  const lastSession = sessions[0];
  const lastTop = lastSession ? topSet(lastSession.sets) : null;

  // 1. Sin histórico → no podemos sugerir nada sensato.
  if (!lastTop) {
    return {
      suggestedWeight: 0,
      suggestedReps: minReps,
      reason:
        "Sin histórico. Empieza con un peso donde puedas hacer " +
        `${minReps}-${maxReps} reps a RPE ${targetRpe}.`,
      confidence: 0,
      plateauDetected: false,
      needsDeload: false,
    };
  }

  // 2. Plateau detection: si 3+ sesiones con mismo peso y no se aumentó ni reps ni peso.
  const lastThree = sessions.slice(0, 3).map((s) => topSet(s.sets)).filter((t): t is HistorySet => t !== null);
  const plateauDetected =
    lastThree.length >= 3 &&
    lastThree.every((t) => t.weight === lastThree[0].weight && t.reps === lastThree[0].reps);

  if (plateauDetected) {
    const avgRpe = avgRpeLastN(sessions, 3);
    const shouldDeload = avgRpe != null && avgRpe >= 9;
    if (shouldDeload) {
      return {
        suggestedWeight: Math.round((lastTop.weight * 0.9) * 2) / 2,
        suggestedReps: minReps,
        reason:
          `Plateau detectado (3 sesiones iguales, RPE promedio ${avgRpe.toFixed(1)}). ` +
          "Recomendado deload: baja ~10% y vuelve al rango bajo de reps.",
        confidence: 0.75,
        plateauDetected: true,
        needsDeload: true,
      };
    }
    return {
      suggestedWeight: lastTop.weight + minIncrement,
      suggestedReps: minReps,
      reason:
        "3 sesiones sin progresar — intenta subir " +
        `${minIncrement} kg y resetear al rango bajo (${minReps} reps).`,
      confidence: 0.7,
      plateauDetected: true,
      needsDeload: false,
    };
  }

  const lastRpe = lastTop.rpe;
  const avgRpe2 = avgRpeLastN(sessions, 2);

  // 5. RPE consistentemente bajo → salto doble.
  if (avgRpe2 != null && avgRpe2 <= targetRpe - 1.5 && sessions.length >= 2) {
    return {
      suggestedWeight: lastTop.weight + minIncrement * 2,
      suggestedReps: minReps,
      reason:
        `RPE promedio (${avgRpe2.toFixed(1)}) muy debajo del objetivo ` +
        `(${targetRpe}). Te sobra fuerza — sube ${minIncrement * 2} kg.`,
      confidence: 0.8,
      plateauDetected: false,
      needsDeload: false,
    };
  }

  // 3. Última sesión llegó al top del rango → sube peso.
  if (lastTop.reps >= maxReps && (lastRpe == null || lastRpe <= targetRpe)) {
    return {
      suggestedWeight: lastTop.weight + minIncrement,
      suggestedReps: minReps,
      reason:
        `Completaste ${maxReps} reps la sesión anterior` +
        (lastRpe != null ? ` a RPE ${lastRpe}` : "") +
        ` — sube ${minIncrement} kg y baja al rango inicial.`,
      confidence: lastRpe != null ? 0.9 : 0.7,
      plateauDetected: false,
      needsDeload: false,
    };
  }

  // 4. No llenó el rango → mantén peso, añade 1 rep.
  if (lastTop.reps < maxReps) {
    const nextReps = Math.min(maxReps, lastTop.reps + 1);
    return {
      suggestedWeight: lastTop.weight,
      suggestedReps: nextReps,
      reason:
        `Sigue con ${lastTop.weight} kg y apunta a ${nextReps} reps ` +
        `(double progression).`,
      confidence: lastRpe != null ? 0.85 : 0.7,
      plateauDetected: false,
      needsDeload: false,
    };
  }

  // Fallback: mantén igual.
  return {
    suggestedWeight: lastTop.weight,
    suggestedReps: lastTop.reps,
    reason: "Mantén el mismo peso y reps — ajusta según cómo te sientas hoy.",
    confidence: 0.5,
    plateauDetected: false,
    needsDeload: false,
  };
}

/**
 * Detecta si el user está en plateau simple (sin progreso).
 */
export function detectPlateau(
  history: HistorySet[],
  windowSessions = 3,
): boolean {
  const sessions = groupByWorkout(history);
  if (sessions.length < windowSessions) return false;
  const tops = sessions
    .slice(0, windowSessions)
    .map((s) => topSet(s.sets))
    .filter((t): t is HistorySet => t !== null);
  if (tops.length < windowSessions) return false;
  const first = tops[0];
  return tops.every((t) => t.weight === first.weight && t.reps === first.reps);
}

/**
 * ¿Necesita deload? — señal combinada de RPE alto + plateau.
 */
export function needsDeload(history: HistorySet[]): boolean {
  const sessions = groupByWorkout(history);
  if (sessions.length < 3) return false;
  if (!detectPlateau(history, 3)) return false;
  const avgRpe = avgRpeLastN(sessions, 3);
  return avgRpe != null && avgRpe >= 9;
}

/**
 * Best estimate del 1RM actual usando el mejor set reciente.
 * Prefiere RPE-based si hay RPE; fallback a Epley.
 */
export function bestEstimated1RM(history: HistorySet[]): number | null {
  const sessions = groupByWorkout(history);
  if (sessions.length === 0) return null;
  let best: number | null = null;
  for (const session of sessions.slice(0, 8)) {
    for (const set of session.sets) {
      if (set.isWarmup) continue;
      let est: number | null;
      if (set.rpe != null && set.rpe >= 6) {
        est = estimate1RMFromRpe(set.weight, set.reps, set.rpe);
      } else {
        // Epley fallback
        est = set.reps > 0 ? set.weight * (1 + set.reps / 30) : null;
      }
      if (est != null && (best == null || est > best)) best = est;
    }
  }
  return best ? Math.round(best * 10) / 10 : null;
}

export { weightForTargetRpe, rpeToPercent1RM };
