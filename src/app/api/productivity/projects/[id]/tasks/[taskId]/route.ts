import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const task = await prisma.projectTask.update({
    where: { id: params.taskId },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.objectiveId !== undefined && { objectiveId: body.objectiveId }),
      ...(body.weight !== undefined && { weight: body.weight }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.projectTask.delete({ where: { id: params.taskId } });
  return new NextResponse(null, { status: 204 });
}
