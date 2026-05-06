// Parser de quick-add para transacciones financieras.
// Extrae amount, type (income/expense), category, merchant, date de strings como:
//   "Uber $250 ayer"                → expense 250, transporte, ayer
//   "Sueldo 45000"                  → income 45000, salario
//   "Starbucks $85"                 → expense 85, café
//   "Supermercado $1,200 ayer"      → expense 1200, alimentación
//   "Netflix $249 mensual"          → expense 249 recurring
//
// Sign override (+/-) — el user puede forzar el tipo escribiendo:
//   "+800 sueldo extra"             → income 800 (forzado por +)
//   "-50 café"                      → expense 50 (forzado por −)
//   "+$45,000"                      → income 45000
// El signo solo aplica cuando aparece pegado al monto (con o sin `$`/`S/`).
// Si no hay signo explícito, se usa la heurística de keywords.

export type ParsedTxn = {
  amount: number;
  type: "income" | "expense";
  category: string;
  subcategory?: string;
  merchant?: string;
  description: string;
  date: string; // YYYY-MM-DD
  confidence: "low" | "medium" | "high";
  isRecurringHint?: boolean;
  hints: string[];
};

// Palabras clave → categoría sugerida
const CATEGORY_KEYWORDS: Record<string, { category: string; subcategory?: string; isIncome?: boolean }> = {
  // Income
  sueldo:       { category: "Salario", isIncome: true },
  salario:      { category: "Salario", isIncome: true },
  nómina:       { category: "Salario", isIncome: true },
  nomina:       { category: "Salario", isIncome: true },
  freelance:    { category: "Freelance", isIncome: true },
  bonus:        { category: "Bonos", isIncome: true },
  bono:         { category: "Bonos", isIncome: true },
  aguinaldo:    { category: "Bonos", isIncome: true },
  venta:        { category: "Ventas", isIncome: true },
  dividendo:    { category: "Inversiones", isIncome: true },
  renta:        { category: "Vivienda" }, // puede ser gasto (pagar renta) o ingreso, lo forzamos en contexto

  // Food
  super:        { category: "Alimentación", subcategory: "Supermercado" },
  supermercado: { category: "Alimentación", subcategory: "Supermercado" },
  walmart:      { category: "Alimentación", subcategory: "Supermercado" },
  soriana:      { category: "Alimentación", subcategory: "Supermercado" },
  chedraui:     { category: "Alimentación", subcategory: "Supermercado" },
  costco:       { category: "Alimentación", subcategory: "Supermercado" },
  restaurante:  { category: "Alimentación", subcategory: "Restaurante" },
  comida:       { category: "Alimentación" },
  starbucks:    { category: "Alimentación", subcategory: "Café" },
  café:         { category: "Alimentación", subcategory: "Café" },
  cafe:         { category: "Alimentación", subcategory: "Café" },
  mcdonalds:    { category: "Alimentación", subcategory: "Fast food" },
  pizza:        { category: "Alimentación", subcategory: "Restaurante" },
  cena:         { category: "Alimentación", subcategory: "Restaurante" },
  lunch:        { category: "Alimentación", subcategory: "Restaurante" },
  desayuno:     { category: "Alimentación", subcategory: "Restaurante" },
  uber_eats:    { category: "Alimentación", subcategory: "Delivery" },
  rappi:        { category: "Alimentación", subcategory: "Delivery" },
  didi_food:    { category: "Alimentación", subcategory: "Delivery" },

  // Transport
  uber:         { category: "Transporte", subcategory: "Ride-share" },
  didi:         { category: "Transporte", subcategory: "Ride-share" },
  gasolina:     { category: "Transporte", subcategory: "Combustible" },
  gas:          { category: "Transporte", subcategory: "Combustible" },
  parking:      { category: "Transporte", subcategory: "Estacionamiento" },
  taxi:         { category: "Transporte", subcategory: "Taxi" },
  metro:        { category: "Transporte", subcategory: "Transporte público" },
  camión:       { category: "Transporte", subcategory: "Transporte público" },

  // Housing
  hipoteca:     { category: "Vivienda", subcategory: "Hipoteca" },
  luz:          { category: "Vivienda", subcategory: "Servicios" },
  agua:         { category: "Vivienda", subcategory: "Servicios" },
  internet:     { category: "Vivienda", subcategory: "Servicios" },
  cable:        { category: "Vivienda", subcategory: "Servicios" },
  telefono:     { category: "Vivienda", subcategory: "Servicios" },
  teléfono:     { category: "Vivienda", subcategory: "Servicios" },

  // Subscriptions
  netflix:      { category: "Entretenimiento", subcategory: "Streaming" },
  spotify:      { category: "Entretenimiento", subcategory: "Streaming" },
  disney:       { category: "Entretenimiento", subcategory: "Streaming" },
  hbo:          { category: "Entretenimiento", subcategory: "Streaming" },
  amazon:       { category: "Compras" },
  mercadolibre: { category: "Compras" },

  // Health
  gym:          { category: "Salud", subcategory: "Gimnasio" },
  gimnasio:     { category: "Salud", subcategory: "Gimnasio" },
  doctor:       { category: "Salud", subcategory: "Médico" },
  farmacia:     { category: "Salud", subcategory: "Medicamentos" },
  medicina:     { category: "Salud", subcategory: "Medicamentos" },

  // Ocio
  cine:         { category: "Ocio" },
  bar:          { category: "Ocio" },
  viaje:        { category: "Ocio", subcategory: "Viajes" },
  hotel:        { category: "Ocio", subcategory: "Viajes" },
  vuelo:        { category: "Ocio", subcategory: "Viajes" },

  // Educación
  curso:        { category: "Educación" },
  libro:        { category: "Educación" },

  // Ahorro / inversión
  ahorro:       { category: "Ahorro" },
  inversion:    { category: "Inversiones" },
  inversión:    { category: "Inversiones" },
};

