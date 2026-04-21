import { describe, it, expect } from "vitest";
import { parseQuickAdd } from "@/lib/calendar/nlp";

// Jueves 23 abril 2026 a mediodía local
const NOW = new Date(2026, 3, 23, 12, 0, 0);

describe("parseQuickAdd · fechas", () => {
  it("detecta 'hoy'", () => {
    const r = parseQuickAdd("Reunión hoy 3pm", NOW);
    expect(r.title).toBe("Reunión");
    expect(r.startAt.getDate()).toBe(23);
    expect(r.startAt.getHours()).toBe(15);
    expect(r.confidence).toBe("high");
  });

  it("detecta 'mañana'", () => {
    const r = parseQuickAdd("Cita doctor mañana 10am", NOW);
    expect(r.startAt.getDate()).toBe(24);
    expect(r.title.toLowerCase()).toContain("cita");
  });

  it("detecta 'pasado mañana'", () => {
    const r = parseQuickAdd("Cena pasado mañana 8pm", NOW);
    expect(r.startAt.getDate()).toBe(25);
  });

  it("detecta día de la semana (viernes = 24 abril)", () => {
    const r = parseQuickAdd("Cena con Ana viernes 8pm", NOW);
    expect(r.startAt.getDate()).toBe(24);
    expect(r.startAt.getHours()).toBe(20);
    expect(r.title.toLowerCase()).toContain("ana");
  });

  it("detecta '25 de mayo'", () => {
    const r = parseQuickAdd("Cumple mamá 25 de mayo", NOW);
    expect(r.startAt.getMonth()).toBe(4); // mayo
    expect(r.startAt.getDate()).toBe(25);
  });

  it("detecta formato dd/mm/yyyy", () => {
    const r = parseQuickAdd("Pagar renta 01/05/2026", NOW);
    expect(r.startAt.getMonth()).toBe(4);
    expect(r.startAt.getDate()).toBe(1);
  });
});

describe("parseQuickAdd · horas", () => {
  it("detecta '3pm' → 15:00", () => {
    const r = parseQuickAdd("Llamada 3pm", NOW);
    expect(r.startAt.getHours()).toBe(15);
  });

  it("detecta '9am' → 09:00", () => {
    const r = parseQuickAdd("Meeting 9am", NOW);
    expect(r.startAt.getHours()).toBe(9);
  });

  it("detecta '10:30' → 10:30", () => {
    const r = parseQuickAdd("Yoga 10:30", NOW);
    expect(r.startAt.getHours()).toBe(10);
    expect(r.startAt.getMinutes()).toBe(30);
  });

  it("detecta '12am' → 00:00", () => {
    const r = parseQuickAdd("Reunión 12am", NOW);
    expect(r.startAt.getHours()).toBe(0);
  });

  it("detecta '12pm' → 12:00", () => {
    const r = parseQuickAdd("Lunch 12pm", NOW);
    expect(r.startAt.getHours()).toBe(12);
  });
});

describe("parseQuickAdd · duración", () => {
  it("detecta '30min' → endAt = start + 30min", () => {
    const r = parseQuickAdd("Meditar hoy 7am 30min", NOW);
    expect(r.endAt).not.toBeNull();
    expect((r.endAt!.getTime() - r.startAt.getTime()) / 60000).toBe(30);
  });

  it("detecta '1h' → endAt = start + 60min", () => {
    const r = parseQuickAdd("Workout mañana 7am 1h", NOW);
    expect((r.endAt!.getTime() - r.startAt.getTime()) / 60000).toBe(60);
  });

  it("detecta '1h30' → endAt = start + 90min", () => {
    const r = parseQuickAdd("Deep work lunes 9am 1h30", NOW);
    expect((r.endAt!.getTime() - r.startAt.getTime()) / 60000).toBe(90);
  });
});

describe("parseQuickAdd · título limpio", () => {
  it("remueve fragmentos de fecha/hora del título", () => {
    const r = parseQuickAdd("Cena con Ana el viernes 8pm", NOW);
    expect(r.title).not.toMatch(/viernes/i);
    expect(r.title).not.toMatch(/8pm/i);
    expect(r.title.toLowerCase()).toContain("cena");
  });

  it("sin fecha → title completo + confidence low", () => {
    const r = parseQuickAdd("Solo una nota random", NOW);
    expect(r.title).toBe("Solo una nota random");
    expect(r.confidence).toBe("low");
  });
});
