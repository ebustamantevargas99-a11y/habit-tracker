"use client";

import { useState } from "react";
import { Sparkles, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { parseQuickAddTxn } from "@/lib/finance/nlp";
import { useFinanceStore } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";

const EXAMPLES = [
  "Uber $250 ayer",
  "Sueldo $45,000 hoy",
  "Starbucks $85",
  "Supermercado $1,200 ayer",
  "Netflix $249 mensual",
  "Gasolina $800 hace 2 días",
];

export default function QuickAddBar({
  onAdded,
}: {
  onAdded?: () => void;
}) {
  const { accounts, createTransaction } = useFinanceStore();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);

  // Seleccionar primera cuenta no archivada como default
  const defaultAccount = accounts.find((a) => !a.archived);
  const preview = input.trim() ? parseQuickAddTxn(input) : null;

  async function submit() {
    if (!input.trim() || !defaultAccount) return;
    const parsed = parseQuickAddTxn(input);
    if (parsed.amount <= 0) {
      toast.error("No detecté un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      const txn = await createTransaction({
        accountId: defaultAccount.id,
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        subcategory: parsed.subcategory ?? null,
        merchant: parsed.merchant ?? null,
        description: parsed.description,
        date: parsed.date,
      });
      if (txn) {
        toast.success(
          `${parsed.type === "income" ? "+" : "−"}${formatMoney(parsed.amount, defaultAccount.currency)} · ${parsed.category}`
        );
        setInput("");
        onAdded?.();
      }
    } catch {
      toast.error("Error creando transacción");
    } finally {
      setSubmitting(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-brand-warm-white border border-dashed border-brand-cream rounded-xl p-4 text-center text-sm text-brand-warm">
        Crea una cuenta primero para empezar a registrar transacciones.
      </div>
    );
  }

  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-accent" />
        <span className="text-xs uppercase tracking-widest text-brand-warm font-semibold">
          Agregar rápido
        </span>
        {defaultAccount && (
          <span className="ml-auto text-[11px] text-brand-tan">
            → {defaultAccount.icon} {defaultAccount.name}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={EXAMPLES[exampleIdx]}
          onFocus={() => setExampleIdx((i) => (i + 1) % EXAMPLES.length)}
          className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
        />
        <button
          onClick={submit}
          disabled={submitting || !input.trim()}
          className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : "Agregar"}
        </button>
      </div>
      {preview && preview.confidence !== "low" && (
        <div className="mt-2 text-xs text-brand-warm flex items-center gap-2 flex-wrap">
          {preview.type === "income" ? (
            <ArrowDownCircle size={14} className="text-success" />
          ) : (
            <ArrowUpCircle size={14} className="text-danger" />
          )}
          <span
            className={cn(
              "font-semibold",
              preview.type === "income" ? "text-success" : "text-danger"
            )}
          >
            {preview.type === "income" ? "+" : "−"}
            {formatMoney(preview.amount, defaultAccount?.currency ?? "MXN")}
          </span>
          <span>·</span>
          <span className="font-medium text-brand-dark">{preview.category}</span>
          {preview.subcategory && (
            <>
              <span>·</span>
              <span>{preview.subcategory}</span>
            </>
          )}
          <span>·</span>
          <span className="font-mono">
            {new Date(preview.date).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="ml-auto text-brand-tan">
            {preview.confidence === "high" ? "alta confianza" : "media confianza"}
          </span>
          {preview.isRecurringHint && (
            <span className="text-[10px] bg-info/10 text-info px-1.5 py-0.5 rounded">
              Recurrente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
