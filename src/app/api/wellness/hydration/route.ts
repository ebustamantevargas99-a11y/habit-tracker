import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { z } from "zod";

const hydrationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountMl: z.number().int().nonnegative().max(100000).optional(),
  goalMl: z.number().int().nonnegative().max(100000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

const hydrationIncrementSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deltaMl: z.number().int().min(-5000).max(5000),
});

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10) || 30, 366);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const logs = await prisma.hydrationLog.findMany({
      where: { userId, date: { gte: cutoffStr } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, hydrationSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const targetDate = d.date ?? new Date().toISOString().split("T")[0];

    const log = await prisma.hydrationLog.upsert({
      where: { userId_date: { userId, date: targetDate } },
      create: {
        userId,
        date: targetDate,
        amountMl: d.amountMl ?? 0,
        goalMl: d.goalMl ?? 2500,
        notes: d.notes ?? null,
      },
      update: {
        amountMl: d.amountMl ?? 0,
        goalMl: d.goalMl ?? 2500,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(log);
  });
}

// PATCH → incrementa amountMl por deltaMl (crea si no existe)
export async function PATCH(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, hydrationIncrementSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const targetDate = d.date ?? new Date().toISOString().split("T")[0];

    const existing = await prisma.hydrationLog.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    });

    const newAmount = Math.max(0, (existing?.amountMl ?? 0) + d.deltaMl);
    const log = await prisma.hydrationLog.upsert({
      where: { userId_date: { userId, date: targetDate } },
      create: { userId, date: targetDate, amountMl: newAmount, goalMl: 2500 },
      update: { amountMl: newAmount },
    });
    return NextResponse.json(log);
  });
}
