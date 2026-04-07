import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const metric = await prisma.bodyMetric.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!metric) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.bodyMetric.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
