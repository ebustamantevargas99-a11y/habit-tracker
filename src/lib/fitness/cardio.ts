/**
 * Cardio / running science helpers — funciones puras.
 *
 * Referencias:
 *   - Tanaka, Monahan, Seals (2001). "Age-predicted maximal heart rate revisited."
 *     J Am Coll Cardiol 37(1):153-156.
 *   - Karvonen, M. (1957). "The effects of training on heart rate."
 *     Ann Med Exp Biol Fenn 35(3):307-315.
 *   - Riegel, P. (1981). "Athletic records and human endurance." Am Sci 69:285-290.
 *   - Daniels, J. (2014). Daniels' Running Formula, 3rd ed. Human Kinetics.
 *   - ACSM (2018). Guidelines for Exercise Testing and Prescription.
 *
 * Todas las distancias en DB están en km (métrico canónico). Tiempos en segundos.
 * La UI convierte a mi/s-por-mi según preferencia del user.
 */

// ─── HR máxima estimada ──────────────────────────────────────────────────────

/**
 * HR_max estimada (Tanaka formula — más precisa que 220-edad).
 * Tanaka et al. (2001): HR_max = 208 − 0.7 × edad
 */
export function tanakaMaxHr(age: number): number {
  if (age < 10 || age > 100) return 220 - age; // fallback clásico
  return Math.round(208 - 0.7 * age);
}

// ─── Zonas de Karvonen (Heart Rate Reserve method) ───────────────────────────

export interface HrZone {
  /** índice 1..5 */
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** rango absoluto de BPM */
  minBpm: number;
  maxBpm: number;
  /** % HRR inferior y superior */
  minPctHrr: number;
  maxPctHrr: number;
  /** descripción del propósito de la zona */
  purpose: string;
}

const KARVONEN_ZONE_DEFS: Array<{
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  minPct: number;
  maxPct: number;
  purpose: string;
}> = [
  { zone: 1, name: "Recuperación activa", minPct: 0.50, maxPct: 0.60,
    purpose: "Calentamiento, recuperación. Puedes hablar normalmente." },
  { zone: 2, name: "Aeróbico base",       minPct: 0.60, maxPct: 0.70,
    purpose: "Quema de grasa, construcción de base aeróbica. Largas distancias." },
  { zone: 3, name: "Tempo",               minPct: 0.70, maxPct: 0.80,
    purpose: "Tempo runs. Justo debajo del umbral." },
  { zone: 4, name: "Umbral (threshold)",  minPct: 0.80, maxPct: 0.90,
    purpose: "Umbral láctico. Intervalos largos de 8-20 min." },
  { zone: 5, name: "VO₂max",              minPct: 0.90, maxPct: 1.00,
    purpose: "Intervalos cortos 2-5 min. Máximo esfuerzo aeróbico." },
];

/**
 * Calcula las 5 zonas cardíacas usando Karvonen (HR reserve).
 *
 * HR_target = ((HR_max − HR_rest) × %) + HR_rest
 *
 * @param age        edad en años (para Tanaka HR_max si no se pasa maxHr)
 * @param restingHr  frecuencia cardíaca en reposo (bpm)
 * @param opts.maxHr override HR_max medida (test de laboratorio)
 */
export function karvonenZones(
  age: number,
  restingHr: number,
  opts: { maxHr?: number } = {},
): HrZone[] {
  if (restingHr < 30 || restingHr > 120) {
    throw new Error("restingHr fuera de rango (30-120 bpm)");
  }
  const maxHr = opts.maxHr ?? tanakaMaxHr(age);
  const hrr = maxHr - restingHr;
  if (hrr <= 0) throw new Error("HR_max debe ser mayor que HR_rest");

  return KARVONEN_ZONE_DEFS.map((d) => ({
    zone: d.zone,
    name: d.name,
    minBpm: Math.round(hrr * d.minPct + restingHr),
    maxBpm: Math.round(hrr * d.maxPct + restingHr),
    minPctHrr: d.minPct,
    maxPctHrr: d.maxPct,
    purpose: d.purpose,
  }));
}

