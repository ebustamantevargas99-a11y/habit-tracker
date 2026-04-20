import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { findOrCreateExercise } from "@/lib/fitness-utils";
import { parseJson, personalRecordUpsertSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const prs = await prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

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
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, personalRecordUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const ex = await findOrCreateExercise(
      d.exercise,
      d.muscleGroup ?? "General",
      userId
    );

    const existing = await prisma.personalRecord.findFirst({
      where: { userId, exerciseId: ex.id },
      select: { id: true },
    });

    const dateStr = d.date ?? new Date().toISOString().split("T")[0];

    const pr = await prisma.personalRecord.upsert({
      where: { id: existing?.id ?? "new" },
      create: {
        userId,
        exerciseId: ex.id,
        exerciseName: d.exercise,
        weight: d.oneRM,
        reps: 1,
        estimated1RM: d.oneRM,
        oneRM: d.oneRM,
        fiveRM: d.fiveRM ?? null,
        tenRM: d.tenRM ?? null,
        date: dateStr,
      },
      update: {
        exerciseName: d.exercise,
        weight: d.oneRM,
        estimated1RM: d.oneRM,
        oneRM: d.oneRM,
        fiveRM: d.fiveRM ?? null,
        tenRM: d.tenRM ?? null,
        date: dateStr,
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
  });
}
