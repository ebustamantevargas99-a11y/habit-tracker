/**
 * RPE (Rate of Perceived Exertion) + RIR (Reps in Reserve) helpers.
 *
 * Basado en tablas científicas de Helms / Zourdos — ampliamente usadas en
 * powerlifting y hipertrofia modernos.
 *
 * Escalas:
 *   RPE 10 = failure absoluto (0 reps más posibles)
 *   RPE 9  = 1 rep en reserva
 *   RPE 8  = 2 reps en reserva
 *   RPE 7  = 3 reps en reserva
 *   RPE 6  = 4 reps en reserva
 *   RPE 5  = 5 reps en reserva (warmup intensity)
 *   RPE <5 = calentamiento, sin relevancia
 *
 * La regla simple: RIR = 10 − RPE (cuando RPE ≥ 5).
 */

export const MIN_RPE = 0;
export const MAX_RPE = 10;

/** Convierte RPE a RIR (reps in reserve). Clamps a [0, 10]. */
export function rpeToRir(rpe: number): number {
  const clamped = Math.max(MIN_RPE, Math.min(MAX_RPE, rpe));
  return Math.round((MAX_RPE - clamped) * 10) / 10;
}

/** Inversa: dado RIR devuelve RPE. */
export function rirToRpe(rir: number): number {
  const clamped = Math.max(0, Math.min(10, rir));
  return Math.round((MAX_RPE - clamped) * 10) / 10;
}

/**
 * Tabla RPE → % del 1RM (derivada de Helms/Zourdos RPE chart).
 *
 * Input: RPE, reps realizadas.
 * Output: porcentaje estimado del 1RM al que se hicieron esas reps.
 *
 * Ejemplo: hiciste 5 reps a RPE 8 → ~82% del 1RM.
 */
const RPE_CHART: Record<number, Record<number, number>> = {
  // reps: { rpe: %1RM }
  1:  { 6: 0.86, 6.5: 0.878, 7: 0.895, 7.5: 0.913, 8: 0.93, 8.5: 0.948, 9: 0.955, 9.5: 0.973, 10: 1.0 },
  2:  { 6: 0.835, 6.5: 0.852, 7: 0.87, 7.5: 0.888, 8: 0.905, 8.5: 0.922, 9: 0.94, 9.5: 0.958, 10: 0.978 },
  3:  { 6: 0.812, 6.5: 0.83, 7: 0.847, 7.5: 0.865, 8: 0.882, 8.5: 0.9, 9: 0.917, 9.5: 0.935, 10: 0.952 },
  4:  { 6: 0.792, 6.5: 0.81, 7: 0.827, 7.5: 0.845, 8: 0.862, 8.5: 0.88, 9: 0.897, 9.5: 0.914, 10: 0.928 },
  5:  { 6: 0.77, 6.5: 0.787, 7: 0.805, 7.5: 0.823, 8: 0.84, 8.5: 0.858, 9: 0.875, 9.5: 0.892, 10: 0.91 },
  6:  { 6: 0.753, 6.5: 0.772, 7: 0.79, 7.5: 0.808, 8: 0.825, 8.5: 0.843, 9: 0.86, 9.5: 0.878, 10: 0.895 },
  7:  { 6: 0.735, 6.5: 0.754, 7: 0.772, 7.5: 0.79, 8: 0.807, 8.5: 0.825, 9: 0.842, 9.5: 0.86, 10: 0.878 },
  8:  { 6: 0.715, 6.5: 0.734, 7: 0.752, 7.5: 0.77, 8: 0.787, 8.5: 0.805, 9: 0.822, 9.5: 0.84, 10: 0.86 },
  9:  { 6: 0.695, 6.5: 0.714, 7: 0.732, 7.5: 0.75, 8: 0.767, 8.5: 0.785, 9: 0.802, 9.5: 0.82, 10: 0.84 },
  10: { 6: 0.677, 6.5: 0.696, 7: 0.714, 7.5: 0.732, 8: 0.75, 8.5: 0.767, 9: 0.785, 9.5: 0.805, 10: 0.825 },
  11: { 6: 0.66, 6.5: 0.679, 7: 0.697, 7.5: 0.715, 8: 0.733, 8.5: 0.751, 9: 0.769, 9.5: 0.788, 10: 0.81 },
  12: { 6: 0.645, 6.5: 0.664, 7: 0.682, 7.5: 0.7, 8: 0.718, 8.5: 0.736, 9: 0.754, 9.5: 0.772, 10: 0.79 },
};

