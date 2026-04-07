import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateExercise } from "@/lib/fitness-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const prs = await prisma.personalRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  // Return in the shape the store expects: { exercise, oneRM, fiveRM, tenRM, date }
  return NextResponse.json(
    prs.map((p) => ({
      id: p.id,
      exercise: p.exerciseName,
      oneRM: p.oneRM ?? p.estimated1RM,
      fiveRM: p.fiveRM ?? 0,
      tenRM: p.tenRM ?? 0,
      date: p.date,
    }))
  );
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { exercise, oneRM, fiveRM, tenRM, date, muscleGroup } = body;

  if (!exercise || oneRM === undefined) {
    return NextResponse.json({ error: "exercise y oneRM son requeridos" }, { status: 400 });
  }

  const ex = await findOrCreateExercise(
    exercise,
    muscleGroup ?? "General",
    session.user.id
  );

  const pr = await prisma.personalRecord.upsert({
    where: {
      // Use a compound unique — we need to find by userId + exerciseId
      // Since there's no @@unique on those, find manually
      id: (
        await prisma.personalRecord.findFirst({
          where: { userId: session.user.id, exerciseId: ex.id },
          select: { id: true },
        })
      )?.id ?? "new",
    },
    create: {
      userId: session.user.id,
      exerciseId: ex.id,
      exerciseName: exercise,
      weight: oneRM,
      reps: 1,
      estimated1RM: oneRM,
      oneRM: oneRM ?? null,
      fiveRM: fiveRM ?? null,
      tenRM: tenRM ?? null,
      date: date ?? new Date().toISOString().split("T")[0],
    },
    update: {
      exerciseName: exercise,
      weight: oneRM,
      estimated1RM: oneRM,
      oneRM: oneRM ?? null,
      fiveRM: fiveRM ?? null,
      tenRM: tenRM ?? null,
      date: date ?? new Date().toISOString().split("T")[0],
    },
  });

  return NextResponse.json({
    id: pr.id,
    exercise: pr.exerciseName,
    oneRM: pr.oneRM ?? pr.estimated1RM,
    fiveRM: pr.fiveRM ?? 0,
    tenRM: pr.tenRM ?? 0,
    date: pr.date,
  });
}
