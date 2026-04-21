import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, debtUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.debt.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    const parsed = await parseJson(req, debtUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const newBalance = d.balance ?? existing.balance;
    const justPaidOff =
      !existing.paidOffAt && newBalance <= 0 && existing.active;

    const updated = await prisma.debt.update({
      where: { id: params.id },
      data: {
        ...("name" in d ? { name: d.name } : {}),
        ...("type" in d ? { type: d.type } : {}),
        ...("balance" in d ? { balance: d.balance } : {}),
        ...("originalAmount" in d ? { originalAmount: d.originalAmount ?? null } : {}),
        ...("interestRate" in d ? { interestRate: d.interestRate } : {}),
        ...("minPayment" in d ? { minPayment: d.minPayment } : {}),
        ...("dueDay" in d ? { dueDay: d.dueDay ?? null } : {}),
        ...("linkedAccountId" in d ? { linkedAccountId: d.linkedAccountId ?? null } : {}),
        ...("active" in d ? { active: d.active } : {}),
        ...(justPaidOff ? { paidOffAt: new Date(), active: false } : {}),
      },
    });

    if (justPaidOff) {
      await prisma.milestone.create({
        data: {
          userId,
          date: new Date().toISOString().split("T")[0],
          type: "custom",
          title: `🆓 Deuda liquidada: ${updated.name}`,
          description: `$${(existing.originalAmount ?? existing.balance).toLocaleString()}`,
          icon: "🆓",
        },
      });
    }
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.debt.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.debt.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
