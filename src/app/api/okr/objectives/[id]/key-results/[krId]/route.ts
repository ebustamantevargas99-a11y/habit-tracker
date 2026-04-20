import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; krId: string } }
) {
  return withAuth(async (userId) => {
    const kr = await prisma.oKRKeyResult.findFirst({
      where: {
        id: params.krId,
        objectiveId: params.id,
        objective: { userId },
      },
      select: { id: true },
    });
    if (!kr)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.oKRKeyResult.delete({ where: { id: params.krId } });
    return new NextResponse(null, { status: 204 });
  });
}
