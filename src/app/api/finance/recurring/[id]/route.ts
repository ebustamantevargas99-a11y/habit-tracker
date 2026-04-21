import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, recurringUpdateSchema } from "@/lib/validation";
import { advanceDate } from "@/lib/finance/recurring";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const parsed = await parseJson(req, recurringUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const updated = await prisma.recurringTransaction.update({
      where: { id: params.id },
      data: {
        ...("accountId" in d ? { accountId: d.accountId } : {}),
        ...("name" in d ? { name: d.name } : {}),
        ...("amount" in d ? { amount: d.amount } : {}),
        ...("type" in d ? { type: d.type } : {}),
        ...("category" in d ? { category: d.category } : {}),
        ...("subcategory" in d ? { subcategory: d.subcategory ?? null } : {}),
        ...("merchant" in d ? { merchant: d.merchant ?? null } : {}),
        ...("frequency" in d ? { frequency: d.frequency } : {}),
        ...("dayOfMonth" in d ? { dayOfMonth: d.dayOfMonth ?? null } : {}),
        ...("nextDate" in d ? { nextDate: d.nextDate } : {}),
        ...("endDate" in d ? { endDate: d.endDate ?? null } : {}),
        ...("active" in d ? { active: d.active } : {}),
        ...("autoLog" in d ? { autoLog: d.autoLog } : {}),
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
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (existing.linkedEventId) {
        await tx.calendarEvent
          .delete({ where: { id: existing.linkedEventId } })
          .catch(() => null);
      }
      await tx.recurringTransaction.delete({ where: { id: params.id } });
    });
    return new NextResponse(null, { status: 204 });
  });
}

// POST = "log now" — crea transacción inmediata y avanza nextDate
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const r = await prisma.recurringTransaction.findFirst({
      where: { id: params.id, userId },
    });
    if (!r) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    if (r.type !== "income" && r.type !== "expense") {
      return NextResponse.json({ error: "Tipo no soportado" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const account = await prisma.financialAccount.findUnique({
      where: { id: r.accountId },
      select: { type: true },
    });
    const isLiability = account?.type === "credit" || account?.type === "loan";
    const delta = r.type === "income" ? r.amount : -r.amount;
    const appliedDelta = isLiability ? -delta : delta;

    const result = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          userId,
          accountId: r.accountId,
          date: today,
          amount: r.amount,
          type: r.type,
          category: r.category,
          subcategory: r.subcategory,
          merchant: r.merchant,
          description: r.name,
          recurringId: r.id,
        },
      });
      await tx.financialAccount.update({
        where: { id: r.accountId },
        data: { balance: { increment: appliedDelta } },
      });
      const nextDate = advanceDate(r.nextDate, r.frequency as never);
      await tx.recurringTransaction.update({
        where: { id: r.id },
        data: {
          lastLoggedDate: today,
          nextDate,
        },
      });
      // Actualizar el CalendarEvent si existe
      if (r.linkedEventId) {
        await tx.calendarEvent
          .update({
            where: { id: r.linkedEventId },
            data: { startAt: new Date(`${nextDate}T09:00:00`) },
          })
          .catch(() => null);
      }
      return txn;
    });

    return NextResponse.json(result, { status: 201 });
  });
}
