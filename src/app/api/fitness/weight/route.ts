import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, weightCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10) || 30, 730);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const rows = await prisma.bodyMetric.findMany({
      where: {
        userId,
        type: "weight",
        date: { gte: cutoff.toISOString().split("T")[0] },
      },
      orderBy: { date: "asc" },
      select: { date: true, value: true },
    });

    return NextResponse.json(rows.map((r) => ({ date: r.date, weight: r.value })));
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, weightCreateSchema);
    if (!parsed.ok) return parsed.response;

    const metric = await prisma.bodyMetric.create({
      data: {
        userId,
        date: parsed.data.date,
        type: "weight",
        value: parsed.data.weight,
        unit: "kg",
      },
    });
    return NextResponse.json(
      { date: metric.date, weight: metric.value },
      { status: 201 }
    );
  });
}
