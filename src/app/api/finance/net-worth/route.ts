import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/finance/net-worth?months=12 — calcula net worth actual y devuelve
// timeline de snapshots. Si no hay snapshot para el mes actual, lo crea (upsert).
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const months = Math.min(60, Math.max(1, parseInt(searchParams.get("months") ?? "12", 10)));

    const [accounts, investments, debts] = await Promise.all([
      prisma.financialAccount.findMany({
        where: { userId, archived: false },
        select: { id: true, name: true, type: true, currency: true, balance: true, creditLimit: true },
      }),
      prisma.investment.findMany({
        where: { userId },
        select: { id: true, symbol: true, name: true, type: true, quantity: true, averageCost: true, lastPrice: true, currency: true },
      }),
      prisma.debt.findMany({
        where: { userId, active: true },
        select: { id: true, name: true, type: true, balance: true },
      }),
    ]);

    // Assets: cuentas no-liability con balance > 0 + inversiones (quantity * price)
    let assets = 0;
    const assetBreakdown: Array<{ id: string; name: string; type: string; value: number }> = [];
    for (const a of accounts) {
      const isLiab = a.type === "credit" || a.type === "loan";
      if (!isLiab) {
        assets += a.balance;
        assetBreakdown.push({ id: a.id, name: a.name, type: a.type, value: a.balance });
      }
    }
    for (const inv of investments) {
      const val = inv.quantity * (inv.lastPrice ?? inv.averageCost);
      assets += val;
      assetBreakdown.push({ id: inv.id, name: `${inv.symbol} · ${inv.name}`, type: `investment_${inv.type}`, value: val });
    }

    // Liabilities: credit/loan accounts con balance negativo Y debts separadas
    let liabilities = 0;
    const liabBreakdown: Array<{ id: string; name: string; type: string; value: number }> = [];
    for (const a of accounts) {
      const isLiab = a.type === "credit" || a.type === "loan";
      if (isLiab) {
        // balance en accounts credit/loan es positivo = deuda
        const debtAmount = Math.max(0, a.balance);
        liabilities += debtAmount;
        if (debtAmount > 0) {
          liabBreakdown.push({ id: a.id, name: a.name, type: a.type, value: debtAmount });
        }
      }
    }
    for (const d of debts) {
      liabilities += d.balance;
      liabBreakdown.push({ id: d.id, name: d.name, type: d.type, value: d.balance });
    }

    const netWorth = assets - liabilities;

    // Upsert snapshot del mes actual
    const today = new Date();
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    try {
      await prisma.netWorthSnapshot.upsert({
        where: { userId_date: { userId, date: firstOfMonth } },
        create: {
          userId,
          date: firstOfMonth,
          assets,
          liabilities,
          netWorth,
          breakdown: { assets: assetBreakdown, liabilities: liabBreakdown } as unknown as object,
        },
        update: {
          assets,
          liabilities,
          netWorth,
          breakdown: { assets: assetBreakdown, liabilities: liabBreakdown } as unknown as object,
        },
      });
    } catch (e) {
      console.error("[net-worth] snapshot upsert failed:", e);
    }

    // Timeline: últimos N snapshots
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-01`;
    const timeline = await prisma.netWorthSnapshot.findMany({
      where: { userId, date: { gte: cutoffStr } },
      orderBy: { date: "asc" },
      select: { date: true, assets: true, liabilities: true, netWorth: true },
    });

    return NextResponse.json({
      current: {
        assets: +assets.toFixed(2),
        liabilities: +liabilities.toFixed(2),
        netWorth: +netWorth.toFixed(2),
      },
      breakdown: {
        assets: assetBreakdown,
        liabilities: liabBreakdown,
      },
      timeline,
      firstOfMonth,
    });
  });
}
