"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore, type Frequency } from "@/stores/finance-store";
import { cn } from "@/components/ui";

const FREQUENCIES: { val: Frequency; label: string }[] = [
  { val: "weekly",    label: "Semanal" },
  { val: "biweekly",  label: "Quincenal" },
  { val: "monthly",   label: "Mensual" },
  { val: "quarterly", label: "Trimestral" },
  { val: "annual",    label: "Anual" },
];

const COMMON_CATEGORIES = {
  expense: ["Vivienda", "Alimentación", "Transporte", "Entretenimiento", "Salud", "Educación", "Servicios", "Deudas", "Otros"],
  income:  ["Salario", "Freelance", "Inversiones", "Bonos", "Rentas", "Otros"],
};

export default function RecurringFormModal({ onClose }: { onClose: () => void }) {
  const { accounts, createRecurring } = useFinanceStore();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [category, setCategory] = useState("Vivienda");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || !accountId) {
      toast.error("Nombre y cuenta son obligatorios");
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Monto inválido");
      return;
    }
    setSaving(true);
    try {
      await createRecurring({
        accountId,
        name: name.trim(),
        amount: amt,
        type,
        category,
        frequency,
        nextDate,
      });
      toast.success(
        type === "expense"
          ? "Recurrente creado. Se agregó a tu Calendario con recordatorio 24h antes."
          : "Recurrente creado."
      );
      onClose();
    } catch {
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">
            Nuevo recurrente
          </h2>
          <button onClick={onClose} className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full">
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-4 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {(["income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCategory(COMMON_CATEGORIES[t][0]);
                }}
                className={cn(
                  "px-4 py-2 rounded-button text-sm font-semibold transition",
                  type === t
                    ? t === "income"
                      ? "bg-success text-white"
                      : "bg-danger text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                )}
              >
                {t === "income" ? "+ Ingreso" : "− Gasto"}
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "income" ? "Sueldo / Freelance X / ..." : "Netflix / Renta / Luz / ..."}
            autoFocus
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Cuenta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            >
              {COMMON_CATEGORIES[type].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Frecuencia
            </label>
            <div className="grid grid-cols-5 gap-1">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.val}
                  onClick={() => setFrequency(f.val)}
                  className={cn(
                    "px-2 py-1.5 rounded text-[11px] font-medium transition",
                    frequency === f.val
                      ? "bg-accent text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Próximo pago/cobro
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {type === "expense" && (
            <p className="text-xs text-brand-warm bg-brand-warm-white rounded p-2 border border-brand-cream">
              💡 Se agregará automáticamente a tu Calendario con recordatorio push 24h antes.
            </p>
          )}
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim() || !amount}
            className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Crear
          </button>
        </footer>
      </div>
    </div>
  );
}
