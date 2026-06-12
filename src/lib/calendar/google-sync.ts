import { prisma } from "@/lib/prisma";
import {
  refreshAccessToken,
  listEvents,
  mapGoogleEvent,
  type GoogleEvent,
} from "@/lib/calendar/google";

const GOOGLE_GROUP_NAME = "Google Calendar";
const GOOGLE_GROUP_COLOR = "#4285F4";

type Connection = {
  id: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string;
  expiresAt: Date | null;
  calendarId: string;
  syncToken: string | null;
};

/** Devuelve un access token válido, renovándolo si está vencido. */
async function getValidAccessToken(conn: Connection): Promise<string> {
  const stillValid =
    conn.accessToken && conn.expiresAt && conn.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return conn.accessToken as string;

  const refreshed = await refreshAccessToken(conn.refreshToken);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await prisma.googleCalendarConnection.update({
    where: { id: conn.id },
    data: { accessToken: refreshed.access_token, expiresAt },
  });
  return refreshed.access_token;
}

/** Asegura el grupo "Google Calendar" del usuario y devuelve su id. */
async function ensureGoogleGroup(userId: string): Promise<string> {
  const existing = await prisma.calendarGroup.findFirst({
    where: { userId, name: GOOGLE_GROUP_NAME },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.calendarGroup.create({
    data: { userId, name: GOOGLE_GROUP_NAME, color: GOOGLE_GROUP_COLOR, icon: "📅" },
    select: { id: true },
  });
  return created.id;
}

export interface SyncResult {
  imported: number;
  removed: number;
}

/**
 * Sincroniza el Google Calendar del usuario hacia la app (solo lectura).
 * Idempotente: usa googleEventId para deduplicar; eventos cancelados se
 * eliminan. Maneja syncToken vencido (410) con full resync.
 */
export async function syncGoogleCalendar(userId: string): Promise<SyncResult> {
  const conn = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!conn) throw new Error("Sin conexión a Google Calendar");

  const accessToken = await getValidAccessToken(conn);
  const groupId = await ensureGoogleGroup(userId);

  let result = await listEvents(accessToken, conn.calendarId, conn.syncToken);
  if (result.expired) {
    // syncToken inválido → full resync desde cero.
    result = await listEvents(accessToken, conn.calendarId, null);
  }

  let imported = 0;
  let removed = 0;

  for (const ev of result.events as GoogleEvent[]) {
    if (ev.status === "cancelled") {
      const del = await prisma.calendarEvent.deleteMany({
        where: { userId, googleEventId: ev.id },
      });
      removed += del.count;
      continue;
    }
    const mapped = mapGoogleEvent(ev);
    if (!mapped) continue;
    await prisma.calendarEvent.upsert({
      where: { userId_googleEventId: { userId, googleEventId: ev.id } },
      create: {
        userId,
        googleEventId: ev.id,
        groupId,
        type: "custom",
        title: mapped.title,
        description: mapped.description,
        location: mapped.location,
        startAt: mapped.startAt,
        endAt: mapped.endAt,
        allDay: mapped.allDay,
      },
      update: {
        title: mapped.title,
        description: mapped.description,
        location: mapped.location,
        startAt: mapped.startAt,
        endAt: mapped.endAt,
        allDay: mapped.allDay,
        groupId,
      },
    });
    imported++;
  }

  await prisma.googleCalendarConnection.update({
    where: { id: conn.id },
    data: {
      syncToken: result.nextSyncToken ?? conn.syncToken,
      lastSyncedAt: new Date(),
    },
  });

  return { imported, removed };
}
