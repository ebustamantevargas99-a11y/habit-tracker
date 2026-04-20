import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, objectiveCreateSchema } from "@/lib/validation";

export async function GET() {
  return withAuth(async (userId) => {
    const objectives = await prisma.oKRObjective.findMany({
      where: { userId },
      include: { keyResults: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(objectives);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, objectiveCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;

    if (d.parentId) {
      const parent = await prisma.oKRObjective.findFirst({
        where: { id: d.parentId, userId },
        select: { id: true },
      });
      if (!parent)
        return NextResponse.json(
          { error: "Objetivo padre no encontrado" },
          { status: 404 }
        );
    }

    const obj = await prisma.oKRObjective.create({
      data: {
        userId,
        title: d.title,
        description: d.description ?? null,
        type: d.type ?? "monthly",
        parentId: d.parentId ?? null,
        startDate: d.startDate ?? null,
        endDate: d.endDate ?? null,
        targetValue: d.targetValue ?? 100,
        unit: d.unit ?? "%",
        color: d.color ?? "#B8860B",
        emoji: d.emoji ?? "🎯",
        progress: 0,
      },
      include: { keyResults: true },
    });
    return NextResponse.json(obj, { status: 201 });
  });
}
