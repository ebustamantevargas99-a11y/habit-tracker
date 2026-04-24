"use client";

import { useCountUp } from "./use-count-up";

interface Props {
  score: number;
  prev: number;
  size?: number;
  delay?: number;
}

/**
 * Anillo circular del Life Score. Número grande en serif animado desde 0.
 * Barra de progreso se rellena con CSS transition del strokeDashoffset.
 */
export default function LifeScoreRing({ score, prev, size = 180, delay = 200 }: Props) {
  const displayed = useCountUp(score, 900, delay);
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, displayed / 100));
  const offset = circumference * (1 - pct);
  const delta = score - prev;

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      role="img"
      aria-label={`Life score ${Math.round(score)} de 100`}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.16, 1, .3, 1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <div className="ht-eyebrow" style={{ fontSize: 9.5, marginBottom: 2 }}>
          Life Score
        </div>
        <div
          className="ht-serif ht-num-big"
          style={{ fontSize: Math.round(size * 0.36), fontWeight: 900 }}
        >
          {Math.round(displayed)}
        </div>
        <div style={{ fontSize: 10, color: "var(--color-warm)", marginTop: 4, fontWeight: 500 }}>
          <span
            style={{
              color: delta >= 0 ? "var(--color-good)" : "var(--color-danger)",
            }}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
          </span>{" "}
          vs semana
        </div>
      </div>
    </div>
  );
}
