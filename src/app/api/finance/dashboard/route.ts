import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { convertWithRates, getLiveRates } from "@/lib/finance/currency";

// GET /api/finance/dashboard — todo lo que el Panel necesita en un solo hit.
//
// Multi-currency: toda agregación monetaria (net worth, cashflow,
// runway, categorías, heatmap) se convierte a la moneda primaria del
// user antes de sumarse. Las cuentas individuales mantienen su moneda
// original en `accounts[]` para que el UI las muestre como están.
export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);                                // YYYY-MM
    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const [profile, fx] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: { primaryCurrency: true },
      }),
      getLiveRates(),
    ]);
    const primary = profile?.primaryCurrency ?? "MXN";
    const convert = (amount: number, from: string, to: string) =>
      convertWithRates(amount, from, to, fx.rates);

    const today = now.toISOString().split("T")[0];
    const in7days = new Date(now);
    in7days.setDate(in7days.getDate() + 7);
    const in7daysStr = in7days.toISOString().split("T")[0];

    const [
      accounts,
      thisMonthTxns,
      lastMonthTxns,
      upcomingRecurrents,
      activeDebts,
      activeGoals,
      investments,
    ] = await Promise.all([
      prisma.financialAccount.findMany({
        where: { userId, archived: false },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: `${thisMonth}-01`, lte: `${thisMonth}-31` } },
        select: {
          date: true, amount: true, type: true, category: true, merchant: true,
          // Necesitamos la currency del account para convertir.
          account: { select: { currency: true } },
        },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: `${prevMonth}-01`, lte: `${prevMonth}-31` } },
        select: {
          amount: true, type: true, category: true,
          account: { select: { currency: true } },
        },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId, active: true, nextDate: { gte: today, lte: in7daysStr } },
        include: { account: { select: { currency: true } } },
        orderBy: { nextDate: "asc" },
      }),
      prisma.debt.findMany({ where: { userId, active: true } }),
      prisma.savingsGoal.findMany({ where: { userId, achieved: false }, orderBy: { priority: "desc" } }),
      prisma.investment.findMany({ where: { userId } }),
    ]);

    // Helper: monto en la moneda del account, convertido a primary.
    const txInPrimary = (t: { amount: number; account: { currency: string } | null }): number =>
      convert(t.amount, t.account?.currency ?? primary, primary);

    // ── Totales del mes (convertidos a primary) ─────────────────────
    const incomeMonth = thisMonthTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + txInPrimary(t), 0);
    const expenseMonth = thisMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + txInPrimary(t), 0);
    const savingsMonth = incomeMonth - expenseMonth;
    const savingsRate = incomeMonth > 0 ? (savingsMonth / incomeMonth) * 100 : 0;

    const incomePrev = lastMonthTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + txInPrimary(t), 0);
    const expensePrev = lastMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + txInPrimary(t), 0);

    // ── Net worth (convertido) ──────────────────────────────────────
    let assets = 0;
    let liabilities = 0;
    const currenciesPresent = new Set<string>();

    for (const a of accounts) {
      const cur = a.currency || primary;
      currenciesPresent.add(cur);
      const isLiab = a.type === "credit" || a.type === "loan";
      if (isLiab) {
        liabilities += convert(Math.max(0, a.balance), cur, primary);
      } else {
        assets += convert(a.balance, cur, primary);
      }
    }
    for (const inv of investments) {
      const cur = inv.currency || primary;
      currenciesPresent.add(cur);
      const val = inv.quantity * (inv.lastPrice ?? inv.averageCost);
      assets += convert(val, cur, primary);
    }
    for (const d of activeDebts) {
      // Schema de debts no tiene currency — asumimos primary.
      liabilities += d.balance;
    }
    const netWorth = assets - liabilities;
    const isMultiCurrency = currenciesPresent.size > 1;

    // ── Emergency fund runway (convertido) ───────────────────────────
    const avgMonthlyExpense = (expenseMonth + expensePrev) / 2 || 1;
    const savingsBalance = accounts
      .filter((a) => a.type === "savings")
      .reduce((s, a) => s + convert(a.balance, a.currency || primary, primary), 0);
    const runwayMonths = +(savingsBalance / avgMonthlyExpense).toFixed(1);

    // ── Top categorías del mes (convertidas) ────────────────────────
    const catMap = new Map<string, number>();
    for (const t of thisMonthTxns) {
      if (t.type !== "expense") continue;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + txInPrimary(t));
    }
    const prevCatMap = new Map<string, number>();
    for (const t of lastMonthTxns) {
      if (t.type !== "expense") continue;
      prevCatMap.set(t.category, (prevCatMap.get(t.category) ?? 0) + txInPrimary(t));
    }
    const topCategories = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, amount]) => {
        const prev = prevCatMap.get(category) ?? 0;
        const delta = prev > 0 ? ((amount - prev) / prev) * 100 : null;
        return {
          category,
          amount: +amount.toFixed(2),
          prevAmount: +prev.toFixed(2),
          deltaPercent: delta !== null ? +delta.toFixed(1) : null,
        };
      });

    // ── Heatmap de gasto últimos 90 días (convertido) ───────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const heatmapRows = await prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: cutoffStr } },
      select: { date: true, amount: true, account: { select: { currency: true } } },
    });
    const heatmap: Record<string, number> = {};
    for (const r of heatmapRows) {
      heatmap[r.date] = (heatmap[r.date] ?? 0) + txInPrimary(r);
    }

    return NextResponse.json({
      currency: primary,
      isMultiCurrency,
      fxLastUpdated: fx.fetchedAt,
      fxSource: fx.source,
      month: thisMonth,
      netWorth: {
        current: +netWorth.toFixed(2),
        assets: +assets.toFixed(2),
        liabilities: +liabilities.toFixed(2),
      },
      cashflow: {
        income: +incomeMonth.toFixed(2),
        expenses: +expenseMonth.toFixed(2),
        savings: +savingsMonth.toFixed(2),
        savingsRate: +savingsRate.toFixed(1),
        incomeDeltaPercent:
          incomePrev > 0 ? +(((incomeMonth - incomePrev) / incomePrev) * 100).toFixed(1) : null,
        expensesDeltaPercent:
          expensePrev > 0 ? +(((expenseMonth - expensePrev) / expensePrev) * 100).toFixed(1) : null,
      },
      runway: {
        months: runwayMonths,
        savingsBalance: +savingsBalance.toFixed(2),
        avgMonthlyExpense: +avgMonthlyExpense.toFixed(2),
        target: 3, // meses recomendados de emergency fund
      },
      topCategories,
      upcoming: upcomingRecurrents.map((r) => ({
        id: r.id,
        name: r.name,
        // Mantenemos el monto en la moneda original del account; el UI lo
        // convierte sólo si lo necesita. Así el user ve "$50" o "S/ 200"
        // tal cual viene de la cuenta.
        amount: r.amount,
        currency: r.account?.currency ?? primary,
        amountInPrimary: +convert(r.amount, r.account?.currency ?? primary, primary).toFixed(2),
        nextDate: r.nextDate,
        type: r.type,
        category: r.category,
      })),
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        balance: +a.balance.toFixed(2),
        balanceInPrimary: +convert(a.balance, a.currency || primary, primary).toFixed(2),
        icon: a.icon,
        color: a.color,
      })),
      goals: activeGoals.slice(0, 4).map((g) => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        target: g.targetAmount,
        current: g.currentAmount,
        targetDate: g.targetDate,
        priority: g.priority,
      })),
      heatmap,
    });
  });
}
