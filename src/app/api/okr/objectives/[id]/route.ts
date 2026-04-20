import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, objectiveUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.oKRObjective.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, objectiveUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.oKRObjective.update({
      where: { id: params.id },
      data: parsed.data,
      include: { keyResults: true },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.oKRObjective.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const collectIds = async (id: string): Promise<string[]> => {
      const children = await prisma.oKRObjective.findMany({
        where: { parentId: id, userId },
        select: { id: true },
      });
      const childIds = await Promise.all(children.map((c) => collectIds(c.id)));
      return [id, ...childIds.flat()];
    };
    const ids = await collectIds(params.id);
    await prisma.oKRObjective.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return new NextResponse(null, { status: 204 });
  });
}
