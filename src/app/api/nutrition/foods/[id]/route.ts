import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const food = await prisma.foodItem.findFirst({ where: { id, userId } });
    if (!food)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(food);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const food = await prisma.foodItem.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!food)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.foodItem.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
