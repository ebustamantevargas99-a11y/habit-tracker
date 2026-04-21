/**
 * Unit conversion + display helpers (Fitness redesign Fase 9).
 *
 * Regla inmutable de diseño:
 *   — En la base de datos TODO se guarda en MÉTRICO (kg, cm, km, m).
 *   — La preferencia `UserProfile.units` ("metric" | "imperial") SÓLO afecta
 *     cómo se muestra y cómo se acepta input del user.
 *   — Nada que se persista va sin pasar por el inverso (UI→DB siempre a métrico).
 *
 * Esto evita data mixta, hace queries analíticas directas y desacopla la
 * preferencia de la correctness.
 */

export type UnitSystem = "metric" | "imperial";

// ─── Conversion factors ───────────────────────────────────────────────────────

const LB_PER_KG = 2.2046226218;
const MI_PER_KM = 0.62137119;
const IN_PER_CM = 0.39370079;

// ─── Raw conversions (puras) ──────────────────────────────────────────────────

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}
export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}
export function kmToMi(km: number): number {
  return km * MI_PER_KM;
}
export function miToKm(mi: number): number {
  return mi / MI_PER_KM;
}
export function cmToIn(cm: number): number {
  return cm * IN_PER_CM;
}
export function inToCm(inches: number): number {
  return inches / IN_PER_CM;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/**
 * Format peso para UI. Acepta kg (siempre como fuente canónica); si units=imperial
 * lo convierte a lb.
 *
 * @param kg  valor en kilos (sistema canónico DB)
 * @param units  preferencia del user
 * @param opts.decimals  decimales a mostrar (default 1)
 * @param opts.includeUnit  incluir sufijo "kg"/"lb" (default true)
 */
export function formatWeight(
  kg: number | null | undefined,
  units: UnitSystem,
  opts: { decimals?: number; includeUnit?: boolean } = {},
): string {
  if (kg === null || kg === undefined || !Number.isFinite(kg)) return "—";
  const { decimals = 1, includeUnit = true } = opts;
  const value = units === "imperial" ? kgToLb(kg) : kg;
  const label = units === "imperial" ? "lb" : "kg";
  const formatted = parseFloat(value.toFixed(decimals)).toString();
  return includeUnit ? `${formatted} ${label}` : formatted;
}

/**
 * Format distancia. Fuente DB en kilómetros; muestra en millas si imperial.
 */
export function formatDistance(
  km: number | null | undefined,
  units: UnitSystem,
  opts: { decimals?: number; includeUnit?: boolean } = {},
): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return "—";
  const { decimals = 2, includeUnit = true } = opts;
  const value = units === "imperial" ? kmToMi(km) : km;
  const label = units === "imperial" ? "mi" : "km";
  const formatted = parseFloat(value.toFixed(decimals)).toString();
  return includeUnit ? `${formatted} ${label}` : formatted;
}

/**
 * Format pace running ("5:30/km" o "8:50/mi").
 * Input: segundos por km (sistema canónico). Si units=imperial, convierte a sec/mi.
 */
export function formatPace(
  secPerKm: number | null | undefined,
  units: UnitSystem,
): string {
  if (secPerKm === null || secPerKm === undefined || !Number.isFinite(secPerKm) || secPerKm <= 0) {
    return "—";
  }
  const secPerUnit = units === "imperial" ? secPerKm / MI_PER_KM : secPerKm;
  const min = Math.floor(secPerUnit / 60);
  const sec = Math.round(secPerUnit % 60);
  const pad = sec < 10 ? `0${sec}` : `${sec}`;
  const suffix = units === "imperial" ? "/mi" : "/km";
  return `${min}:${pad}${suffix}`;
}

/**
 * Format estatura. Fuente DB en cm. Si imperial, muestra "5'9"" (pies-pulgadas).
 */
export function formatHeight(
  cm: number | null | undefined,
  units: UnitSystem,
): string {
  if (cm === null || cm === undefined || !Number.isFinite(cm) || cm <= 0) return "—";
  if (units === "metric") {
    return `${Math.round(cm)} cm`;
  }
  const totalIn = cmToIn(cm);
  const feet = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - feet * 12);
  return `${feet}'${inches}"`;
}

/**
 * Format duración "hh:mm:ss" o "mm:ss" desde segundos.
 * Esto no depende de units, pero vive acá porque lo usa Cardio.
 */
export function formatDuration(
  totalSec: number | null | undefined,
  opts: { forceHours?: boolean } = {},
): string {
  if (totalSec === null || totalSec === undefined || !Number.isFinite(totalSec) || totalSec < 0) {
    return "—";
  }
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  if (h > 0 || opts.forceHours) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

// ─── Input parsers (UI → DB) ──────────────────────────────────────────────────

/**
 * Normaliza input de peso al sistema métrico (kg).
 * Si el user está en imperial, convertimos a kg antes de persistir.
 */
export function normalizeWeightToKg(value: number, units: UnitSystem): number {
  return units === "imperial" ? lbToKg(value) : value;
}

export function normalizeDistanceToKm(value: number, units: UnitSystem): number {
  return units === "imperial" ? miToKm(value) : value;
}

export function normalizeHeightToCm(value: number, units: UnitSystem): number {
  return units === "imperial" ? inToCm(value) : value;
}

// ─── Labels para UI ───────────────────────────────────────────────────────────

export function weightUnitLabel(units: UnitSystem): "kg" | "lb" {
  return units === "imperial" ? "lb" : "kg";
}

export function distanceUnitLabel(units: UnitSystem): "km" | "mi" {
  return units === "imperial" ? "mi" : "km";
}

export function heightUnitLabel(units: UnitSystem): "cm" | "in" {
  return units === "imperial" ? "in" : "cm";
}
