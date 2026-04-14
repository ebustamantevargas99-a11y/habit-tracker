import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.fastingLog.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(body.endTime !== undefined && { endTime: body.endTime ? new Date(body.endTime) : null }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.notes !== undefined && { notes: body.notes?.trim() ?? null }),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const updated = await prisma.fastingLog.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.fastingLog.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
