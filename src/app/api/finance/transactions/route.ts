import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const type = searchParams.get("type");   // income | expense

  const where: Record<string, unknown> = { userId: session.user.id };
  if (month) {
    where.date = { gte: `${month}-01`, lte: `${month}-31` };
  }
  if (type) {
    where.type = type;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { date, description, amount, type, category, subcategory, paymentMethod, isRecurring } = body;

  if (!date || !description || amount === undefined || !type || !category) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      date,
      description,
      amount: parseFloat(amount),
      type,
      category,
      subcategory: subcategory ?? null,
      paymentMethod: paymentMethod ?? null,
      isRecurring: isRecurring ?? false,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
