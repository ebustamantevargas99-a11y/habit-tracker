"use client";

import { useState } from "react";
import { Sparkles, Copy } from "lucide-react";
import SectionHeader from "./primitives/section-header";

interface Item {
  key: "day" | "week" | "full";
  label: string;
  desc: string;
  buildText: () => string;
}

interface Props {
  items?: Item[];
}

const DEFAULT_ITEMS: Item[] = [
  {
    key: "day",
    label: "Analizar mi día",
    desc: "Hábitos, comidas, foco — copia contexto al portapapeles.",
    buildText: () =>
      `Resumen del día ${new Date().toISOString().slice(0, 10)}: (pendiente de conectar datos reales)`,
  },
  {
    key: "week",
    label: "Analizar mi semana",
    desc: "Tendencias, baches y victorias de los últimos 7 días.",
    buildText: () => `Resumen semanal: (pendiente de conectar datos reales)`,
  },
  {
    key: "full",
    label: "Perfil completo → IA",
    desc: "Snapshot entero: todo tu sistema en un mensaje.",
    buildText: () => `Perfil completo: (pendiente de conectar datos reales)`,
  },
];

export default function AIHub({ items = DEFAULT_ITEMS }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const handle = (item: Item) => {
    const text = item.buildText();
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(item.key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <section>
      <SectionHeader
        eyebrow="Asistente"
        title="Llévate esto a tu IA favorita"
        subtitle="Un toque copia el contexto al portapapeles. Pégalo donde quieras."
      />
      <div
        className="grid gap-4 mt-5"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {items.map((it, i) => {
          const isCopied = copied === it.key;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => handle(it)}
              className="ht-card ht-card-interactive text-left flex flex-col gap-3.5"
              style={{
                padding: 24,
                cursor: "pointer",
                border: isCopied ? "1px solid var(--color-accent)" : undefined,
                background: isCopied
                  ? "color-mix(in oklab, var(--color-accent) 8%, var(--color-warm-white))"
                  : undefined,
                animation: `ht-fadeUp .55s ${80 + i * 80}ms both`,
                minHeight: 160,
                fontFamily: "inherit",
                color: "inherit",
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "color-mix(in oklab, var(--color-accent) 18%, var(--color-warm-white))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-accent)",
                  }}
                >
                  <Sparkles size={18} strokeWidth={1.75} />
                </div>
                {isCopied && (
                  <span
                    className="inline-flex items-center font-semibold rounded-full"
                    style={{
                      padding: "4px 10px",
                      fontSize: 10.5,
                      color: "var(--color-accent)",
                      background:
                        "color-mix(in oklab, var(--color-accent) 14%, var(--color-warm-white))",
                      border: "1px solid color-mix(in oklab, var(--color-accent) 28%, transparent)",
                    }}
                  >
                    ✓ Copiado
                  </span>
                )}
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
                <Copy size={13} strokeWidth={1.75} /> Copiar al portapapeles
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
