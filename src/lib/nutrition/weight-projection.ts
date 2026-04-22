/**
 * Proyección de peso — regresión lineal sobre weightLogs para estimar:
 *   - Tendencia real de kg/semana (diferente al "plan" teórico)
 *   - ETA para llegar al peso objetivo
 *   - Confianza (R²)
 *   - Desviación vs plan (¿vas más lento/rápido de lo previsto?)
 *
 * Matemática: mínimos cuadrados ordinarios (OLS) sobre pares (dayIndex, weight).
 *
 * Funciones puras — no tocan DB.
 */

export interface WeightPoint {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface WeightTrend {
  /** kg/día pendiente de regresión lineal */
  slopeKgPerDay: number;
  /** kg/semana (útil para UI) */
  weeklyRateKg: number;
  /** Intercepto de la recta (kg en day 0) */
  intercept: number;
  /** Coeficiente R² (0 a 1). Mide qué tan lineal es la tendencia. */
  r2: number;
  /** Primera fecha del rango analizado */
  fromDate: string;
  /** Última fecha del rango analizado */
  toDate: string;
  /** Cantidad de puntos usados */
  points: number;
}

/**
 * Regresión lineal simple sobre puntos de peso.
 * Requiere al menos 2 puntos con fechas distintas.
 */
export function computeWeightTrend(points: WeightPoint[]): WeightTrend | null {
  const filtered = points.filter(
    (p) => Number.isFinite(p.weightKg) && p.weightKg > 0 && p.date.length === 10,
  );
  if (filtered.length < 2) return null;

  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const t0 = dateToMs(sorted[0].date);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of sorted) {
    const diffDays = (dateToMs(p.date) - t0) / 86_400_000;
    xs.push(diffDays);
    ys.push(p.weightKg);
  }

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = meanY - slope * meanX;

  // R² coeficiente determinación
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssRes += (ys[i] - predicted) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

  return {
    slopeKgPerDay: Math.round(slope * 10000) / 10000,
    weeklyRateKg: Math.round(slope * 7 * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
    r2: Math.round(r2 * 1000) / 1000,
    fromDate: sorted[0].date,
    toDate: sorted[sorted.length - 1].date,
    points: n,
  };
}

function dateToMs(dateStr: string): number {
  // Fechas civiles locales: mediodía UTC para evitar drift por DST
  return new Date(`${dateStr}T12:00:00.000Z`).getTime();
}

/**
 * Dada una tendencia y peso actual + objetivo, calcula ETA en días.
 * Devuelve null si la tendencia va en dirección contraria a la meta.
 */
export function eta(args: {
  currentWeightKg: number;
  targetWeightKg: number;
  slopeKgPerDay: number;
}): number | null {
  const { currentWeightKg, targetWeightKg, slopeKgPerDay } = args;
  if (
    !Number.isFinite(currentWeightKg) ||
    !Number.isFinite(targetWeightKg) ||
    !Number.isFinite(slopeKgPerDay)
  ) {
    return null;
  }
  const diff = targetWeightKg - currentWeightKg;
  if (Math.abs(diff) < 0.1) return 0; // ya está en meta
  // La tendencia debe tener el signo adecuado (si quieres bajar, slope < 0)
  if (diff * slopeKgPerDay < 0 || slopeKgPerDay === 0) return null;
  return Math.ceil(Math.abs(diff / slopeKgPerDay));
}

/**
 * Devuelve fecha YYYY-MM-DD de cuándo se alcanzaría el objetivo según la
 * tendencia actual. null si la tendencia es contraria.
 */
export function etaDate(args: {
  currentWeightKg: number;
  targetWeightKg: number;
  slopeKgPerDay: number;
  fromDate?: string; // default hoy
}): string | null {
  const days = eta(args);
  if (days == null) return null;
  const base = args.fromDate
    ? new Date(`${args.fromDate}T12:00:00.000Z`)
    : new Date();
  const target = new Date(base);
  target.setUTCDate(target.getUTCDate() + days);
  return target.toISOString().split("T")[0];
}

/**
 * Compara la tendencia real con la planeada (weeklyRateKg en el NutritionGoal).
 * Devuelve el factor de adherencia: 1.0 = perfecto, >1 más rápido de lo previsto,
 * <1 más lento. null si no se puede comparar (plan o trend 0).
 */
export function adherenceRatio(args: {
  plannedWeeklyKg: number;
  actualWeeklyKg: number;
}): number | null {
  const { plannedWeeklyKg, actualWeeklyKg } = args;
  if (!Number.isFinite(plannedWeeklyKg) || !Number.isFinite(actualWeeklyKg)) {
    return null;
  }
  if (Math.abs(plannedWeeklyKg) < 0.01) return null;
  // Si las direcciones no coinciden (plan baja pero subo), devolvemos valor
  // negativo indicando "va en contra del plan"
  const ratio = actualWeeklyKg / plannedWeeklyKg;
  return Math.round(ratio * 100) / 100;
}

/**
 * Peso suavizado con media móvil de N días (default 7).
 * Reduce ruido de fluctuaciones diarias (hidratación, glicógeno, etc.).
 */
export function movingAverage(
  points: WeightPoint[],
  windowDays = 7,
): WeightPoint[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const out: WeightPoint[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const from = Math.max(0, i - windowDays + 1);
    const slice = sorted.slice(from, i + 1);
    const avg = slice.reduce((s, p) => s + p.weightKg, 0) / slice.length;
    out.push({ date: sorted[i].date, weightKg: Math.round(avg * 100) / 100 });
  }
  return out;
}
