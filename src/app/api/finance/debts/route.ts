import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, debtCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: [{ active: "desc" }, { interestRate: "desc" }],
    });
    return NextResponse.json(debts);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, debtCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const debt = await prisma.debt.create({
      data: {
        userId,
        name: d.name,
        type: d.type,
        balance: d.balance,
        originalAmount: d.originalAmount ?? d.balance,
        interestRate: d.interestRate,
        minPayment: d.minPayment,
        dueDay: d.dueDay ?? null,
        linkedAccountId: d.linkedAccountId ?? null,
      },
    });
    return NextResponse.json(debt, { status: 201 });
  });
}
