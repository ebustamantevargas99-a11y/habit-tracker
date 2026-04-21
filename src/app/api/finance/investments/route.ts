import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, investmentCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { symbol: "asc" }],
    });
    return NextResponse.json(investments);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, investmentCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const inv = await prisma.investment.create({
      data: {
        userId,
        symbol: d.symbol,
        name: d.name,
        type: d.type,
        quantity: d.quantity,
        averageCost: d.averageCost,
        currency: d.currency ?? "USD",
        linkedAccountId: d.linkedAccountId ?? null,
        lastPrice: d.lastPrice ?? d.averageCost,
        lastPriceAt: d.lastPrice ? new Date() : null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(inv, { status: 201 });
  });
}
