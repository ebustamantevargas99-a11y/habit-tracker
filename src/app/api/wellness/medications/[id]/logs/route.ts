import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, medicationLogUpsertSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const med = await prisma.medication.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!med)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const days = Math.min(
      parseInt(searchParams.get("days") ?? "30", 10) || 30,
      365
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await prisma.medicationLog.findMany({
      where: {
        medicationId: params.id,
        userId,
        date: { gte: cutoff.toISOString().split("T")[0] },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const med = await prisma.medication.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!med)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, medicationLogUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const targetDate = d.date ?? new Date().toISOString().split("T")[0];

    const log = await prisma.medicationLog.upsert({
      where: { medicationId_date: { medicationId: params.id, date: targetDate } },
      create: {
        userId,
        medicationId: params.id,
        date: targetDate,
        taken: d.taken ?? false,
        takenAt: d.taken ? new Date() : null,
        notes: d.notes ?? null,
      },
      update: {
        taken: d.taken ?? false,
        takenAt: d.taken ? new Date() : null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(log);
  });
}
