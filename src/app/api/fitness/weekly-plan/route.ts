import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface PlanExercise {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await prisma.weeklyPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(
    rows.map((r) => ({ dayOfWeek: r.dayOfWeek, exercises: r.exercises }))
  );
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { dayOfWeek, exercises } = body as {
    dayOfWeek: number;
    exercises: PlanExercise[];
  };

  if (typeof dayOfWeek !== "number" || !Array.isArray(exercises)) {
    return NextResponse.json({ error: "dayOfWeek y exercises son requeridos" }, { status: 400 });
  }

  const row = await prisma.weeklyPlan.upsert({
    where: { userId_dayOfWeek: { userId: session.user.id, dayOfWeek } },
    update: { exercises: exercises as object[] },
    create: { userId: session.user.id, dayOfWeek, exercises: exercises as object[] },
  });

  return NextResponse.json({ dayOfWeek: row.dayOfWeek, exercises: row.exercises });
}
