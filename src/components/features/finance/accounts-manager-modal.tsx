"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Wallet,
  PiggyBank,
  CreditCard,
  LineChart,
  Banknote,
  Coins,
  Loader2,
  Trash2,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { useFinanceStore, type AccountType, type FinancialAccount } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/components/ui";
import PayCardModal from "./pay-card-modal";

const TYPE_META: Record<AccountType, { label: string; icon: React.ElementType; color: string }> = {
  checking:   { label: "Débito",       icon: Wallet,      color: "bg-info/10 text-info" },
  savings:    { label: "Ahorro",       icon: PiggyBank,   color: "bg-success/10 text-success" },
  credit:     { label: "Crédito",      icon: CreditCard,  color: "bg-danger/10 text-danger" },
  investment: { label: "Inversión",    icon: LineChart,   color: "bg-accent/10 text-accent" },
  loan:       { label: "Préstamo",     icon: Banknote,    color: "bg-warning/10 text-warning" },
  crypto:     { label: "Crypto",       icon: Coins,       color: "bg-accent-light/10 text-accent-light" },
  cash:       { label: "Efectivo",     icon: Wallet,      color: "bg-brand-medium/10 text-brand-medium" },
};

const CURRENCIES = ["MXN", "USD", "EUR", "GBP", "CAD", "ARS", "COP", "CLP", "PEN", "BRL", "JPY"];

