import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withAuth(async (userId) => {

  // Return global exercises + user's custom exercises
  const exercises = await prisma.exercise.findMany({
    where: { OR: [{ userId: null }, { userId: userId }] },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(exercises);
});
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {

  const body = await req.json();
  const { name, muscleGroup, category, equipment } = body;

  if (!name || !muscleGroup) {
    return NextResponse.json({ error: "name y muscleGroup son requeridos" }, { status: 400 });
  }

  const exercise = await prisma.exercise.create({
    data: {
      userId: userId,
      name,
      muscleGroup,
      category: category ?? "compound",
      equipment: equipment ?? null,
      isCustom: true,
    },
  });

  return NextResponse.json(exercise, { status: 201 });
});
}
