import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const configs = await prisma.projectionConfig.findMany({
    where: { userId: session.user.id },
    include: { milestones: { orderBy: { weekNumber: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { objectiveId, name, model, baseline, goal, unit, startDate, endDate, alertThreshold, autoGenerate } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name es requerido" }, { status: 400 });

  const cfg = await prisma.projectionConfig.create({
    data: {
      userId: session.user.id,
      objectiveId: objectiveId ?? null,
      name: name.trim(),
      model: model ?? "linear",
      baseline: baseline ?? 0,
      goal: goal ?? 100,
      unit: unit ?? "%",
      startDate: startDate ?? new Date().toISOString().split("T")[0],
      endDate: endDate ?? "",
      alertThreshold: alertThreshold ?? 0.15,
      autoGenerate: autoGenerate ?? true,
    },
    include: { milestones: true },
  });
  return NextResponse.json(cfg, { status: 201 });
}
