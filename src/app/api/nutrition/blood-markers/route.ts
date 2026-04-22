import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, bloodMarkerCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      Math.max(parseInt(searchParams.get("days") ?? "180", 10) || 180, 1),
      730,
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const markers = await prisma.bloodMarker.findMany({
      where: { userId, date: { gte: cutoffStr } },
      orderBy: [{ date: "desc" }, { measuredAt: "desc" }, { createdAt: "desc" }],
      take: 500,
    });
    return NextResponse.json(markers);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, bloodMarkerCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    const created = await prisma.bloodMarker.create({
      data: {
        userId,
        date: d.date,
        measuredAt: d.measuredAt ? new Date(d.measuredAt) : null,
        context: d.context ?? null,
        glucoseMgDl: d.glucoseMgDl ?? null,
        a1cPercent: d.a1cPercent ?? null,
        ketonesMmolL: d.ketonesMmolL ?? null,
        insulinMuIml: d.insulinMuIml ?? null,
        systolic: d.systolic ?? null,
        diastolic: d.diastolic ?? null,
        heartRate: d.heartRate ?? null,
        totalCholesterol: d.totalCholesterol ?? null,
        hdl: d.hdl ?? null,
        ldl: d.ldl ?? null,
        triglycerides: d.triglycerides ?? null,
        source: d.source ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  });
}
