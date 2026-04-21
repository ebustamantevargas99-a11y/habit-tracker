"use client";

import { TrendingUp } from "lucide-react";
import { useFinanceStore } from "@/stores/finance-store";
import { formatMoney } from "@/lib/finance/format";

/** Stub — se completa en Fase 5 con CRUD + allocation pie + P&L + precios API. */
export default function InvestmentsView() {
  const { investments } = useFinanceStore();

  const totalValue = investments.reduce(
    (s, i) => s + i.quantity * (i.lastPrice ?? i.averageCost),
    0
  );
  const totalCost = investments.reduce((s, i) => s + i.quantity * i.averageCost, 0);
  const pnl = totalValue - totalCost;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-brand-dark to-brand-brown rounded-2xl p-6 text-brand-paper">
        <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
          Portafolio total
        </p>
        <div className="text-4xl font-display font-bold text-accent-glow">
          {formatMoney(totalValue, "USD")}
        </div>
        <div className="mt-2 text-sm text-brand-light-cream">
          Cost basis: {formatMoney(totalCost, "USD")} · P&L:{" "}
          <span className={pnl >= 0 ? "text-success" : "text-danger"}>
            {pnl >= 0 ? "+" : ""}{formatMoney(pnl, "USD")}
          </span>
        </div>
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <TrendingUp size={16} /> Holdings
        </h3>
        {investments.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-6">
            Sin inversiones registradas todavía.
          </p>
        ) : (
          <div className="space-y-2">
            {investments.map((inv) => {
              const value = inv.quantity * (inv.lastPrice ?? inv.averageCost);
              const cost = inv.quantity * inv.averageCost;
              const pnl = value - cost;
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between border border-brand-cream rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{inv.symbol}</p>
                    <p className="text-[11px] text-brand-warm">
                      {inv.name} · {inv.quantity} × {formatMoney(inv.averageCost, inv.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-dark">
                      {formatMoney(value, inv.currency)}
                    </p>
                    <p className={`text-[11px] font-semibold ${pnl >= 0 ? "text-success" : "text-danger"}`}>
                      {pnl >= 0 ? "+" : ""}{formatMoney(pnl, inv.currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-brand-cream/30 border border-brand-cream rounded-xl p-5 text-center text-sm text-brand-warm">
        <p className="font-semibold text-brand-medium mb-1">Fase 5 · próximamente</p>
        <p>Creación de inversiones · Allocation pie chart · Actualización manual de precios · (TODO futuro: precios en vivo via CoinGecko + stocks API)</p>
      </div>
    </div>
  );
}
