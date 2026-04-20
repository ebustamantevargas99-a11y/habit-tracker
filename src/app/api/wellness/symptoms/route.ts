import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, symptomCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      parseInt(searchParams.get("days") ?? "30", 10) || 30,
      365
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await prisma.symptomLog.findMany({
      where: { userId, date: { gte: cutoff.toISOString().split("T")[0] } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, symptomCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const log = await prisma.symptomLog.create({
      data: {
        userId,
        date: d.date ?? new Date().toISOString().split("T")[0],
        symptom: d.symptom,
        intensity: d.intensity,
        duration: d.duration ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  });
}
