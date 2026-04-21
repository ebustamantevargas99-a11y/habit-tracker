import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, accountCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";
    const accounts = await prisma.financialAccount.findMany({
      where: { userId, ...(includeArchived ? {} : { archived: false }) },
      orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(accounts);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, accountCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Si no hay moneda explícita, usamos primaryCurrency del perfil
    let currency = d.currency;
    if (!currency) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { primaryCurrency: true },
      });
      currency = profile?.primaryCurrency ?? "MXN";
    }

    const account = await prisma.financialAccount.create({
      data: {
        userId,
        name: d.name,
        type: d.type,
        currency,
        balance: d.balance ?? 0,
        creditLimit: d.creditLimit ?? null,
        interestRate: d.interestRate ?? null,
        institution: d.institution ?? null,
        color: d.color ?? null,
        icon: d.icon ?? null,
      },
    });
    return NextResponse.json(account, { status: 201 });
  });
}
