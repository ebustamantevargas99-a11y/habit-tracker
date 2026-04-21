import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, trainingProgramUpdateSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: params.id, userId },
      include: { phases: { orderBy: { weekStart: "asc" } } },
    });
    if (!program) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(program);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const existing = await prisma.trainingProgram.findFirst({
      where: { id: params.id, userId },
      select: { id: true, active: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const parsed = await parseJson(req, trainingProgramUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Si activamos este, desactivamos los otros (uno activo por user)
    if (d.active === true && !existing.active) {
      await prisma.trainingProgram.updateMany({
        where: { userId, active: true, NOT: { id: params.id } },
        data: { active: false },
      });
    }

    const updated = await prisma.trainingProgram.update({
      where: { id: params.id },
      data: {
        name: d.name,
        description: d.description,
        type: d.type,
        goal: d.goal,
        durationWeeks: d.durationWeeks,
        daysPerWeek: d.daysPerWeek,
        startDate: d.startDate,
        endDate: d.endDate,
        active: d.active,
        schedule: d.schedule !== undefined ? (d.schedule as object[]) : undefined,
      },
      include: { phases: { orderBy: { weekStart: "asc" } } },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const existing = await prisma.trainingProgram.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    await prisma.trainingProgram.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
