import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, projectionCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const configs = await prisma.projectionConfig.findMany({
      where: { userId },
      include: { milestones: { orderBy: { weekNumber: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(configs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, projectionCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;

    if (d.objectiveId) {
      const objective = await prisma.oKRObjective.findFirst({
        where: { id: d.objectiveId, userId },
        select: { id: true },
      });
      if (!objective)
        return NextResponse.json(
          { error: "Objetivo no encontrado" },
          { status: 404 }
        );
    }

    const cfg = await prisma.projectionConfig.create({
      data: {
        userId,
        objectiveId: d.objectiveId ?? null,
        name: d.name,
        model: d.model ?? "linear",
        baseline: d.baseline ?? 0,
        goal: d.goal ?? 100,
        unit: d.unit ?? "%",
        startDate: d.startDate ?? new Date().toISOString().split("T")[0],
        endDate: d.endDate ?? "",
        alertThreshold: d.alertThreshold ?? 0.15,
        autoGenerate: d.autoGenerate ?? true,
      },
      include: { milestones: true },
    });
    return NextResponse.json(cfg, { status: 201 });
  });
}
