import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, stepsCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const days = Math.min(
      parseInt(searchParams.get("days") ?? "7", 10) || 7,
      730
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const rows = await prisma.bodyMetric.findMany({
      where: {
        userId,
        type: "steps",
        date: { gte: cutoff.toISOString().split("T")[0] },
      },
      orderBy: { date: "asc" },
      select: { date: true, value: true },
    });

    return NextResponse.json(
      rows.map((r) => ({ date: r.date, steps: Math.round(r.value) }))
    );
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, stepsCreateSchema);
    if (!parsed.ok) return parsed.response;

    const metric = await prisma.bodyMetric.create({
      data: {
        userId,
        date: parsed.data.date,
        type: "steps",
        value: parsed.data.steps,
        unit: "steps",
      },
    });

    return NextResponse.json(
      { date: metric.date, steps: Math.round(metric.value) },
      { status: 201 }
    );
  });
}
