import { describe, it, expect } from "vitest";
import {
  projectGoal,
  simulatePayoff,
  calculateFIRE,
  checkAffordability,
} from "@/lib/finance/calculations";

describe("projectGoal", () => {
  it("si ya se logró, retorna remaining 0", () => {
    const r = projectGoal(10000, 10000, null, 500);
    expect(r.remaining).toBe(0);
    expect(r.onTrack).toBe(true);
  });

  it("con monthlySavings calcula monthsAtCurrentPace", () => {
    const r = projectGoal(0, 10000, null, 1000);
    expect(r.monthsAtCurrentPace).toBe(10);
    expect(r.projectedDate).toBeTruthy();
  });

  it("con savings 0 → monthsAtCurrentPace null", () => {
    const r = projectGoal(0, 10000, null, 0);
    expect(r.monthsAtCurrentPace).toBeNull();
  });

  it("con targetDate calcula requiredMonthlySavings y onTrack", () => {
    const today = new Date(2026, 0, 1);
    const targetDate = "2026-07-01"; // 6 meses adelante
    const r = projectGoal(0, 6000, targetDate, 500, today);
    expect(r.requiredMonthlySavings).toBeGreaterThan(900);
    expect(r.requiredMonthlySavings).toBeLessThan(1100);
    expect(r.onTrack).toBe(false); // ahorrar 500 < 1000 requerido
    expect(r.deficit).toBeGreaterThan(400);
    expect(r.deficit).toBeLessThan(600);
  });
});

describe("simulatePayoff", () => {
  const debts = [
    { id: "1", name: "CC A", balance: 1000, interestRate: 24, minPayment: 50 },
    { id: "2", name: "CC B", balance: 3000, interestRate: 15, minPayment: 100 },
  ];

  it("avalanche prioriza la de mayor interés", () => {
    const plan = simulatePayoff(debts, "avalanche", 100);
    // La primera en liquidarse debe ser CC A (24% > 15%)
    expect(plan.order[0].name).toBe("CC A");
  });

  it("snowball prioriza la de menor balance", () => {
    const plan = simulatePayoff(debts, "snowball", 100);
    // CC A tiene balance menor, va primero
    expect(plan.order[0].name).toBe("CC A");
  });

  it("sin extra payment tarda más", () => {
    const noExtra = simulatePayoff(debts, "avalanche", 0);
    const withExtra = simulatePayoff(debts, "avalanche", 500);
    expect(withExtra.totalMonths).toBeLessThan(noExtra.totalMonths);
  });

  it("totalInterest es finito y positivo", () => {
    const plan = simulatePayoff(debts, "avalanche", 100);
    expect(plan.totalInterest).toBeGreaterThan(0);
    expect(Number.isFinite(plan.totalInterest)).toBe(true);
  });
});

describe("calculateFIRE", () => {
  it("fireNumber = annualExpenses × 25", () => {
    const r = calculateFIRE(1000, 0, 0, 30);
    expect(r.fireNumber).toBe(300_000); // 1000*12*25
  });

  it("ya estás FIRE si investments >= fireNumber", () => {
    const r = calculateFIRE(1000, 500, 500_000, 40);
    expect(r.yearsToFIRE).toBe(0);
  });

  it("con savings + return, llega a FIRE en algún momento", () => {
    const r = calculateFIRE(3000, 2000, 50_000, 30);
    expect(r.yearsToFIRE).not.toBeNull();
    expect(r.yearsToFIRE!).toBeGreaterThan(0);
    expect(r.yearsToFIRE!).toBeLessThan(50);
  });

  it("coast FIRE es menor o igual que FIRE", () => {
    const r = calculateFIRE(3000, 2000, 100_000, 30);
    if (r.yearsToCoastFIRE !== null && r.yearsToFIRE !== null) {
      expect(r.yearsToCoastFIRE).toBeGreaterThan(0);
    }
  });

  it("ageAtFIRE = currentAge + years", () => {
    const r = calculateFIRE(2000, 1500, 10000, 25);
    expect(r.ageAtFIRE).not.toBeNull();
    expect(r.ageAtFIRE!).toBeGreaterThan(25);
  });
});

describe("checkAffordability", () => {
  it("puede pagar cash sin romper emergency fund", () => {
    const r = checkAffordability(5000, 50000, 10000, 3000, 10000);
    expect(r.canAffordCash).toBe(true);
    expect(r.newBalance).toBe(45000);
  });

  it("NO puede pagar cash (destroy emergency fund)", () => {
    const r = checkAffordability(48000, 50000, 10000, 3000, 10000);
    expect(r.canAffordCash).toBe(false);
    expect(r.newRunwayMonths).toBeCloseTo(0.2, 1);
  });

  it("monthsToSaveFor = price/savings", () => {
    const r = checkAffordability(3000, 10000, 5000, 1000, 5000);
    expect(r.monthsToSaveFor).toBe(3);
  });

  it("savings rate impact: financia en N meses", () => {
    const r = checkAffordability(12000, 10000, 5000, 2000, 10000);
    // Financiado en 12 meses: $1000/mes adicional de gasto
    // Savings baja a 1000, rate = 10%
    expect(r.savingsRateImpact(12)).toBeCloseTo(10, 0);
  });
});
