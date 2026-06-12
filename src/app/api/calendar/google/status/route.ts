import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { googleConfigured } from "@/lib/calendar/google";

// GET /api/calendar/google/status → estado de la conexión.
export async function GET() {
  return withAuth(async (userId) => {
    const conn = await prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { email: true, lastSyncedAt: true },
    });
    return NextResponse.json({
      configured: googleConfigured(),
      connected: !!conn,
      email: conn?.email ?? null,
      lastSyncedAt: conn?.lastSyncedAt ?? null,
    });
  });
}