/**
 * Busca la fila de reps más cercana en la chart.
 */
function nearestRepRow(reps: number): Record<number, number> | null {
  if (reps < 1) return null;
  const keys = Object.keys(RPE_CHART).map(Number).sort((a, b) => a - b);
  const clamped = Math.max(keys[0], Math.min(keys[keys.length - 1], reps));
  // Busca el más cercano — si hay empate, elige el inferior (más conservador).
  let best = keys[0];
  let bestDist = Math.abs(clamped - keys[0]);
  for (const k of keys) {
    const d = Math.abs(clamped - k);
    if (d < bestDist) {
      best = k;
      bestDist = d;
    }
  }
  return RPE_CHART[best];
}

/**
 * Busca el % de 1RM más cercano en una fila.
 */
function nearestRpeInRow(
  row: Record<number, number>,
  rpe: number,
): number | null {
  const keys = Object.keys(row).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return null;
  const clamped = Math.max(keys[0], Math.min(keys[keys.length - 1], rpe));
  let best = keys[0];
  let bestDist = Math.abs(clamped - keys[0]);
  for (const k of keys) {
    const d = Math.abs(clamped - k);
    if (d < bestDist) {
      best = k;
      bestDist = d;
    }
  }
  return row[best];
}

/**
 * Dado reps + RPE, estima el porcentaje del 1RM al que se hicieron.
 * Devuelve null si los valores están fuera de rango razonable.
 *
 * @param reps  reps realizadas (1-12+)
 * @param rpe   RPE 6.0-10.0 en pasos de 0.5
 * @returns     ratio 0-1 (0.82 = 82%) o null si fuera de rango
 */
export function rpeToPercent1RM(reps: number, rpe: number): number | null {
  if (!Number.isFinite(reps) || !Number.isFinite(rpe)) return null;
  if (rpe < 6 || rpe > 10) return null;
  const row = nearestRepRow(reps);
  if (!row) return null;
  return nearestRpeInRow(row, rpe);
}

/**
 * Dado peso × reps × RPE, estima el 1RM.
 * Más preciso que Epley para sets con RPE conocido.
 *
 * Fórmula: 1RM = weight / (% de 1RM al que se hizo)
 */
export function estimate1RMFromRpe(
  weight: number,
  reps: number,
  rpe: number,
): number | null {
  const pct = rpeToPercent1RM(reps, rpe);
  if (pct === null || pct === 0) return null;
  return Math.round((weight / pct) * 10) / 10;
}

/**
 * Dado un 1RM estimado + reps + RPE objetivo, devuelve el peso recomendado.
 *
 * Útil para programar sets: "quiero 5 reps a RPE 8" → ¿qué peso cargo?
 *
 * @param estimatedOneRM  1RM estimado del user (kg)
 * @param targetReps      reps que quiere hacer
 * @param targetRpe       RPE objetivo (6-10)
 * @returns               peso en kg, redondeado al 0.5 kg más cercano
 */
export function weightForTargetRpe(
  estimatedOneRM: number,
  targetReps: number,
  targetRpe: number,
): number | null {
  if (estimatedOneRM <= 0) return null;
  const pct = rpeToPercent1RM(targetReps, targetRpe);
  if (pct === null) return null;
  const raw = estimatedOneRM * pct;
  // Redondeo a 0.5 kg (estándar de barbell + discos pequeños)
  return Math.round(raw * 2) / 2;
}
