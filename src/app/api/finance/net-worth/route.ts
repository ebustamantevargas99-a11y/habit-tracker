import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { convertAmount, FX_LAST_UPDATED } from "@/lib/finance/currency";

// GET /api/finance/net-worth?months=12 — calcula net worth actual y devuelve
// timeline de snapshots. Si no hay snapshot para el mes actual, lo crea (upsert).
//
// Multi-currency: convertimos cada balance/inversión/deuda a la moneda
// primaria del user (UserProfile.primaryCurrency, default MXN) usando
// tasas estáticas en src/lib/finance/currency.ts. La response incluye
// `breakdown.byCurrency` para que el UI muestre los originales si hay
// más de una moneda.
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const months = Math.min(60, Math.max(1, parseInt(searchParams.get("months") ?? "12", 10)));

    const [profile, accounts, investments, debts] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: { primaryCurrency: true },
      }),
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
        // Las debts no tienen currency en el schema — asumimos primaryCurrency.
        select: { id: true, name: true, type: true, balance: true },
      }),
    ]);

    const primary = profile?.primaryCurrency ?? "MXN";

    // Acumuladores en primaryCurrency + breakdown por moneda original.
    let assets = 0;
    let liabilities = 0;
    const byCurrency: Record<string, { assets: number; liabilities: number }> = {};

    function bumpByCurrency(code: string, kind: "assets" | "liabilities", amount: number) {
      if (!byCurrency[code]) byCurrency[code] = { assets: 0, liabilities: 0 };
      byCurrency[code][kind] += amount;
    }

    const assetBreakdown: Array<{
      id: string; name: string; type: string;
      value: number; currency: string; valueInPrimary: number;
    }> = [];
    const liabBreakdown: Array<{
      id: string; name: string; type: string;
      value: number; currency: string; valueInPrimary: number;
    }> = [];

    // ── Cuentas (assets para débito/savings/etc, liabilities para credit/loan)
    for (const a of accounts) {
      const cur = a.currency || primary;
      const isLiab = a.type === "credit" || a.type === "loan";
      if (isLiab) {
        const debtAmount = Math.max(0, a.balance);
        const inPrimary = convertAmount(debtAmount, cur, primary);
        liabilities += inPrimary;
        bumpByCurrency(cur, "liabilities", debtAmount);
        if (debtAmount > 0) {
          liabBreakdown.push({
            id: a.id,
            name: a.name,
            type: a.type,
            value: debtAmount,
            currency: cur,
            valueInPrimary: +inPrimary.toFixed(2),
          });
        }
      } else {
        const inPrimary = convertAmount(a.balance, cur, primary);
        assets += inPrimary;
        bumpByCurrency(cur, "assets", a.balance);
        assetBreakdown.push({
          id: a.id,
          name: a.name,
          type: a.type,
          value: a.balance,
          currency: cur,
          valueInPrimary: +inPrimary.toFixed(2),
        });
      }
    }

    // ── Inversiones (siempre asset)
    for (const inv of investments) {
      const val = inv.quantity * (inv.lastPrice ?? inv.averageCost);
      const cur = inv.currency || primary;
      const inPrimary = convertAmount(val, cur, primary);
      assets += inPrimary;
      bumpByCurrency(cur, "assets", val);
      assetBreakdown.push({
        id: inv.id,
        name: `${inv.symbol} · ${inv.name}`,
        type: `investment_${inv.type}`,
        value: val,
        currency: cur,
        valueInPrimary: +inPrimary.toFixed(2),
      });
    }

    // ── Debts separadas (no tienen currency en el schema)
    for (const d of debts) {
      // Asumimos que están denominadas en primaryCurrency.
      liabilities += d.balance;
      bumpByCurrency(primary, "liabilities", d.balance);
      liabBreakdown.push({
        id: d.id,
        name: d.name,
        type: d.type,
        value: d.balance,
        currency: primary,
        valueInPrimary: +d.balance.toFixed(2),
      });
    }

    const netWorth = assets - liabilities;

    // Upsert snapshot del mes actual (en primaryCurrency)
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
          breakdown: { assets: assetBreakdown, liabilities: liabBreakdown, byCurrency, primary } as unknown as object,
        },
        update: {
          assets,
          liabilities,
          netWorth,
          breakdown: { assets: assetBreakdown, liabilities: liabBreakdown, byCurrency, primary } as unknown as object,
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

    // Listar las currencies presentes con totales en primary y original
    const byCurrencySerialized = Object.entries(byCurrency).map(([code, v]) => ({
      currency: code,
      assets: +v.assets.toFixed(2),
      liabilities: +v.liabilities.toFixed(2),
      netWorth: +(v.assets - v.liabilities).toFixed(2),
    }));
    const isMultiCurrency = byCurrencySerialized.length > 1;

    return NextResponse.json({
      currency: primary,
      isMultiCurrency,
      fxLastUpdated: FX_LAST_UPDATED,
      current: {
        assets: +assets.toFixed(2),
        liabilities: +liabilities.toFixed(2),
        netWorth: +netWorth.toFixed(2),
      },
      breakdown: {
        assets: assetBreakdown,
        liabilities: liabBreakdown,
        byCurrency: byCurrencySerialized,
      },
      timeline,
      firstOfMonth,
    });
  });
}
