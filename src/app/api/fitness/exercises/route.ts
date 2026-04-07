import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Return global exercises + user's custom exercises
  const exercises = await prisma.exercise.findMany({
    where: { OR: [{ userId: null }, { userId: session.user.id }] },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, muscleGroup, category, equipment } = body;

  if (!name || !muscleGroup) {
    return NextResponse.json({ error: "name y muscleGroup son requeridos" }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({
    data: {
      userId: session.user.id,
      name,
      muscleGroup,
      category: category ?? "compound",
      equipment: equipment ?? null,
      isCustom: true,
    },
  });

  return NextResponse.json(exercise, { status: 201 });
}
