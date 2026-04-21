import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, periodLogCreateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, periodLogCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Asociar al ciclo más reciente cuyo startDate <= date
    const cycle = await prisma.menstrualCycle.findFirst({
      where: { userId, startDate: { lte: d.date } },
      orderBy: { startDate: "desc" },
      select: { id: true },
    });

    const log = await prisma.periodLog.upsert({
      where: { userId_date: { userId, date: d.date } },
      create: {
        userId,
        cycleId: cycle?.id ?? null,
        date: d.date,
        flow: d.flow,
        symptoms: d.symptoms ?? [],
        mood: d.mood ?? null,
        energy: d.energy ?? null,
        libido: d.libido ?? null,
        notes: d.notes ?? null,
      },
      update: {
        cycleId: cycle?.id ?? null,
        flow: d.flow,
        symptoms: d.symptoms ?? [],
        mood: d.mood ?? null,
        energy: d.energy ?? null,
        libido: d.libido ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  });
}
