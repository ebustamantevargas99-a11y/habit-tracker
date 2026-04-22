import { describe, it, expect } from "vitest";
import {
  resolveTimezone,
  toLocalDateStr,
  todayLocal,
  shiftDaysLocal,
  parseLocalDateStr,
  localDateAtNoonUTC,
  sameLocalDay,
} from "@/lib/date/local";

describe("toLocalDateStr", () => {
  it("22:00 local del 22 de abril en México debe devolver 2026-04-22, NO 2026-04-23", () => {
    // 22:00 local Mexico (UTC-6) = 04:00 UTC del día siguiente
    // El bug clásico: toISOString() daría "2026-04-23"
    // Esperado con TZ México: "2026-04-22"
    const utc = new Date("2026-04-23T04:00:00Z");
    expect(toLocalDateStr(utc, "America/Mexico_City")).toBe("2026-04-22");
  });

  it("03:00 UTC del 22 es todavía día 21 en México (UTC-6)", () => {
    const utc = new Date("2026-04-22T03:00:00Z");
    expect(toLocalDateStr(utc, "America/Mexico_City")).toBe("2026-04-21");
  });

  it("15:00 UTC del 22 es día 22 en México", () => {
    const utc = new Date("2026-04-22T15:00:00Z");
    expect(toLocalDateStr(utc, "America/Mexico_City")).toBe("2026-04-22");
  });

  it("TZ Asia/Tokyo adelanta un día cuando UTC es de madrugada", () => {
    // 23:00 UTC del 21 = 08:00 del 22 en Tokyo (UTC+9)
    const utc = new Date("2026-04-21T23:00:00Z");
    expect(toLocalDateStr(utc, "Asia/Tokyo")).toBe("2026-04-22");
  });
});

describe("resolveTimezone", () => {
  it("devuelve el tz proporcionado si es válido", () => {
    expect(resolveTimezone("America/Mexico_City")).toBe("America/Mexico_City");
  });
  it("fallback cuando recibe null/undefined/vacío", () => {
    const r = resolveTimezone(null);
    expect(typeof r).toBe("string");
    expect(r.length).toBeGreaterThan(0);
  });
});

describe("todayLocal", () => {
  it("devuelve formato YYYY-MM-DD", () => {
    const r = todayLocal("America/Mexico_City");
    expect(r).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("shiftDaysLocal", () => {
  it("7 días atrás desde 2026-04-22 = 2026-04-15", () => {
    const r = shiftDaysLocal(-7, "2026-04-22", "America/Mexico_City");
    expect(r).toBe("2026-04-15");
  });

  it("30 días adelante cruza mes correctamente", () => {
    const r = shiftDaysLocal(30, "2026-01-20", "America/Mexico_City");
    expect(r).toBe("2026-02-19");
  });

  it("cruce de año", () => {
    const r = shiftDaysLocal(1, "2026-12-31", "America/Mexico_City");
    expect(r).toBe("2027-01-01");
  });
});

describe("parseLocalDateStr", () => {
  it("parsea 2026-04-22 y devuelve Date del 22 a mediodía local", () => {
    const d = parseLocalDateStr("2026-04-22");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // abril = 3 (0-indexed)
    expect(d.getDate()).toBe(22);
  });

  it("formato inválido devuelve Invalid Date", () => {
    const d = parseLocalDateStr("no-es-fecha");
    expect(Number.isNaN(d.getTime())).toBe(true);
  });
});

describe("localDateAtNoonUTC", () => {
  it("devuelve 12:00 UTC del día civil", () => {
    const d = localDateAtNoonUTC("2026-04-22");
    expect(d.toISOString()).toBe("2026-04-22T12:00:00.000Z");
  });
});

describe("sameLocalDay", () => {
  it("true cuando ambas fechas son el mismo día local", () => {
    const a = new Date("2026-04-22T15:00:00Z");
    const b = new Date("2026-04-22T23:00:00Z");
    expect(sameLocalDay(a, b, "America/Mexico_City")).toBe(true);
  });

  it("false cuando están en días distintos local", () => {
    // 15:00 UTC del 22 = 09:00 MX del 22
    // 03:00 UTC del 23 = 21:00 MX del 22 — mismo día en MX!
    // Mejor: 08:00 UTC del 23 = 02:00 MX del 23 (ya distinto)
    const a = new Date("2026-04-22T15:00:00Z"); // 09:00 MX 22
    const b = new Date("2026-04-23T08:00:00Z"); // 02:00 MX 23
    expect(sameLocalDay(a, b, "America/Mexico_City")).toBe(false);
  });

  it("acepta strings YYYY-MM-DD directamente", () => {
    expect(sameLocalDay("2026-04-22", "2026-04-22")).toBe(true);
    expect(sameLocalDay("2026-04-22", "2026-04-23")).toBe(false);
  });
});