const RECURRING_HINTS = ["mensual", "cada mes", "semanal", "cada semana", "anual", "cada año", "quincenal"];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function extractAmount(text: string): {
  amount: number;
  match: string;
  sign?: "+" | "-";
} | null {
  // Captura opcional `+` o `-` antes del monto, opcional `$` o `S/` antes
  // del número, y el número en formato "1,200" / "1,200.50" / "45" / "$45".
  const m = text.match(
    /([+-])?\s*(?:\$|s\/)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i,
  );
  if (!m) return null;
  const sign = (m[1] === "+" || m[1] === "-" ? m[1] : undefined) as
    | "+"
    | "-"
    | undefined;
  const raw = m[2].replace(/,/g, "");
  const val = parseFloat(raw);
  if (!Number.isFinite(val) || val <= 0) return null;
  return { amount: val, match: m[0], sign };
}

function extractDate(text: string, now: Date): { date: string; match: string } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (/\bhoy\b/.test(text)) {
    return { date: today.toISOString().split("T")[0], match: "hoy" };
  }
  if (/\bayer\b/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return { date: d.toISOString().split("T")[0], match: "ayer" };
  }
  if (/\bantier|antenoche|anteayer\b/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return { date: d.toISOString().split("T")[0], match: "antier" };
  }
  // "hace N días"
  const hace = text.match(/\bhace\s+(\d+)\s+d[ií]as?\b/i);
  if (hace) {
    const d = new Date(today);
    d.setDate(d.getDate() - parseInt(hace[1], 10));
    return { date: d.toISOString().split("T")[0], match: hace[0] };
  }
  // Default: hoy
  return { date: today.toISOString().split("T")[0], match: "" };
}

export function parseQuickAddTxn(input: string, now: Date = new Date()): ParsedTxn {
  const raw = input.trim();
  const text = normalize(raw);
  const hints: string[] = [];

  const amountPart = extractAmount(text);
  const amount = amountPart?.amount ?? 0;
  if (amountPart) hints.push(`monto: ${amountPart.match}`);

  const dateInfo = extractDate(text, now);
  if (dateInfo.match) hints.push(`fecha: ${dateInfo.match}`);

  const isRecurringHint = RECURRING_HINTS.some((h) => text.includes(h));
  if (isRecurringHint) hints.push("recurrente detectado");

  // Detectar tipo por keywords
  let category = "Otros";
  let subcategory: string | undefined;
  let type: "income" | "expense" = "expense";
  let merchantGuess: string | undefined;

  for (const [kw, meta] of Object.entries(CATEGORY_KEYWORDS)) {
    const kwNormalized = kw.replace(/_/g, " ");
    if (text.includes(kwNormalized)) {
      category = meta.category;
      if (meta.subcategory) subcategory = meta.subcategory;
      if (meta.isIncome) type = "income";
      // Usar el keyword en capital como merchant guess
      merchantGuess = kwNormalized.charAt(0).toUpperCase() + kwNormalized.slice(1);
      hints.push(`categoría: ${category}`);
      break;
    }
  }

  // Sign override — si el user puso `+` o `−` antes del monto, forzar
  // el tipo independientemente de las keywords detectadas. Esto le da
  // control explícito al user para casos donde la heurística falla
  // (ej. "venta" puede ser ingreso o gasto según contexto).
  if (amountPart?.sign === "+") {
    type = "income";
    hints.push("tipo forzado: ingreso (+)");
  } else if (amountPart?.sign === "-") {
    type = "expense";
    hints.push("tipo forzado: gasto (−)");
  }

  // Descripción: limpiamos lo que parseamos
  let description = raw;
  if (amountPart) description = description.replace(amountPart.match, "").trim();
  if (dateInfo.match) {
    description = description.replace(new RegExp(`\\b${dateInfo.match}\\b`, "i"), "").trim();
  }
  description = description.replace(/\s{2,}/g, " ").trim();
  if (!description) description = merchantGuess ?? category;

  // Confianza: si el user usó signo explícito (+/-), subimos un nivel.
  const hasSign = !!amountPart?.sign;
  const confidence: ParsedTxn["confidence"] =
    amountPart && (merchantGuess || hasSign) ? "high" :
    amountPart ? "medium" : "low";

  return {
    amount,
    type,
    category,
    subcategory,
    merchant: merchantGuess,
    description,
    date: dateInfo.date,
    confidence,
    isRecurringHint,
    hints,
  };
}
