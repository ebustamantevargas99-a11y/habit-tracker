import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, accountUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.financialAccount.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const parsed = await parseJson(req, accountUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const updated = await prisma.financialAccount.update({
      where: { id: params.id },
      data: {
        ...("name" in d ? { name: d.name } : {}),
        ...("type" in d ? { type: d.type } : {}),
        ...("currency" in d ? { currency: d.currency } : {}),
        ...("balance" in d ? { balance: d.balance } : {}),
        ...("creditLimit" in d ? { creditLimit: d.creditLimit ?? null } : {}),
        ...("interestRate" in d ? { interestRate: d.interestRate ?? null } : {}),
        ...("institution" in d ? { institution: d.institution ?? null } : {}),
        ...("color" in d ? { color: d.color ?? null } : {}),
        ...("icon" in d ? { icon: d.icon ?? null } : {}),
        ...("archived" in d ? { archived: d.archived } : {}),
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
    const account = await prisma.financialAccount.findFirst({
      where: { id: params.id, userId },
    });
    if (!account) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const txnCount = await prisma.transaction.count({ where: { accountId: params.id } });
    if (txnCount > 0) {
      // Soft-archive para preservar histórico
      await prisma.financialAccount.update({
        where: { id: params.id },
        data: { archived: true },
      });
      return NextResponse.json({ archived: true, reason: "has_transactions" });
    }
    await prisma.financialAccount.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
