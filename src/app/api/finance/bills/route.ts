import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bills = await prisma.bill.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(bills);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, amount, dueDate, isPaid, isRecurring } = body;

  if (!name || amount === undefined || !dueDate) {
    return NextResponse.json({ error: "name, amount y dueDate son requeridos" }, { status: 400 });
  }

  const bill = await prisma.bill.create({
    data: {
      userId: session.user.id,
      name,
      amount: parseFloat(amount),
      dueDate,
      isPaid: isPaid ?? false,
      isRecurring: isRecurring ?? false,
    },
  });

  return NextResponse.json(bill, { status: 201 });
}
