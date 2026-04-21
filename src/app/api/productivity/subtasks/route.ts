import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, subtaskCreateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, subtaskCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Verificar que el task pertenece al user (via project)
    const task = await prisma.projectTask.findFirst({
      where: { id: d.taskId, project: { userId } },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

    const count = await prisma.projectSubtask.count({ where: { taskId: d.taskId } });

    const subtask = await prisma.projectSubtask.create({
      data: {
        taskId: d.taskId,
        title: d.title,
        orderIndex: count,
      },
    });
    return NextResponse.json(subtask, { status: 201 });
  });
}
