import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

interface PlanExercise {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
}

export async function GET() {
  return withAuth(async (userId) => {

  const rows = await prisma.weeklyPlan.findMany({
    where: { userId: userId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(
    rows.map((r) => ({ dayOfWeek: r.dayOfWeek, exercises: r.exercises }))
  );
});
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {

  const body = await req.json();
  const { dayOfWeek, exercises } = body as {
    dayOfWeek: number;
    exercises: PlanExercise[];
  };

  if (typeof dayOfWeek !== "number" || !Array.isArray(exercises)) {
    return NextResponse.json({ error: "dayOfWeek y exercises son requeridos" }, { status: 400 });
  }

  const row = await prisma.weeklyPlan.upsert({
    where: { userId_dayOfWeek: { userId: userId, dayOfWeek } },
    update: { exercises: exercises as object[] },
    create: { userId: userId, dayOfWeek, exercises: exercises as object[] },
  });

  return NextResponse.json({ dayOfWeek: row.dayOfWeek, exercises: row.exercises });
});
}
