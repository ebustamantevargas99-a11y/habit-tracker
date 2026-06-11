import { describe, it, expect } from "vitest";
import {
  isLiabilityAccount,
  sourceBalanceDelta,
  destinationBalanceDelta,
} from "@/lib/finance/balance";

describe("finance/balance — convención de signos", () => {
  it("clasifica pasivos correctamente", () => {
    expect(isLiabilityAccount("credit")).toBe(true);
    expect(isLiabilityAccount("loan")).toBe(true);
    expect(isLiabilityAccount("checking")).toBe(false);
    expect(isLiabilityAccount("cash")).toBe(false);
    expect(isLiabilityAccount(null)).toBe(false);
  });

  it("cuenta de activo: income suma, expense resta", () => {
    expect(sourceBalanceDelta("checking", "income", 100)).toBe(100);
    expect(sourceBalanceDelta("checking", "expense", 100)).toBe(-100);
    expect(sourceBalanceDelta("checking", "transfer", 100)).toBe(-100);
  });

  it("cuenta de pasivo: expense AUMENTA la deuda (signo invertido)", () => {
    expect(sourceBalanceDelta("credit", "expense", 100)).toBe(100);
    expect(sourceBalanceDelta("credit", "income", 100)).toBe(-100);
    expect(sourceBalanceDelta("credit", "transfer", 100)).toBe(100);
  });

  it("destino de transferencia: activo suma, tarjeta reduce deuda", () => {
    expect(destinationBalanceDelta("checking", 100)).toBe(100);
    expect(destinationBalanceDelta("credit", 100)).toBe(-100);
    expect(destinationBalanceDelta("loan", 100)).toBe(-100);
  });

  it("ciclo create→delete deja el saldo neto en cero (activo)", () => {
    const apply = sourceBalanceDelta("savings", "expense", 250);
    const revert = -sourceBalanceDelta("savings", "expense", 250);
    expect(apply + revert).toBe(0);
  });

  it("editar gasto 100→500 ajusta exactamente la diferencia", () => {
    // Reconciliación: revertir el viejo + aplicar el nuevo.
    const revertOld = -sourceBalanceDelta("checking", "expense", 100); // +100
    const applyNew = sourceBalanceDelta("checking", "expense", 500); // -500
    expect(revertOld + applyNew).toBe(-400); // el saldo baja 400 más, correcto
  });

  it("cambiar expense→income en activo invierte el doble", () => {
    const revertOld = -sourceBalanceDelta("checking", "expense", 100); // +100
    const applyNew = sourceBalanceDelta("checking", "income", 100); // +100
    expect(revertOld + applyNew).toBe(200);
  });

  it("transferencia a tarjeta: paga deuda y descuenta del origen", () => {
    const fromAsset = sourceBalanceDelta("checking", "transfer", 300); // -300
    const toCard = destinationBalanceDelta("credit", 300); // -300 (reduce deuda)
    expect(fromAsset).toBe(-300);
    expect(toCard).toBe(-300);
  });
});
