import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, transactionCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const take = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10) || 100,
      500
    );
    const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10) || 0, 0);

    const where: Record<string, unknown> = { userId };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      where.date = { gte: `${month}-01`, lte: `${month}-31` };
    }
    if (type === "income" || type === "expense") {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take,
      skip,
    });

    return NextResponse.json(transactions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, transactionCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        date: d.date,
        description: d.description,
        amount: d.amount,
        type: d.type,
        category: d.category,
        subcategory: d.subcategory ?? null,
        paymentMethod: d.paymentMethod ?? null,
        isRecurring: d.isRecurring ?? false,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  });
}
