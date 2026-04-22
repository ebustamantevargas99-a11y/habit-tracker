import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bodyCompositionUpdateSchema } from "@/lib/validation";
import { deriveMissingFields } from "@/lib/nutrition/body-composition";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.bodyComposition.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const parsed = await parseJson(req, bodyCompositionUpdateSchema);
    if (!parsed.ok) return parsed.response;

    // Derivar si vienen nuevos valores que permitan completar
    const d = deriveMissingFields(parsed.data);

    const updated = await prisma.bodyComposition.update({
      where: { id },
      data: {
        ...(d.date !== undefined && { date: d.date }),
        ...(d.weightKg !== undefined && { weightKg: d.weightKg }),
        ...(d.bodyFatPercent !== undefined && { bodyFatPercent: d.bodyFatPercent }),
        ...(d.leanMassKg !== undefined && { leanMassKg: d.leanMassKg }),
        ...(d.fatMassKg !== undefined && { fatMassKg: d.fatMassKg }),
        ...(d.waterPercent !== undefined && { waterPercent: d.waterPercent }),
        ...(d.visceralFat !== undefined && { visceralFat: d.visceralFat }),
        ...(d.boneMassKg !== undefined && { boneMassKg: d.boneMassKg }),
        ...(d.bmr !== undefined && { bmr: d.bmr }),
        ...(d.method !== undefined && { method: d.method }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (userId) => {
    const { id } = await params;
    const existing = await prisma.bodyComposition.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    await prisma.bodyComposition.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