/**
 * Dada una frecuencia cardíaca actual, ¿en qué zona Karvonen está?
 */
export function classifyHrZone(
  currentBpm: number,
  zones: HrZone[],
): HrZone | null {
  for (const z of zones) {
    if (currentBpm >= z.minBpm && currentBpm <= z.maxBpm) return z;
  }
  if (zones.length > 0 && currentBpm < zones[0].minBpm) return null; // debajo de Z1
  return zones[zones.length - 1]; // sobre Z5
}

// ─── Pace y conversiones ─────────────────────────────────────────────────────

/**
 * Convierte tiempo total (seg) + distancia (km) → pace en seg/km.
 */
export function paceSecPerKm(distanceKm: number, durationSec: number): number | null {
  if (distanceKm <= 0 || durationSec <= 0) return null;
  return durationSec / distanceKm;
}

/**
 * Calcula la velocidad en km/h desde pace seg/km.
 */
export function speedKmH(secPerKm: number): number {
  if (secPerKm <= 0) return 0;
  return Math.round((3600 / secPerKm) * 100) / 100;
}

// ─── Riegel race predictor ───────────────────────────────────────────────────

/**
 * Riegel formula: predice tiempo para otra distancia dado un tiempo conocido.
 *
 * T₂ = T₁ × (D₂ / D₁) ^ fatigueFactor
 *
 * @param knownDistanceKm  distancia conocida (km)
 * @param knownTimeSec     tiempo de esa distancia (seg)
 * @param targetDistanceKm distancia a predecir (km)
 * @param fatigueFactor    exponente (default 1.06, Riegel clásico)
 */
export function riegelPredict(
  knownDistanceKm: number,
  knownTimeSec: number,
  targetDistanceKm: number,
  fatigueFactor = 1.06,
): number {
  if (knownDistanceKm <= 0 || knownTimeSec <= 0 || targetDistanceKm <= 0) return 0;
  return knownTimeSec * Math.pow(targetDistanceKm / knownDistanceKm, fatigueFactor);
}

/**
 * Convención de distancias clásicas de carreras (km).
 */
export const CLASSIC_RACES = {
  mile:     1.609,
  "5k":     5,
  "10k":    10,
  half:     21.0975,
  marathon: 42.195,
  "50k":    50,
} as const;

export type ClassicRace = keyof typeof CLASSIC_RACES;

/**
 * Dado un tiempo en una distancia, devuelve predicciones para las distancias clásicas.
 */
export function predictClassicRaces(
  knownDistanceKm: number,
  knownTimeSec: number,
  fatigueFactor = 1.06,
): Record<ClassicRace, number> {
  const out = {} as Record<ClassicRace, number>;
  for (const [race, dist] of Object.entries(CLASSIC_RACES) as Array<[ClassicRace, number]>) {
    out[race] = Math.round(
      riegelPredict(knownDistanceKm, knownTimeSec, dist, fatigueFactor),
    );
  }
  return out;
}

// ─── VO₂max estimation ───────────────────────────────────────────────────────

/**
 * Estima VO₂max desde tiempo de carrera usando la fórmula de Daniels & Gilbert.
 *
 * VO₂ (ml/kg/min) = −4.60 + 0.182258 × v + 0.000104 × v²  [v en m/min]
 * %VO₂max = 0.8 + 0.1894393 × e^(−0.012778 × t) + 0.2989558 × e^(−0.1932605 × t)
 *          [t en minutos]
 * VO₂max = VO₂ / %VO₂max
 *
 * @param distanceKm  distancia (km)
 * @param timeSec     tiempo (seg) — ideal entre 3.5 min y 2.5 h
 * @returns           VO₂max estimado (ml/kg/min) o null si fuera de rango
 */
