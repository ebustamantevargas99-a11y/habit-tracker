import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, cardioSessionUpdateSchema } from "@/lib/validation";
import { paceSecPerKm } from "@/lib/fitness/cardio";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const session = await prisma.cardioSession.findFirst({
      where: { id: params.id, userId },
      include: { shoe: true },
    });
    if (!session) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(session);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(async (userId) => {
    const existing = await prisma.cardioSession.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const parsed = await parseJson(req, cardioSessionUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // shoe ownership si cambia
    if (d.shoeId && d.shoeId !== existing.shoeId) {
      const shoe = await prisma.shoe.findFirst({
        where: { id: d.shoeId, userId },
        select: { id: true },
      });
      if (!shoe) {
        return NextResponse.json(
          { error: "Zapatilla no encontrada" },
          { status: 404 },
        );
      }
    }

    // Recalcular pace si cambia distancia o duración
    const newDist = d.distanceKm ?? existing.distanceKm;
    const newDur = d.durationSec ?? existing.durationSec;
    const autoPace =
      d.avgPaceSecPerKm ??
      (newDist != null ? paceSecPerKm(newDist, newDur) : existing.avgPaceSecPerKm);

    const updated = await prisma.cardioSession.update({
      where: { id: params.id },
      data: {
        date: d.date ?? existing.date,
        startedAt: d.startedAt ? new Date(d.startedAt) : existing.startedAt,
        endedAt: d.endedAt !== undefined ? (d.endedAt ? new Date(d.endedAt) : null) : existing.endedAt,
        activityType: d.activityType ?? existing.activityType,
        distanceKm: d.distanceKm ?? existing.distanceKm,
        durationSec: d.durationSec ?? existing.durationSec,
        avgPaceSecPerKm: autoPace,
        avgHr: d.avgHr ?? existing.avgHr,
        maxHr: d.maxHr ?? existing.maxHr,
        elevationGainM: d.elevationGainM ?? existing.elevationGainM,
        caloriesBurned: d.caloriesBurned ?? existing.caloriesBurned,
        perceivedExertion: d.perceivedExertion ?? existing.perceivedExertion,
        zones: d.zones !== undefined ? (d.zones ?? undefined) : undefined,
        splits: d.splits !== undefined ? (d.splits ?? undefined) : undefined,
        shoeId: d.shoeId !== undefined ? d.shoeId : existing.shoeId,
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
    const existing = await prisma.cardioSession.findFirst({
      where: { id: params.id, userId },
      select: { id: true, distanceKm: true, shoeId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.cardioSession.delete({ where: { id: params.id } });

    // Restar km a la shoe si la sesión los había aportado
    if (existing.shoeId && existing.distanceKm && existing.distanceKm > 0) {
      await prisma.shoe.update({
        where: { id: existing.shoeId },
        data: { currentKm: { decrement: existing.distanceKm } },
      });
    }

    return NextResponse.json({ ok: true });
  });
}
