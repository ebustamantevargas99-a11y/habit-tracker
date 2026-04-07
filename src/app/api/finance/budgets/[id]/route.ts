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

  const budget = await prisma.budget.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!budget) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { limit } = await req.json();
  const updated = await prisma.budget.update({
    where: { id: params.id },
    data: { limit: parseFloat(limit) },
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

  const budget = await prisma.budget.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!budget) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.budget.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
