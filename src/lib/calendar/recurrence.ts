// RRULE simplificada. Formato: "FREQ=DAILY|WEEKLY|MONTHLY;BYDAY=MO,WE,FR;INTERVAL=2"
// Preset shortcuts: "daily" | "weekdays" | "weekly" | "monthly"

export type RecurrenceRule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  byDay?: number[]; // 0=Dom..6=Sáb
  interval?: number;
};

const DAY_KEYS: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};
const DAY_LETTERS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function parseRecurrence(rrule: string | null | undefined): RecurrenceRule | null {
  if (!rrule) return null;
  const lc = rrule.toLowerCase();
  // Presets
  if (lc === "daily") return { freq: "DAILY" };
  if (lc === "weekdays") return { freq: "WEEKLY", byDay: [1, 2, 3, 4, 5] };
  if (lc === "weekly") return { freq: "WEEKLY" };
  if (lc === "monthly") return { freq: "MONTHLY" };

  // RRULE-like
  const parts = rrule.split(";").map((p) => p.trim().toUpperCase());
  let freq: RecurrenceRule["freq"] | null = null;
  let byDay: number[] | undefined;
  let interval: number | undefined;

  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "FREQ") {
      if (v === "DAILY" || v === "WEEKLY" || v === "MONTHLY") freq = v;
    } else if (k === "BYDAY" && v) {
      byDay = v.split(",").map((d) => DAY_KEYS[d]).filter((n) => n !== undefined);
    } else if (k === "INTERVAL" && v) {
      const i = parseInt(v, 10);
      if (i > 0 && i < 100) interval = i;
    }
  }
  if (!freq) return null;
  return { freq, byDay, interval };
}

export function formatRecurrence(rule: RecurrenceRule): string {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.byDay && rule.byDay.length > 0) {
    parts.push(`BYDAY=${rule.byDay.map((d) => DAY_LETTERS[d]).join(",")}`);
  }
  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }
  return parts.join(";");
}

/**
 * Expande una serie recurrente en instancias concretas entre [from, to].
 * Límite de seguridad: 100 ocurrencias máximo por serie.
 */
export function expandRecurrence(
  startAt: Date,
  endAt: Date | null,
  rrule: string | null,
  rangeStart: Date,
  rangeEnd: Date,
  recurrenceEnd: Date | null = null
): Array<{ startAt: Date; endAt: Date | null }> {
  const rule = parseRecurrence(rrule);
  const dur = endAt ? endAt.getTime() - startAt.getTime() : 0;
  if (!rule) {
    // No recurrencia → solo la instancia si intersecta el rango.
    // Overnight events (endAt al día siguiente) se incluyen cuando el
    // endAt cae en rango aunque startAt quede justo antes.
    const effectiveEnd = endAt ?? startAt;
    if (effectiveEnd >= rangeStart && startAt <= rangeEnd) {
      return [{ startAt, endAt }];
    }
    return [];
  }
  const interval = Math.max(1, rule.interval ?? 1);
  const stopAt = recurrenceEnd ?? rangeEnd;
  const out: Array<{ startAt: Date; endAt: Date | null }> = [];
  const MAX = 100;

  // Una ocurrencia es "visible" si su [start, end] intersecta el rango.
  // Para eventos overnight (dur > 0) la ocurrencia puede comenzar antes
  // del rango pero terminar dentro — necesitamos incluirla.
  const intersectsRange = (occStart: Date): boolean => {
    const occEnd = new Date(occStart.getTime() + dur);
    return occEnd >= rangeStart && occStart <= rangeEnd;
  };

  if (rule.freq === "DAILY") {
    let current = new Date(startAt);
    while (current <= stopAt && out.length < MAX) {
      if (intersectsRange(current)) {
        out.push({
          startAt: new Date(current),
          endAt: endAt ? new Date(current.getTime() + dur) : null,
        });
      }
      current = new Date(current);
      current.setDate(current.getDate() + interval);
    }
  } else if (rule.freq === "WEEKLY") {
    const days = rule.byDay ?? [startAt.getDay()];
    // Avanzar semana por semana, generando una ocurrencia por cada día en byDay
    let weekStart = new Date(startAt);
    weekStart.setHours(0, 0, 0, 0);
    const baseDow = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - ((baseDow + 6) % 7)); // Lunes de esa semana

    while (weekStart <= stopAt && out.length < MAX) {
      for (const dow of days) {
        const offset = (dow + 6) % 7; // Lunes=0..Dom=6
        const occ = new Date(weekStart);
        occ.setDate(occ.getDate() + offset);
        occ.setHours(startAt.getHours(), startAt.getMinutes(), startAt.getSeconds());
        if (occ >= startAt && occ <= stopAt && intersectsRange(occ)) {
          out.push({
            startAt: new Date(occ),
            endAt: endAt ? new Date(occ.getTime() + dur) : null,
          });
        }
      }
      weekStart = new Date(weekStart);
      weekStart.setDate(weekStart.getDate() + 7 * interval);
    }
  } else if (rule.freq === "MONTHLY") {
    let current = new Date(startAt);
    while (current <= stopAt && out.length < MAX) {
      if (intersectsRange(current)) {
        out.push({
          startAt: new Date(current),
          endAt: endAt ? new Date(current.getTime() + dur) : null,
        });
      }
      current = new Date(current);
      current.setMonth(current.getMonth() + interval);
    }
  }

  return out;
}

export function humanReadableRecurrence(rrule: string | null | undefined): string {
  const rule = parseRecurrence(rrule);
  if (!rule) return "Una vez";
  const every = rule.interval && rule.interval > 1 ? `cada ${rule.interval} ` : "";
  if (rule.freq === "DAILY") return `${every}${rule.interval && rule.interval > 1 ? "días" : "Diario"}`;
  if (rule.freq === "MONTHLY") return `${every}${rule.interval && rule.interval > 1 ? "meses" : "Mensual"}`;
  if (rule.freq === "WEEKLY") {
    if (!rule.byDay || rule.byDay.length === 0) {
      return `${every}${rule.interval && rule.interval > 1 ? "semanas" : "Semanal"}`;
    }
    const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dayNames = rule.byDay.map((d) => labels[d]).join(", ");
    return `Semanal · ${dayNames}`;
  }
  return "Recurrente";
}
