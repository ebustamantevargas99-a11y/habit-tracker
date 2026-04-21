import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, timeCapsuleCreateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest) {
  return withAuth(async (userId) => {
    const capsules = await prisma.timeCapsule.findMany({
      where: { userId },
      orderBy: { unlockAt: "asc" },
    });
    // Marcar como "ready" sin revelar message si aún no llegó la fecha
    const now = new Date();
    const safe = capsules.map((c) => ({
      id: c.id,
      unlockAt: c.unlockAt,
      opened: c.opened,
      openedAt: c.openedAt,
      createdAt: c.createdAt,
      ready: c.unlockAt <= now,
      message: c.unlockAt <= now ? c.message : null,
    }));
    return NextResponse.json(safe);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, timeCapsuleCreateSchema);
    if (!parsed.ok) return parsed.response;
    const d = parsed.data;
    const unlockAt = new Date(d.unlockAt);
    if (unlockAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "La fecha debe estar en el futuro" },
        { status: 400 }
      );
    }
    const capsule = await prisma.timeCapsule.create({
      data: { userId, message: d.message, unlockAt },
    });
    return NextResponse.json(
      { id: capsule.id, unlockAt: capsule.unlockAt, opened: false, message: null, ready: false },
      { status: 201 }
    );
  });
}
