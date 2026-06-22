import { describe, it, expect } from "vitest";
import { currentWeekKey, deloadTarget, DELOAD_VOLUME_FACTOR } from "@/lib/fitness/deload";

describe("currentWeekKey", () => {
  it("devuelve el lunes de la semana (YYYY-MM-DD)", () => {
    // 2026-06-21 es domingo → su lunes es 2026-06-15
    expect(currentWeekKey("2026-06-21")).toBe("2026-06-15");
    // 2026-06-15 es lunes → se queda igual
    expect(currentWeekKey("2026-06-15")).toBe("2026-06-15");
    // 2026-06-17 es miércoles → lunes 2026-06-15
    expect(currentWeekKey("2026-06-17")).toBe("2026-06-15");
  });
});

describe("deloadTarget", () => {
  it("baja a ~50% del volumen, a media serie", () => {
    expect(DELOAD_VOLUME_FACTOR).toBe(0.5);
    expect(deloadTarget(14)).toBe(7);
    expect(deloadTarget(9)).toBe(4.5);
    expect(deloadTarget(5)).toBe(2.5);
    expect(deloadTarget(0)).toBe(0);
  });
});
