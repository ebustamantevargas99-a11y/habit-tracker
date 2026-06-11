/**
 * Timezone-aware date helpers.
 *
 * PROBLEMA QUE RESUELVE: `new Date().toISOString().split("T")[0]` devuelve la
 * fecha en UTC, no en la zona del user. En México (UTC-6), a las 22:00 del día
 * 22 el `toISOString()` devuelve "2026-04-23T04:00:00Z" → split da "2026-04-23"
 * → la app muestra día 23 cuando localmente es aún 22.
 *
 * Estas funciones siempre operan en la TZ del user (o la del navegador como
 * fallback) usando `Intl.DateTimeFormat`.
 *
 * INVARIANTES:
 *   - Las strings "YYYY-MM-DD" representan fechas civiles locales al user,
 *     no UTC.
 *   - Persistencia en DB: seguimos usando "YYYY-MM-DD" pero asumiendo que esa
 *     string es la fecha local del user al momento de crear el registro.
 *   - Al leer de DB una string "YYYY-MM-DD" y querer mostrarla, la tratamos
 *     como fecha civil local (no aplicamos UTC offset).
 */

/** Resuelve el timezone efectivo: arg > navegador > fallback. */
export function resolveTimezone(tz?: string | null): string {
  if (tz && typeof tz === "string" && tz.length > 0) return tz;
  if (typeof Intl !== "undefined") {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolved) return resolved;
    } catch {
      /* ignore */
    }
  }
  return "America/Mexico_City";
}

/**
 * Formatea una fecha como "YYYY-MM-DD" en la TZ indicada.
 * Reemplaza `date.toISOString().split("T")[0]` que devuelve UTC.
 */
export function toLocalDateStr(date: Date, tz?: string | null): string {
  const timeZone = resolveTimezone(tz);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Fecha de HOY en TZ del user como "YYYY-MM-DD".
 * Reemplaza `new Date().toISOString().split("T")[0]`.
 */
export function todayLocal(tz?: string | null): string {
  return toLocalDateStr(new Date(), tz);
}

/**
 * Fecha desplazada N días desde hoy (o desde una fecha base), en TZ local.
 * Útil para rangos como "últimos 7 días" sin drift por UTC.
 */
export function shiftDaysLocal(
  days: number,
  base: Date | string = new Date(),
  tz?: string | null,
): string {
  // Convertimos a noon local para evitar DST issues
  const baseDate =
    typeof base === "string" ? parseLocalDateStr(base, tz) : new Date(base);
  const shifted = new Date(baseDate);
  shifted.setDate(shifted.getDate() + days);
  return toLocalDateStr(shifted, tz);
}

/**
 * Convierte "YYYY-MM-DD" a Date local (mediodía para evitar problemas de DST).
 * Tratamos la string como fecha civil local, no UTC.
 */
export function parseLocalDateStr(dateStr: string, _tz?: string | null): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return new Date(NaN);
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  // Creamos a mediodía local del navegador. Como el string se interpreta como
  // fecha civil, este Date representa "el medio día de ese día en el navegador".
  // Para operaciones de rango/comparación funciona correctamente.
  return new Date(y, m, d, 12, 0, 0, 0);
}

/**
 * ISO string de mediodía local del día YYYY-MM-DD en TZ del user.
 * Útil para query de rangos de DB donde necesitas un Date pero la intención
 * es "el día X en TZ del user".
 */
export function localDateAtNoonUTC(dateStr: string): Date {
  // Para queries gte/lte contra DateTime de Prisma, usamos mediodía UTC del
  // día civil. Así un rango [2026-04-22 00:00 UTC, 2026-04-22 23:59 UTC]
  // siempre incluye las 12:00 UTC del día.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return new Date(NaN);
  return new Date(
    `${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`,
  );
}

/** Lunes de la semana que contiene `date`, en TZ local, devuelto como Date. */
export function startOfWeekLocal(date: Date, tz?: string | null): Date {
  const dateStr = toLocalDateStr(date, tz);
  const d = parseLocalDateStr(dateStr);
  const day = d.getDay(); // 0=Dom..6=Sab
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Componentes de pared (wall-clock) de un instante en una TZ dada.
 * weekday: 0=Dom..6=Sáb.
 */
export function zonedParts(
  date: Date,
  tz: string,
): { year: number; month: number; day: number; weekday: number; hour: number; minute: number; second: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wkMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // algunos motores devuelven "24" a medianoche
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    weekday: wkMap[get("weekday")] ?? 0,
    hour,
    minute: parseInt(get("minute"), 10),
    second: parseInt(get("second"), 10),
  };
}

/**
 * Instante UTC que corresponde a una hora de pared (Y-M-D H:M:S) en una TZ.
 * Usa el truco de offset de 1 iteración (exacto en zonas sin DST como Lima;
 * en transiciones DST puede errar 1h en la hora ambigua, aceptable aquí).
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date {
  const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  const p = zonedParts(new Date(asUTC), tz);
  const tzAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = tzAsUTC - asUTC; // cuánto adelanta la TZ respecto a UTC
  return new Date(asUTC - offset);
}

/** Instante UTC del inicio del día civil `dateStr` en la TZ del usuario. */
export function zonedStartOfDayUTC(dateStr: string, tz?: string | null): Date {
  const z = resolveTimezone(tz);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return new Date(NaN);
  return zonedWallTimeToUtc(+m[1], +m[2], +m[3], 0, 0, 0, z);
}

/** Instante UTC del fin del día civil `dateStr` (23:59:59.999) en la TZ. */
export function zonedEndOfDayUTC(dateStr: string, tz?: string | null): Date {
  const start = zonedStartOfDayUTC(dateStr, tz);
  if (isNaN(start.getTime())) return start;
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** ¿Dos fechas caen en el mismo día civil en TZ local? */
export function sameLocalDay(
  a: Date | string,
  b: Date | string,
  tz?: string | null,
): boolean {
  const as = typeof a === "string" ? a : toLocalDateStr(a, tz);
  const bs = typeof b === "string" ? b : toLocalDateStr(b, tz);
  return as === bs;
}
