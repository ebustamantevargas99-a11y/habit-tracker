import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, transactionCreateSchema } from "@/lib/validation";
import { sourceBalanceDelta, destinationBalanceDelta, roundCents } from "@/lib/finance/balance";

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

    // Si es transfer, verificar la cuenta destino (y obtener su tipo para
    // aplicar el signo correcto: transferir hacia una tarjeta reduce deuda).
    let toAccountType: string | null = null;
    let toAccountBalance = 0;
    if (d.type === "transfer") {
      if (!d.transferToAccountId || d.transferToAccountId === d.accountId) {
        return NextResponse.json(
          { error: "Transferencia requiere cuenta destino distinta" },
          { status: 400 }
        );
      }
      const toAccount = await prisma.financialAccount.findFirst({
        where: { id: d.transferToAccountId, userId },
        select: { id: true, type: true, balance: true },
      });
      if (!toAccount) {
        return NextResponse.json({ error: "Cuenta destino no encontrada" }, { status: 404 });
      }
      toAccountType = toAccount.type;
      toAccountBalance = toAccount.balance;
    }

    const today = new Date().toISOString().split("T")[0];
    const date = d.date ?? today;
    const amount = roundCents(d.amount);

    // Transaction: crear + actualizar balance(s) de cuenta(s)
    const created = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          userId,
          accountId: d.accountId,
          date,
          amount,
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

      // Impacto sobre la cuenta origen (helper único respeta activo/pasivo).
      // Leer-y-setear redondeado a centavos para no acumular deriva binaria.
      await tx.financialAccount.update({
        where: { id: d.accountId },
        data: {
          balance: roundCents(account.balance + sourceBalanceDelta(account.type, d.type, amount)),
        },
      });

      // Cuenta destino de la transferencia: respeta el tipo del destino
      // (transferir hacia una tarjeta reduce la deuda, no la aumenta).
      if (d.type === "transfer" && d.transferToAccountId) {
        await tx.financialAccount.update({
          where: { id: d.transferToAccountId },
          data: {
            balance: roundCents(toAccountBalance + destinationBalanceDelta(toAccountType, amount)),
          },
        });
      }

      return txn;
    });

    return NextResponse.json(created, { status: 201 });
  });
}
