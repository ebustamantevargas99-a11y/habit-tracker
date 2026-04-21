import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, shoeUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const existing = await prisma.shoe.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const parsed = await parseJson(req, shoeUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Si se retira ahora (no estaba retirada), setea retiredAt
    const willRetire = d.retired === true && !existing.retired;
    const willUnretire = d.retired === false && existing.retired;

    const updated = await prisma.shoe.update({
      where: { id: params.id },
      data: {
        name: d.name ?? existing.name,
        brand: d.brand !== undefined ? d.brand : existing.brand,
        model: d.model !== undefined ? d.model : existing.model,
        purchaseDate: d.purchaseDate !== undefined ? d.purchaseDate : existing.purchaseDate,
        currentKm: d.currentKm ?? existing.currentKm,
        maxKm: d.maxKm ?? existing.maxKm,
        retired: d.retired ?? existing.retired,
        retiredAt: willRetire
          ? new Date()
          : willUnretire
            ? null
            : existing.retiredAt,
        notes: d.notes !== undefined ? d.notes : existing.notes,
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const existing = await prisma.shoe.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // Soft dependency: las CardioSession tienen shoe onDelete SetNull,
    // así que no se pierden sesiones.
    await prisma.shoe.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
