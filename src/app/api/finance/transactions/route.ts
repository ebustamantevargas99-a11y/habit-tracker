import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, transactionCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const category = searchParams.get("category");
    const merchant = searchParams.get("merchant");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const take = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10) || 100,
      500
    );
    const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10) || 0, 0);

    const where: Record<string, unknown> = { userId };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      where.date = { gte: `${month}-01`, lte: `${month}-31` };
    } else if (from || to) {
      const range: { gte?: string; lte?: string } = {};
      if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) range.gte = from;
      if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) range.lte = to;
      where.date = range;
    }
    if (type === "income" || type === "expense" || type === "transfer") where.type = type;
    if (accountId) where.accountId = accountId;
    if (category) where.category = category;
    if (merchant) where.merchant = merchant;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take,
      skip,
      include: { account: { select: { id: true, name: true, color: true, icon: true, currency: true } } },
    });

    return NextResponse.json(transactions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, transactionCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Verificar ownership de la cuenta
    const account = await prisma.financialAccount.findFirst({
      where: { id: d.accountId, userId },
      select: { id: true, balance: true, type: true },
    });
    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    // Si es transfer, verificar la cuenta destino
    if (d.type === "transfer") {
      if (!d.transferToAccountId || d.transferToAccountId === d.accountId) {
        return NextResponse.json(
          { error: "Transferencia requiere cuenta destino distinta" },
          { status: 400 }
        );
      }
      const toAccount = await prisma.financialAccount.findFirst({
        where: { id: d.transferToAccountId, userId },
        select: { id: true },
      });
      if (!toAccount) {
        return NextResponse.json({ error: "Cuenta destino no encontrada" }, { status: 404 });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const date = d.date ?? today;

    // Transaction: crear + actualizar balance(s) de cuenta(s)
    const created = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          userId,
          accountId: d.accountId,
          date,
          amount: d.amount,
          type: d.type,
          category: d.category,
          subcategory: d.subcategory ?? null,
          merchant: d.merchant ?? null,
          description: d.description ?? null,
          notes: d.notes ?? null,
          tags: d.tags ?? [],
          photoData: d.photoData ?? null,
          transferToAccountId: d.type === "transfer" ? d.transferToAccountId : null,
        },
        include: {
          account: { select: { id: true, name: true, color: true, icon: true, currency: true } },
        },
      });

      // Para credit/loan, el signo del balance es inverso: un "expense" aumenta la deuda.
      const isLiability = account.type === "credit" || account.type === "loan";
      const delta =
        d.type === "income" ? d.amount :
        d.type === "expense" ? -d.amount :
        -d.amount; // transfer out
      const appliedDelta = isLiability ? -delta : delta;

      await tx.financialAccount.update({
        where: { id: d.accountId },
        data: { balance: { increment: appliedDelta } },
      });

      if (d.type === "transfer" && d.transferToAccountId) {
        await tx.financialAccount.update({
          where: { id: d.transferToAccountId },
          data: { balance: { increment: d.amount } },
        });
      }

      return txn;
    });

    return NextResponse.json(created, { status: 201 });
  });
}
