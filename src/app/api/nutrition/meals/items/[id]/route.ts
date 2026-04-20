import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;

    const item = await prisma.mealItem.findFirst({
      where: { id },
      include: { mealLog: { select: { userId: true } } },
    });
    if (!item || item.mealLog.userId !== userId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.mealItem.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
