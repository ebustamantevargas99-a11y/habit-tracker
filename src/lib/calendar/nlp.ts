// Parser de quick-add en español natural.
// Extrae fecha, hora, duración y título de strings como:
//   "Cena con Ana viernes 8pm"
//   "Reunión mañana 3pm 1h"
//   "Meditar hoy 7:30 15min"
//   "Cita doctor 25 de abril 10am"

export type ParsedEvent = {
  title: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  confidence: "low" | "medium" | "high";
  hints: string[]; // qué fragmentos se detectaron
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado: 6, sábado: 6,
  dom: 0, lun: 1, mar: 2, mie: 3, mié: 3, jue: 4, vie: 5, sab: 6, sáb: 6,
};

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Next occurrence of a weekday (0=Dom..6=Sáb), relative to `from`. */
function nextWeekday(from: Date, dow: number): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const current = d.getDay();
  let diff = (dow - current + 7) % 7;
  if (diff === 0) diff = 7; // "viernes" a viernes = próxima semana
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Extrae hora del texto: "3pm" "9am" "15:00" "10:30" "9" (si es aislado tras "a las"/"at")
 * Retorna { hour, minute, consumedMatch } o null.
 */
function extractTime(
  text: string
): { hour: number; minute: number; match: string } | null {
  // 10:30am / 3:45pm / 09:00
  const full = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (full) {
    let h = parseInt(full[1], 10);
    const m = parseInt(full[2], 10);
    const meridiem = full[3]?.toLowerCase();
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    if (h <= 23 && m <= 59) return { hour: h, minute: m, match: full[0] };
  }

  // 3pm / 9am / 12am
  const simple = text.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (simple) {
    let h = parseInt(simple[1], 10);
    const meridiem = simple[2].toLowerCase();
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    if (h <= 23) return { hour: h, minute: 0, match: simple[0] };
  }

  // "a las 9", "a las 14"
  const alas = text.match(/\ba\s+las\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (alas) {
    const h = parseInt(alas[1], 10);
    const m = alas[2] ? parseInt(alas[2], 10) : 0;
    if (h <= 23 && m <= 59) return { hour: h, minute: m, match: alas[0] };
  }

  return null;
}

/** Extrae duración: "30min" "1h" "1h30" "2 horas" "45 minutos" */
function extractDuration(text: string): { minutes: number; match: string } | null {
  // "1h30" "2h15"
  const combo = text.match(/(\d+)\s*h\s*(\d+)/i);
  if (combo) {
    const h = parseInt(combo[1], 10);
    const m = parseInt(combo[2], 10);
    return { minutes: h * 60 + m, match: combo[0] };
  }
  // "2 horas" "1 hora"
  const horas = text.match(/(\d+)\s*h(?:ora)?s?\b/i);
  if (horas) {
    return { minutes: parseInt(horas[1], 10) * 60, match: horas[0] };
  }
  // "30min" "45 minutos"
  const mins = text.match(/(\d+)\s*m(?:in)?(?:uto)?s?\b/i);
  if (mins) {
    return { minutes: parseInt(mins[1], 10), match: mins[0] };
  }
  return null;
}

function extractDate(text: string, now: Date): { date: Date; match: string } | null {
  // "pasado mañana" — chequear PRIMERO, sino "mañana" lo match antes
  if (/\bpasado\s+ma[ñn]ana\b/.test(text)) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 2);
    return { date: d, match: "pasado mañana" };
  }
  // "hoy"
  if (/\bhoy\b/.test(text)) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return { date: d, match: "hoy" };
  }
  // "mañana" (solo si no venía "pasado mañana")
  if (/\bma[ñn]ana\b/.test(text)) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return { date: d, match: "mañana" };
  }
  // weekday name
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    const re = new RegExp(`\\b${name}\\b`, "i");
    const m = text.match(re);
    if (m) return { date: nextWeekday(now, dow), match: m[0] };
  }
  // "25 de abril", "25 abril", "25/04"
  const dmMatch = text.match(
    /\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i
  );
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const monthKey = dmMatch[2].toLowerCase();
    const month = MONTHS[monthKey];
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setMonth(month);
      d.setDate(day);
      // Si ya pasó este año, asumir próximo año
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return { date: d, match: dmMatch[0] };
    }
  }
  // "25/04/2026" o "25/04"
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    const year = slashMatch[3]
      ? slashMatch[3].length === 2
        ? 2000 + parseInt(slashMatch[3], 10)
        : parseInt(slashMatch[3], 10)
      : now.getFullYear();
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day, 0, 0, 0, 0);
      if (!slashMatch[3] && d < now) d.setFullYear(d.getFullYear() + 1);
      return { date: d, match: slashMatch[0] };
    }
  }
  return null;
}

export function parseQuickAdd(input: string, now: Date = new Date()): ParsedEvent {
  const raw = input.trim();
  const text = normalize(raw);
  const hints: string[] = [];
  let cleaned = raw;

  const datePart = extractDate(text, now);
  let startDate = datePart?.date ?? new Date(now);
  if (datePart) {
    hints.push(`fecha: ${datePart.match}`);
    cleaned = cleaned.replace(new RegExp(datePart.match, "i"), "").trim();
  } else {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  }

  const timePart = extractTime(text);
  let allDay = false;
  if (timePart) {
    hints.push(`hora: ${timePart.match}`);
    startDate.setHours(timePart.hour, timePart.minute, 0, 0);
    cleaned = cleaned.replace(new RegExp(timePart.match.replace(/\s/g, "\\s*"), "i"), "").trim();
  } else {
    allDay = true;
    // Si no dice hora y fue "hoy/mañana", default 9am
    if (datePart) {
      startDate.setHours(9, 0, 0, 0);
      allDay = false;
    }
  }

  let endDate: Date | null = null;
  const durationPart = extractDuration(text);
  if (durationPart) {
    hints.push(`duración: ${durationPart.match}`);
    endDate = new Date(startDate.getTime() + durationPart.minutes * 60 * 1000);
    cleaned = cleaned.replace(new RegExp(durationPart.match.replace(/\s/g, "\\s*"), "i"), "").trim();
  }

  // Limpiar preposiciones sueltas
  cleaned = cleaned
    .replace(/\ba\s+las\s*$/i, "")
    .replace(/\s+(el|del|a|de|por|para)\s*$/i, "")
    .replace(/\s+,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const title = cleaned || "Sin título";

  const confidence: ParsedEvent["confidence"] =
    datePart && timePart ? "high" : datePart || timePart ? "medium" : "low";

  return {
    title,
    startAt: startDate,
    endAt: endDate,
    allDay,
    confidence,
    hints,
  };
}
