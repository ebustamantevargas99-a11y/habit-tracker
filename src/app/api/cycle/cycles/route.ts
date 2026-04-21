import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, cycleCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const cycles = await prisma.menstrualCycle.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      include: {
        periodLogs: { orderBy: { date: "asc" } },
      },
      take: 24, // últimos 24 ciclos (~2 años)
    });
    return NextResponse.json(cycles);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, cycleCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Si hay un ciclo previo sin endDate ni cycleLength, calcular días y cerrarlo
    const previous = await prisma.menstrualCycle.findFirst({
      where: { userId, cycleLength: null },
      orderBy: { startDate: "desc" },
    });

    if (previous) {
      const diffDays = Math.round(
        (new Date(d.startDate).getTime() - new Date(previous.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays > 0) {
        await prisma.menstrualCycle.update({
          where: { id: previous.id },
          data: { cycleLength: diffDays },
        });
      }
    }

    const cycle = await prisma.menstrualCycle.create({
      data: {
        userId,
        startDate: d.startDate,
        endDate: d.endDate ?? null,
        periodLength: d.periodLength ?? null,
        flowHeavy: d.flowHeavy ?? false,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(cycle, { status: 201 });
  });
}
