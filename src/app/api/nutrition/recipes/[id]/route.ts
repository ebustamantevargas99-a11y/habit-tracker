import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.recipe.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.recipe.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
