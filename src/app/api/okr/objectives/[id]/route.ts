import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.oKRObjective.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.parentId !== undefined && { parentId: body.parentId }),
      ...(body.startDate !== undefined && { startDate: body.startDate }),
      ...(body.endDate !== undefined && { endDate: body.endDate }),
      ...(body.targetValue !== undefined && { targetValue: body.targetValue }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const updated = await prisma.oKRObjective.findUnique({ where: { id: params.id }, include: { keyResults: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Cascade delete children first
  const collectIds = async (id: string): Promise<string[]> => {
    const children = await prisma.oKRObjective.findMany({ where: { parentId: id, userId: session.user.id }, select: { id: true } });
    const childIds = await Promise.all(children.map(c => collectIds(c.id)));
    return [id, ...childIds.flat()];
  };
  const ids = await collectIds(params.id);
  await prisma.oKRObjective.deleteMany({ where: { id: { in: ids }, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
