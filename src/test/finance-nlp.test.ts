import { describe, it, expect } from "vitest";
import { parseQuickAddTxn } from "@/lib/finance/nlp";

const NOW = new Date(2026, 3, 23, 12, 0, 0); // jueves 23 abril 2026

describe("parseQuickAddTxn · montos", () => {
  it("detecta $250", () => {
    const r = parseQuickAddTxn("Uber $250 ayer", NOW);
    expect(r.amount).toBe(250);
  });
  it("detecta 1200 sin $", () => {
    const r = parseQuickAddTxn("Supermercado 1200", NOW);
    expect(r.amount).toBe(1200);
  });
  it("detecta 1,500.50 con coma y decimales", () => {
    const r = parseQuickAddTxn("Comida $1,500.50", NOW);
    expect(r.amount).toBe(1500.5);
  });
});

describe("parseQuickAddTxn · fechas", () => {
  it("detecta 'hoy'", () => {
    const r = parseQuickAddTxn("Comida $50 hoy", NOW);
    expect(r.date).toBe("2026-04-23");
  });
  it("detecta 'ayer'", () => {
    const r = parseQuickAddTxn("Uber $250 ayer", NOW);
    expect(r.date).toBe("2026-04-22");
  });
  it("detecta 'antier'", () => {
    const r = parseQuickAddTxn("Café $85 antier", NOW);
    expect(r.date).toBe("2026-04-21");
  });
  it("detecta 'hace 5 días'", () => {
    const r = parseQuickAddTxn("Netflix $249 hace 5 días", NOW);
    expect(r.date).toBe("2026-04-18");
  });
  it("sin fecha → hoy", () => {
    const r = parseQuickAddTxn("Compra $100", NOW);
    expect(r.date).toBe("2026-04-23");
  });
});

describe("parseQuickAddTxn · categorías", () => {
  it("Uber → Transporte/Ride-share", () => {
    const r = parseQuickAddTxn("Uber $250", NOW);
    expect(r.category).toBe("Transporte");
    expect(r.subcategory).toBe("Ride-share");
    expect(r.type).toBe("expense");
  });
  it("Sueldo → income / Salario", () => {
    const r = parseQuickAddTxn("Sueldo $45000", NOW);
    expect(r.type).toBe("income");
    expect(r.category).toBe("Salario");
  });
  it("Starbucks → Alimentación/Café", () => {
    const r = parseQuickAddTxn("Starbucks $85", NOW);
    expect(r.category).toBe("Alimentación");
    expect(r.subcategory).toBe("Café");
  });
  it("Netflix mensual → Entretenimiento recurring", () => {
    const r = parseQuickAddTxn("Netflix $249 mensual", NOW);
    expect(r.category).toBe("Entretenimiento");
    expect(r.isRecurringHint).toBe(true);
  });
  it("Gasolina → Transporte/Combustible", () => {
    const r = parseQuickAddTxn("Gasolina $800", NOW);
    expect(r.category).toBe("Transporte");
    expect(r.subcategory).toBe("Combustible");
  });
  it("sin keyword → Otros con low confidence", () => {
    const r = parseQuickAddTxn("Cosa random $100", NOW);
    expect(r.category).toBe("Otros");
    expect(r.confidence).not.toBe("high");
  });
});

describe("parseQuickAddTxn · confianza", () => {
  it("amount + keyword → high", () => {
    const r = parseQuickAddTxn("Uber $250 ayer", NOW);
    expect(r.confidence).toBe("high");
  });
  it("solo amount → medium", () => {
    const r = parseQuickAddTxn("$500 cosa", NOW);
    expect(r.confidence).toBe("medium");
  });
  it("sin amount → low", () => {
    const r = parseQuickAddTxn("algo sin número", NOW);
    expect(r.confidence).toBe("low");
  });
});

describe("parseQuickAddTxn · sign override (+/−)", () => {
  it("`+800 sueldo extra` → income con monto correcto", () => {
    const r = parseQuickAddTxn("+800 sueldo extra", NOW);
    expect(r.type).toBe("income");
    expect(r.amount).toBe(800);
  });

  it("`-50 café` → expense forzado", () => {
    const r = parseQuickAddTxn("-50 café", NOW);
    expect(r.type).toBe("expense");
    expect(r.amount).toBe(50);
  });

  it("`+$45,000 hoy` → income con monto y fecha correctos", () => {
    const r = parseQuickAddTxn("+$45,000 hoy", NOW);
    expect(r.type).toBe("income");
    expect(r.amount).toBe(45000);
    expect(r.date).toBe("2026-04-23");
  });

  it("sign explícito vence keyword contradictoria", () => {
    // "Sueldo" normalmente fuerza income, pero `-` lo forza a expense
    // (caso raro pero válido: "−500 sueldo devuelto").
    const r = parseQuickAddTxn("-500 sueldo devuelto", NOW);
    expect(r.type).toBe("expense");
    expect(r.amount).toBe(500);
  });

  it("sin sign explícito → heurística de keywords sigue intacta", () => {
    expect(parseQuickAddTxn("Uber 50", NOW).type).toBe("expense");
    expect(parseQuickAddTxn("Sueldo 5000", NOW).type).toBe("income");
  });

  it("`+ S/ 200` (con espacios y símbolo de sol) detecta correctamente", () => {
    const r = parseQuickAddTxn("+ S/ 200 freelance", NOW);
    expect(r.type).toBe("income");
    expect(r.amount).toBe(200);
  });

  it("sign sube confidence a high incluso sin merchant", () => {
    const r = parseQuickAddTxn("+800", NOW);
    expect(r.type).toBe("income");
    expect(r.confidence).toBe("high");
  });
});
