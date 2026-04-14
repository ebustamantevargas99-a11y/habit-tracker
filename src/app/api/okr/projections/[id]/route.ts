import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.projectionConfig.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.baseline !== undefined && { baseline: body.baseline }),
      ...(body.goal !== undefined && { goal: body.goal }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.endDate !== undefined && { endDate: body.endDate }),
      ...(body.alertThreshold !== undefined && { alertThreshold: body.alertThreshold }),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const updated = await prisma.projectionConfig.findUnique({ where: { id: params.id }, include: { milestones: { orderBy: { weekNumber: "asc" } } } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.projectionConfig.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
