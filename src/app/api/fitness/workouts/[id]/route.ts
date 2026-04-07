import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toWorkoutSession } from "@/lib/fitness-utils";

const WORKOUT_INCLUDE = {
  exercises: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      exercise: { select: { name: true, muscleGroup: true } },
      sets: { orderBy: { setNumber: "asc" as const } },
    },
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const workout = await prisma.workout.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: WORKOUT_INCLUDE,
  });

  if (!workout) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(toWorkoutSession(workout));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const workout = await prisma.workout.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!workout) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.workout.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.duration !== undefined && { durationMinutes: body.duration }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: WORKOUT_INCLUDE,
  });

  return NextResponse.json(toWorkoutSession(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const workout = await prisma.workout.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!workout) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.workout.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
