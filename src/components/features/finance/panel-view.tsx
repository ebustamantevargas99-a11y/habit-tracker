"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Shield, Calendar, AlertTriangle,
  CheckCircle2, Info, Sparkles, Plus, Wallet,
} from "lucide-react";
import { cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatMoney, formatCompact } from "@/lib/finance/format";
import QuickAddBar from "./quick-add-bar";
import RecentTransactions from "./recent-transactions";
import AIExportButton from "@/components/features/ai-export/ai-export-button";

type DashboardData = {
  currency: string;
  isMultiCurrency: boolean;
  fxLastUpdated: string;
  fxSource: "live" | "static";
  month: string;
  netWorth: { current: number; assets: number; liabilities: number };
  cashflow: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    incomeDeltaPercent: number | null;
    expensesDeltaPercent: number | null;
  };
  runway: { months: number; savingsBalance: number; avgMonthlyExpense: number; target: number };
  topCategories: Array<{ category: string; amount: number; prevAmount: number; deltaPercent: number | null }>;
  upcoming: Array<{ id: string; name: string; amount: number; currency?: string; amountInPrimary?: number; nextDate: string; type: string; category: string }>;
  accounts: Array<{ id: string; name: string; type: string; currency: string; balance: number; balanceInPrimary?: number; icon: string | null; color: string | null }>;
  goals: Array<{ id: string; name: string; emoji: string | null; target: number; current: number; targetDate: string | null; priority: string | null }>;
  heatmap: Record<string, number>;
};

type NetWorthData = {
  current: { assets: number; liabilities: number; netWorth: number };
  timeline: Array<{ date: string; assets: number; liabilities: number; netWorth: number }>;
};

type Insight = {
  id: string;
  severity: "info" | "warning" | "success" | "critical";
  icon: string;
  title: string;
  description: string;
};

