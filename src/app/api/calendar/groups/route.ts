import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, calendarGroupCreateSchema } from "@/lib/validation";

/**
 * GET  /api/calendar/groups → lista de grupos del user ordenados
 * POST /api/calendar/groups → crea un nuevo grupo
 */

export async function GET() {
  return withAuth(async (userId) => {
    const groups = await prisma.calendarGroup.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(groups);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, calendarGroupCreateSchema);
    if (!parsed.ok) return parsed.response;

    const d = parsed.data;
    // Si no viene sortOrder, lo colocamos al final
    const last = await prisma.calendarGroup.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSort = d.sortOrder ?? (last ? last.sortOrder + 1 : 0);

    const created = await prisma.calendarGroup.create({
      data: {
        userId,
        name: d.name,
        color: d.color ?? "#b8860b",
        icon: d.icon ?? null,
        visible: d.visible ?? true,
        sortOrder: nextSort,
      },
    });
    return NextResponse.json(created, { status: 201 });
  });
}
