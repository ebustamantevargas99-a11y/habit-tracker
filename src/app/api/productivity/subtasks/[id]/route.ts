import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, subtaskUpdateSchema } from "@/lib/validation";

async function assertOwnership(id: string, userId: string) {
  return prisma.projectSubtask.findFirst({
    where: { id, task: { project: { userId } } },
    select: { id: true },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await assertOwnership(id, userId);
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const parsed = await parseJson(req, subtaskUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.projectSubtask.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await assertOwnership(id, userId);
    if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    await prisma.projectSubtask.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
