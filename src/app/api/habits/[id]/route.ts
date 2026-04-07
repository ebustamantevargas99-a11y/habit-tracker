import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getHabitForUser(id: string, userId: string) {
  return prisma.habit.findFirst({ where: { id, userId, isActive: true } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const habit = await getHabitForUser(params.id, session.user.id);
  if (!habit) {
    return NextResponse.json({ error: "Hábito no encontrado" }, { status: 404 });
  }

  return NextResponse.json(habit);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const habit = await getHabitForUser(params.id, session.user.id);
  if (!habit) {
    return NextResponse.json({ error: "Hábito no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { name, icon, category, timeOfDay, frequency, targetDays } = body;

  const updated = await prisma.habit.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(category !== undefined && { category }),
      ...(timeOfDay !== undefined && { timeOfDay }),
      ...(frequency !== undefined && { frequency }),
      ...(targetDays !== undefined && { targetDays }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const habit = await getHabitForUser(params.id, session.user.id);
  if (!habit) {
    return NextResponse.json({ error: "Hábito no encontrado" }, { status: 404 });
  }

  // Soft delete
  await prisma.habit.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return new NextResponse(null, { status: 204 });
}
