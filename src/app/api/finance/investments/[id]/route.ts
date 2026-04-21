import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, investmentUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.investment.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    const parsed = await parseJson(req, investmentUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const updated = await prisma.investment.update({
      where: { id: params.id },
      data: {
        ...("symbol" in d ? { symbol: d.symbol } : {}),
        ...("name" in d ? { name: d.name } : {}),
        ...("type" in d ? { type: d.type } : {}),
        ...("quantity" in d ? { quantity: d.quantity } : {}),
        ...("averageCost" in d ? { averageCost: d.averageCost } : {}),
        ...("currency" in d ? { currency: d.currency } : {}),
        ...("linkedAccountId" in d ? { linkedAccountId: d.linkedAccountId ?? null } : {}),
        ...("lastPrice" in d
          ? { lastPrice: d.lastPrice ?? null, lastPriceAt: d.lastPrice ? new Date() : null }
          : {}),
        ...("notes" in d ? { notes: d.notes ?? null } : {}),
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
    const existing = await prisma.investment.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.investment.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
