import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, readinessCheckUpsertSchema } from "@/lib/validation";
import { computeReadiness } from "@/lib/fitness/training-load";

/**
 * GET  /api/fitness/readiness?days=30  → historial
 * POST /api/fitness/readiness          → upsert del día (unique por userId+date)
 */

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const url = req.nextUrl;
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days")) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const checks = await prisma.readinessCheck.findMany({
      where: { userId, date: { gte: sinceStr } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(checks);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, readinessCheckUpsertSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Calculamos score + recommendation del lado del servidor para consistencia.
    const computed = computeReadiness({
      sleepQuality: d.sleepQuality ?? null,
      soreness: d.soreness ?? null,
      stress: d.stress ?? null,
      mood: d.mood ?? null,
      energy: d.energy ?? null,
      motivation: d.motivation ?? null,
      sleepHours: d.sleepHours ?? null,
    });

    const data = {
      userId,
      date: d.date,
      restingHr: d.restingHr ?? null,
      hrv: d.hrv ?? null,
      sleepHours: d.sleepHours ?? null,
      sleepQuality: d.sleepQuality ?? null,
      soreness: d.soreness ?? null,
      stress: d.stress ?? null,
      mood: d.mood ?? null,
      energy: d.energy ?? null,
      motivation: d.motivation ?? null,
      score: d.score ?? computed.score,
      recommendation: d.recommendation ?? computed.recommendation,
      notes: d.notes ?? null,
    };

    const check = await prisma.readinessCheck.upsert({
      where: { userId_date: { userId, date: d.date } },
      update: data,
      create: data,
    });

    return NextResponse.json({
      ...check,
      computed: {
        label: computed.label,
        description: computed.description,
        color: computed.color,
      },
    }, { status: 201 });
  });
}
