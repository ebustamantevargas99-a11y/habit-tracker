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

  const item = await prisma.wishlistItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.wishlistItem.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.price !== undefined && { price: parseFloat(body.price) }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.savedAmount !== undefined && { savedAmount: parseFloat(body.savedAmount) }),
      ...(body.link !== undefined && { link: body.link }),
      ...(body.isPurchased !== undefined && { isPurchased: body.isPurchased }),
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

  const item = await prisma.wishlistItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.wishlistItem.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
