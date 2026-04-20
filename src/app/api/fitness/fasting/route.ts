import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, fastingCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "20", 10) || 20,
      200
    );

    const logs = await prisma.fastingLog.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: limit,
    });
    return NextResponse.json(logs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, fastingCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    const log = await prisma.fastingLog.create({
      data: {
        userId,
        startTime: new Date(d.startTime),
        endTime: d.endTime ? new Date(d.endTime) : null,
        targetHours: d.targetHours ?? 16,
        completed: d.completed ?? false,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  });
}
