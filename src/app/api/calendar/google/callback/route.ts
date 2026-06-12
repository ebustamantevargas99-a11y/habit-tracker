import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import {
  exchangeCode,
  fetchUserEmail,
  verifyState,
  googleConfigured,
} from "@/lib/calendar/google";
import { captureException } from "@/lib/sentry";

// GET /api/calendar/google/callback?code=...&state=...
// Google redirige aquí tras el consentimiento. No usa withAuth (es una
// navegación top-level); la identidad viaja firmada en `state`.
export async function GET(req: NextRequest) {
  const calendarUrl = appUrl("/?page=plan&tab=week");
  const fail = (reason: string) =>
    NextResponse.redirect(appUrl(`/?page=plan&tab=week&google=error&reason=${reason}`));

  try {
    if (!googleConfigured()) return fail("not_configured");

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    if (error) return fail("denied");
    if (!code || !state) return fail("missing_params");

    const userId = verifyState(state);
    if (!userId) return fail("bad_state");

    // El usuario debe existir (defensa adicional).
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("no_user");

    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      // Sin refresh_token no podemos renovar acceso (suele pasar si ya se
      // autorizó antes sin prompt=consent). Pedimos reconsentir.
      return fail("no_refresh_token");
    }
    const email = await fetchUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.googleCalendarConnection.upsert({
      where: { userId },
      create: {
        userId,
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        calendarId: "primary",
      },
      update: {
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        syncToken: null, // forzar full sync al reconectar
      },
    });

    // NO bloqueamos el redirect con la importación: en serverless una sync
    // larga (muchos eventos recurrentes) cuelga la función. Redirigimos al
    // instante; el auto-sync al cargar el calendario importa los eventos.
    return NextResponse.redirect(`${calendarUrl}&google=connected`);
  } catch (e) {
    captureException(e, { tags: { area: "google-calendar-callback" } });
    return fail("server_error");
  }
}
