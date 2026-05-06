"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Loader2, ArrowDownCircle, ArrowUpCircle, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { parseQuickAddTxn } from "@/lib/finance/nlp";
import { useFinanceStore } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";

const EXAMPLES = [
  "Sueldo $800 hoy",
  "Uber S/ 25 ayer",
  "Starbucks $8.50",
  "Supermercado S/ 180 ayer",
  "Netflix $19.99 mensual",
  "Gasolina S/ 90 hace 2 días",
];

const LS_LAST_ACCOUNT = "ut-finance-last-account";

export default function QuickAddBar({
  onAdded,
}: {
  onAdded?: () => void;
}) {
  const { accounts, createTransaction } = useFinanceStore();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Cuentas activas (no archivadas) — ordenadas por orden de creación.
  const activeAccounts = accounts.filter((a) => !a.archived);

  // Resolver cuenta seleccionada: la del state si existe, si no la guardada
  // en localStorage, si no la primera activa.
  const selectedAccount =
    activeAccounts.find((a) => a.id === accountId) ?? activeAccounts[0];

  // Restaurar última cuenta usada al montar (una vez con accounts cargadas).
  useEffect(() => {
    if (accountId || activeAccounts.length === 0) return;
    try {
      const stored = localStorage.getItem(LS_LAST_ACCOUNT);
      if (stored && activeAccounts.some((a) => a.id === stored)) {
        setAccountId(stored);
      } else {
        setAccountId(activeAccounts[0].id);
      }
    } catch {
      setAccountId(activeAccounts[0].id);
    }
  }, [activeAccounts, accountId]);

  // Cerrar menú al click fuera.
  useEffect(() => {
    if (!accountMenuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountMenuOpen]);

  function pickAccount(id: string) {
    setAccountId(id);
    setAccountMenuOpen(false);
    try {
      localStorage.setItem(LS_LAST_ACCOUNT, id);
    } catch {
      // ignore
    }
  }

  const preview = input.trim() ? parseQuickAddTxn(input) : null;

  async function submit() {
    if (!input.trim() || !selectedAccount) return;
    const parsed = parseQuickAddTxn(input);
    if (parsed.amount <= 0) {
      toast.error("No detecté un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      const txn = await createTransaction({
        accountId: selectedAccount.id,
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
          `${parsed.type === "income" ? "+" : "−"}${formatMoney(parsed.amount, selectedAccount.currency)} → ${selectedAccount.name}`,
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
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Sparkles size={14} className="text-accent" />
        <span className="text-xs uppercase tracking-widest text-brand-warm font-semibold">
          Agregar rápido
        </span>
      </div>

      <div className="flex gap-2 items-stretch">
        {/* Selector de cuenta — botón prominente al lado del input */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setAccountMenuOpen((v) => !v)}
            className={cn(
              "h-full flex items-center gap-2 px-3 py-2 rounded-button border-2 transition",
              "bg-brand-warm-white border-brand-tan hover:border-accent hover:bg-brand-cream",
              accountMenuOpen && "border-accent bg-brand-cream",
            )}
            title="Cambiar cuenta destino"
            aria-label="Seleccionar cuenta"
          >
            <span className="text-base">{selectedAccount?.icon ?? "💳"}</span>
            <div className="flex flex-col items-start text-left leading-tight">
              <span className="text-[9px] uppercase tracking-widest text-brand-warm font-semibold">
                Cuenta
              </span>
              <span className="text-xs font-semibold text-brand-dark">
                {selectedAccount?.name ?? "Elegir"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-brand-tan ml-1">
              {selectedAccount?.currency}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "text-brand-warm transition-transform",
                accountMenuOpen && "rotate-180",
              )}
            />
          </button>
          {accountMenuOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[260px] bg-brand-paper rounded-lg border border-brand-tan shadow-warm-lg py-1 max-h-[320px] overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-brand-warm font-semibold border-b border-brand-cream">
                Mandar a…
              </div>
              {activeAccounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickAccount(a.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs hover:bg-brand-cream flex items-center gap-2 transition",
                    a.id === selectedAccount?.id && "bg-brand-cream font-semibold",
                  )}
                >
                  <span className="text-base">{a.icon ?? "💳"}</span>
                  <span className="flex-1 truncate text-sm">{a.name}</span>
                  <span className="text-brand-tan font-mono text-[10px] uppercase">
                    {a.currency}
                  </span>
                  {a.id === selectedAccount?.id && (
                    <span className="text-accent text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input principal */}
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
          disabled={submitting || !input.trim() || !selectedAccount}
          className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : "Agregar"}
        </button>
      </div>

      {/* Tip helper — siempre visible debajo */}
      <p className="text-[11px] text-brand-warm mt-2 leading-relaxed">
        <span className="font-semibold text-brand-medium">Tip:</span>{" "}
        usa <code className="px-1 rounded bg-brand-cream text-success font-mono">+</code>{" "}
        antes del monto para <strong className="text-success">ingreso</strong>
        {" "}o{" "}
        <code className="px-1 rounded bg-brand-cream text-danger font-mono">−</code>{" "}
        para <strong className="text-danger">gasto</strong>. Ej:{" "}
        <code className="text-brand-dark font-mono">+800 sueldo</code>,{" "}
        <code className="text-brand-dark font-mono">−45 café</code>.
      </p>
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
              preview.type === "income" ? "text-success" : "text-danger",
            )}
          >
            {preview.type === "income" ? "+" : "−"}
            {formatMoney(preview.amount, selectedAccount?.currency ?? "MXN")}
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
