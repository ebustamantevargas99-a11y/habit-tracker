"use client";

import { useRef, useState } from "react";
import SectionHeader from "./primitives/section-header";
import type { CompoundData } from "./types";

interface Props {
  data: CompoundData;
}

/**
 * Compound effect — 3 series (real, máx, abandono) sobre 52 semanas.
 * Hover vertical guide line con los 3 valores.
 */
export default function CompoundEffect({ data }: Props) {
  const { real, best, abandon } = data;
  const W = 760;
  const H = 260;
  const PAD = { l: 48, r: 24, t: 24, b: 32 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  const all = [...real, ...best, ...abandon];
  const max = Math.max(...all);
  const min = 0;
  const xAt = (i: number) => PAD.l + (i / (real.length - 1)) * iw;
  const yAt = (v: number) => PAD.t + ih - ((v - min) / (max - min)) * ih;

  const toPath = (arr: number[]) =>
    arr.map((v, i) => (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1)).join(" ");

  const [hoverI, setHoverI] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const i = Math.round(((x - PAD.l) / iw) * (real.length - 1));
    setHoverI(Math.max(0, Math.min(real.length - 1, i)));
  };

  const yTicks: Array<{ v: number; y: number }> = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const v = min + ((max - min) / tickCount) * i;
    yTicks.push({ v, y: yAt(v) });
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Efecto compuesto"
        title="El 1% que todo lo cambia"
        subtitle="1% cada día compone en 37× al año. 2% abandonado te deja en 0.03×."
      />
      <div
        className="ht-card mt-5"
        style={{ padding: 24, animation: "ht-fadeUp .55s 80ms both" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ maxHeight: 300, display: "block" }}
          onMouseMove={onMove}
          onMouseLeave={() => setHoverI(null)}
          aria-hidden
        >
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={t.y}
                y2={t.y}
                stroke="var(--color-cream)"
                strokeWidth="1"
                strokeDasharray={i === tickCount ? undefined : "2 3"}
              />
              <text
                x={PAD.l - 8}
                y={t.y + 3}
                textAnchor="end"
                style={{
                  fontSize: 10,
                  fill: "var(--color-warm)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {t.v.toFixed(1)}×
              </text>
            </g>
          ))}
          {[0, 13, 26, 39, 51].map((i) => (
            <text
              key={i}
              x={xAt(i)}
              y={H - 10}
              textAnchor="middle"
              style={{
                fontSize: 10,
                fill: "var(--color-warm)",
                fontFamily: "var(--font-mono)",
              }}
            >
              S{i + 1}
            </text>
          ))}
          <path d={toPath(best)} fill="none" stroke="var(--color-tan)" strokeWidth="1.25" strokeDasharray="4 4" />
          <path
            d={toPath(abandon)}
            fill="none"
            stroke="var(--color-warm)"
            strokeWidth="1.25"
            strokeDasharray="2 3"
            opacity="0.7"
          />
          <path
            d={toPath(real)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.25"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 1px 2px color-mix(in oklab, var(--color-accent) 25%, transparent))",
            }}
          />
          <circle
            cx={xAt(real.length - 1)}
            cy={yAt(real[real.length - 1])}
            r="4"
            fill="var(--color-accent)"
            stroke="var(--color-warm-white)"
            strokeWidth="2"
          />

          {hoverI != null && (
            <g pointerEvents="none">
              <line
                x1={xAt(hoverI)}
                x2={xAt(hoverI)}
                y1={PAD.t}
                y2={H - PAD.b}
                stroke="var(--color-brown)"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.35"
              />
              <circle cx={xAt(hoverI)} cy={yAt(real[hoverI])} r="3.5" fill="var(--color-accent)" />
              <circle cx={xAt(hoverI)} cy={yAt(best[hoverI])} r="3" fill="var(--color-tan)" />
              <circle cx={xAt(hoverI)} cy={yAt(abandon[hoverI])} r="3" fill="var(--color-warm)" />
            </g>
          )}
        </svg>

        <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
          <div
            className="flex items-center gap-4 flex-wrap"
            style={{ fontSize: 11.5, color: "var(--color-warm)" }}
          >
            <span className="flex items-center gap-2">
              <span style={{ width: 18, height: 2, background: "var(--color-accent)", borderRadius: 2 }} />
              Tu ritmo real
            </span>
            <span className="flex items-center gap-2">
              <span
                style={{
                  width: 18,
                  height: 2,
                  background:
                    "repeating-linear-gradient(90deg, var(--color-tan) 0 4px, transparent 4px 8px)",
                  borderRadius: 2,
                }}
              />
              +0.5%/día (máx.)
            </span>
            <span className="flex items-center gap-2">
              <span
                style={{
                  width: 18,
                  height: 2,
                  background: "var(--color-warm)",
                  borderRadius: 2,
                  opacity: 0.7,
                }}
              />
              -2%/sem (abandono)
            </span>
          </div>
          {hoverI != null && (
            <div className="ht-mono flex items-center gap-4" style={{ fontSize: 11.5 }}>
              <span style={{ color: "var(--color-warm)" }}>S{hoverI + 1}</span>
              <span style={{ color: "var(--color-accent)" }}>real {real[hoverI].toFixed(2)}×</span>
              <span style={{ color: "var(--color-tan)" }}>máx {best[hoverI].toFixed(2)}×</span>
              <span style={{ color: "var(--color-warm)" }}>aband {abandon[hoverI].toFixed(2)}×</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
