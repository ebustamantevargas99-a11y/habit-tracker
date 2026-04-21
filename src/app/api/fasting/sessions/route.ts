import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, fastingStartSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10)));

    const sessions = await prisma.fastingSession.findMany({
      where: { userId, ...(activeOnly ? { endedAt: null } : {}) },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return NextResponse.json(sessions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, fastingStartSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;

    // Cerrar cualquier sesión abierta previa
    await prisma.fastingSession.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: new Date() },
    });

    const session = await prisma.fastingSession.create({
      data: {
        userId,
        startedAt: d.startedAt ? new Date(d.startedAt) : new Date(),
        targetHours: d.targetHours ?? 16,
        protocol: d.protocol ?? null,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(session, { status: 201 });
  });
}
