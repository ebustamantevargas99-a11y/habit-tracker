import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { renewalDate: "asc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, amount, billingCycle, renewalDate, category, isActive } = body;

  if (!name || amount === undefined || !billingCycle || !renewalDate || !category) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      name,
      amount: parseFloat(amount),
      billingCycle,
      renewalDate,
      category,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
