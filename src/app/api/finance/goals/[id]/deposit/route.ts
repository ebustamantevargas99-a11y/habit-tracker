import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";

const depositSchema = z.object({
  amount: z.number().min(-1_000_000).max(1_000_000),   // positivo = depósito, negativo = retiro
  fromAccountId: z.string().min(1).max(64).optional().nullable(),
});

// POST = aporta o retira de la meta, opcionalmente registrando una transacción
// desde una cuenta (útil para reflejar movimientos reales).
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId },
    });
    if (!goal) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const parsed = await parseJson(req, depositSchema);
    if (!parsed.ok) return parsed.response;
    const { amount, fromAccountId } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const newCurrent = Math.max(0, goal.currentAmount + amount);
      const justAchieved = !goal.achieved && newCurrent >= goal.targetAmount;

      const updated = await tx.savingsGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: newCurrent,
          achieved: justAchieved || goal.achieved,
          achievedAt: justAchieved ? new Date() : goal.achievedAt,
        },
      });

      // Si especificó cuenta origen y el amount es positivo → transacción expense
      // categorizada como "ahorro" (no es un gasto real, es reasignación).
      if (fromAccountId && amount > 0) {
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
              category: "Ahorro",
              subcategory: goal.name,
              description: `Aporte a meta: ${goal.name}`,
              tags: ["ahorro", "meta"],
            },
          });
        }
      }

      if (justAchieved) {
        await tx.milestone.create({
          data: {
            userId,
            date: new Date().toISOString().split("T")[0],
            type: "custom",
            title: `🎯 Meta lograda: ${goal.name}`,
            description: `$${goal.targetAmount.toLocaleString()}`,
            icon: goal.emoji ?? "🏆",
          },
        });
      }

      return { goal: updated, justAchieved };
    });

    return NextResponse.json(result);
  });
}