export default function PanelView({
  onManageAccounts,
}: {
  onManageAccounts: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  // Bumpeamos cada vez que se agrega una tx para que RecentTransactions
  // re-fetch del store sin necesidad de prop drilling de listeners.
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    const [dash, nw, ins] = await Promise.all([
      api.get<DashboardData>("/finance/dashboard"),
      api.get<NetWorthData>("/finance/net-worth?months=12"),
      api.get<{ insights: Insight[] }>("/finance/insights").catch(() => ({ insights: [] })),
    ]);
    setData(dash);
    setNetWorth(nw);
    setInsights(ins.insights ?? []);
    setTxRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!data) {
    return <div className="text-center py-16 text-brand-warm animate-pulse">Cargando…</div>;
  }

  if (data.accounts.length === 0) {
    return (
      <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-12 text-center">
        <Wallet size={32} className="mx-auto text-brand-warm mb-3" />
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
          Empieza creando tu primera cuenta
        </h3>
        <p className="text-sm text-brand-warm mb-4">
          Puede ser débito, crédito, ahorro, crypto, efectivo o inversión.
        </p>
        <button
          onClick={onManageAccounts}
          className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown inline-flex items-center gap-2"
        >
          <Plus size={14} /> Crear cuenta
        </button>
      </div>
    );
  }

  const {
    currency, isMultiCurrency, netWorth: nw, cashflow, runway, topCategories, upcoming, accounts, goals, heatmap,
  } = data;

  // Conjunto único de monedas presentes — para el disclaimer.
  const distinctCurrencies = Array.from(
    new Set(accounts.map((a) => a.currency).filter(Boolean)),
  );

  return (
    <div className="space-y-5">
      {/* Hero: Net Worth + chart 12m */}
      <div className="bg-gradient-hero-accent rounded-2xl p-6 text-brand-paper">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
              Patrimonio neto · {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
            </p>
            <div className="text-5xl font-display font-bold text-accent-glow leading-none">
              {formatMoney(nw.current, currency)}
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-brand-light-cream">
              <span>Activos: <b className="text-accent-glow">{formatMoney(nw.assets, currency)}</b></span>
              <span className="text-brand-light-tan">·</span>
              <span>Pasivos: <b className="text-danger">{formatMoney(nw.liabilities, currency)}</b></span>
            </div>
            {isMultiCurrency && (
              <p
                className="text-[11px] mt-2 text-brand-light-cream/80 italic"
                title={
                  data.fxSource === "live"
                    ? `Tasas en vivo desde open.er-api.com · actualizadas ${data.fxLastUpdated}`
                    : `Tasas estáticas (la API en vivo falló o aún no respondió) · ${data.fxLastUpdated}`
                }
              >
                Convertido a {currency} desde {distinctCurrencies.join(", ")} ·{" "}
                {data.fxSource === "live"
                  ? `tasa del ${data.fxLastUpdated}`
                  : "tasa aprox."}
              </p>
            )}
          </div>
          {netWorth && netWorth.timeline.length >= 2 && (
            <div className="shrink-0 w-56 h-24">
              <ResponsiveContainer>
                <AreaChart data={netWorth.timeline}>
                  <defs>
                    <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F0D78C" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#F0D78C" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFDF9",
                      border: "1px solid #EDE0D4",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    labelFormatter={(v: string) => v}
                    formatter={(v: number) => [formatMoney(v, currency), "Patrimonio neto"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#F0D78C"
                    strokeWidth={2}
                    fill="url(#nwGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* KPIs: Income / Expenses / Savings Rate / Runway */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Ingresos del mes"
          value={formatMoney(cashflow.income, currency)}
          delta={cashflow.incomeDeltaPercent}
          color="text-success"
        />
        <KpiCard
          icon={<TrendingDown size={16} />}
          label="Gastos del mes"
          value={formatMoney(cashflow.expenses, currency)}
          delta={cashflow.expensesDeltaPercent}
          color="text-danger"
          deltaInverted
        />
        <KpiCard
          icon={<Sparkles size={16} />}
          label="Tasa de ahorro"
          value={`${cashflow.savingsRate.toFixed(0)}%`}
          sub={`${formatMoney(cashflow.savings, currency)} ahorrados`}
          color={cashflow.savingsRate >= 20 ? "text-success" : cashflow.savingsRate >= 10 ? "text-warning" : "text-danger"}
        />
        <KpiCard
          icon={<Shield size={16} />}
          label="Fondo de emergencia"
          value={`${runway.months.toFixed(1)}m`}
          sub={`${formatMoney(runway.savingsBalance, currency)} / meta ${runway.target}m`}
          color={runway.months >= runway.target ? "text-success" : runway.months >= 1 ? "text-warning" : "text-danger"}
        />
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-brand-warm font-semibold">
            Alertas y descubrimientos
          </p>
          <div className="space-y-1.5">
            {insights.slice(0, 5).map((i) => (
              <InsightRow key={i.id} insight={i} />
            ))}
          </div>
        </div>
      )}

      {/* Quick-add */}
      <QuickAddBar onAdded={refresh} />

      {/* Últimas transacciones — agregar / editar / borrar */}
      <RecentTransactions limit={8} refreshKey={txRefreshKey} />

      {/* Grid: Cuentas + Upcoming + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cuentas */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-base font-semibold text-brand-dark">Tus cuentas</h3>
            <button
              onClick={onManageAccounts}
              className="text-xs text-accent hover:text-brand-brown"
            >
              Administrar →
            </button>
          </div>
          <div className="space-y-2">
            {accounts.slice(0, 6).map((a) => {
              const isLiab = a.type === "credit" || a.type === "loan";
              return (
                <div key={a.id} className="flex items-center gap-2.5 py-1.5">
                  <span className="text-lg">{a.icon ?? "💳"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-dark truncate font-medium">{a.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-brand-warm">{a.type}</p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold font-mono",
                      isLiab ? "text-danger" : a.balance >= 0 ? "text-brand-dark" : "text-warning"
                    )}
                  >
                    {formatMoney(a.balance, a.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-serif text-base font-semibold text-brand-dark mb-3 flex items-center gap-2">
            <Calendar size={14} /> Próximos 7 días
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-brand-warm italic text-center py-4">
              Sin cargos pendientes.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((u) => {
                const isIncome = u.type === "income";
                const dateObj = new Date(u.nextDate + "T00:00:00");
                const daysUntil = Math.ceil(
                  (dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={u.id} className="flex items-center gap-2 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{u.name}</p>
                      <p className="text-[11px] text-brand-warm">
                        {daysUntil <= 0
                          ? "Hoy"
                          : daysUntil === 1
                          ? "Mañana"
                          : `En ${daysUntil} días`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isIncome ? "text-success" : "text-danger"
                      )}
                    >
                      {isIncome ? "+" : "−"}
                      {formatMoney(u.amount, u.currency ?? currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top categories */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
            Top categorías del mes
          </h3>
          {topCategories.length === 0 ? (
            <p className="text-xs text-brand-warm italic text-center py-4">
              Sin gastos registrados.
            </p>
          ) : (
            <div className="space-y-2">
              {topCategories.slice(0, 5).map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="font-medium text-brand-dark">{c.category}</span>
                    <span className="font-mono">
                      {formatMoney(c.amount, currency)}
                      {c.deltaPercent !== null && c.deltaPercent !== 0 && (
                        <span
                          className={cn(
                            "ml-1.5 text-[10px]",
                            c.deltaPercent > 20
                              ? "text-danger"
                              : c.deltaPercent < -10
                              ? "text-success"
                              : "text-brand-warm"
                          )}
                        >
                          {c.deltaPercent > 0 ? "+" : ""}
                          {c.deltaPercent.toFixed(0)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{
                        width: `${Math.min(100, (c.amount / topCategories[0].amount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
            Tus metas activas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
              return (
                <div key={g.id} className="border border-brand-cream rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{g.emoji ?? "🎯"}</span>
                    <span className="text-sm font-semibold text-brand-dark truncate">{g.name}</span>
                  </div>
                  <div className="text-xs text-brand-warm mb-1">
                    {formatCompact(g.current)} / {formatCompact(g.target)}
                  </div>
                  <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-brand-tan mt-1">
                    {Math.round(pct)}% · {g.priority ?? "normal"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap 90 días */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Mapa de calor de gasto · últimos 90 días
        </h3>
        <HeatMap heatmap={heatmap} currency={currency} />
      </div>

      {/* AI export */}
      <div className="flex justify-end">
        <AIExportButton scope="finance" label="Analizar con IA" variant="outline" size="sm" />
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  delta,
  color,
  deltaInverted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  color?: string;
  deltaInverted?: boolean;
}) {
  let deltaColor = "text-brand-warm";
  if (delta !== null && delta !== undefined) {
    const good = deltaInverted ? delta < 0 : delta > 0;
    deltaColor = good ? "text-success" : delta === 0 ? "text-brand-warm" : "text-danger";
  }
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-3">
      <div className={cn("flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold", color)}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn("text-xl font-bold leading-none mt-1.5", color)}>{value}</div>
      {delta !== null && delta !== undefined && (
        <div className={cn("text-[11px] mt-1 font-semibold", deltaColor)}>
          {delta > 0 ? "↑" : delta < 0 ? "↓" : "·"} {Math.abs(delta).toFixed(1)}% vs mes anterior
        </div>
      )}
      {sub && <div className="text-[11px] text-brand-warm mt-0.5">{sub}</div>}
    </div>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const ICON_BY_SEVERITY = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    critical: AlertTriangle,
  };
  const COLOR_BY_SEVERITY = {
    info:     "bg-info/10 border-info/30 text-info",
    warning:  "bg-warning/10 border-warning/30 text-warning",
    success:  "bg-success/10 border-success/30 text-success",
    critical: "bg-danger/10 border-danger/40 text-danger",
  };
  const Icon = ICON_BY_SEVERITY[insight.severity];
  return (
    <div
      className={cn(
        "border rounded-lg p-2.5 flex items-start gap-2.5",
        COLOR_BY_SEVERITY[insight.severity]
      )}
    >
      <span className="text-base shrink-0 leading-none mt-0.5">{insight.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{insight.title}</p>
        <p className="text-xs opacity-90 mt-0.5">{insight.description}</p>
      </div>
      <Icon size={14} className="shrink-0 mt-0.5 opacity-60" />
    </div>
  );
}

function HeatMap({ heatmap, currency }: { heatmap: Record<string, number>; currency: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: Array<{ date: string; amount: number }> = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const s = d.toISOString().split("T")[0];
    cells.push({ date: s, amount: heatmap[s] ?? 0 });
  }
  const max = Math.max(1, ...Object.values(heatmap));
  const firstDow = new Date(cells[0].date + "T00:00:00").getDay();
  const leadingEmpty = (firstDow + 6) % 7;

  function bg(amount: number): string {
    if (amount === 0) return "bg-brand-cream";
    const pct = amount / max;
    if (pct < 0.25) return "bg-accent-glow/40";
    if (pct < 0.5) return "bg-accent-glow";
    if (pct < 0.75) return "bg-accent-light";
    return "bg-accent";
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-flow-col grid-rows-7 gap-[2px]">
        {Array.from({ length: leadingEmpty }).map((_, i) => (
          <div key={`e-${i}`} className="w-3 h-3" />
        ))}
        {cells.map((c) => (
          <div
            key={c.date}
            className={cn("w-3 h-3 rounded-[2px] hover:ring-1 hover:ring-accent cursor-default", bg(c.amount))}
            title={`${c.date}: ${formatMoney(c.amount, currency)}`}
          />
        ))}
      </div>
    </div>
  );
}
