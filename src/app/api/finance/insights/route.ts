import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type Insight = {
  id: string;
  severity: "info" | "warning" | "success" | "critical";
  icon: string;
  title: string;
  description: string;
  action?: string;
  meta?: Record<string, unknown>;
};

// GET /api/finance/insights — detecta patrones automáticos
export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const insights: Insight[] = [];

    // Últimos 6 meses de transacciones
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.toISOString().split("T")[0];

    const [txns, accounts, budgets, recurring, goals, debts] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: cutoff } },
        select: { date: true, amount: true, type: true, category: true, merchant: true },
      }),
      prisma.financialAccount.findMany({ where: { userId, archived: false } }),
      prisma.budget.findMany({ where: { userId, month: thisMonth } }),
      prisma.recurringTransaction.findMany({
        where: { userId, active: true },
        select: { name: true, amount: true, frequency: true, type: true },
      }),
      prisma.savingsGoal.findMany({ where: { userId, achieved: false } }),
      prisma.debt.findMany({ where: { userId, active: true } }),
    ]);

    // ── 1. Categoría inflada vs promedio ─────────────────────────────
    const catMonthly: Record<string, number[]> = {};
    for (const t of txns) {
      if (t.type !== "expense") continue;
      const m = t.date.slice(0, 7);
      if (!catMonthly[t.category]) catMonthly[t.category] = [];
      const monthIdx = Math.max(
        0,
        (new Date(now).getMonth() - new Date(m + "-01").getMonth() + 12) % 12
      );
      catMonthly[t.category][monthIdx] = (catMonthly[t.category][monthIdx] ?? 0) + t.amount;
    }
    for (const [category, monthAmounts] of Object.entries(catMonthly)) {
      const thisMonthAmount = monthAmounts[0] ?? 0;
      const prev = monthAmounts.slice(1, 6).filter((n) => n !== undefined);
      if (prev.length < 2 || thisMonthAmount === 0) continue;
      const avg = prev.reduce((s, n) => s + n, 0) / prev.length;
      if (avg === 0) continue;
      const delta = (thisMonthAmount - avg) / avg;
      if (delta > 0.4 && thisMonthAmount > 100) {
        insights.push({
          id: `cat-inflation-${category}`,
          severity: "warning",
          icon: "📈",
          title: `Gastas ${Math.round(delta * 100)}% más en "${category}"`,
          description: `Este mes llevas $${Math.round(thisMonthAmount).toLocaleString()}, promedio anterior: $${Math.round(avg).toLocaleString()}.`,
          meta: { category, thisMonth: thisMonthAmount, avg },
        });
      }
    }

    // ── 2. Budget superado ────────────────────────────────────────────
    const monthExpensesByCategory = new Map<string, number>();
    for (const t of txns.filter((x) => x.type === "expense" && x.date.startsWith(thisMonth))) {
      monthExpensesByCategory.set(
        t.category,
        (monthExpensesByCategory.get(t.category) ?? 0) + t.amount
      );
    }
    for (const b of budgets) {
      const spent = monthExpensesByCategory.get(b.category) ?? 0;
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      if (pct >= 100) {
        insights.push({
          id: `budget-over-${b.id}`,
          severity: "critical",
          icon: "🚨",
          title: `Superaste el budget de "${b.category}"`,
          description: `$${Math.round(spent).toLocaleString()} / $${Math.round(b.limit).toLocaleString()} (${Math.round(pct)}%).`,
        });
      } else if (pct >= 80) {
        // Días que faltan del mes
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysLeft = daysInMonth - now.getDate();
        insights.push({
          id: `budget-warn-${b.id}`,
          severity: "warning",
          icon: "⚠️",
          title: `Budget "${b.category}" al ${Math.round(pct)}%`,
          description: `Ya gastaste $${Math.round(spent).toLocaleString()} de $${Math.round(b.limit).toLocaleString()}. Quedan ${daysLeft} días del mes.`,
        });
      }
    }

    // ── 3. Merchant inflado ──────────────────────────────────────────
    const merchantMonthly: Record<string, number[]> = {};
    for (const t of txns) {
      if (t.type !== "expense" || !t.merchant) continue;
      const m = t.date.slice(0, 7);
      const idx = Math.max(
        0,
        (new Date(now).getMonth() - new Date(m + "-01").getMonth() + 12) % 12
      );
      if (!merchantMonthly[t.merchant]) merchantMonthly[t.merchant] = [];
      merchantMonthly[t.merchant][idx] = (merchantMonthly[t.merchant][idx] ?? 0) + t.amount;
    }
    for (const [merchant, arr] of Object.entries(merchantMonthly)) {
      const thisM = arr[0] ?? 0;
      const avg = arr.slice(1, 6).filter((n) => n !== undefined).reduce((s, n) => s + n, 0) / Math.max(1, arr.slice(1, 6).filter((n) => n !== undefined).length);
      if (thisM > avg * 1.8 && thisM > 500 && avg > 0) {
        insights.push({
          id: `merchant-${merchant}`,
          severity: "info",
          icon: "🔍",
          title: `Gastas más en ${merchant}`,
          description: `Este mes $${Math.round(thisM).toLocaleString()} vs promedio de $${Math.round(avg).toLocaleString()}.`,
        });
      }
    }

    // ── 4. Savings rate bajo ──────────────────────────────────────────
    const incomeThisMonth = txns
      .filter((t) => t.type === "income" && t.date.startsWith(thisMonth))
      .reduce((s, t) => s + t.amount, 0);
    const expenseThisMonth = txns
      .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
      .reduce((s, t) => s + t.amount, 0);
    if (incomeThisMonth > 0) {
      const sr = ((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100;
      if (sr < 10 && expenseThisMonth > 0) {
        insights.push({
          id: `savings-low`,
          severity: "warning",
          icon: "💸",
          title: `Savings rate bajo: ${Math.round(sr)}%`,
          description: `Expertos financieros recomiendan mínimo 20%. Considera revisar gastos recurrentes.`,
        });
      } else if (sr >= 30) {
        insights.push({
          id: `savings-great`,
          severity: "success",
          icon: "🎉",
          title: `Excelente savings rate: ${Math.round(sr)}%`,
          description: `Estás por encima del 20% recomendado. Sigue así.`,
        });
      }
    }

    // ── 5. Deuda de alto interés ──────────────────────────────────────
    const highestInterest = debts.sort((a, b) => b.interestRate - a.interestRate)[0];
    if (highestInterest && highestInterest.interestRate >= 20) {
      insights.push({
        id: `debt-high-${highestInterest.id}`,
        severity: "critical",
        icon: "🔥",
        title: `Deuda de alto interés: ${highestInterest.name}`,
        description: `${highestInterest.interestRate.toFixed(1)}% APR · Saldo $${highestInterest.balance.toLocaleString()}. Prioriza liquidarla (avalanche).`,
      });
    }

    // ── 6. Emergency fund ─────────────────────────────────────────────
    const savings = accounts.filter((a) => a.type === "savings").reduce((s, a) => s + a.balance, 0);
    const monthlyExp = expenseThisMonth || 1;
    const months = savings / monthlyExp;
    if (months < 1 && monthlyExp > 1000) {
      insights.push({
        id: `emergency-fund-low`,
        severity: "warning",
        icon: "🛡️",
        title: `Tu emergency fund es débil`,
        description: `Solo tienes ${months.toFixed(1)} meses de cobertura. Meta: 3-6 meses.`,
      });
    }

    // ── 7. Zombie subscription (mayor monto no logueado en transacciones) ─
    // Heurística simple: recurring activo sin logs relacionados en 60 días
    // (Simplificado: solo detectamos si hay recurring con amount alto)
    for (const r of recurring) {
      if (r.type !== "expense") continue;
      // Suma anual del servicio
      const annualCost =
        r.frequency === "weekly" ? r.amount * 52 :
        r.frequency === "biweekly" ? r.amount * 26 :
        r.frequency === "monthly" ? r.amount * 12 :
        r.frequency === "quarterly" ? r.amount * 4 :
        r.amount;
      if (annualCost > 5000) {
        insights.push({
          id: `sub-review-${r.name}`,
          severity: "info",
          icon: "🧐",
          title: `Revisa: ${r.name}`,
          description: `$${r.amount}/${r.frequency} = $${Math.round(annualCost).toLocaleString()}/año. ¿Aún lo usas?`,
        });
      }
    }

    // ── 8. Goals en progreso ──────────────────────────────────────────
    for (const g of goals.slice(0, 2)) {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      if (pct >= 75) {
        insights.push({
          id: `goal-close-${g.id}`,
          severity: "success",
          icon: g.emoji ?? "🎯",
          title: `Tu meta "${g.name}" está al ${Math.round(pct)}%`,
          description: `Faltan $${Math.round(g.targetAmount - g.currentAmount).toLocaleString()} para lograrlo.`,
        });
      }
    }

    return NextResponse.json({
      insights: insights.slice(0, 10),
      generatedAt: now.toISOString(),
    });
  });
}
