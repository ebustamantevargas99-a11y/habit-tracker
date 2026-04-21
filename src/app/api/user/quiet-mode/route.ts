import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";

const updateSchema = z.object({
  quietModeAuto: z.boolean().optional(),
  quietModeForced: z.boolean().optional(),
});

// GET: devuelve estado calculado de quiet mode
// auto = si user tiene quietModeAuto=true Y mood avg < 5 últimos 7d
export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { quietModeAuto: true, quietModeForced: true },
    });
    if (!profile) return NextResponse.json({ active: false });

    if (profile.quietModeForced) {
      return NextResponse.json({
        active: true,
        reason: "manual",
        quietModeAuto: profile.quietModeAuto,
        quietModeForced: true,
      });
    }

    if (!profile.quietModeAuto) {
      return NextResponse.json({
        active: false,
        quietModeAuto: false,
        quietModeForced: false,
      });
    }

    // Calcular mood avg últimos 7 días
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const moods = await prisma.moodLog.findMany({
      where: { userId, date: { gte: cutoffStr } },
      select: { mood: true },
    });
    if (moods.length < 3) {
      return NextResponse.json({
        active: false,
        reason: "insufficient_data",
        quietModeAuto: true,
        quietModeForced: false,
      });
    }
    const avg = moods.reduce((s, m) => s + m.mood, 0) / moods.length;
    return NextResponse.json({
      active: avg < 5,
      reason: avg < 5 ? "low_mood_auto" : null,
      moodAvg: +avg.toFixed(1),
      quietModeAuto: true,
      quietModeForced: false,
    });
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, updateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: {
        ...(d.quietModeAuto !== undefined ? { quietModeAuto: d.quietModeAuto } : {}),
        ...(d.quietModeForced !== undefined ? { quietModeForced: d.quietModeForced } : {}),
      },
      select: { quietModeAuto: true, quietModeForced: true },
    });
    return NextResponse.json(updated);
  });
}
