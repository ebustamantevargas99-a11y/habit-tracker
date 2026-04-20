import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, taskCreateSchema, tasksBulkPatchSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!project)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const tasks = await prisma.projectTask.findMany({
      where: { projectId: params.id },
      orderBy: [{ status: "asc" }, { orderIndex: "asc" }],
    });
    return NextResponse.json(tasks);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!project)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, taskCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const task = await prisma.projectTask.create({
      data: {
        projectId: params.id,
        title: d.title,
        description: d.description ?? null,
        status: d.status ?? "todo",
        priority: d.priority ?? null,
        objectiveId: d.objectiveId ?? null,
        weight: d.weight ?? 1,
        dueDate: d.dueDate ?? null,
        orderIndex: d.orderIndex ?? 0,
      },
    });
    return NextResponse.json(task, { status: 201 });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!project)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, tasksBulkPatchSchema);
    if (!parsed.ok) return parsed.response;

    await Promise.all(
      parsed.data.tasks.map((t) => {
        const { id, ...rest } = t;
        return prisma.projectTask.updateMany({
          where: { id, projectId: params.id },
          data: rest,
        });
      })
    );

    const updated = await prisma.projectTask.findMany({
      where: { projectId: params.id },
      orderBy: [{ status: "asc" }, { orderIndex: "asc" }],
    });
    return NextResponse.json(updated);
  });
}
