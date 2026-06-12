import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { googleConfigured, buildAuthUrl, signState } from "@/lib/calendar/google";

// GET /api/calendar/google/connect → redirige al consentimiento de Google.
export async function GET() {
  return withAuth(async (userId) => {
    if (!googleConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar no está configurado en el servidor" },
        { status: 503 },
      );
    }
    const url = buildAuthUrl(signState(userId));
    return NextResponse.redirect(url);
  });
}
