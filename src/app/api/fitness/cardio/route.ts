import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, cardioSessionCreateSchema } from "@/lib/validation";
import { paceSecPerKm } from "@/lib/fitness/cardio";

/**
 * GET  /api/fitness/cardio?days=30  → lista sesiones en el rango
 * POST /api/fitness/cardio          → crea sesión nueva
 */

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    const daysStr = url.searchParams.get("days");
    const days = Math.min(365, Math.max(1, Number(daysStr) || 90));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const sessions = await prisma.cardioSession.findMany({
      where: { userId, date: { gte: sinceStr } },
      orderBy: { startedAt: "desc" },
      include: {
        shoe: { select: { id: true, name: true, brand: true, model: true } },
      },
    });

    return NextResponse.json(sessions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, cardioSessionCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Ownership check para shoeId si viene
    if (d.shoeId) {
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

    // Si avgPace no viene pero sí distancia y duración, lo calculamos.
    const computedPace =
      d.avgPaceSecPerKm ??
      (d.distanceKm != null ? paceSecPerKm(d.distanceKm, d.durationSec) : null);

    const created = await prisma.cardioSession.create({
      data: {
        userId,
        date: d.date,
        startedAt: new Date(d.startedAt),
        endedAt: d.endedAt ? new Date(d.endedAt) : null,
        activityType: d.activityType ?? "run",
        distanceKm: d.distanceKm ?? null,
        durationSec: d.durationSec,
        avgPaceSecPerKm: computedPace ?? null,
        avgHr: d.avgHr ?? null,
        maxHr: d.maxHr ?? null,
        elevationGainM: d.elevationGainM ?? null,
        caloriesBurned: d.caloriesBurned ?? null,
        perceivedExertion: d.perceivedExertion ?? null,
        zones: d.zones ?? undefined,
        splits: d.splits ?? undefined,
        shoeId: d.shoeId ?? null,
        notes: d.notes ?? null,
      },
    });

    // Incrementar currentKm de la zapatilla si se asignó
    if (d.shoeId && d.distanceKm && d.distanceKm > 0) {
      await prisma.shoe.update({
        where: { id: d.shoeId },
        data: { currentKm: { increment: d.distanceKm } },
      });
    }

    return NextResponse.json(created, { status: 201 });
  });
}
