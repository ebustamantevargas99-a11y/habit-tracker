import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { z } from "zod";

const sleepLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bedtime: z.string().max(10),
  wakeTime: z.string().max(10),
  quality: z.number().int().min(1).max(10),
  durationHours: z.number().finite().min(0).max(24).optional(),
  dreamJournal: z.string().max(5000).optional().nullable(),
  factors: z.array(z.string().max(50)).max(30).optional(),
});

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10) || 30, 366);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const logs = await prisma.sleepLog.findMany({
      where: {
        userId,
        date: { gte: cutoff.toISOString().split("T")[0] },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, sleepLogSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const targetDate = d.date ?? new Date().toISOString().split("T")[0];

    const log = await prisma.sleepLog.upsert({
      where: { userId_date: { userId, date: targetDate } },
      create: {
        userId,
        date: targetDate,
        bedtime: d.bedtime,
        wakeTime: d.wakeTime,
        quality: d.quality,
        durationHours: d.durationHours ?? 0,
        dreamJournal: d.dreamJournal ?? null,
        factors: d.factors ?? [],
      },
      update: {
        bedtime: d.bedtime,
        wakeTime: d.wakeTime,
        quality: d.quality,
        durationHours: d.durationHours ?? 0,
        dreamJournal: d.dreamJournal ?? null,
        factors: d.factors ?? [],
      },
    });
    return NextResponse.json(log);
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id.length > 64)
      return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const log = await prisma.sleepLog.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!log)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.sleepLog.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  });
}
