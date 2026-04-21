import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/finance/dashboard — todo lo que el Panel necesita en un solo hit.
export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);                                // YYYY-MM
    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { primaryCurrency: true },
    });

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
        select: { date: true, amount: true, type: true, category: true, merchant: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: `${prevMonth}-01`, lte: `${prevMonth}-31` } },
        select: { amount: true, type: true, category: true },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId, active: true, nextDate: { gte: today, lte: in7daysStr } },
        orderBy: { nextDate: "asc" },
      }),
      prisma.debt.findMany({ where: { userId, active: true } }),
      prisma.savingsGoal.findMany({ where: { userId, achieved: false }, orderBy: { priority: "desc" } }),
      prisma.investment.findMany({ where: { userId } }),
    ]);

    // ── Totales del mes ─────────────────────────────────────────────
    const incomeMonth = thisMonthTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expenseMonth = thisMonthTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const savingsMonth = incomeMonth - expenseMonth;
    const savingsRate = incomeMonth > 0 ? (savingsMonth / incomeMonth) * 100 : 0;

    const incomePrev = lastMonthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expensePrev = lastMonthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // ── Net worth (usando mismos campos que /net-worth pero resumido) ─
    let assets = 0;
    let liabilities = 0;
    for (const a of accounts) {
      const isLiab = a.type === "credit" || a.type === "loan";
      if (isLiab) liabilities += Math.max(0, a.balance);
      else assets += a.balance;
    }
    for (const inv of investments) {
      assets += inv.quantity * (inv.lastPrice ?? inv.averageCost);
    }
    for (const d of activeDebts) {
      liabilities += d.balance;
    }
    const netWorth = assets - liabilities;

    // ── Emergency fund runway ────────────────────────────────────────
    const avgMonthlyExpense = (expenseMonth + expensePrev) / 2 || 1;
    const savingsBalance = accounts
      .filter((a) => a.type === "savings")
      .reduce((s, a) => s + a.balance, 0);
    const runwayMonths = +(savingsBalance / avgMonthlyExpense).toFixed(1);

    // ── Top categorías del mes ──────────────────────────────────────
    const catMap = new Map<string, number>();
    for (const t of thisMonthTxns) {
      if (t.type !== "expense") continue;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
    }
    const prevCatMap = new Map<string, number>();
    for (const t of lastMonthTxns) {
      if (t.type !== "expense") continue;
      prevCatMap.set(t.category, (prevCatMap.get(t.category) ?? 0) + t.amount);
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

    // ── Heatmap de gasto últimos 90 días ─────────────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const heatmapRows = await prisma.transaction.findMany({
      where: { userId, type: "expense", date: { gte: cutoffStr } },
      select: { date: true, amount: true },
    });
    const heatmap: Record<string, number> = {};
    for (const r of heatmapRows) {
      heatmap[r.date] = (heatmap[r.date] ?? 0) + r.amount;
    }

    return NextResponse.json({
      currency: profile?.primaryCurrency ?? "MXN",
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
        amount: r.amount,
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
