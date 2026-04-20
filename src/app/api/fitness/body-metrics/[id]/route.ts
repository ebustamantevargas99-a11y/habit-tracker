import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {

  const metric = await prisma.bodyMetric.findFirst({
    where: { id: params.id, userId: userId },
  });
  if (!metric) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.bodyMetric.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
});
}
