"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import SectionHeader from "./primitives/section-header";
import AIExportModal from "@/components/features/ai-export/ai-export-modal";
import type { ExportScope } from "@/lib/ai-export/types";

interface Item {
  key: "daily" | "weekly" | "holistic";
  label: string;
  desc: string;
}

const ITEMS: Item[] = [
  {
    key: "daily",
    label: "Analizar mi día",
    desc: "Hábitos, comidas, foco y más de hoy. Se arma el contexto y lo pegas en tu IA favorita.",
  },
  {
    key: "weekly",
    label: "Analizar mi semana",
    desc: "Tendencias, baches y victorias de los últimos 7 días agregados en un único prompt.",
  },
  {
    key: "holistic",
    label: "Perfil completo → IA",
    desc: "Snapshot entero del sistema: todo tu historial relevante en un solo mensaje.",
  },
];

/**
 * AI Hub — 3 cards grandes, cada una abre el AIExportModal con el
 * scope pre-seleccionado. Reutiliza el modal existente que ya maneja
 * provider (Claude / ChatGPT / Gemini) + estilo (coach / analyst /
 * retrospective / projection) + rango de fechas.
 */
export default function AIHub() {
  const [openScope, setOpenScope] = useState<ExportScope | null>(null);

  return (
    <section>
      <SectionHeader
        eyebrow="Asistente"
        title="Llévate esto a tu IA favorita"
        subtitle="Un click abre el modal con el contexto listo para enviar a Claude, ChatGPT o Gemini."
      />
      <div className="grid gap-4 mt-5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {ITEMS.map((it, i) => (
          <button
            key={it.key}
            type="button"
            onClick={() => setOpenScope(it.key)}
            className="ht-card ht-card-interactive text-left flex flex-col gap-3.5"
            style={{
              padding: 24,
              cursor: "pointer",
              animation: `ht-fadeUp .55s ${80 + i * 80}ms both`,
              minHeight: 160,
              fontFamily: "inherit",
              color: "inherit",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background:
                  "color-mix(in oklab, var(--color-accent) 18%, var(--color-warm-white))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
              }}
            >
              <Sparkles size={18} strokeWidth={1.75} />
            </div>
            <h3
              className="ht-serif m-0"
              style={{
                fontSize: 22,
                lineHeight: 1.15,
                color: "var(--color-brown)",
                fontWeight: 700,
                letterSpacing: "-0.015em",
              }}
            >
              {it.label}
            </h3>
            <p style={{ color: "var(--color-warm)", fontSize: 13, lineHeight: 1.5, flex: 1 }}>
              {it.desc}
            </p>
            <div
              className="flex items-center gap-1"
              style={{ color: "var(--color-accent)", fontSize: 12.5, fontWeight: 500 }}
            >
              Abrir diálogo <ArrowRight size={13} strokeWidth={1.75} />
            </div>
          </button>
        ))}
      </div>

      <AIExportModal
        open={openScope !== null}
        onClose={() => setOpenScope(null)}
        initialScope={openScope ?? "daily"}
        title={
          openScope === "weekly"
            ? "Resumen semanal"
            : openScope === "holistic"
              ? "Perfil completo → IA"
              : "Cierre del día"
        }
      />
    </section>
  );
}
