"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { parseQuickAdd } from "@/lib/calendar/nlp";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { CalendarEvent } from "./types";

const EXAMPLES = [
  "Cena con Ana viernes 8pm",
  "Reunión mañana 3pm 1h",
  "Yoga lunes 7am 45min",
  "Cumple mamá 25 de mayo",
  "Deep work hoy 9am 2h",
];

export default function QuickAddBar({
  onCreated,
}: {
  onCreated: (event: CalendarEvent) => void;
}) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);
  const preview = input.trim() ? parseQuickAdd(input) : null;

  async function submit() {
    if (!input.trim()) return;
    const parsed = parseQuickAdd(input);
    setSubmitting(true);
    try {
      const event = await api.post<CalendarEvent>("/calendar/events", {
        title: parsed.title,
        startAt: parsed.startAt.toISOString(),
        endAt: parsed.endAt?.toISOString() ?? null,
        allDay: parsed.allDay,
        type: "custom",
      });
      onCreated(event);
      setInput("");
      toast.success(`"${event.title}" agendado`);
    } catch {
      toast.error("Error creando evento");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-accent" />
        <span className="text-xs uppercase tracking-widest text-brand-warm font-semibold">
          Quick add
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={EXAMPLES[exampleIdx]}
          onFocus={() => setExampleIdx((i) => (i + 1) % EXAMPLES.length)}
          className="flex-1 px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
        />
        <button
          onClick={submit}
          disabled={submitting || !input.trim()}
          className="px-5 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown disabled:opacity-40 flex items-center gap-1.5"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : "Agendar"}
        </button>
      </div>
      {preview && preview.confidence !== "low" && (
        <div className="mt-2 text-xs text-brand-warm flex flex-wrap gap-2">
          <span className="font-semibold text-brand-dark">{preview.title}</span>
          <span>·</span>
          <span>
            {preview.startAt.toLocaleDateString("es-MX", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          {!preview.allDay && (
            <>
              <span>·</span>
              <span className="font-mono">
                {preview.startAt.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {preview.endAt && (
                  <>
                    {" – "}
                    {preview.endAt.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </span>
            </>
          )}
          <span className="ml-auto text-brand-tan">
            {preview.confidence === "high" ? "alta confianza" : "media confianza"}
          </span>
        </div>
      )}
    </div>
  );
}
