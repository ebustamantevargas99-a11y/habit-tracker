import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, focusSessionStartSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const sessions = await prisma.focusSession.findMany({
      where: { userId, ...(activeOnly ? { endedAt: null } : {}) },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
    return NextResponse.json(sessions);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, focusSessionStartSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    // Cerrar sesiones abiertas previas
    await prisma.focusSession.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: new Date() },
    });
    const session = await prisma.focusSession.create({
      data: {
        userId,
        startedAt: new Date(),
        plannedMinutes: d.plannedMinutes ?? 90,
        task: d.task ?? null,
        category: d.category ?? null,
      },
    });
    return NextResponse.json(session, { status: 201 });
  });
}
