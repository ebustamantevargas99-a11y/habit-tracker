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

  const tx = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!tx) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      ...(body.date !== undefined && { date: body.date }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
      ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
      ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
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

  const tx = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!tx) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.transaction.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
