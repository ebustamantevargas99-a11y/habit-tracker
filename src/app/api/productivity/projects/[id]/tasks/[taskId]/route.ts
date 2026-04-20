import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, taskUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  return withAuth(async (userId) => {
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!project)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const task = await prisma.projectTask.findFirst({
      where: { id: params.taskId, projectId: params.id },
      select: { id: true },
    });
    if (!task)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, taskUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.projectTask.update({
      where: { id: params.taskId },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  return withAuth(async (userId) => {
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!project)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const task = await prisma.projectTask.findFirst({
      where: { id: params.taskId, projectId: params.id },
      select: { id: true },
    });
    if (!task)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.projectTask.delete({ where: { id: params.taskId } });
    return new NextResponse(null, { status: 204 });
  });
}
