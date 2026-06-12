import { describe, it, expect } from "vitest";
import { mapGoogleEvent, type GoogleEvent } from "@/lib/calendar/google";

// Google con singleEvents=true EXPANDE las series recurrentes en instancias
// individuales: cada ocurrencia llega como un evento aparte, con su propio id
// y su fecha/hora concreta. Por eso cada repetición se plasma en su día.

describe("mapGoogleEvent", () => {
  it("evento con hora (timed) → startAt/endAt correctos, no allDay", () => {
    const ev: GoogleEvent = {
      id: "abc123",
      status: "confirmed",
      summary: "Reunión equipo",
      location: "Zoom",
      start: { dateTime: "2026-06-15T20:00:00-05:00" },
      end: { dateTime: "2026-06-15T21:00:00-05:00" },
    };
    const m = mapGoogleEvent(ev)!;
    expect(m.title).toBe("Reunión equipo");
    expect(m.location).toBe("Zoom");
    expect(m.allDay).toBe(false);
    expect(m.startAt.toISOString()).toBe("2026-06-16T01:00:00.000Z"); // 20:00 Lima
    expect(m.endAt?.toISOString()).toBe("2026-06-16T02:00:00.000Z");
  });

  it("evento de día completo (date) → allDay true", () => {
    const ev: GoogleEvent = {
      id: "allday1",
      summary: "Cumpleaños",
      start: { date: "2026-06-20" },
      end: { date: "2026-06-21" },
    };
    const m = mapGoogleEvent(ev)!;
    expect(m.allDay).toBe(true);
    expect(m.title).toBe("Cumpleaños");
  });

  it("instancias de un evento recurrente (Lun/Mié/Vie) → cada una en su día", () => {
    // Lo que Google entrega para "Gym, todos los L-M-V 18:00" con singleEvents:
    const instancias: GoogleEvent[] = [
      { id: "gym_20260615T230000Z", summary: "Gym", start: { dateTime: "2026-06-15T18:00:00-05:00" }, end: { dateTime: "2026-06-15T19:00:00-05:00" } }, // lunes
      { id: "gym_20260617T230000Z", summary: "Gym", start: { dateTime: "2026-06-17T18:00:00-05:00" }, end: { dateTime: "2026-06-17T19:00:00-05:00" } }, // miércoles
      { id: "gym_20260619T230000Z", summary: "Gym", start: { dateTime: "2026-06-19T18:00:00-05:00" }, end: { dateTime: "2026-06-19T19:00:00-05:00" } }, // viernes
    ];
    const dias = instancias.map((e) => {
      const m = mapGoogleEvent(e)!;
      // día civil en Lima
      return new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "short" }).format(m.startAt);
    });
    expect(dias).toEqual(["Mon", "Wed", "Fri"]); // cada repetición cae en su día correcto
    // Cada instancia tiene id único → se guardan como eventos distintos (sin duplicar).
    const ids = new Set(instancias.map((e) => e.id));
    expect(ids.size).toBe(3);
  });

  it("evento sin título → '(sin título)'", () => {
    const m = mapGoogleEvent({ id: "x", start: { dateTime: "2026-06-15T10:00:00Z" } })!;
    expect(m.title).toBe("(sin título)");
  });

  it("evento sin start → null (se ignora)", () => {
    expect(mapGoogleEvent({ id: "x", summary: "Sin fecha" })).toBeNull();
  });
});
