import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, morningRitualUpsertSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const ritual = await prisma.morningRitual.findUnique({
      where: { userId_date: { userId, date } },
    });
    return NextResponse.json(ritual);
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, morningRitualUpsertSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const date = d.date ?? new Date().toISOString().split("T")[0];

    const ritual = await prisma.morningRitual.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        wakeTime: d.wakeTime ?? null,
        hydration: d.hydration ?? false,
        meditation: d.meditation ?? false,
        intention: d.intention ?? null,
        gratitude: d.gratitude ?? [],
        energy: d.energy ?? null,
      },
      update: {
        ...(d.wakeTime !== undefined ? { wakeTime: d.wakeTime } : {}),
        ...(d.hydration !== undefined ? { hydration: d.hydration } : {}),
        ...(d.meditation !== undefined ? { meditation: d.meditation } : {}),
        ...(d.intention !== undefined ? { intention: d.intention } : {}),
        ...(d.gratitude !== undefined ? { gratitude: d.gratitude } : {}),
        ...(d.energy !== undefined ? { energy: d.energy } : {}),
      },
    });
    return NextResponse.json(ritual);
  });
}