export function estimateVo2MaxFromRace(
  distanceKm: number,
  timeSec: number,
): number | null {
  if (distanceKm <= 0 || timeSec <= 0) return null;
  const timeMin = timeSec / 60;
  // Formula tiene validez ~entre 3.5 min (800m sprint) y ~150 min (maratón).
  if (timeMin < 3 || timeMin > 240) return null;
  const velocityMperMin = (distanceKm * 1000) / timeMin;
  const vo2 =
    -4.6 + 0.182258 * velocityMperMin + 0.000104 * velocityMperMin * velocityMperMin;
  const pctVo2Max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin);
  if (pctVo2Max <= 0) return null;
  const vo2Max = vo2 / pctVo2Max;
  if (vo2Max <= 0 || vo2Max > 95) return null; // >95 es fisiológicamente poco realista
  return Math.round(vo2Max * 10) / 10;
}

/**
 * Clasifica VO₂max en categorías cualitativas por edad + sexo (ACSM 2018 approx).
 *
 * @param vo2max     ml/kg/min
 * @param age        edad
 * @param sex        "male" | "female"
 */
export function classifyVo2Max(
  vo2max: number,
  age: number,
  sex: "male" | "female",
): "excellent" | "good" | "average" | "fair" | "poor" {
  // Simplificación de las tablas ACSM (male 20-49 / female 20-49). Ajuste por edad.
  const ageAdjust = Math.max(0, (age - 30) * 0.3);
  const thresholds =
    sex === "male"
      ? { excellent: 55, good: 48, average: 42, fair: 36 }
      : { excellent: 49, good: 43, average: 37, fair: 31 };
  const adj = (t: number) => t - ageAdjust;
  if (vo2max >= adj(thresholds.excellent)) return "excellent";
  if (vo2max >= adj(thresholds.good)) return "good";
  if (vo2max >= adj(thresholds.average)) return "average";
  if (vo2max >= adj(thresholds.fair)) return "fair";
  return "poor";
}

// ─── Splits analysis ─────────────────────────────────────────────────────────

export interface SplitRow {
  km: number;
  paceSec: number;
  hr?: number;
}

/**
 * ¿La corrida fue "negative split" (segunda mitad más rápida)?
 * Criterio: avg pace de la segunda mitad < avg pace de la primera mitad.
 */
export function detectNegativeSplit(splits: SplitRow[]): boolean {
  if (splits.length < 4) return false;
  const half = Math.floor(splits.length / 2);
  const firstAvg = splits.slice(0, half).reduce((s, r) => s + r.paceSec, 0) / half;
  const secondAvg =
    splits.slice(half).reduce((s, r) => s + r.paceSec, 0) / (splits.length - half);
  return secondAvg < firstAvg;
}

/**
 * Detecta fatigue drift — si el pace empeora progresivamente hacia el final.
 * Devuelve un ratio: >1 = se ralentizó, <1 = aceleró (negative split).
 */
export function fatigueDrift(splits: SplitRow[]): number {
  if (splits.length < 2) return 1;
  const first = splits[0].paceSec;
  const last = splits[splits.length - 1].paceSec;
  return Math.round((last / first) * 100) / 100;
}

// ─── Shoe rotation ───────────────────────────────────────────────────────────

export interface ShoeHealth {
  status: "new" | "good" | "aging" | "retire_soon" | "retired" | "over";
  usagePct: number;
  remainingKm: number;
}

/**
 * Estado de salud de una zapatilla running.
 */
export function shoeHealth(currentKm: number, maxKm: number, retired: boolean): ShoeHealth {
  if (retired) {
    return { status: "retired", usagePct: 1, remainingKm: 0 };
  }
  const pct = maxKm > 0 ? currentKm / maxKm : 0;
  const remaining = Math.max(0, maxKm - currentKm);
  if (pct > 1) return { status: "over", usagePct: pct, remainingKm: 0 };
  if (pct >= 0.9) return { status: "retire_soon", usagePct: pct, remainingKm: remaining };
  if (pct >= 0.7) return { status: "aging", usagePct: pct, remainingKm: remaining };
  if (pct >= 0.15) return { status: "good", usagePct: pct, remainingKm: remaining };
  return { status: "new", usagePct: pct, remainingKm: remaining };
}
