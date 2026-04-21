import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, cycleUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.menstrualCycle.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const parsed = await parseJson(req, cycleUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const updated = await prisma.menstrualCycle.update({
      where: { id },
      data: {
        ...("startDate" in d ? { startDate: d.startDate } : {}),
        ...("endDate" in d ? { endDate: d.endDate ?? null } : {}),
        ...("periodLength" in d ? { periodLength: d.periodLength ?? null } : {}),
        ...("flowHeavy" in d ? { flowHeavy: d.flowHeavy } : {}),
        ...("notes" in d ? { notes: d.notes ?? null } : {}),
      },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.menstrualCycle.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.menstrualCycle.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
