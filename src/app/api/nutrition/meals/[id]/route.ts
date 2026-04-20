import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;

    const meal = await prisma.mealLog.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!meal)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.mealLog.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
