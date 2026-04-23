"use client";

import { useMemo, useState } from "react";
import {
  Target, Plus, Trash2, Calendar, TrendingDown, Flame,
  Check, AlertTriangle, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/components/ui";
import { useFinanceStore, type SavingsGoal, type Debt } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";
import { projectGoal, simulatePayoff } from "@/lib/finance/calculations";

export default function GoalsDebtsView() {
  const {
    goals, debts, accounts, transactions,
    createGoal, deleteGoal, depositToGoal,
    createDebt, deleteDebt, payDebt,
  } = useFinanceStore();
  const primaryCurrency = accounts[0]?.currency ?? "MXN";

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [depositFor, setDepositFor] = useState<SavingsGoal | null>(null);
  const [payFor, setPayFor] = useState<Debt | null>(null);
  const [payoffStrategy, setPayoffStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPayment, setExtraPayment] = useState<number>(0);

  // Calcular avgMonthlySavings de los últimos 3 meses
  const avgMonthlySavings = useMemo(() => {
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      if (!byMonth.has(m)) byMonth.set(m, { income: 0, expense: 0 });
      const b = byMonth.get(m)!;
      if (t.type === "income") b.income += t.amount;
      else if (t.type === "expense") b.expense += t.amount;
    }
    const last3 = Array.from(byMonth.values()).slice(-3);
    if (last3.length === 0) return 0;
    const totalSavings = last3.reduce((s, m) => s + (m.income - m.expense), 0);
    return Math.max(0, totalSavings / last3.length);
  }, [transactions]);

  const activeGoals = goals.filter((g) => !g.achieved);
  const achievedGoals = goals.filter((g) => g.achieved);
  const activeDebts = debts.filter((d) => d.active);

  const debtsForSimulation = useMemo(
    () => activeDebts.map((d) => ({
      id: d.id, name: d.name, balance: d.balance,
      interestRate: d.interestRate, minPayment: d.minPayment,
    })),
    [activeDebts]
  );

  const avalanchePlan = useMemo(
    () => debtsForSimulation.length > 0 ? simulatePayoff(debtsForSimulation, "avalanche", extraPayment) : null,
    [debtsForSimulation, extraPayment]
  );
  const snowballPlan = useMemo(
    () => debtsForSimulation.length > 0 ? simulatePayoff(debtsForSimulation, "snowball", extraPayment) : null,
    [debtsForSimulation, extraPayment]
  );

  return (
    <div className="space-y-5">
      {/* GOALS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl font-bold text-brand-dark flex items-center gap-2">
            <Target size={20} className="text-accent" /> Metas de ahorro
          </h3>
          <button
            onClick={() => setShowGoalForm(true)}
            className="px-3 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown flex items-center gap-1.5"
          >
            <Plus size={12} /> Nueva meta
          </button>
        </div>

        {activeGoals.length === 0 ? (
          <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-8 text-center text-sm text-brand-warm">
            Crea tu primera meta: emergency fund, viaje, auto, casa…
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeGoals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                currency={primaryCurrency}
                avgMonthlySavings={avgMonthlySavings}
                onDeposit={() => setDepositFor(g)}
                onDelete={async () => {
                  if (!confirm("¿Borrar meta?")) return;
                  await deleteGoal(g.id);
                  toast.success("Meta eliminada");
                }}
              />
            ))}
          </div>
        )}

        {achievedGoals.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-brand-warm uppercase tracking-widest font-semibold mb-2">
              Logradas ({achievedGoals.length})
            </p>
            <div className="flex gap-2 flex-wrap">
              {achievedGoals.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1.5 bg-success/10 text-success border border-success/30 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {g.emoji ?? "🏆"} {g.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DEBTS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl font-bold text-brand-dark flex items-center gap-2">
            <TrendingDown size={20} className="text-danger" /> Deudas
          </h3>
          <button
            onClick={() => setShowDebtForm(true)}
            className="px-3 py-1.5 rounded-button bg-danger text-white text-xs font-semibold hover:bg-danger/90 flex items-center gap-1.5"
          >
            <Plus size={12} /> Nueva deuda
          </button>
        </div>

        {activeDebts.length === 0 ? (
          <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-8 text-center text-sm text-brand-warm">
            ¡Sin deudas! Si tienes tarjetas, préstamos o hipoteca, regístralas aquí para planear tu salida.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              {activeDebts.map((d) => (
                <DebtCard
                  key={d.id}
                  debt={d}
                  currency={primaryCurrency}
                  onPay={() => setPayFor(d)}
                  onDelete={async () => {
                    if (!confirm("¿Borrar deuda?")) return;
                    await deleteDebt(d.id);
                    toast.success("Deuda eliminada");
                  }}
                />
              ))}
            </div>

            {/* Payoff planner */}
            {debtsForSimulation.length >= 1 && (
              <PayoffPlanner
                avalanchePlan={avalanchePlan!}
                snowballPlan={snowballPlan!}
                currency={primaryCurrency}
                strategy={payoffStrategy}
                onStrategyChange={setPayoffStrategy}
                extraPayment={extraPayment}
                onExtraPaymentChange={setExtraPayment}
              />
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {showGoalForm && (
        <GoalFormModal
          onClose={() => setShowGoalForm(false)}
          onSave={async (data) => {
            await createGoal(data);
            toast.success("Meta creada");
            setShowGoalForm(false);
          }}
        />
      )}

      {showDebtForm && (
        <DebtFormModal
          onClose={() => setShowDebtForm(false)}
          onSave={async (data) => {
            await createDebt(data);
            toast.success("Deuda registrada");
            setShowDebtForm(false);
          }}
        />
      )}

      {depositFor && (
        <DepositModal
          goal={depositFor}
          currency={primaryCurrency}
          accounts={accounts}
          onClose={() => setDepositFor(null)}
          onDeposit={async (amount, accountId) => {
            await depositToGoal(depositFor.id, amount, accountId);
            toast.success(`Aporte registrado`);
            setDepositFor(null);
          }}
        />
      )}

      {payFor && (
        <PayDebtModal
          debt={payFor}
          currency={primaryCurrency}
          accounts={accounts}
          onClose={() => setPayFor(null)}
          onPay={async (amount, accountId) => {
            await payDebt(payFor.id, amount, accountId);
            toast.success("Pago registrado");
            setPayFor(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────────

function GoalCard({
  goal, currency, avgMonthlySavings, onDeposit, onDelete,
}: {
  goal: SavingsGoal;
  currency: string;
  avgMonthlySavings: number;
  onDeposit: () => void;
  onDelete: () => void;
}) {
  const projection = projectGoal(goal.currentAmount, goal.targetAmount, goal.targetDate, avgMonthlySavings);
  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4 group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center text-lg shrink-0">
          {goal.emoji ?? "🎯"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-base font-semibold text-brand-dark m-0">{goal.name}</h4>
          <p className="text-[11px] text-brand-warm">
            {formatMoney(goal.currentAmount, currency)} de {formatMoney(goal.targetAmount, currency)}
            {goal.priority && ` · prioridad ${goal.priority}`}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-brand-warm hover:text-danger rounded transition"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden mb-2">
        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between text-[11px] mb-3">
        <span className="text-brand-warm">{Math.round(pct)}% completado</span>
        <span className="text-brand-medium font-semibold">
          Faltan {formatMoney(projection.remaining, currency)}
        </span>
      </div>

      {/* Proyección */}
      <div className="bg-brand-warm-white rounded-lg p-2.5 text-[11px] space-y-1 mb-3">
        {goal.targetDate && (
          <div className="flex items-center gap-1.5 text-brand-medium">
            <Calendar size={10} />
            <span>
              Meta: {new Date(goal.targetDate + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        )}
        {projection.requiredMonthlySavings !== null && (
          <div className={cn(
            "font-semibold",
            projection.onTrack ? "text-success" : "text-warning"
          )}>
            Necesitas ahorrar {formatMoney(projection.requiredMonthlySavings, currency)}/mes
          </div>
        )}
        {projection.monthsAtCurrentPace !== null && projection.monthsAtCurrentPace > 0 && (
          <div className="text-brand-warm">
            A tu ritmo (avg {formatMoney(avgMonthlySavings, currency)}/mes):{" "}
            <b className="text-brand-dark">~{Math.ceil(projection.monthsAtCurrentPace)} meses</b>
            {projection.projectedDate && ` · ${new Date(projection.projectedDate).toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`}
          </div>
        )}
        {projection.onTrack === false && projection.deficit !== null && (
          <div className="flex items-center gap-1 text-danger font-semibold">
            <AlertTriangle size={10} />
            <span>Falta ahorrar {formatMoney(projection.deficit, currency)}/mes más</span>
          </div>
        )}
        {projection.onTrack === true && (
          <div className="flex items-center gap-1 text-success font-semibold">
            <Check size={10} />
            <span>En ritmo para lograrlo</span>
          </div>
        )}
      </div>

      <button
        onClick={onDeposit}
        className="w-full px-3 py-2 rounded-button bg-success text-white text-xs font-semibold hover:bg-success/90"
      >
        + Aportar
      </button>
    </div>
  );
}

// ─── Debt Card ───────────────────────────────────────────────────────

function DebtCard({
  debt, currency, onPay, onDelete,
}: {
  debt: Debt;
  currency: string;
  onPay: () => void;
  onDelete: () => void;
}) {
  const highInterest = debt.interestRate >= 20;
  const progress = debt.originalAmount
    ? ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100
    : 0;

  return (
    <div
      className={cn(
        "bg-brand-paper border rounded-xl p-4 group",
        highInterest ? "border-danger/40" : "border-brand-cream"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0",
          highInterest ? "bg-danger/10" : "bg-warning/10"
        )}>
          {highInterest ? "🔥" : "💳"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-base font-semibold text-brand-dark m-0">{debt.name}</h4>
          <p className="text-[11px] text-brand-warm">
            {debt.type.replace("_", " ")} · min {formatMoney(debt.minPayment, currency)}/mes
          </p>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-brand-warm hover:text-danger rounded transition"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold text-danger">{formatMoney(debt.balance, currency)}</span>
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full",
          highInterest ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
        )}>
          {debt.interestRate.toFixed(1)}% APR
        </span>
      </div>

      {debt.originalAmount && debt.originalAmount > debt.balance && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden">
            <div className="h-full bg-success" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-brand-warm mt-0.5">
            {Math.round(progress)}% liquidado · Original {formatMoney(debt.originalAmount, currency)}
          </p>
        </div>
      )}

      <button
        onClick={onPay}
        className="w-full px-3 py-2 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown"
      >
        Registrar pago
      </button>
    </div>
  );
}

// ─── Payoff Planner ──────────────────────────────────────────────────

function PayoffPlanner({
  avalanchePlan, snowballPlan, currency, strategy, onStrategyChange, extraPayment, onExtraPaymentChange,
}: {
  avalanchePlan: ReturnType<typeof simulatePayoff>;
  snowballPlan: ReturnType<typeof simulatePayoff>;
  currency: string;
  strategy: "avalanche" | "snowball";
  onStrategyChange: (s: "avalanche" | "snowball") => void;
  extraPayment: number;
  onExtraPaymentChange: (n: number) => void;
}) {
  const plan = strategy === "avalanche" ? avalanchePlan : snowballPlan;
  const other = strategy === "avalanche" ? snowballPlan : avalanchePlan;
  const savedInterest = strategy === "avalanche"
    ? snowballPlan.totalInterest - avalanchePlan.totalInterest
    : 0;

  return (
    <div className="bg-gradient-to-br from-brand-warm-white to-brand-paper border border-brand-cream rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="font-display text-lg font-bold text-brand-dark m-0">
            Plan de liquidación
          </h4>
          <p className="text-xs text-brand-warm">
            Simulación mes a mes con mínimos + extra payment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-brand-warm font-semibold">Extra/mes</label>
          <input
            type="number"
            step="100"
            value={extraPayment || ""}
            onChange={(e) => onExtraPaymentChange(parseFloat(e.target.value) || 0)}
            className="w-24 px-2 py-1 rounded border border-brand-cream bg-brand-paper text-sm font-mono focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Strategy toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StrategyCard
          active={strategy === "avalanche"}
          onClick={() => onStrategyChange("avalanche")}
          title="Avalanche (matemático)"
          description="Primero la de mayor interés. Ahorras más dinero."
          months={avalanchePlan.totalMonths}
          interest={avalanchePlan.totalInterest}
          currency={currency}
          recommended={savedInterest > 0}
        />
        <StrategyCard
          active={strategy === "snowball"}
          onClick={() => onStrategyChange("snowball")}
          title="Snowball (motivacional)"
          description="Primero la más pequeña. Ganas momentum rápido."
          months={snowballPlan.totalMonths}
          interest={snowballPlan.totalInterest}
          currency={currency}
        />
      </div>

      {savedInterest > 0 && strategy === "avalanche" && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-2.5 mb-4 text-xs text-success flex items-start gap-2">
          <Check size={14} className="shrink-0 mt-0.5" />
          <span>
            Con avalanche ahorras <b>{formatMoney(savedInterest, currency)}</b> en intereses vs snowball.
          </span>
        </div>
      )}

      {/* Order */}
      <div>
        <p className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
          Orden de liquidación
        </p>
        <div className="space-y-1.5">
          {plan.order.map((d, i) => (
            <div
              key={d.id}
              className="flex items-center gap-2 bg-brand-paper rounded-lg px-3 py-2 border border-brand-cream"
            >
              <span className="text-sm font-bold text-accent w-5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{d.name}</p>
                <p className="text-[11px] text-brand-warm">
                  {d.interestRate.toFixed(1)}% · Liquidada en mes {d.monthsToPayoff}
                </p>
              </div>
              <span className="text-xs text-danger font-mono">
                Int. {formatMoney(d.interestPaid, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-brand-cream text-xs text-brand-warm flex items-center justify-between">
        <span>
          Total tiempo: <b className="text-brand-dark">{Math.floor(plan.totalMonths / 12)}a {plan.totalMonths % 12}m</b>
        </span>
        <span>
          Interés total: <b className="text-danger">{formatMoney(plan.totalInterest, currency)}</b>
        </span>
      </div>
    </div>
  );
}

function StrategyCard({
  active, onClick, title, description, months, interest, currency, recommended,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
  months: number;
  interest: number;
  currency: string;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-xl border-2 transition",
        active ? "border-accent bg-accent/5" : "border-brand-cream hover:border-accent/40"
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className="font-bold text-sm text-brand-dark">{title}</span>
        {recommended && (
          <span className="text-[9px] bg-success text-white px-1.5 py-0.5 rounded-full font-bold">
            REC
          </span>
        )}
      </div>
      <p className="text-[11px] text-brand-warm mb-2">{description}</p>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono text-brand-medium">{months}m</span>
        <span className="font-mono text-danger">{formatMoney(interest, currency)}</span>
      </div>
    </button>
  );
}

// ─── Modal: Goal Form ────────────────────────────────────────────────

function GoalFormModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (data: { name: string; emoji: string; targetAmount: number; targetDate: string | null; priority: "low" | "medium" | "high"; category: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  async function save() {
    const t = parseFloat(target);
    if (!name.trim() || !t || t <= 0) {
      toast.error("Nombre y monto objetivo son obligatorios");
      return;
    }
    setSaving(true);
    await onSave({ name: name.trim(), emoji, targetAmount: t, targetDate: date || null, priority, category });
    setSaving(false);
  }

  const EMOJIS = ["🎯", "🏠", "🚗", "✈️", "🎓", "💍", "🛡️", "💻", "🎁", "🌴"];
  const CATS = ["emergency", "travel", "home", "car", "wedding", "education", "other"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg my-8" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">Nueva meta</h2>
          <button onClick={onClose} className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full">
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Fondo de emergencia / Viaje a Japón / Enganche casa"
              className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-16 px-2 py-2 rounded-button border border-brand-cream bg-brand-paper text-lg text-center focus:outline-none focus:border-accent"
            >
              {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="100"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Monto objetivo"
              className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Prioridad
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "py-1.5 rounded text-xs font-semibold transition",
                    priority === p ? "bg-accent text-white" : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {p === "low" ? "Baja" : p === "medium" ? "Media" : "Alta"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent capitalize"
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Crear meta
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Modal: Debt Form ────────────────────────────────────────────────

function DebtFormModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (data: { name: string; type: string; balance: number; interestRate: number; minPayment: number; originalAmount?: number; dueDay?: number }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("credit_card");
  const [balance, setBalance] = useState("");
  const [original, setOriginal] = useState("");
  const [rate, setRate] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [saving, setSaving] = useState(false);

  const TYPES = [
    { val: "credit_card", label: "Tarjeta" },
    { val: "loan",        label: "Préstamo" },
    { val: "mortgage",    label: "Hipoteca" },
    { val: "student",     label: "Estudiantil" },
    { val: "personal",    label: "Personal" },
    { val: "other",       label: "Otro" },
  ];

  async function save() {
    const b = parseFloat(balance);
    const r = parseFloat(rate);
    const mp = parseFloat(minPayment);
    if (!name.trim() || !b || b <= 0 || isNaN(r) || r < 0 || !mp || mp <= 0) {
      toast.error("Nombre, balance, tasa y pago mínimo son obligatorios");
      return;
    }
    setSaving(true);
    await onSave({
      name: name.trim(), type, balance: b, interestRate: r, minPayment: mp,
      originalAmount: parseFloat(original) || undefined,
      dueDay: parseInt(dueDay) || undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg my-8" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-brand-cream flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-dark m-0">Nueva deuda</h2>
          <button onClick={onClose} className="p-1.5 text-brand-warm hover:bg-brand-cream rounded-full">
            <X size={16} />
          </button>
        </header>
        <div className="px-6 py-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Tarjeta BBVA / Préstamo auto / ..."
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-1">
              {TYPES.map((t) => (
                <button
                  key={t.val}
                  onClick={() => setType(t.val)}
                  className={cn(
                    "py-1.5 rounded text-xs font-medium transition",
                    type === t.val ? "bg-danger text-white" : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Balance actual
              </label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Monto original (opc)
              </label>
              <input
                type="number"
                step="0.01"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                % APR
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Pago mín/mes
              </label>
              <input
                type="number"
                step="0.01"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                Día corte
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-button bg-danger text-white text-sm font-semibold hover:bg-danger/90 disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Registrar
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Modal: Deposit to Goal ──────────────────────────────────────────

function DepositModal({
  goal, currency, accounts, onClose, onDeposit,
}: {
  goal: SavingsGoal;
  currency: string;
  accounts: Array<{ id: string; name: string; icon: string | null; type: string }>;
  onClose: () => void;
  onDeposit: (amount: number, accountId?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    setSaving(true);
    await onDeposit(a, accountId || undefined);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-brand-paper rounded-2xl w-full max-w-sm shadow-warm-lg" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-brand-cream">
          <h2 className="font-display text-lg font-bold text-brand-dark m-0">
            Aportar a {goal.emoji ?? "🎯"} {goal.name}
          </h2>
          <p className="text-xs text-brand-warm mt-0.5">
            Actual: {formatMoney(goal.currentAmount, currency)} / {formatMoney(goal.targetAmount, currency)}
          </p>
        </header>
        <div className="px-6 py-4 space-y-3">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            placeholder="Monto"
            className="w-full px-3 py-3 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-xl font-mono text-center focus:outline-none focus:border-accent"
          />
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Desde (opcional — crea transacción)
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Solo actualizar meta</option>
              {accounts.filter((a) => a.type !== "credit" && a.type !== "loan").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !amount}
            className="px-5 py-2 rounded-button bg-success text-white text-sm font-semibold hover:bg-success/90 disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Aportar
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Modal: Pay Debt ──────────────────────────────────────────────────

function PayDebtModal({
  debt, currency, accounts, onClose, onPay,
}: {
  debt: Debt;
  currency: string;
  accounts: Array<{ id: string; name: string; icon: string | null; type: string }>;
  onClose: () => void;
  onPay: (amount: number, accountId?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(debt.minPayment));
  const [accountId, setAccountId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    setSaving(true);
    await onPay(a, accountId || undefined);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-brand-paper rounded-2xl w-full max-w-sm shadow-warm-lg" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-brand-cream">
          <h2 className="font-display text-lg font-bold text-brand-dark m-0">
            Pago a {debt.name}
          </h2>
          <p className="text-xs text-brand-warm mt-0.5">
            Balance: {formatMoney(debt.balance, currency)} · Min {formatMoney(debt.minPayment, currency)}
          </p>
        </header>
        <div className="px-6 py-4 space-y-3">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            className="w-full px-3 py-3 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-xl font-mono text-center focus:outline-none focus:border-accent"
          />
          <div className="flex gap-1">
            <button
              onClick={() => setAmount(String(debt.minPayment))}
              className="flex-1 px-2 py-1.5 rounded text-[11px] font-medium bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            >
              Mínimo
            </button>
            <button
              onClick={() => setAmount(String(debt.minPayment * 2))}
              className="flex-1 px-2 py-1.5 rounded text-[11px] font-medium bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            >
              2× mín
            </button>
            <button
              onClick={() => setAmount(String(debt.balance))}
              className="flex-1 px-2 py-1.5 rounded text-[11px] font-medium bg-success/10 text-success hover:bg-success/20"
            >
              Liquidar
            </button>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
              Desde cuenta (opcional — crea transacción)
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Solo reducir saldo</option>
              {accounts.filter((a) => a.type !== "credit" && a.type !== "loan").map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <footer className="px-6 py-3 border-t border-brand-cream flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !amount}
            className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Pagar
          </button>
        </footer>
      </div>
    </div>
  );
}
