"use client";

import { useEffect } from "react";
import { api } from "@/lib/api-client";
import type { CalendarEvent } from "./types";

const NOTIFIED_KEY = "ut-notified-events";

// Clave única por ocurrencia: `${eventId}@${startAtISO}`. Para eventos
// recurrentes el id se repite entre ocurrencias, así que sin el sufijo
// de fecha la notificación del lunes bloquearía la del jueves.
function notifyKey(ev: CalendarEvent): string {
  return `${ev.id}@${ev.startAt}`;
}

function getNotifiedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function addNotifiedId(key: string) {
  const current = getNotifiedIds();
  current.add(key);
  // Trimar a últimos 500 para no explotar localStorage
  const arr = Array.from(current).slice(-500);
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * Chequea cada minuto si algún evento próximo debe disparar recordatorio.
 * Solo si el user concedió permiso de Notifications.
 */
export default function ReminderScheduler() {
  useEffect(() => {
    if (typeof Notification === "undefined") return;

    async function check() {
      if (Notification.permission !== "granted") return;

      // Fetch eventos de próximas 2 horas con recordatorio configurado
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      try {
        const events = await api.get<CalendarEvent[]>(
          `/calendar/events?from=${now.toISOString()}&to=${twoHoursLater.toISOString()}`
        );
        const notified = getNotifiedIds();

        for (const ev of events) {
          if (ev.reminderMinutes === null || ev.reminderMinutes === undefined) continue;
          if (ev.completed) continue;
          const key = notifyKey(ev);
          if (notified.has(key)) continue;

          const eventTime = new Date(ev.startAt).getTime();
          const reminderTime = eventTime - ev.reminderMinutes * 60 * 1000;
          const nowMs = Date.now();

          if (nowMs >= reminderTime && nowMs < eventTime) {
            new Notification("⏰ Ultimate TRACKER · " + ev.title, {
              body:
                (ev.reminderMinutes === 0
                  ? "Comienza ahora"
                  : `En ${ev.reminderMinutes} min`) +
                (ev.location ? ` · ${ev.location}` : ""),
              icon: "/favicon.ico",
              tag: key,
            });
            addNotifiedId(key);
          }
        }
      } catch {
        // Silencioso
      }
    }

    void check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
