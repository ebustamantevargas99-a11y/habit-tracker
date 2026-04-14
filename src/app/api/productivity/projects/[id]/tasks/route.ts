import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tasks = await prisma.projectTask.findMany({
    where: { projectId: params.id },
    orderBy: [{ status: "asc" }, { orderIndex: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verify project belongs to user
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { title, description, status, priority, objectiveId, weight, dueDate, orderIndex } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "title es requerido" }, { status: 400 });

  const task = await prisma.projectTask.create({
    data: {
      projectId: params.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      status: status ?? "todo",
      priority: priority ?? null,
      objectiveId: objectiveId ?? null,
      weight: weight ?? 1,
      dueDate: dueDate ?? null,
      orderIndex: orderIndex ?? 0,
    },
  });
  return NextResponse.json(task, { status: 201 });
}

// PATCH bulk — update multiple tasks at once (for Kanban column moves)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { tasks } = await req.json();
  if (!Array.isArray(tasks)) return NextResponse.json({ error: "tasks[] requerido" }, { status: 400 });

  await Promise.all(tasks.map((t: { id: string; status?: string; orderIndex?: number; title?: string; priority?: string; objectiveId?: string; weight?: number }) =>
    prisma.projectTask.updateMany({
      where: { id: t.id, projectId: params.id },
      data: {
        ...(t.status !== undefined && { status: t.status }),
        ...(t.orderIndex !== undefined && { orderIndex: t.orderIndex }),
        ...(t.title !== undefined && { title: t.title.trim() }),
        ...(t.priority !== undefined && { priority: t.priority }),
        ...(t.objectiveId !== undefined && { objectiveId: t.objectiveId }),
        ...(t.weight !== undefined && { weight: t.weight }),
      },
    })
  ));

  const updated = await prisma.projectTask.findMany({ where: { projectId: params.id }, orderBy: [{ status: "asc" }, { orderIndex: "asc" }] });
  return NextResponse.json(updated);
}
