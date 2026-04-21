import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, budgetUpsertSchema } from "@/lib/validation";

// GET /api/finance/budgets?month=YYYY-MM
// Returns budgets with `spent` computed from transactions
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const month =
      searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

    const [budgets, transactions] = await Promise.all([
      prisma.budget.findMany({ where: { userId, month } }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: "expense",
          date: { gte: `${month}-01`, lte: `${month}-31` },
        },
        select: { category: true, amount: true },
      }),
    ]);

    const spentByCategory = new Map<string, number>();
    for (const tx of transactions) {
      spentByCategory.set(
        tx.category,
        (spentByCategory.get(tx.category) ?? 0) + tx.amount
      );
    }

    const result = budgets.map((b) => ({
      ...b,
      spent: Math.round((spentByCategory.get(b.category) ?? 0) * 100) / 100,
    }));

    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, budgetUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const { category, limit, month } = parsed.data;
    const targetMonth = month;

    const budget = await prisma.budget.upsert({
      where: {
        userId_month_category: { userId, month: targetMonth, category },
      },
      create: { userId, month: targetMonth, category, limit },
      update: { limit },
    });

    return NextResponse.json(budget, { status: 201 });
  });
}
