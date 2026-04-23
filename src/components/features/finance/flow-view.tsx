"use client";

import { useMemo, useState } from "react";
import {
  Plus, Trash2, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight,
  RefreshCw, Zap, Search, Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore, type Transaction } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";
import QuickAddBar from "./quick-add-bar";
import RecurringFormModal from "./recurring-form-modal";

export default function FlowView() {
  const { transactions, recurring, accounts, deleteTransaction, logRecurringNow, deleteRecurring } = useFinanceStore();
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showRecurringForm, setShowRecurringForm] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (accountFilter && t.accountId !== accountFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.description?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.merchant?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, filter, accountFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <QuickAddBar />

      {/* Recurrentes activos */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-semibold text-brand-dark flex items-center gap-2">
            <RefreshCw size={14} /> Recurrentes
            {recurring.length > 0 && (
              <span className="text-xs text-brand-warm font-normal">
                ({recurring.filter((r) => r.active).length} activos)
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowRecurringForm(true)}
            className="px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown flex items-center gap-1.5"
          >
            <Plus size={12} /> Nuevo recurrente
          </button>
        </div>
        {recurring.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-4">
            Sin recurrentes. Crea uno para automatizar sueldo, facturas, suscripciones. Se vincula con tu Calendario.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recurring.slice(0, 8).map((r) => {
              const nextDateObj = new Date(r.nextDate + "T00:00:00");
              const daysUntil = Math.ceil(
                (nextDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const acc = accounts.find((a) => a.id === r.accountId);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-brand-cream/30"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", r.active ? "bg-accent" : "bg-brand-tan")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-brand-dark truncate">{r.name}</span>
                      <span className="text-[10px] text-brand-warm uppercase tracking-wider">
                        {r.frequency}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-warm">
                      {daysUntil <= 0 ? "Vencido" : daysUntil === 1 ? "Mañana" : `En ${daysUntil} días`}
                      {" · "}
                      {r.category}
                      {acc && ` · ${acc.name}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      r.type === "income" ? "text-success" : "text-danger"
                    )}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {formatMoney(r.amount, acc?.currency ?? "MXN")}
                  </span>
                  <button
                    onClick={() => {
                      void logRecurringNow(r.id);
                      toast.success(`Transacción registrada`);
                    }}
                    title="Registrar ahora"
                    className="p-1.5 text-accent hover:bg-accent/10 rounded"
                  >
                    <Zap size={12} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Borrar recurrente "${r.name}"?`)) return;
                      await deleteRecurring(r.id);
                      toast.success("Borrado");
                    }}
                    className="p-1.5 text-brand-warm hover:text-danger rounded"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["all", "income", "expense", "transfer"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-button text-xs font-medium transition",
                filter === f
                  ? "bg-accent text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
              )}
            >
              {f === "all" ? "Todas" : f === "income" ? "Ingresos" : f === "expense" ? "Gastos" : "Transferencias"}
            </button>
          ))}
        </div>
        <select
          value={accountFilter ?? ""}
          onChange={(e) => setAccountFilter(e.target.value || null)}
          className="px-3 py-1.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-xs focus:outline-none focus:border-accent"
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
            </option>
          ))}
        </select>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-warm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar (descripción, categoría, comercio, etiqueta)…"
            className="w-full pl-7 pr-3 py-1.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-xs focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Lista de transacciones agrupada por día */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl overflow-hidden">
        {grouped.length === 0 ? (
          <div className="p-12 text-center text-brand-warm">
            <CalendarIcon size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Sin transacciones{filter !== "all" || search ? " que coincidan" : ""}</p>
          </div>
        ) : (
          grouped.map(([date, txns]) => {
            const dailyTotal = txns.reduce((s, t) => {
              if (t.type === "income") return s + t.amount;
              if (t.type === "expense") return s - t.amount;
              return s;
            }, 0);
            return (
              <div key={date}>
                <div className="px-4 py-2 bg-brand-warm-white border-b border-brand-cream flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-medium capitalize">
                    {new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      dailyTotal > 0 ? "text-success" : dailyTotal < 0 ? "text-danger" : "text-brand-warm"
                    )}
                  >
                    {dailyTotal > 0 ? "+" : ""}
                    {formatMoney(dailyTotal, txns[0].account?.currency ?? "MXN")}
                  </span>
                </div>
                {txns.map((t) => (
                  <TxnRow
                    key={t.id}
                    txn={t}
                    onDelete={async () => {
                      if (!confirm("¿Borrar transacción?")) return;
                      await deleteTransaction(t.id);
                      toast.success("Borrada");
                    }}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {showRecurringForm && (
        <RecurringFormModal onClose={() => setShowRecurringForm(false)} />
      )}
    </div>
  );
}

function TxnRow({
  txn,
  onDelete,
}: {
  txn: Transaction;
  onDelete: () => void;
}) {
  const Icon =
    txn.type === "income" ? ArrowDownCircle :
    txn.type === "expense" ? ArrowUpCircle :
    ArrowLeftRight;
  const color =
    txn.type === "income" ? "text-success" :
    txn.type === "expense" ? "text-danger" :
    "text-brand-medium";
  const currency = txn.account?.currency ?? "MXN";
  const displayName = txn.merchant ?? txn.description ?? txn.category;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-brand-cream/30 border-b border-brand-cream last:border-b-0 group">
      <Icon size={16} className={color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-brand-dark font-medium truncate">{displayName}</p>
        <p className="text-[11px] text-brand-warm">
          {txn.category}
          {txn.subcategory && ` · ${txn.subcategory}`}
          {txn.account && ` · ${txn.account.icon} ${txn.account.name}`}
          {txn.tags.length > 0 && ` · ${txn.tags.map((t) => `#${t}`).join(" ")}`}
        </p>
      </div>
      <span className={cn("text-sm font-bold font-mono", color)}>
        {txn.type === "income" ? "+" : txn.type === "expense" ? "−" : "↔"}
        {formatMoney(txn.amount, currency)}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-brand-warm hover:text-danger rounded transition"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
