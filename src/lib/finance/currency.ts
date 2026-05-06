/**
 * Conversión de monedas para totales agregados (patrimonio neto, gastos
 * del mes, runway, etc.). Combinamos:
 *
 *   1. Tasas estáticas (FX_RATES_PER_USD) — fallback siempre disponible.
 *   2. Tasas en vivo via getLiveRates() — fetch lazy a open.er-api.com,
 *      con cache en memoria de 24h. La primera request de cada día las
 *      refresca; el resto del día sirve del cache.
 *
 * Convención: rates expresan "cuánto vale 1 USD en la moneda dada", así
 * que para convertir A → B hacemos `amount * rates[B] / rates[A]`.
 *
 * Si una moneda no está en la tabla, asumimos paridad 1:1 (mejor mostrar
 * algo aproximado que crashear). El UI debe mostrar un disclaimer cuando
 * haya conversión activa.
 */

export const FX_RATES_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 149,
  CNY: 7.2,
  // Latam
  PEN: 3.78,    // Sol peruano
  MXN: 17.0,    // Peso mexicano
  COP: 4100,    // Peso colombiano
  ARS: 1000,    // Peso argentino (volátil — actualizar seguido)
  BRL: 5.0,     // Real brasileño
  CLP: 950,     // Peso chileno
  UYU: 40,      // Peso uruguayo
  // Crypto majors aproximadas (en USD a la fecha)
  BTC: 1 / 95000,
  ETH: 1 / 3500,
};

/** Fecha (YYYY-MM-DD) de la última actualización manual de FX_RATES_PER_USD. */
export const FX_LAST_UPDATED = "2026-01-15";

/**
 * Convierte un monto de la moneda `from` a la moneda `to`.
 * - Si from === to: devuelve amount sin tocar.
 * - Si alguna moneda no está soportada: devuelve amount como fallback
 *   (mejor mostrar algo razonable que romper la página).
 */
export function convertAmount(amount: number, from: string, to: string): number {
  if (!from || !to) return amount;
  if (from === to) return amount;
  const fromRate = FX_RATES_PER_USD[from];
  const toRate = FX_RATES_PER_USD[to];
  if (fromRate == null || toRate == null) return amount;
  return (amount / fromRate) * toRate;
}

/** True si todas las currencies dadas son la misma (no hay multi-currency). */
export function isSingleCurrency(currencies: ReadonlyArray<string>): boolean {
  const set = new Set<string>();
  for (let i = 0; i < currencies.length; i++) {
    const c = currencies[i];
    if (c) set.add(c);
    if (set.size > 1) return false;
  }
  return true;
}

/** True si la currency está cubierta por la tabla de rates. */
export function isSupportedCurrency(c: string | null | undefined): boolean {
  return !!c && c in FX_RATES_PER_USD;
}

// ─── Tasas en vivo (open.er-api.com) ─────────────────────────────────────
//
// open.er-api.com es la versión gratuita y open-source de exchangerate-api.
// No requiere API key, soporta todas las monedas latam (PEN, MXN, COP,
// ARS, BRL, CLP, UYU, etc.), y ofrece datos actualizados diariamente.
//
// Cache en memoria de 24h con fallback al estático cuando la API falla.

const LIVE_RATES_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_API_URL = "https://open.er-api.com/v6/latest/USD";

let cachedRates: Record<string, number> | null = null;
let cachedAtMs = 0;
let cachedSource: "live" | "static" = "static";
let cachedFetchedAtISO: string = FX_LAST_UPDATED;

interface OpenERApiResponse {
  result: "success" | "error";
  base_code?: string;
  time_last_update_unix?: number;
  rates?: Record<string, number>;
}

export interface LiveRatesResult {
  rates: Record<string, number>;
  source: "live" | "static";
  /** ISO date or fallback FX_LAST_UPDATED. Lo que el UI muestra como disclaimer. */
  fetchedAt: string;
}

/**
 * Devuelve las tasas más recientes disponibles. Hace fetch en vivo si el
 * cache expiró (24h). Si la API falla, devuelve las estáticas con
 * `source: "static"`. Nunca lanza — siempre devuelve algo usable.
 */
export async function getLiveRates(): Promise<LiveRatesResult> {
  const now = Date.now();
  if (cachedRates && now - cachedAtMs < LIVE_RATES_TTL_MS) {
    return { rates: cachedRates, source: cachedSource, fetchedAt: cachedFetchedAtISO };
  }

  try {
    // Next.js fetch con revalidate: el runtime cacheará la respuesta
    // entre invocaciones del mismo deployment, además de nuestro cache
    // en memoria por instancia.
    const res = await fetch(LIVE_API_URL, {
      next: { revalidate: 60 * 60 * 12 }, // 12h en el cache de Next
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as OpenERApiResponse;
    if (data.result !== "success" || !data.rates) {
      throw new Error("invalid response");
    }
    // Asegurar USD === 1 (el endpoint devuelve "USD": 1 pero por si las moscas).
    const rates = { ...data.rates, USD: 1 };
    const fetchedAtISO = data.time_last_update_unix
      ? new Date(data.time_last_update_unix * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    cachedRates = rates;
    cachedAtMs = now;
    cachedSource = "live";
    cachedFetchedAtISO = fetchedAtISO;
    return { rates, source: "live", fetchedAt: fetchedAtISO };
  } catch (e) {
    // Fallback al estático. No tirar el endpoint completo por culpa de FX.
    if (process.env.NODE_ENV !== "test") {
      console.warn("[currency] Live FX fetch failed, using static rates:", e);
    }
    cachedRates = FX_RATES_PER_USD;
    cachedAtMs = now;
    cachedSource = "static";
    cachedFetchedAtISO = FX_LAST_UPDATED;
    return { rates: FX_RATES_PER_USD, source: "static", fetchedAt: FX_LAST_UPDATED };
  }
}

/**
 * Versión de convertAmount que acepta una tabla de rates explícita.
 * Útil cuando ya hiciste `getLiveRates()` y querés convertir varios
 * valores con la misma snapshot de tasas.
 */
export function convertWithRates(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  if (!from || !to || from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (fromRate == null || toRate == null) return amount;
  return (amount / fromRate) * toRate;
}

/** Reset interno usado por tests. NO usar en código de producción. */
export function __resetLiveRatesCache(): void {
  cachedRates = null;
  cachedAtMs = 0;
  cachedSource = "static";
  cachedFetchedAtISO = FX_LAST_UPDATED;
}
