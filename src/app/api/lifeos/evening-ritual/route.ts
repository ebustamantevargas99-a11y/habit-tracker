import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, eveningRitualUpsertSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const ritual = await prisma.eveningRitual.findUnique({
      where: { userId_date: { userId, date } },
    });
    return NextResponse.json(ritual);
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, eveningRitualUpsertSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const date = d.date ?? new Date().toISOString().split("T")[0];

    const ritual = await prisma.eveningRitual.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        sleepTime: d.sleepTime ?? null,
        reflection: d.reflection ?? null,
        gratitude: d.gratitude ?? [],
        tomorrowTop3: d.tomorrowTop3 ?? [],
        medsDone: d.medsDone ?? false,
      },
      update: {
        ...(d.sleepTime !== undefined ? { sleepTime: d.sleepTime } : {}),
        ...(d.reflection !== undefined ? { reflection: d.reflection } : {}),
        ...(d.gratitude !== undefined ? { gratitude: d.gratitude } : {}),
        ...(d.tomorrowTop3 !== undefined ? { tomorrowTop3: d.tomorrowTop3 } : {}),
        ...(d.medsDone !== undefined ? { medsDone: d.medsDone } : {}),
      },
    });
    return NextResponse.json(ritual);
  });
}
