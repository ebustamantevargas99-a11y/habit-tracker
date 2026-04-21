"use client";

import { Target } from "lucide-react";
import { cn } from "@/components/ui";
import { useFinanceStore } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";

/** Stub — viene en Fase 3 con proyecciones + snowball/avalanche. */
export default function GoalsDebtsView() {
  const { goals, debts, accounts } = useFinanceStore();
  const primaryCurrency = accounts[0]?.currency ?? "MXN";

  return (
    <div className="space-y-5">
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <Target size={16} /> Metas de ahorro
        </h3>
        {goals.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-4">
            Aún no tienes metas. Próxima fase: creación + proyección "a tu ritmo actual tardas X meses".
          </p>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
              return (
                <div key={g.id} className="border border-brand-cream rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-brand-dark flex items-center gap-2">
                      <span>{g.emoji ?? "🎯"}</span> {g.name}
                    </span>
                    <span className="text-xs text-brand-warm">
                      {formatMoney(g.currentAmount, primaryCurrency)} / {formatMoney(g.targetAmount, primaryCurrency)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-brand-tan mt-1">{Math.round(pct)}% completado</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Deudas activas
        </h3>
        {debts.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-4">
            Sin deudas. Próxima fase: snowball/avalanche planner.
          </p>
        ) : (
          <div className="space-y-2">
            {debts.map((d) => (
              <div
                key={d.id}
                className={cn(
                  "flex items-center justify-between border rounded-lg px-3 py-2",
                  d.interestRate >= 20 ? "border-danger/50 bg-danger/5" : "border-brand-cream"
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{d.name}</p>
                  <p className="text-[11px] text-brand-warm">
                    {d.interestRate}% APR · min {formatMoney(d.minPayment, primaryCurrency)}/mes
                  </p>
                </div>
                <span className="text-sm font-bold text-danger">
                  {formatMoney(d.balance, primaryCurrency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-brand-cream/30 border border-brand-cream rounded-xl p-5 text-center text-sm text-brand-warm">
        <p className="font-semibold text-brand-medium mb-1">Fase 3 · próximamente</p>
        <p>Creación inline de metas con proyección a fecha objetivo · Planner de deudas (snowball vs avalanche) · Conscious Spending Plan (Ramit-style) · Budget YNAB-style por categoría.</p>
      </div>
    </div>
  );
}
