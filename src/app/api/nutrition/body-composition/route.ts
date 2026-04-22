import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bodyCompositionCreateSchema } from "@/lib/validation";
import { deriveMissingFields } from "@/lib/nutrition/body-composition";

/**
 * GET  /api/nutrition/body-composition?days=180  → lista mediciones
 * POST /api/nutrition/body-composition           → upsert (única por userId+date)
 *
 * BodyComposition es el modelo que alimenta el hub "Composición" (bioimpedancia).
 * Vive compartido con Fitness (creado en Fase 1 de Fitness redesign).
 */

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const days = Math.min(
      1095,
      Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 180),
    );
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const list = await prisma.bodyComposition.findMany({
      where: { userId, date: { gte: sinceStr } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(list);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, bodyCompositionCreateSchema);
    if (!parsed.ok) return parsed.response;

    // Deriva campos faltantes (si el user da peso + %grasa, llenamos LBM/fatMass)
    const d = deriveMissingFields(parsed.data);

    const data = {
      userId,
      date: parsed.data.date,
      weightKg: d.weightKg ?? null,
      bodyFatPercent: d.bodyFatPercent ?? null,
      leanMassKg: d.leanMassKg ?? null,
      fatMassKg: d.fatMassKg ?? null,
      waterPercent: d.waterPercent ?? null,
      visceralFat: d.visceralFat ?? null,
      boneMassKg: d.boneMassKg ?? null,
      bmr: d.bmr ?? null,
      method: d.method ?? null,
      notes: d.notes ?? null,
    };

    // Upsert por userId+date (permite actualizar la medición del día)
    const saved = await prisma.bodyComposition.upsert({
      where: { userId_date: { userId, date: parsed.data.date } },
      update: data,
      create: data,
    });
    return NextResponse.json(saved, { status: 201 });
  });
}
