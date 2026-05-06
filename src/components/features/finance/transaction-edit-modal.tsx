"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore, type Transaction, type TransactionType } from "@/stores/finance-store";
import { cn } from "@/components/ui";

interface Props {
  txn: Transaction | null;     // null → modal cerrado
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

const COMMON_CATEGORIES = [
  "Salario", "Comisión", "Reembolso", "Bono",
  "Alimentación", "Transporte", "Vivienda", "Ocio",
  "Salud", "Suscripciones", "Compras", "Otros",
];

/**
 * Modal de edición de transacción. Reusa el endpoint PATCH existente
 * (`/api/finance/transactions/[id]`) y el store. Al guardar dispara
 * `onSaved`; al borrar dispara `onDeleted`. Ambos cierran el modal.
 */
export default function TransactionEditModal({ txn, onClose, onSaved, onDeleted }: Props) {
  const { accounts, updateTransaction, deleteTransaction } = useFinanceStore();
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // Cargar valores cuando llega un nuevo txn.
  useEffect(() => {
    if (!txn) return;
    setAccountId(txn.accountId);
    setType(txn.type);
    setAmount(String(txn.amount));
    setCategory(txn.category);
    setMerchant(txn.merchant ?? "");
    setDescription(txn.description ?? "");
    setDate(txn.date);
    setNotes(txn.notes ?? "");
    // Foco al campo monto al abrir.
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [txn?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc cierra
  useEffect(() => {
    if (!txn) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [txn, onClose]);

  if (!txn) return null;

  const account = accounts.find((a) => a.id === accountId);

  async function save() {
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("El monto debe ser un número positivo");
      return;
    }
    if (!txn) return;
    setSaving(true);
    try {
      await updateTransaction(txn.id, {
        accountId,
        type,
        amount: num,
        category: category.trim() || "Otros",
        merchant: merchant.trim() || null,
        description: description.trim() || null,
        date,
        notes: notes.trim() || null,
      });
      toast.success("Transacción actualizada");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!txn) return;
    if (!confirm("¿Borrar esta transacción? No se puede deshacer.")) return;
    setDeleting(true);
    try {
      await deleteTransaction(txn.id);
      toast.success("Transacción eliminada");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Error eliminando");
    } finally {
      setDeleting(false);
    }
  }

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
          <h2 className="font-serif text-lg font-semibold text-brand-dark m-0">
            Editar transacción
          </h2>
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
          {/* Tipo */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
              Tipo
            </label>
            <div className="flex gap-1.5">
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-button text-xs font-medium transition",
                    type === t
                      ? t === "income"
                        ? "bg-success text-white"
                        : t === "expense"
                          ? "bg-danger text-white"
                          : "bg-info text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
                  )}
                >
                  {t === "income" ? "Ingreso" : t === "expense" ? "Gasto" : "Transferencia"}
                </button>
              ))}
            </div>
          </div>

          {/* Cuenta + Monto */}
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
                Cuenta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
                Monto {account ? `· ${account.currency}` : ""}
              </label>
              <input
                ref={titleRef}
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="ut-tx-categories"
              placeholder="ej. Alimentación"
              className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            <datalist id="ut-tx-categories">
              {COMMON_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Comercio + Fecha */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
                Comercio
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="ej. Starbucks"
                className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
              />
            </div>
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
          </div>

          {/* Descripción */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Café latte mediano"
              className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold block mb-1.5">
              Notas <span className="text-brand-tan normal-case lowercase tracking-normal">opcional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-2 rounded-button border border-brand-cream bg-brand-warm-white text-brand-dark text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-brand-cream bg-brand-warm-white">
          <button
            type="button"
            onClick={remove}
            disabled={deleting || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 rounded-button disabled:opacity-40"
            title="Borrar transacción"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Borrar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || deleting}
              className="px-5 py-1.5 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