export default function AccountsManagerModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { accounts, createAccount, updateAccount, deleteAccount } = useFinanceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);
  const [paying, setPaying] = useState<FinancialAccount | null>(null);

  const activeAccounts = accounts.filter((a) => !a.archived);
  const archivedAccounts = accounts.filter((a) => a.archived);

  const totalAssets = activeAccounts
    .filter((a) => a.type !== "credit" && a.type !== "loan")
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = activeAccounts
    .filter((a) => a.type === "credit" || a.type === "loan")
    .reduce((s, a) => s + Math.max(0, a.balance), 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-brand-paper rounded-2xl w-full max-w-2xl shadow-warm-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-dark m-0">
              Cuentas
            </h2>
            <p className="text-xs text-brand-warm mt-0.5">
              {activeAccounts.length} activas · Assets {formatMoney(totalAssets, "MXN")} · Liabilities {formatMoney(totalLiabilities, "MXN")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCreate(true);
                setEditing(null);
              }}
              className="px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown flex items-center gap-1.5"
            >
              <Plus size={12} /> Nueva
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="px-6 py-4 space-y-3">
          {activeAccounts.length === 0 && !showCreate && (
            <div className="text-center py-8 text-brand-warm">
              <Wallet size={32} className="mx-auto mb-3 text-brand-tan" />
              <p className="text-sm mb-3">Aún no tienes cuentas</p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown"
              >
                Crear primera cuenta
              </button>
            </div>
          )}

          {(showCreate || editing) && (
            <AccountForm
              account={editing}
              onCancel={() => {
                setShowCreate(false);
                setEditing(null);
              }}
              onSave={async (data) => {
                try {
                  if (editing) {
                    await updateAccount(editing.id, data);
                    toast.success("Cuenta actualizada");
                  } else {
                    await createAccount(data as Parameters<typeof createAccount>[0]);
                    toast.success("Cuenta creada");
                  }
                  setShowCreate(false);
                  setEditing(null);
                } catch {
                  toast.error("Error");
                }
              }}
            />
          )}

          {activeAccounts.map((a) => (
            <AccountRow
              key={a.id}
              account={a}
              onEdit={() => setEditing(a)}
              onDelete={async () => {
                if (!confirm(`¿Borrar "${a.name}"?`)) return;
                await deleteAccount(a.id);
                toast.success("Cuenta eliminada");
              }}
              onPay={() => setPaying(a)}
            />
          ))}

          {archivedAccounts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
                Archivadas ({archivedAccounts.length})
              </h3>
              <div className="space-y-2 opacity-60">
                {archivedAccounts.map((a) => (
                  <AccountRow
                    key={a.id}
                    account={a}
                    onEdit={() => setEditing(a)}
                    onDelete={async () => {
                      await deleteAccount(a.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de pago anidado — la tarjeta a pagar se setea desde
          el botón de cada AccountRow tipo credit/loan. */}
      <PayCardModal card={paying} onClose={() => setPaying(null)} />
    </div>
  );
}

function AccountRow({
  account,
  onEdit,
  onDelete,
  onPay,
}: {
  account: FinancialAccount;
  onEdit: () => void;
  onDelete: () => void;
  onPay?: () => void;
}) {
  const meta = TYPE_META[account.type];
  const Icon = meta.icon;
  const isLiability = account.type === "credit" || account.type === "loan";
  // Mostrar "Pagar" solo si es credit/loan, no archivada y tiene saldo deudor.
  const canPay = isLiability && !account.archived && account.balance > 0 && !!onPay;

  return (
    <div
      onClick={onEdit}
      className="flex items-center gap-3 p-3 border border-brand-cream rounded-xl hover:border-accent/50 transition cursor-pointer"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg",
          meta.color
        )}
      >
        {account.icon ?? <Icon size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brand-dark text-sm truncate">{account.name}</p>
        <p className="text-[11px] text-brand-warm">
          {meta.label} · {account.currency}
          {account.institution ? ` · ${account.institution}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            "font-bold text-base",
            account.balance === 0
              ? "text-brand-tan"
              : isLiability
              ? "text-danger"
              : account.balance > 0
              ? "text-brand-dark"
              : "text-warning"
          )}
        >
          {formatMoney(account.balance, account.currency)}
        </p>
        {account.type === "credit" && account.creditLimit && (
          <p className="text-[10px] text-brand-warm">
            /{formatMoney(account.creditLimit, account.currency)}
          </p>
        )}
      </div>
      {canPay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPay?.();
          }}
          className="shrink-0 px-2.5 py-1 rounded-button text-xs font-semibold bg-accent text-white hover:bg-brand-brown"
          title={`Pagar saldo de ${formatMoney(account.balance, account.currency)}`}
        >
          Pagar
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 p-1.5 text-brand-warm hover:text-danger hover:bg-danger-light/30 rounded"
      >
        {account.archived ? <Trash2 size={13} /> : <Archive size={13} />}
      </button>
    </div>
  );
}

function AccountForm({
  account,
  onCancel,
  onSave,
}: {
  account: FinancialAccount | null;
  onCancel: () => void;
  onSave: (data: Partial<FinancialAccount> & { name: string; type: AccountType }) => Promise<void>;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [currency, setCurrency] = useState(account?.currency ?? "MXN");
  const [balance, setBalance] = useState(String(account?.balance ?? 0));
  const [icon, setIcon] = useState(account?.icon ?? "💳");
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const [creditLimit, setCreditLimit] = useState(String(account?.creditLimit ?? ""));
  const [interestRate, setInterestRate] = useState(String(account?.interestRate ?? ""));
  const [statementDay, setStatementDay] = useState(String(account?.statementDay ?? ""));
  const [dueDay, setDueDay] = useState(String(account?.dueDay ?? ""));
  const [bureauReportDay, setBureauReportDay] = useState(String(account?.bureauReportDay ?? ""));
  const [minPaymentLast, setMinPaymentLast] = useState(String(account?.minPaymentLast ?? ""));
  const [saving, setSaving] = useState(false);

  function parseDay(v: string): number | null {
    if (!v.trim()) return null;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n < 1 || n > 31) return null;
    return n;
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nombre requerido");
      return;
    }
    const isCredit = type === "credit" || type === "loan";
    setSaving(true);
    await onSave({
      name: name.trim(),
      type,
      currency,
      balance: parseFloat(balance) || 0,
      icon: icon || null,
      institution: institution.trim() || null,
      creditLimit: creditLimit ? parseFloat(creditLimit) : null,
      interestRate: interestRate ? parseFloat(interestRate) : null,
      // Solo enviamos los días de ciclo si el tipo lo amerita —
      // si no, los limpiamos por si el user cambió el tipo.
      statementDay: isCredit ? parseDay(statementDay) : null,
      dueDay: isCredit ? parseDay(dueDay) : null,
      bureauReportDay: isCredit ? parseDay(bureauReportDay) : null,
      minPaymentLast: isCredit && minPaymentLast ? parseFloat(minPaymentLast) : null,
    });
    setSaving(false);
  }

  return (
    <div className="border-2 border-accent/40 rounded-xl p-4 space-y-3 bg-brand-warm-white">
      <h3 className="font-serif font-semibold text-brand-dark">
        {account ? "Editar cuenta" : "Nueva cuenta"}
      </h3>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (ej. BBVA débito)"
          autoFocus
          className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
        />
        <input
          value={icon ?? ""}
          onChange={(e) => setIcon(e.target.value.slice(0, 4))}
          placeholder="🏦"
          maxLength={4}
          className="w-16 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-center text-lg focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
          Tipo
        </label>
        <div className="grid grid-cols-4 gap-1">
          {(Object.entries(TYPE_META) as [AccountType, typeof TYPE_META[AccountType]][]).map(
            ([t, meta]) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-2 py-1.5 rounded text-[10px] font-semibold transition",
                  type === t
                    ? "bg-accent text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                )}
              >
                {meta.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
            Moneda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
            Balance inicial
          </label>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <input
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        placeholder="Banco/Institución (opcional)"
        className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
      />

      {(type === "credit" || type === "loan") && (
        <div className="space-y-2 border-t border-brand-cream pt-3 mt-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Detalles de la tarjeta
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-brand-warm block mb-1">
                {type === "credit" ? "Línea de crédito" : "Monto original"}
              </label>
              <input
                type="number"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder={type === "credit" ? "ej. 50,000" : "ej. 200,000"}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-warm block mb-1">
                Tasa anual (APR %)
              </label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="ej. 24.5"
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-brand-warm block mb-1">
                Día de corte
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                placeholder="ej. 15"
                title="Día del mes en que cierra el corte mensual (1-31)"
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-warm block mb-1">
                Día de pago
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="ej. 5"
                title="Día del mes en que vence el pago (1-31)"
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-warm block mb-1">
                Reporte buró
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={bureauReportDay}
                onChange={(e) => setBureauReportDay(e.target.value)}
                placeholder="ej. 18"
                title="Día del mes que reporta al buró de crédito (1-31)"
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-brand-warm block mb-1">
              Pago mínimo del último corte
            </label>
            <input
              type="number"
              step="0.01"
              value={minPaymentLast}
              onChange={(e) => setMinPaymentLast(e.target.value)}
              placeholder="ej. 250"
              title="Pago mínimo informado en el estado de cuenta más reciente"
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <p className="text-[11px] text-brand-warm italic">
            Tip: el día de corte es cuando cierra el periodo, el día de pago
            es cuando vence. Pagar antes del corte mejora tu reporte al buró.
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          {account ? "Guardar" : "Crear"}
        </button>
      </div>
    </div>
  );
}
