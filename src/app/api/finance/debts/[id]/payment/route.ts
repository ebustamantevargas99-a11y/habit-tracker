import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";

const paymentSchema = z.object({
  amount: z.number().min(0.01).max(10_000_000),
  fromAccountId: z.string().min(1).max(64).optional().nullable(),
});

// POST = registra un pago a la deuda (reduce balance + crea transacción)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const debt = await prisma.debt.findFirst({
      where: { id: params.id, userId },
    });
    if (!debt) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const parsed = await parseJson(req, paymentSchema);
    if (!parsed.ok) return parsed.response;
    const { amount, fromAccountId } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const newBalance = Math.max(0, debt.balance - amount);
      const justPaidOff = debt.balance > 0 && newBalance === 0;

      const updated = await tx.debt.update({
        where: { id: debt.id },
        data: {
          balance: newBalance,
          ...(justPaidOff ? { paidOffAt: new Date(), active: false } : {}),
        },
      });

      if (fromAccountId) {
        const account = await tx.financialAccount.findFirst({
          where: { id: fromAccountId, userId },
          select: { type: true },
        });
        if (account) {
          const isLiability = account.type === "credit" || account.type === "loan";
          await tx.financialAccount.update({
            where: { id: fromAccountId },
            data: { balance: { increment: isLiability ? amount : -amount } },
          });
          await tx.transaction.create({
            data: {
              userId,
              accountId: fromAccountId,
              date: new Date().toISOString().split("T")[0],
              amount,
              type: "expense",
              category: "Pago de deuda",
              subcategory: debt.name,
              description: `Pago a ${debt.name}`,
              tags: ["deuda"],
            },
          });
        }
      }

      if (justPaidOff) {
        await tx.milestone.create({
          data: {
            userId,
            date: new Date().toISOString().split("T")[0],
            type: "custom",
            title: `🆓 Deuda liquidada: ${debt.name}`,
            description: `$${(debt.originalAmount ?? debt.balance).toLocaleString()}`,
            icon: "🆓",
          },
        });
      }

      return { debt: updated, justPaidOff };
    });

    return NextResponse.json(result);
  });
}
