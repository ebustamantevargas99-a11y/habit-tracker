import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.symptomLog.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
