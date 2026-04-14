import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const milestones = await prisma.projectionMilestone.findMany({
    where: { projectionConfigId: params.id },
    orderBy: { weekNumber: "asc" },
  });
  return NextResponse.json(milestones);
}

// PUT replaces all milestones for this config (bulk upsert)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verify config belongs to user
  const cfg = await prisma.projectionConfig.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!cfg) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { milestones } = await req.json();
  await prisma.projectionMilestone.deleteMany({ where: { projectionConfigId: params.id } });
  if (milestones?.length) {
    await prisma.projectionMilestone.createMany({
      data: milestones.map((m: { weekNumber: number; targetValue: number; actualValue?: number; status?: string; date: string; recalculated?: boolean }) => ({
        projectionConfigId: params.id,
        weekNumber: m.weekNumber,
        targetValue: m.targetValue,
        actualValue: m.actualValue ?? null,
        status: m.status ?? "pending",
        date: m.date,
        recalculated: m.recalculated ?? false,
      })),
    });
  }
  const updated = await prisma.projectionMilestone.findMany({ where: { projectionConfigId: params.id }, orderBy: { weekNumber: "asc" } });
  return NextResponse.json(updated);
}

// PATCH updates a single milestone by milestoneId in body
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { milestoneId, actualValue, status } = await req.json();
  if (!milestoneId) return NextResponse.json({ error: "milestoneId requerido" }, { status: 400 });

  const ms = await prisma.projectionMilestone.update({
    where: { id: milestoneId },
    data: {
      ...(actualValue !== undefined && { actualValue }),
      ...(status !== undefined && { status }),
    },
  });
  return NextResponse.json(ms);
}
