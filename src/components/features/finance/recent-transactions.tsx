"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore, type Transaction } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";
import TransactionEditModal from "./transaction-edit-modal";

interface Props {
  /** Cuántas mostrar por defecto. */
  limit?: number;
  /** Re-disparar cuando agregamos una transacción nueva (cambio de timestamp). */
  refreshKey?: number;
}

/**
 * Widget compacto en el panel principal con las últimas N transacciones,
 * con botones para editar (modal) y borrar inline. Lee del store que ya
 * carga `transactions` en `initialize()` (las primeras 200).
 */
export default function RecentTransactions({ limit = 8, refreshKey = 0 }: Props) {
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const refresh = useFinanceStore((s) => s.refresh);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Re-fetch al cambiar refreshKey (lo invocamos cuando se agrega algo nuevo).
  useEffect(() => {
    if (refreshKey > 0) {
      void refresh();
    }
  }, [refreshKey, refresh]);

  // Ordenadas más recientes primero.
  const sorted = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => {
          const da = `${a.date}-${a.createdAt ?? ""}`;
          const db = `${b.date}-${b.createdAt ?? ""}`;
          return db.localeCompare(da);
        })
        .slice(0, limit),
    [transactions, limit],
  );

  async function handleQuickDelete(t: Transaction) {
    if (!confirm(`¿Borrar "${t.description ?? t.merchant ?? t.category}"?`)) return;
    try {
      await deleteTransaction(t.id);
      toast.success("Transacción eliminada");
    } catch {
      toast.error("Error eliminando");
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-2">
          Últimas transacciones
        </h3>
        <p className="text-xs text-brand-warm italic text-center py-6">
          Aún no hay transacciones. Usa &ldquo;Agregar rápido&rdquo; arriba para empezar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-semibold text-brand-dark m-0">
            Últimas transacciones
          </h3>
          <span className="text-[10px] uppercase tracking-widest text-brand-warm">
            {sorted.length} más recientes
          </span>
        </div>

        <div className="divide-y divide-brand-cream">
          {sorted.map((t) => {
            const account = accounts.find((a) => a.id === t.accountId);
            const currency = account?.currency ?? t.account?.currency ?? "MXN";
            const Icon =
              t.type === "income"
                ? ArrowDownCircle
                : t.type === "expense"
                  ? ArrowUpCircle
                  : ArrowRightLeft;
            const sign = t.type === "income" ? "+" : t.type === "expense" ? "−" : "";
            const amountClass =
              t.type === "income"
                ? "text-success"
                : t.type === "expense"
                  ? "text-danger"
                  : "text-info";

            return (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2 group hover:bg-brand-warm-white/40 -mx-1 px-1 rounded transition"
              >
                <Icon size={16} className={cn("shrink-0", amountClass)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark truncate">
                    {t.description?.trim() || t.merchant?.trim() || t.category}
                  </p>
                  <p className="text-[11px] text-brand-warm truncate">
                    <span className="font-mono">
                      {new Date(t.date + "T12:00:00").toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span>{t.category}</span>
                    {account && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span className="text-brand-tan">
                          {account.icon} {account.name}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <span className={cn("text-sm font-bold font-mono shrink-0", amountClass)}>
                  {sign}
                  {formatMoney(t.amount, currency)}
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(t)}
                    className="p-1.5 rounded hover:bg-brand-cream text-brand-warm hover:text-accent"
                    title="Editar"
                    aria-label="Editar transacción"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDelete(t)}
                    className="p-1.5 rounded hover:bg-danger/10 text-brand-warm hover:text-danger"
                    title="Borrar"
                    aria-label="Borrar transacción"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TransactionEditModal
        txn={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
