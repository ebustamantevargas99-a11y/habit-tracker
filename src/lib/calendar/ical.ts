// Generador de archivos iCalendar (.ics) según RFC 5545.
// Compatible con Google Calendar, Apple Calendar, Outlook, etc.

type EventForICal = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  location: string | null;
  recurrence: string | null;
  recurrenceEnd: Date | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatICalDate(d: Date, allDay: boolean): string {
  if (allDay) {
    return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
  }
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  // RFC: líneas no pueden exceder 75 octetos. Doblar con CRLF + espacio.
  if (line.length <= 75) return line;
  const out: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    out.push(remaining.slice(0, 75));
    remaining = remaining.slice(75);
  }
  out.push(remaining);
  return out.join("\r\n ");
}

export function generateICal(events: EventForICal[], calendarName = "Ultimate TRACKER"): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ultimate TRACKER//EN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${ev.id}@ultimate-tracker`));
    lines.push(`DTSTAMP:${formatICalDate(now, false)}`);
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICalDate(ev.startAt, true)}`);
      if (ev.endAt) {
        lines.push(`DTEND;VALUE=DATE:${formatICalDate(ev.endAt, true)}`);
      }
    } else {
      lines.push(`DTSTART:${formatICalDate(ev.startAt, false)}`);
      if (ev.endAt) {
        lines.push(`DTEND:${formatICalDate(ev.endAt, false)}`);
      }
    }
    lines.push(foldLine(`SUMMARY:${escapeText(ev.title)}`));
    if (ev.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(ev.description)}`));
    }
    if (ev.location) {
      lines.push(foldLine(`LOCATION:${escapeText(ev.location)}`));
    }
    if (ev.recurrence) {
      const rrule = ev.recurrence.toUpperCase().startsWith("FREQ=")
        ? ev.recurrence.toUpperCase()
        : null;
      if (rrule) {
        let rule = rrule;
        if (ev.recurrenceEnd) {
          rule += `;UNTIL=${formatICalDate(ev.recurrenceEnd, false)}`;
        }
        lines.push(`RRULE:${rule}`);
      }
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
