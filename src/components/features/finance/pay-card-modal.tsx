"use client";

import { useEffect, useMemo, useState } from "react";
import { X, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore, type FinancialAccount } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";
import { convertWithRates, FX_RATES_PER_USD } from "@/lib/finance/currency";

interface Props {
  /** Tarjeta de crédito (o préstamo) a pagar. null → modal cerrado. */
  card: FinancialAccount | null;
  onClose: () => void;
  onPaid?: () => void;
}

/**
 * Modal de pago de tarjeta de crédito (o préstamo).
 * Flujo:
 *   1. User elige cuenta origen (entre las que NO son credit/loan).
 *   2. Ingresa monto. Por default proponemos el balance actual de la
 *      tarjeta (pago total) — el user puede ajustar a pago mínimo o
 *      cualquier cantidad.
 *   3. Confirma → llama a payCreditAccount() del store que dispara
 *      POST /api/finance/accounts/[id]/pay (transferencia atómica).
 *
 * Detalle multi-moneda: si la cuenta origen y la tarjeta están en
 * monedas distintas, mostramos el monto convertido aproximado para
 * que el user no se confunda. La conversión usa las tasas estáticas
 * (rápido, no async); el cálculo real lo hace el server con tasas
 * live al momento del pago.
 */
export default function PayCardModal({ card, onClose, onPaid }: Props) {
  const accounts = useFinanceStore((s) => s.accounts);
  const payCreditAccount = useFinanceStore((s) => s.payCreditAccount);

  const [fromAccountId, setFromAccountId] = useState("");
  const [amount, setAmount] = useState("0");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cuentas válidas como origen: activas + no credit/loan + sin la
  // tarjeta misma (que no debería pasar el filtro pero por seguridad).
  const sourceAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          !a.archived &&
          a.type !== "credit" &&
          a.type !== "loan" &&
          a.id !== card?.id,
      ),
    [accounts, card?.id],
  );

  const fromAccount = sourceAccounts.find((a) => a.id === fromAccountId);

  // Reset cuando se abre con una tarjeta nueva.
  useEffect(() => {
    if (!card) return;
    // Default: balance de la tarjeta (pago total).
    setAmount(String(Math.max(0, card.balance).toFixed(2)));
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    // Default: primera cuenta source disponible (preferimos checking).
    const checking = sourceAccounts.find((a) => a.type === "checking");
    setFromAccountId((checking ?? sourceAccounts[0])?.id ?? "");
  }, [card]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc cierra
  useEffect(() => {
    if (!card) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  if (!card) return null;

  const numAmount = parseFloat(amount) || 0;

  // Conversión aproximada para mostrar en el preview.
  const needsConversion =
    fromAccount && fromAccount.currency !== card.currency;
  const amountInTargetCurrency = needsConversion
    ? convertWithRates(
        numAmount,
        fromAccount.currency,
        card.currency,
        FX_RATES_PER_USD,
      )
    : numAmount;

  const wouldOverpay = numAmount > card.balance + 0.01;
  const insufficientFunds = fromAccount && numAmount > fromAccount.balance + 0.01;

  async function handleSubmit() {
    if (!card || !fromAccountId) return;
    if (numAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await payCreditAccount({
        creditAccountId: card.id,
        fromAccountId,
        amount: numAmount,
        date,
        notes: notes.trim() || undefined,
      });
      if (ok) {
        toast.success(
          `Pagaste ${formatMoney(numAmount, fromAccount?.currency ?? card.currency)} a ${card.name}`,
        );
        onPaid?.();
        onClose();
      } else {
        toast.error("Error procesando el pago");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function setQuickAmount(value: number) {
    setAmount(String(Math.max(0, value).toFixed(2)));
  }

  const minPayment = card.minPaymentLast ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl shadow-warm-lg border border-brand-tan w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-cream">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-accent" />
            <h2 className="font-serif text-lg font-semibold text-brand-dark m-0">
              Pagar {card.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-brand-cream text-brand-warm"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Resumen tarjeta */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{
              background:
                "color-mix(in oklab, var(--color-danger) 10%, var(--color-warm-white))",
              border: "1px solid color-mix(in oklab, var(--color-danger) 25%, transparent)",
            }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
                Saldo deudor actual
              </p>
              <p className="text-xl font-bold text-danger font-mono">
                {formatMoney(card.balance, card.currency)}
              </p>
            </div>
            {card.creditLimit && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
                  Límite
                </p>
                <p className="text-sm text-brand-medium font-mono">
                  {formatMoney(card.creditLimit, card.currency)}
                </p>
                <p className="text-[10px] text-brand-warm">
                  {Math.round((card.balance / card.creditLimit) * 100)}% utilizado
                </p>
              </div>
            )}
          </div>

          {/* Cuenta origen */}
          {sourceAccounts.length === 0 ? (
            <div className="bg-warning/10 border border-warning/30 rounded-md p-3 text-xs text-brand-medium">
              No tienes cuentas de débito/ahorro disponibles para pagar. Crea una
              cuenta primero.
            </div>
          ) : (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
                Pagar desde
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
              >
                {sourceAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon ?? "💳"} {a.name} · {formatMoney(a.balance, a.currency)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
              Monto a pagar {fromAccount ? `(${fromAccount.currency})` : ""}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-lg font-mono focus:outline-none focus:border-accent"
            />

            {/* Atajos */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {minPayment > 0 && (
                <button
                  type="button"
                  onClick={() => setQuickAmount(minPayment)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-brand-cream text-brand-medium hover:bg-brand-light-tan transition"
                >
                  Mínimo · {formatMoney(minPayment, card.currency)}
                </button>
              )}
              <button
                type="button"
                onClick={() => setQuickAmount(card.balance)}
                className="px-2.5 py-1 rounded-full text-[11px] bg-accent/10 text-accent hover:bg-accent/20 transition font-semibold"
              >
                Total · {formatMoney(card.balance, card.currency)}
              </button>
              {card.balance >= 100 && (
                <button
                  type="button"
                  onClick={() => setQuickAmount(card.balance / 2)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-brand-cream text-brand-medium hover:bg-brand-light-tan transition"
                >
                  50%
                </button>
              )}
            </div>

            {/* Conversión multi-moneda */}
            {needsConversion && numAmount > 0 && (
              <p className="text-[11px] text-brand-warm mt-1.5 italic">
                ≈ {formatMoney(amountInTargetCurrency, card.currency)} hacia
                {" "}{card.name} (tasa aproximada — el server usa la del día)
              </p>
            )}

            {/* Warnings */}
            {wouldOverpay && (
              <p className="text-[11px] text-warning mt-1.5">
                ⚠ Estás pagando más que el saldo deudor. Quedará saldo a favor.
              </p>
            )}
            {insufficientFunds && (
              <p className="text-[11px] text-danger mt-1.5">
                ⚠ El monto excede el saldo de {fromAccount?.name}. Tu cuenta
                quedará en negativo.
              </p>
            )}
          </div>

          {/* Fecha + Notas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
                Notas <span className="text-brand-tan normal-case lowercase tracking-normal">opcional</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej. pago de junio"
                className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Preview */}
          {fromAccount && numAmount > 0 && (
            <div className="bg-brand-warm-white border border-brand-cream rounded-md p-3 text-xs flex items-center gap-2 justify-center font-mono">
              <span className="text-brand-medium">{fromAccount.name}</span>
              <span className="text-danger">−{formatMoney(numAmount, fromAccount.currency)}</span>
              <ArrowRight size={12} className="text-brand-warm" />
              <span className="text-brand-medium">{card.name}</span>
              <span className="text-success">−{formatMoney(amountInTargetCurrency, card.currency)} deuda</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-brand-cream bg-brand-warm-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !fromAccountId ||
              numAmount <= 0 ||
              sourceAccounts.length === 0
            }
            className={cn(
              "px-5 py-1.5 rounded-button text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40",
              "bg-accent text-white hover:bg-brand-brown",
            )}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}
