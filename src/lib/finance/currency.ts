/**
 * Conversión de monedas para totales agregados (patrimonio neto, gastos
 * del mes, runway, etc.). Mientras no haya un endpoint en vivo conectado
 * a un proveedor de FX (exchangerate.host / openexchangerates), usamos
 * tipos de cambio estáticos actualizados periódicamente.
 *
 * Convención: rates expresan "cuánto vale 1 USD en la moneda dada", así
 * que para convertir A → B hacemos `amount * rates[B] / rates[A]`.
 *
 * Si una moneda no está en la tabla, asumimos paridad 1:1 (mejor mostrar
 * algo aproximado que crashear). El UI debe mostrar un disclaimer cuando
 * haya conversión activa para que el user entienda que es una estimación.
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
