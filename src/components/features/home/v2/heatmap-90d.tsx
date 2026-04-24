"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./primitives/section-header";
import { MONTHS_ES } from "./primitives/helpers";

interface Props {
  data: number[]; // 90 días, valores 0-5
}

export default function Heatmap90({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const cols = 15;
  const tileSize = 20;
  const gap = 3;

  const shadeFor = (v: number): string => {
    if (v === 0) return "color-mix(in oklab, var(--color-cream) 80%, var(--color-warm-white))";
    const pctTable = [0, 20, 38, 56, 72, 92];
    const p = pctTable[Math.max(0, Math.min(5, v))];
    return `color-mix(in oklab, var(--color-accent) ${p}%, var(--color-warm-white))`;
  };

  const dateFor = (idx: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - (data.length - 1 - idx));
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()].slice(0, 3)}`;
  };

  return (
    <section>
      <SectionHeader
        eyebrow="Últimos 90 días"
        title="Tu constancia, en mosaico"
        subtitle="Cada cuadro es un día. Su intensidad, la suma de acciones."
        right={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[12px] transition"
            style={{
              background: "transparent",
              color: "var(--color-dark)",
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 500,
              border: "1px solid var(--color-tan)",
            }}
          >
            Ver año completo <ArrowRight size={13} strokeWidth={1.75} />
          </button>
        }
      />
      <div
        className="ht-card mt-5 relative"
        style={{ padding: 24, animation: "ht-fadeUp .55s 80ms both" }}
      >
        <div
          className="grid justify-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
            gap,
          }}
        >
          {data.map((v, i) => (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                width: tileSize,
                height: tileSize,
                borderRadius: 3,
                background: shadeFor(v),
                border: "1px solid color-mix(in oklab, var(--color-tan) 20%, transparent)",
                cursor: "pointer",
                transition: "transform .15s",
                transform: hover === i ? "scale(1.15)" : "none",
              }}
            />
          ))}
        </div>

        <div
          className="flex items-center justify-between flex-wrap gap-3 mt-4"
          style={{ fontSize: 11, color: "var(--color-warm)" }}
        >
          <span>Hace 90 días · hoy</span>
          <div className="flex items-center gap-2">
            <span>menos</span>
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <span
                key={v}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background: shadeFor(v),
                  border: "1px solid color-mix(in oklab, var(--color-tan) 20%, transparent)",
                }}
              />
            ))}
            <span>más</span>
          </div>
        </div>

        {hover != null && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: 16,
              right: 24,
              background: "var(--color-dark)",
              color: "var(--color-paper)",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div className="ht-mono" style={{ fontSize: 11, opacity: 0.7 }}>
              {dateFor(hover)}
            </div>
            <div style={{ marginTop: 2 }}>
              <b>{data[hover]}</b> acciones ·{" "}
              {data[hover] >= 3 ? "día activo" : data[hover] >= 1 ? "día suave" : "pausa"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
