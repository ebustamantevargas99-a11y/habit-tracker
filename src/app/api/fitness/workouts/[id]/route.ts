import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { toWorkoutSession } from "@/lib/fitness-utils";
import { parseJson, workoutUpdateSchema } from "@/lib/validation";

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
  return withAuth(async (userId) => {
    const workout = await prisma.workout.findFirst({
      where: { id: params.id, userId },
      include: WORKOUT_INCLUDE,
    });

    if (!workout)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(toWorkoutSession(workout));
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const workout = await prisma.workout.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!workout)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, workoutUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const updated = await prisma.workout.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.duration !== undefined && { durationMinutes: d.duration }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
      include: WORKOUT_INCLUDE,
    });

    return NextResponse.json(toWorkoutSession(updated));
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const workout = await prisma.workout.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!workout)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.workout.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
