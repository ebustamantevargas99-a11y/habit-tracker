import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.subscription.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.billingCycle !== undefined && { billingCycle: body.billingCycle }),
      ...(body.renewalDate !== undefined && { renewalDate: body.renewalDate }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.subscription.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
