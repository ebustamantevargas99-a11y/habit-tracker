/**
 * Fuente única de verdad para el impacto de una transacción sobre el
 * balance de una cuenta. Antes esta fórmula estaba copiada (con variantes
 * y bugs de signo) en create/PATCH/DELETE de transactions y en /pay, lo
 * que corrompía saldos al editar transacciones o transferir hacia
 * tarjetas. Centralizarla aquí garantiza que `balance == Σ(transacciones)`.
 *
 * CONVENCIÓN DE SIGNOS:
 *  - Cuentas de activo (checking/savings/cash/investment/crypto): el
 *    balance es lo que TIENES. income suma, expense/transfer-out resta.
 *  - Cuentas de pasivo (credit/loan): el balance es lo que DEBES
 *    (positivo = deuda). Un expense con la tarjeta AUMENTA la deuda; un
 *    pago/transferencia HACIA la tarjeta la REDUCE. Por eso el signo se
 *    invierte respecto a una cuenta de activo.
 */

export type TxnType = "income" | "expense" | "transfer";

/** ¿Es una cuenta donde el balance representa deuda? */
export function isLiabilityAccount(type: string | null | undefined): boolean {
  return type === "credit" || type === "loan";
}

/**
 * Delta a aplicar al balance de la cuenta ORIGEN de una transacción.
 * `amount` siempre positivo. Devuelve el incremento firmado a sumar.
 */
export function sourceBalanceDelta(
  accountType: string | null | undefined,
  txnType: TxnType,
  amount: number,
): number {
  // Convención de activo: income entra (+), expense y transfer-out salen (−).
  const assetDelta = txnType === "income" ? amount : -amount;
  return isLiabilityAccount(accountType) ? -assetDelta : assetDelta;
}

/**
 * Delta a aplicar al balance de la cuenta DESTINO de una transferencia
 * (el dinero que llega). Activo: suma. Pasivo (pagar una tarjeta): resta
 * la deuda.
 */
export function destinationBalanceDelta(
  destAccountType: string | null | undefined,
  amount: number,
): number {
  return isLiabilityAccount(destAccountType) ? -amount : amount;
}
