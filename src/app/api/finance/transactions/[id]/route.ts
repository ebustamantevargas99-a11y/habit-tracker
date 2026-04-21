import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, transactionUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, transactionUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...("accountId" in d ? { accountId: d.accountId } : {}),
        ...("date" in d ? { date: d.date } : {}),
        ...("amount" in d ? { amount: d.amount } : {}),
        ...("type" in d ? { type: d.type } : {}),
        ...("category" in d ? { category: d.category } : {}),
        ...("subcategory" in d ? { subcategory: d.subcategory ?? null } : {}),
        ...("merchant" in d ? { merchant: d.merchant ?? null } : {}),
        ...("description" in d ? { description: d.description ?? null } : {}),
        ...("notes" in d ? { notes: d.notes ?? null } : {}),
        ...("tags" in d ? { tags: d.tags ?? [] } : {}),
        ...("photoData" in d ? { photoData: d.photoData ?? null } : {}),
      },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const tx = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!tx)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Revertir el impacto en balance cuando borramos
    await prisma.$transaction(async (db) => {
      const account = await db.financialAccount.findUnique({
        where: { id: tx.accountId },
        select: { type: true },
      });
      const isLiability = account?.type === "credit" || account?.type === "loan";
      const delta =
        tx.type === "income" ? -tx.amount :
        tx.type === "expense" ? tx.amount :
        tx.amount;
      const appliedDelta = isLiability ? -delta : delta;
      await db.financialAccount.update({
        where: { id: tx.accountId },
        data: { balance: { increment: appliedDelta } },
      });
      if (tx.type === "transfer" && tx.transferToAccountId) {
        await db.financialAccount.update({
          where: { id: tx.transferToAccountId },
          data: { balance: { increment: -tx.amount } },
        });
      }
      await db.transaction.delete({ where: { id: params.id } });
    });
    return new NextResponse(null, { status: 204 });
  });
}
