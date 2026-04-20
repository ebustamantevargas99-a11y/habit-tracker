import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { z } from "zod";

const milestonesPutSchema = z.object({
  milestones: z
    .array(
      z.object({
        weekNumber: z.number().int().nonnegative().max(1000),
        targetValue: z.number().finite().nonnegative().max(1_000_000_000),
        actualValue: z
          .number()
          .finite()
          .nonnegative()
          .max(1_000_000_000)
          .optional()
          .nullable(),
        status: z.string().max(50).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        recalculated: z.boolean().optional(),
      })
    )
    .max(1000),
});

const milestonePatchSchema = z.object({
  milestoneId: z.string().min(1).max(64),
  actualValue: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  status: z.string().max(50).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const cfg = await prisma.projectionConfig.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!cfg)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const milestones = await prisma.projectionMilestone.findMany({
      where: { projectionConfigId: params.id },
      orderBy: { weekNumber: "asc" },
    });
    return NextResponse.json(milestones);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const cfg = await prisma.projectionConfig.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!cfg)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, milestonesPutSchema);
    if (!parsed.ok) return parsed.response;

    await prisma.$transaction([
      prisma.projectionMilestone.deleteMany({
        where: { projectionConfigId: params.id },
      }),
      ...(parsed.data.milestones.length
        ? [
            prisma.projectionMilestone.createMany({
              data: parsed.data.milestones.map((m) => ({
                projectionConfigId: params.id,
                weekNumber: m.weekNumber,
                targetValue: m.targetValue,
                actualValue: m.actualValue ?? null,
                status: m.status ?? "pending",
                date: m.date,
                recalculated: m.recalculated ?? false,
              })),
            }),
          ]
        : []),
    ]);

    const updated = await prisma.projectionMilestone.findMany({
      where: { projectionConfigId: params.id },
      orderBy: { weekNumber: "asc" },
    });
    return NextResponse.json(updated);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, milestonePatchSchema);
    if (!parsed.ok) return parsed.response;

    const { milestoneId, ...updateData } = parsed.data;

    const milestone = await prisma.projectionMilestone.findFirst({
      where: {
        id: milestoneId,
        projectionConfigId: params.id,
        projectionConfig: { userId },
      },
      select: { id: true },
    });
    if (!milestone)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const updated = await prisma.projectionMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });
    return NextResponse.json(updated);
  });
}
