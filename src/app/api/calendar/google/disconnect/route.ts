import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

// POST /api/calendar/google/disconnect → corta la conexión.
// Body opcional { deleteEvents: true } para borrar también los eventos
// importados de Google (los nativos de la app no se tocan).
export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    let deleteEvents = false;
    try {
      const body = await req.json();
      deleteEvents = body?.deleteEvents === true;
    } catch {
      /* sin body */
    }

    if (deleteEvents) {
      await prisma.calendarEvent.deleteMany({
        where: { userId, googleEventId: { not: null } },
      });
    }
    await prisma.googleCalendarConnection.deleteMany({ where: { userId } });

    return NextResponse.json({ ok: true });
  });
}
