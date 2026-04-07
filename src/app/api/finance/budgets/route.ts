import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/finance/budgets?month=YYYY-MM
// Returns budgets with `spent` computed from transactions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month =
    searchParams.get("month") ??
    new Date().toISOString().slice(0, 7); // YYYY-MM

  const [budgets, transactions] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: session.user.id, month },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "expense",
        date: { gte: `${month}-01`, lte: `${month}-31` },
      },
      select: { category: true, amount: true },
    }),
  ]);

  // Compute spent per category
  const spentByCategory = new Map<string, number>();
  for (const tx of transactions) {
    spentByCategory.set(tx.category, (spentByCategory.get(tx.category) ?? 0) + tx.amount);
  }

  const result = budgets.map((b) => ({
    ...b,
    spent: Math.round((spentByCategory.get(b.category) ?? 0) * 100) / 100,
  }));

  return NextResponse.json(result);
}

// POST /api/finance/budgets — upsert a budget category
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { category, limit, month } = body;
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);

  if (!category || limit === undefined) {
    return NextResponse.json({ error: "category y limit son requeridos" }, { status: 400 });
  }

  const budget = await prisma.budget.upsert({
    where: { userId_month_category: { userId: session.user.id, month: targetMonth, category } },
    create: { userId: session.user.id, month: targetMonth, category, limit: parseFloat(limit) },
    update: { limit: parseFloat(limit) },
  });

  return NextResponse.json(budget, { status: 201 });
}
