// Helpers para recurring transactions.

/** Avanza una fecha YYYY-MM-DD según frecuencia. */
export function advanceDate(
  dateStr: string,
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annual"
): string {
  const d = new Date(dateStr + "T00:00:00");
  switch (frequency) {
    case "weekly":    d.setDate(d.getDate() + 7); break;
    case "biweekly":  d.setDate(d.getDate() + 14); break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "annual":    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

/** Emoji default según categoría. */
export function categoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("sueldo") || c.includes("salario") || c.includes("ingreso")) return "💵";
  if (c.includes("renta") || c.includes("hipoteca") || c.includes("casa")) return "🏠";
  if (c.includes("luz") || c.includes("agua") || c.includes("gas") || c.includes("servicio")) return "⚡";
  if (c.includes("tele") || c.includes("internet")) return "📡";
  if (c.includes("gym") || c.includes("salud")) return "💪";
  if (c.includes("netflix") || c.includes("spotify") || c.includes("subs")) return "📺";
  if (c.includes("comida") || c.includes("super") || c.includes("restaurant")) return "🍽️";
  if (c.includes("transporte") || c.includes("gasolina") || c.includes("uber")) return "🚗";
  return "💳";
}
