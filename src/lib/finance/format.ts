// Formateo consistente de moneda y números financieros.

/**
 * Locales por currency — aproximado. Useful to display con el separador
 * correcto (ej. MXN usa coma para decimales? no — MXN usa punto como USD).
 */
const CURRENCY_LOCALE: Record<string, string> = {
  MXN: "es-MX",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  ARS: "es-AR",
  COP: "es-CO",
  CLP: "es-CL",
  PEN: "es-PE",
  BRL: "pt-BR",
  JPY: "ja-JP",
};

export function formatMoney(
  amount: number,
  currency: string = "MXN",
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
}

/** Para cantidades pequeñas (< 1000) con 2 decimales. */
export function formatMoneyDetail(amount: number, currency: string = "MXN"): string {
  return formatMoney(amount, currency, { maximumFractionDigits: 2 });
}

/** Formato compacto "1.2K", "3.5M". */
export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(0);
}

export function signForType(type: "income" | "expense" | "transfer"): string {
  return type === "income" ? "+" : "−";
}

export function colorForType(type: "income" | "expense" | "transfer"): string {
  return type === "income" ? "text-success" : type === "expense" ? "text-danger" : "text-brand-medium";
}

/** Símbolo de moneda (fallback $). */
export function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    MXN: "$", USD: "$", EUR: "€", GBP: "£", CAD: "C$", ARS: "$", COP: "$",
    CLP: "$", PEN: "S/", BRL: "R$", JPY: "¥",
  };
  return map[currency] ?? "$";
}
