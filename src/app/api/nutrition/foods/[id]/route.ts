import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const food = await prisma.foodItem.findFirst({ where: { id, userId: session.user.id } });
  if (!food) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(food);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.foodItem.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
