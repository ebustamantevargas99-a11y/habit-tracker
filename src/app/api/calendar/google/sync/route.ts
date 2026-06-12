import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { syncGoogleCalendar } from "@/lib/calendar/google-sync";
import { captureException } from "@/lib/sentry";

// POST /api/calendar/google/sync → sincroniza eventos de Google a la app.
export async function POST() {
  return withAuth(async (userId) => {
    const conn = await prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!conn) {
      return NextResponse.json({ error: "Sin conexión a Google Calendar" }, { status: 404 });
    }
    try {
      const result = await syncGoogleCalendar(userId);
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      captureException(e, { user: { id: userId }, tags: { area: "google-calendar-sync" } });
      return NextResponse.json(
        { error: "No se pudo sincronizar. Reconecta tu Google Calendar." },
        { status: 502 },
      );
    }
  });
}
