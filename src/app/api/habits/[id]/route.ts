import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, habitUpdateSchema } from "@/lib/validation";

async function getHabitForUser(id: string, userId: string) {
  return prisma.habit.findFirst({ where: { id, userId, isActive: true } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const habit = await getHabitForUser(params.id, userId);
    if (!habit)
      return NextResponse.json(
        { error: "Hábito no encontrado" },
        { status: 404 }
      );
    return NextResponse.json(habit);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const habit = await getHabitForUser(params.id, userId);
    if (!habit)
      return NextResponse.json(
        { error: "Hábito no encontrado" },
        { status: 404 }
      );

    const parsed = await parseJson(req, habitUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.habit.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const habit = await getHabitForUser(params.id, userId);
    if (!habit)
      return NextResponse.json(
        { error: "Hábito no encontrado" },
        { status: 404 }
      );

    await prisma.habit.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return new NextResponse(null, { status: 204 });
  });
}
