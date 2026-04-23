"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Flame, Calculator, Beaker, Sparkles, AlertTriangle, Check,
} from "lucide-react";
import { cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useFinanceStore } from "@/stores/finance-store";
import { formatMoney, formatCompact } from "@/lib/finance/format";
import { calculateFIRE, checkAffordability } from "@/lib/finance/calculations";
import AIExportButton from "@/components/features/ai-export/ai-export-button";

export default function AnalysisView() {
  const { transactions, accounts, investments, debts } = useFinanceStore();
  const primaryCurrency = accounts[0]?.currency ?? "MXN";

  // ── Cashflow 12 meses ─────────────────────────────────────────────
  const cashflow = useMemo(() => {
    const byMonth = new Map<string, { income: number; expense: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toISOString().slice(0, 7);
      byMonth.set(m, { income: 0, expense: 0 });
    }
    for (const t of transactions) {
      const m = t.date.slice(0, 7);
      if (!byMonth.has(m)) continue;
      const e = byMonth.get(m)!;
      if (t.type === "income") e.income += t.amount;
      else if (t.type === "expense") e.expense += t.amount;
    }
    return Array.from(byMonth.entries()).map(([month, d]) => ({
      month: month.slice(5),
      income: Math.round(d.income),
      expense: Math.round(d.expense),
      savings: Math.round(d.income - d.expense),
      savingsRate: d.income > 0 ? Math.round(((d.income - d.expense) / d.income) * 100) : 0,
    }));
  }, [transactions]);

  // ── Category growth YoY ───────────────────────────────────────────
  const categoryGrowth = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 7);

    const thisTotal = new Map<string, number>();
    const prevTotal = new Map<string, number>();

    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const m = t.date.slice(0, 7);
      if (m === thisMonth) {
        thisTotal.set(t.category, (thisTotal.get(t.category) ?? 0) + t.amount);
      } else if (m >= sixMonthsAgoStr && m < thisMonth) {
        prevTotal.set(t.category, (prevTotal.get(t.category) ?? 0) + t.amount);
      }
    }

    const categorySet = new Set<string>();
    thisTotal.forEach((_, k) => categorySet.add(k));
    prevTotal.forEach((_, k) => categorySet.add(k));
    const categories = Array.from(categorySet);
    return categories
      .map((c) => {
        const now = thisTotal.get(c) ?? 0;
        const prevSum = prevTotal.get(c) ?? 0;
        const prevAvg = prevSum / 6;
        const delta = prevAvg > 0 ? ((now - prevAvg) / prevAvg) * 100 : 0;
        return { category: c, now, prevAvg, delta };
      })
      .filter((c) => c.now > 0)
      .sort((a, b) => b.now - a.now);
  }, [transactions]);

  // ── Savings rate trendline ─────────────────────────────────────────
  const savingsRateTrend = useMemo(() => cashflow.map((c) => ({
    month: c.month, rate: c.savingsRate,
  })), [cashflow]);

  // ── FIRE calc ─────────────────────────────────────────────────────
  const [currentAge, setCurrentAge] = useState<number>(30);
  const fire = useMemo(() => {
    const recent = cashflow.slice(-3);
    const avgExpense = recent.length > 0 ? recent.reduce((s, c) => s + c.expense, 0) / recent.length : 0;
    const avgSavings = recent.length > 0 ? recent.reduce((s, c) => s + c.savings, 0) / recent.length : 0;
    const currentInvestments = investments.reduce(
      (s, i) => s + i.quantity * (i.lastPrice ?? i.averageCost),
      0
    );
    return calculateFIRE(avgExpense, avgSavings, currentInvestments, currentAge);
  }, [cashflow, investments, currentAge]);

  // ── Affordability checker ─────────────────────────────────────────
  const [affPrice, setAffPrice] = useState<string>("");
  const affordability = useMemo(() => {
    const price = parseFloat(affPrice);
    if (!price || price <= 0) return null;
    const liquidAccounts = accounts.filter((a) => a.type !== "credit" && a.type !== "loan");
    const currentLiquid = liquidAccounts.reduce((s, a) => s + a.balance, 0);
    const recent = cashflow.slice(-3);
    const avgExpense = recent.length > 0 ? recent.reduce((s, c) => s + c.expense, 0) / recent.length : 0;
    const avgSavings = recent.length > 0 ? recent.reduce((s, c) => s + c.savings, 0) / recent.length : 0;
    const avgIncome = recent.length > 0 ? recent.reduce((s, c) => s + c.income, 0) / recent.length : 0;
    return checkAffordability(price, currentLiquid, avgExpense, avgSavings, avgIncome);
  }, [affPrice, accounts, cashflow]);

  // ── What-if simulator ────────────────────────────────────────────
  const [whatIfIncomeDelta, setWhatIfIncomeDelta] = useState<number>(0);
  const [whatIfExpenseDelta, setWhatIfExpenseDelta] = useState<number>(0);
  const whatIfResult = useMemo(() => {
    const recent = cashflow.slice(-3);
    if (recent.length === 0) return null;
    const avgIncome = recent.reduce((s, c) => s + c.income, 0) / recent.length;
    const avgExpense = recent.reduce((s, c) => s + c.expense, 0) / recent.length;
    const newIncome = avgIncome + whatIfIncomeDelta;
    const newExpense = Math.max(0, avgExpense + whatIfExpenseDelta);
    const newSavings = newIncome - newExpense;
    const newRate = newIncome > 0 ? (newSavings / newIncome) * 100 : 0;
    const originalRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;
    return {
      original: { income: avgIncome, expense: avgExpense, savings: avgIncome - avgExpense, rate: originalRate },
      adjusted: { income: newIncome, expense: newExpense, savings: newSavings, rate: newRate },
    };
  }, [cashflow, whatIfIncomeDelta, whatIfExpenseDelta]);

  const PIE_COLORS = ["#B8860B", "#D4A843", "#7A9E3E", "#5A8FA8", "#C0544F", "#D4943A", "#6B4226", "#8B6542"];

  if (transactions.length === 0) {
    return (
      <div className="bg-brand-paper border border-dashed border-brand-cream rounded-xl p-16 text-center">
        <TrendingUp size={32} className="mx-auto text-brand-warm mb-3" />
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
          Sin transacciones aún
        </h3>
        <p className="text-sm text-brand-warm">
          Registra algunas transacciones en el tab "Flujo" para desbloquear el análisis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cashflow 12 meses */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-display text-base font-bold text-brand-dark mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" /> Flujo de efectivo · últimos 12 meses
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cashflow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#A0845C" }} />
            <YAxis tick={{ fontSize: 10, fill: "#A0845C" }} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip
              contentStyle={{ background: "#FFFDF9", border: "1px solid #EDE0D4", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => formatMoney(v, primaryCurrency)}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" fill="#7A9E3E" name="Ingresos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#C0544F" name="Gastos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" fill="#B8860B" name="Ahorro" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Savings rate trendline */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-display text-base font-bold text-brand-dark mb-3 flex items-center gap-2">
            <Flame size={16} className="text-accent" /> Tasa de ahorro · tendencia
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={savingsRateTrend}>
              <defs>
                <linearGradient id="srGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B8860B" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#B8860B" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE0D4" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#A0845C" }} />
              <YAxis tick={{ fontSize: 10, fill: "#A0845C" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#FFFDF9", border: "1px solid #EDE0D4", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v}%`, "Tasa"]} />
              <Area type="monotone" dataKey="rate" stroke="#B8860B" strokeWidth={2} fill="url(#srGradient)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-brand-warm mt-2">
            20%+ recomendado · 30%+ te acelera al FIRE · 50%+ eres un máquina
          </p>
        </div>

        {/* Category growth */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-display text-base font-bold text-brand-dark mb-3">
            Categorías · mes actual vs promedio 6m
          </h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto">
            {categoryGrowth.slice(0, 8).map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="font-medium text-brand-dark truncate">{c.category}</span>
                  <span className="font-mono">
                    {formatMoney(c.now, primaryCurrency)}
                    {c.prevAvg > 0 && (
                      <span className={cn(
                        "ml-1.5 text-[10px] font-bold",
                        c.delta > 30 ? "text-danger" :
                        c.delta > 10 ? "text-warning" :
                        c.delta < -10 ? "text-success" : "text-brand-warm"
                      )}>
                        {c.delta > 0 ? "+" : ""}{c.delta.toFixed(0)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.min(100, (c.now / categoryGrowth[0].now) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution Pie */}
      {categoryGrowth.length > 0 && (
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-display text-base font-bold text-brand-dark mb-3">
            Distribución de gasto del mes
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryGrowth.slice(0, 8)}
                dataKey="now"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                label={(entry) => entry.category}
                labelLine={false}
              >
                {categoryGrowth.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatMoney(v, primaryCurrency)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* FIRE Calculator */}
      <div className="bg-gradient-to-br from-brand-dark to-brand-brown text-brand-paper rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-bold text-accent-glow flex items-center gap-2">
              🔥 Calculadora FIRE
            </h3>
            <p className="text-xs text-brand-light-tan">
              Independencia financiera, jubilación anticipada · regla del 4%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-brand-light-tan">Tu edad</label>
            <input
              type="number"
              min="18"
              max="99"
              value={currentAge}
              onChange={(e) => setCurrentAge(parseInt(e.target.value) || 30)}
              className="w-16 px-2 py-1 rounded bg-white/10 text-brand-paper text-sm font-mono text-center focus:outline-none focus:bg-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest text-brand-light-tan mb-1">
              Tu meta FIRE
            </p>
            <p className="text-2xl font-bold text-accent-glow">
              {formatCompact(fire.fireNumber)}
            </p>
            <p className="text-[10px] text-brand-light-cream mt-1">
              {formatMoney(fire.fireNumber, primaryCurrency)}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest text-brand-light-tan mb-1">
              Años hasta FIRE
            </p>
            <p className="text-2xl font-bold text-accent-glow">
              {fire.yearsToFIRE !== null ? fire.yearsToFIRE : "∞"}
            </p>
            {fire.ageAtFIRE !== null && (
              <p className="text-[10px] text-brand-light-cream mt-1">
                A los {fire.ageAtFIRE} años
              </p>
            )}
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest text-brand-light-tan mb-1">
              Coast FIRE
            </p>
            <p className="text-2xl font-bold text-accent-glow">
              {fire.yearsToCoastFIRE !== null ? `${Math.round(fire.yearsToCoastFIRE)}` : "—"}
            </p>
            <p className="text-[10px] text-brand-light-cream mt-1">
              Años sin aportar
            </p>
          </div>
        </div>

        <p className="text-[11px] text-brand-light-tan mt-3 italic">
          💡 FIRE asume 7% de rendimiento real anual (ajustado por inflación). Ajusta tu edad arriba.
        </p>
      </div>

      {/* Affordability + What-if side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Affordability */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-display text-base font-bold text-brand-dark mb-3 flex items-center gap-2">
            <Calculator size={16} className="text-accent" /> ¿Puedes permitirte X?
          </h3>
          <input
            type="number"
            step="100"
            value={affPrice}
            onChange={(e) => setAffPrice(e.target.value)}
            placeholder="Precio de lo que quieres comprar"
            className="w-full px-3 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-base font-mono focus:outline-none focus:border-accent mb-3"
          />
          {affordability && (
            <div className="space-y-3">
              <div className={cn(
                "rounded-lg p-3 border",
                affordability.canAffordCash
                  ? "bg-success/10 border-success/30"
                  : "bg-danger/10 border-danger/30"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {affordability.canAffordCash ? <Check size={14} className="text-success" /> : <AlertTriangle size={14} className="text-danger" />}
                  <span className={cn(
                    "text-sm font-bold",
                    affordability.canAffordCash ? "text-success" : "text-danger"
                  )}>
                    {affordability.canAffordCash ? "Puedes al contado" : "Destruye tu emergency fund"}
                  </span>
                </div>
                <p className="text-xs text-brand-medium">
                  Balance nuevo: <b>{formatMoney(affordability.newBalance, primaryCurrency)}</b> · Runway:{" "}
                  <b>{affordability.newRunwayMonths.toFixed(1)}m</b>
                </p>
              </div>

              {affordability.monthsToSaveFor !== null && (
                <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-cream text-xs text-brand-medium">
                  <p className="mb-1">
                    💰 <b>Opción ahorrar:</b> Tardas <b>{Math.ceil(affordability.monthsToSaveFor)} meses</b> a tu ritmo actual.
                  </p>
                </div>
              )}

              <div className="bg-brand-warm-white rounded-lg p-3 border border-brand-cream">
                <p className="text-xs text-brand-medium font-semibold mb-2">
                  💳 Opción financiar:
                </p>
                <div className="space-y-1 text-xs">
                  {[6, 12, 18, 24].map((m) => {
                    const installment = affordability.monthlyInstallment(m);
                    const newRate = affordability.savingsRateImpact(m);
                    return (
                      <div key={m} className="flex items-center justify-between">
                        <span className="text-brand-warm">{m} meses:</span>
                        <span className="font-mono">
                          {formatMoney(installment, primaryCurrency)}/mes ·{" "}
                          <span className={cn(
                            "font-bold",
                            newRate < 0 ? "text-danger" : newRate < 10 ? "text-warning" : "text-success"
                          )}>
                            Tasa {newRate.toFixed(0)}%
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What-if simulator */}
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-display text-base font-bold text-brand-dark mb-3 flex items-center gap-2">
            <Beaker size={16} className="text-accent" /> Simulador "¿Qué pasa si…?"
          </h3>
          {whatIfResult && (
            <>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                    Ingreso +/− {formatMoney(whatIfIncomeDelta, primaryCurrency)}
                  </label>
                  <input
                    type="range"
                    min={-(whatIfResult.original.income * 0.5) || -5000}
                    max={whatIfResult.original.income * 0.5 || 5000}
                    step="100"
                    value={whatIfIncomeDelta}
                    onChange={(e) => setWhatIfIncomeDelta(parseFloat(e.target.value))}
                    className="w-full accent-success"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1 block">
                    Gasto +/− {formatMoney(whatIfExpenseDelta, primaryCurrency)}
                  </label>
                  <input
                    type="range"
                    min={-(whatIfResult.original.expense * 0.5) || -5000}
                    max={whatIfResult.original.expense * 0.5 || 5000}
                    step="100"
                    value={whatIfExpenseDelta}
                    onChange={(e) => setWhatIfExpenseDelta(parseFloat(e.target.value))}
                    className="w-full accent-danger"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-brand-warm-white rounded-lg p-2 border border-brand-cream">
                  <p className="text-[10px] uppercase text-brand-warm">Actual</p>
                  <p className="font-bold text-brand-dark">
                    Ahorro: {formatMoney(whatIfResult.original.savings, primaryCurrency)}
                  </p>
                  <p className="text-brand-medium">Tasa: {whatIfResult.original.rate.toFixed(0)}%</p>
                </div>
                <div className="bg-accent/10 rounded-lg p-2 border border-accent/30">
                  <p className="text-[10px] uppercase text-accent">Simulado</p>
                  <p className="font-bold text-accent">
                    Ahorro: {formatMoney(whatIfResult.adjusted.savings, primaryCurrency)}
                  </p>
                  <p className={cn(
                    "font-bold",
                    whatIfResult.adjusted.rate >= whatIfResult.original.rate ? "text-success" : "text-danger"
                  )}>
                    Tasa: {whatIfResult.adjusted.rate.toFixed(0)}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setWhatIfIncomeDelta(0);
                  setWhatIfExpenseDelta(0);
                }}
                className="mt-3 text-[11px] text-brand-warm hover:text-accent"
              >
                Reiniciar
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI export */}
      <div className="bg-gradient-to-br from-accent/10 to-accent-light/10 border border-accent/30 rounded-xl p-5 flex items-center gap-4">
        <Sparkles size={28} className="text-accent shrink-0" />
        <div className="flex-1">
          <p className="font-display text-base font-semibold text-brand-dark">
            Análisis profundo con IA
          </p>
          <p className="text-xs text-brand-warm">
            Exporta toda tu data financiera a Claude/ChatGPT/Gemini para análisis tipo asesor.
          </p>
        </div>
        <AIExportButton scope="finance" label="Exportar" variant="primary" size="md" />
      </div>
    </div>
  );
}
