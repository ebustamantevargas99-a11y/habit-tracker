import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.fitnessChallenge.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.currentValue !== undefined && { currentValue: body.currentValue }),
      ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
      ...(body.completedDays !== undefined && { completedDays: body.completedDays }),
      ...(body.targetValue !== undefined && { targetValue: body.targetValue }),
      ...(body.endDate !== undefined && { endDate: body.endDate }),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const updated = await prisma.fitnessChallenge.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.fitnessChallenge.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
