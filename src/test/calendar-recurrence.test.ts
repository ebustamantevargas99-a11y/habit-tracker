import { describe, it, expect } from "vitest";
import {
  parseRecurrence,
  formatRecurrence,
  expandRecurrence,
  humanReadableRecurrence,
} from "@/lib/calendar/recurrence";

// Helper: construir fecha UTC para tests determinísticos
function d(iso: string): Date {
  return new Date(iso);
}

describe("parseRecurrence", () => {
  it("presets: daily, weekdays, weekly, monthly", () => {
    expect(parseRecurrence("daily")).toEqual({ freq: "DAILY" });
    expect(parseRecurrence("weekdays")).toEqual({
      freq: "WEEKLY",
      byDay: [1, 2, 3, 4, 5],
    });
    expect(parseRecurrence("weekly")).toEqual({ freq: "WEEKLY" });
    expect(parseRecurrence("monthly")).toEqual({ freq: "MONTHLY" });
  });

  it("RRULE FREQ=WEEKLY;BYDAY=MO,TH → mo+th", () => {
    const r = parseRecurrence("FREQ=WEEKLY;BYDAY=MO,TH");
    expect(r?.freq).toBe("WEEKLY");
    expect(r?.byDay).toEqual([1, 4]);
  });

  it("RRULE FREQ=DAILY;INTERVAL=2", () => {
    const r = parseRecurrence("FREQ=DAILY;INTERVAL=2");
    expect(r?.freq).toBe("DAILY");
    expect(r?.interval).toBe(2);
  });

  it("null/empty → null", () => {
    expect(parseRecurrence(null)).toBeNull();
    expect(parseRecurrence(undefined)).toBeNull();
    expect(parseRecurrence("")).toBeNull();
  });
});

describe("formatRecurrence", () => {
  it("roundtrip FREQ=WEEKLY;BYDAY=MO,TH", () => {
    const rule = parseRecurrence("FREQ=WEEKLY;BYDAY=MO,TH")!;
    expect(formatRecurrence(rule)).toBe("FREQ=WEEKLY;BYDAY=MO,TH");
  });

  it("omite INTERVAL cuando es 1", () => {
    expect(formatRecurrence({ freq: "DAILY", interval: 1 })).toBe("FREQ=DAILY");
    expect(formatRecurrence({ freq: "DAILY", interval: 2 })).toBe(
      "FREQ=DAILY;INTERVAL=2",
    );
  });
});

describe("expandRecurrence", () => {
  // Bug que motivó este test: si un evento semanal con BYDAY=MO,TH tenía
  // su seed en lunes 20 abril 2026, la vista semana solo mostraba lunes —
  // jueves 23 quedaba vacío porque la API no expandía la serie.
  it("WEEKLY BYDAY=MO,TH genera ambas ocurrencias en la misma semana", () => {
    const seed = d("2026-04-20T06:00:00Z"); // Lunes
    const end = d("2026-04-20T07:00:00Z");
    const rangeStart = d("2026-04-20T00:00:00Z");
    const rangeEnd = d("2026-04-26T23:59:59Z"); // Domingo

    const occs = expandRecurrence(
      seed,
      end,
      "FREQ=WEEKLY;BYDAY=MO,TH",
      rangeStart,
      rangeEnd,
    );

    expect(occs).toHaveLength(2);
    // Lunes 20
    expect(occs[0].startAt.toISOString()).toBe("2026-04-20T06:00:00.000Z");
    // Jueves 23 (mismo horario)
    expect(occs[1].startAt.toISOString()).toBe("2026-04-23T06:00:00.000Z");
  });

  it("WEEKLY BYDAY=MO,TH genera 4 ocurrencias en dos semanas", () => {
    const seed = d("2026-04-20T06:00:00Z");
    const rangeStart = d("2026-04-20T00:00:00Z");
    const rangeEnd = d("2026-05-03T23:59:59Z"); // 2 semanas

    const occs = expandRecurrence(
      seed,
      null,
      "FREQ=WEEKLY;BYDAY=MO,TH",
      rangeStart,
      rangeEnd,
    );

    expect(occs.map((o) => o.startAt.toISOString())).toEqual([
      "2026-04-20T06:00:00.000Z", // lun sem 1
      "2026-04-23T06:00:00.000Z", // jue sem 1
      "2026-04-27T06:00:00.000Z", // lun sem 2
      "2026-04-30T06:00:00.000Z", // jue sem 2
    ]);
  });

  it("DAILY genera una ocurrencia por día", () => {
    const seed = d("2026-04-20T08:00:00Z");
    const rangeStart = d("2026-04-20T00:00:00Z");
    const rangeEnd = d("2026-04-24T23:59:59Z");

    const occs = expandRecurrence(seed, null, "daily", rangeStart, rangeEnd);

    expect(occs).toHaveLength(5);
  });

  it("DAILY INTERVAL=2 genera cada dos días", () => {
    const seed = d("2026-04-20T08:00:00Z");
    const rangeStart = d("2026-04-20T00:00:00Z");
    const rangeEnd = d("2026-04-28T23:59:59Z");

    const occs = expandRecurrence(
      seed,
      null,
      "FREQ=DAILY;INTERVAL=2",
      rangeStart,
      rangeEnd,
    );

    // 20, 22, 24, 26, 28 → 5 ocurrencias
    expect(occs).toHaveLength(5);
  });

  it("recurrenceEnd corta la serie", () => {
    const seed = d("2026-04-20T08:00:00Z");
    const recEnd = d("2026-04-22T23:59:59Z");
    const rangeStart = d("2026-04-20T00:00:00Z");
    const rangeEnd = d("2026-04-30T23:59:59Z");

    const occs = expandRecurrence(seed, null, "daily", rangeStart, rangeEnd, recEnd);
    expect(occs).toHaveLength(3); // 20, 21, 22
  });

  it("sin recurrence → devuelve seed si cae en rango", () => {
    const seed = d("2026-04-20T08:00:00Z");
    const rangeStart = d("2026-04-18T00:00:00Z");
    const rangeEnd = d("2026-04-25T23:59:59Z");

    const occs = expandRecurrence(seed, null, null, rangeStart, rangeEnd);
    expect(occs).toHaveLength(1);
    expect(occs[0].startAt.toISOString()).toBe("2026-04-20T08:00:00.000Z");
  });

  it("sin recurrence + seed fuera del rango → lista vacía", () => {
    const seed = d("2026-04-20T08:00:00Z");
    const rangeStart = d("2026-04-22T00:00:00Z");
    const rangeEnd = d("2026-04-25T23:59:59Z");

    const occs = expandRecurrence(seed, null, null, rangeStart, rangeEnd);
    expect(occs).toHaveLength(0);
  });

  it("MONTHLY en 3 meses", () => {
    const seed = d("2026-04-20T08:00:00Z");
    const rangeStart = d("2026-04-01T00:00:00Z");
    const rangeEnd = d("2026-07-01T00:00:00Z");

    const occs = expandRecurrence(seed, null, "monthly", rangeStart, rangeEnd);
    expect(occs).toHaveLength(3); // Abril, Mayo, Junio
  });
});

describe("humanReadableRecurrence", () => {
  it("muestra días en español", () => {
    expect(humanReadableRecurrence("FREQ=WEEKLY;BYDAY=MO,TH")).toBe(
      "Semanal · Lun, Jue",
    );
  });
  it("daily / monthly / one-off", () => {
    expect(humanReadableRecurrence("daily")).toBe("Diario");
    expect(humanReadableRecurrence("monthly")).toBe("Mensual");
    expect(humanReadableRecurrence(null)).toBe("Una vez");
  });
});
