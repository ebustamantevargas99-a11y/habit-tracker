import crypto from "crypto";
import { appUrl } from "@/lib/app-url";

// ─── Integración Google Calendar (solo lectura) ───────────────────────────────
// La app refleja el Google Calendar del usuario. Pedimos calendar.readonly +
// email. Usamos singleEvents=true para que Google expanda las series en
// instancias individuales (cada una con su id) → no necesitamos mapear RRULE.

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
].join(" ");

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function clientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID no configurado");
  return id;
}
function clientSecret(): string {
  const s = process.env.GOOGLE_CLIENT_SECRET;
  if (!s) throw new Error("GOOGLE_CLIENT_SECRET no configurado");
  return s;
}

export function redirectUri(): string {
  return appUrl("/api/calendar/google/callback");
}

// ─── State firmado (CSRF) ─────────────────────────────────────────────────────
const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";

export function signState(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, ts: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyState(state: string): string | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const { uid, ts } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof uid !== "string" || typeof ts !== "number") return null;
    if (Date.now() - ts > 10 * 60 * 1000) return null; // state válido 10 min
    return uid;
  } catch {
    return null;
  }
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // necesario para refresh_token
    prompt: "consent", // fuerza refresh_token en cada conexión
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange falló: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh falló: ${res.status}`);
  return res.json();
}

export async function fetchUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email ?? null;
  } catch {
    return null;
  }
}

export interface GoogleEvent {
  id: string;
  status?: string; // "confirmed" | "cancelled" | ...
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface ListResult {
  events: GoogleEvent[];
  nextSyncToken: string | null;
  expired: boolean; // 410 → token de sync inválido, requiere full resync
}

/**
 * Lista eventos del calendario. Con syncToken hace sync incremental; sin él,
 * trae desde `timeMinDaysAgo` días atrás. singleEvents=true expande series.
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  syncToken: string | null,
  timeMinDaysAgo = 30,
  timeMaxDaysAhead = 120,
): Promise<ListResult> {
  const events: GoogleEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;
  let pages = 0;
  const MAX_PAGES = 12; // tope de seguridad: ~3000 eventos máx por sync

  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      maxResults: "250",
      showDeleted: "true", // para eliminar cancelados en sync incremental
    });
    if (syncToken) {
      params.set("syncToken", syncToken);
    } else {
      // Ventana acotada [-30d, +120d]: sin timeMax, las series recurrentes
      // se expanden a miles de instancias y la función se cuelga/timeout.
      params.set("timeMin", new Date(Date.now() - timeMinDaysAgo * 86400000).toISOString());
      params.set("timeMax", new Date(Date.now() + timeMaxDaysAhead * 86400000).toISOString());
      params.set("orderBy", "startTime");
    }
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.status === 410) {
      // syncToken inválido → el caller debe reintentar sin token (full sync).
      return { events: [], nextSyncToken: null, expired: true };
    }
    if (!res.ok) throw new Error(`Google events.list falló: ${res.status}`);

    const data = await res.json();
    for (const item of data.items ?? []) events.push(item as GoogleEvent);
    pageToken = data.nextPageToken;
    if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
    pages++;
  } while (pageToken && pages < MAX_PAGES);

  return { events, nextSyncToken, expired: false };
}

/** Mapea un evento de Google a los campos de nuestro CalendarEvent. */
export function mapGoogleEvent(ev: GoogleEvent): {
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
} | null {
  const startRaw = ev.start?.dateTime ?? ev.start?.date;
  if (!startRaw) return null;
  const allDay = !ev.start?.dateTime; // si solo hay `date`, es de día completo
  const startAt = new Date(startRaw);
  const endRaw = ev.end?.dateTime ?? ev.end?.date ?? null;
  const endAt = endRaw ? new Date(endRaw) : null;
  return {
    title: ev.summary?.trim() || "(sin título)",
    description: ev.description?.trim() || null,
    location: ev.location?.trim() || null,
    startAt,
    endAt,
    allDay,
  };
}
