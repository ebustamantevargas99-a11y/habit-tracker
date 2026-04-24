"use client";

import { Fragment } from "react";

/**
 * Ilustraciones SVG para los spotlights de cada módulo.
 * Estética "grabado antiguo + geometría simple" para respetar la paleta.
 */

interface NutritionArtProps {
  data: { protein: number; carbs: number; fat: number };
}

export function NutritionArt({ data }: NutritionArtProps) {
  const total = data.protein + data.carbs + data.fat || 1;
  const p = data.protein / total;
  const c = data.carbs / total;
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const R = 70;
  const iR = 44;

  const arc = (start: number, end: number): string => {
    const a0 = -Math.PI / 2 + start * Math.PI * 2;
    const a1 = -Math.PI / 2 + end * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * R;
    const y0 = cy + Math.sin(a0) * R;
    const x1 = cx + Math.cos(a1) * R;
    const y1 = cy + Math.sin(a1) * R;
    const x0i = cx + Math.cos(a1) * iR;
    const y0i = cy + Math.sin(a1) * iR;
    const x1i = cx + Math.cos(a0) * iR;
    const y1i = cy + Math.sin(a0) * iR;
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x0i} ${y0i} A ${iR} ${iR} 0 ${large} 0 ${x1i} ${y1i} Z`;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="220" height="220" aria-hidden>
      <path d={arc(0, p)} fill="var(--color-accent)" opacity="0.85" />
      <path d={arc(p, p + c)} fill="var(--color-tan)" />
      <path d={arc(p + c, 1)} fill="var(--color-brown)" opacity="0.55" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="ht-serif"
        style={{ fontSize: 22, fontWeight: 700, fill: "var(--color-brown)" }}
      >
        {Math.round(p * 100)}P
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        style={{ fontSize: 10, fill: "var(--color-warm)", letterSpacing: "0.08em", fontWeight: 500 }}
      >
        MACROS
      </text>
    </svg>
  );
}

interface FinanceArtProps {
  pct: number;
}

export function FinanceArt({ pct }: FinanceArtProps) {
  return (
    <svg viewBox="0 0 180 180" width="200" height="200" aria-hidden>
      <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-tan)" strokeWidth="1.5" />
      <circle
        cx="90"
        cy="90"
        r="62"
        fill="var(--color-warm-white)"
        stroke="var(--color-accent)"
        strokeWidth="1"
      />
      <circle
        cx="90"
        cy="90"
        r="54"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="0.8"
        strokeDasharray="3 2"
        opacity="0.6"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={72}
          y={70 + i * 8}
          width={36 * (1 - i * 0.14)}
          height={4}
          fill="var(--color-accent)"
          opacity={1 - i * 0.18}
        />
      ))}
      <text
        x="90"
        y="130"
        textAnchor="middle"
        className="ht-serif"
        style={{ fontSize: 18, fontWeight: 700, fill: "var(--color-brown)" }}
      >
        +{pct}%
      </text>
    </svg>
  );
}

interface FitnessArtProps {
  vol: number;
}

export function FitnessArt({ vol }: FitnessArtProps) {
  return (
    <svg viewBox="0 0 220 180" width="220" height="180" aria-hidden>
      <g stroke="var(--color-brown)" strokeWidth="2" fill="none" strokeLinecap="round">
        <rect x="40" y="78" width="14" height="24" fill="var(--color-accent)" opacity="0.8" />
        <rect x="32" y="72" width="8" height="36" fill="var(--color-brown)" opacity="0.65" />
        <rect x="166" y="78" width="14" height="24" fill="var(--color-accent)" opacity="0.8" />
        <rect x="180" y="72" width="8" height="36" fill="var(--color-brown)" opacity="0.65" />
        <line x1="54" y1="90" x2="166" y2="90" strokeWidth="6" stroke="var(--color-brown)" opacity="0.65" />
      </g>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <line
          key={i}
          x1={64 + i * 10}
          y1={72}
          x2={64 + i * 10}
          y2={108}
          stroke="var(--color-tan)"
          strokeWidth="0.6"
          opacity="0.6"
        />
      ))}
      <text
        x="110"
        y="138"
        textAnchor="middle"
        style={{ fontSize: 10, fill: "var(--color-warm)", letterSpacing: "0.14em", fontWeight: 500 }}
      >
        VOLUMEN
      </text>
      <text
        x="110"
        y="156"
        textAnchor="middle"
        className="ht-serif"
        style={{ fontSize: 16, fontWeight: 700, fill: "var(--color-brown)" }}
      >
        {vol.toLocaleString("es-MX")} kg
      </text>
    </svg>
  );
}

interface CycleArtProps {
  day: number;
  length: number;
}

export function CycleArt({ day, length }: CycleArtProps) {
  const size = 180;
  const cx = 90;
  const cy = 90;
  const R = 70;
  const pct = day / length;

  const phases = [
    { from: 0, to: 5 / length, color: "var(--color-danger)", op: 0.65 },
    { from: 5 / length, to: 13 / length, color: "var(--color-tan)", op: 0.7 },
    { from: 13 / length, to: 16 / length, color: "var(--color-accent)", op: 0.9 },
    { from: 16 / length, to: 1, color: "var(--color-brown)", op: 0.4 },
  ];

  const marker = (() => {
    const a = -Math.PI / 2 + pct * Math.PI * 2;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  })();

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="200" height="200" aria-hidden>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--color-cream)" strokeWidth="2" />
      {phases.map((p, i) => {
        const a0 = -Math.PI / 2 + p.from * Math.PI * 2;
        const a1 = -Math.PI / 2 + p.to * Math.PI * 2;
        const x0 = cx + Math.cos(a0) * R;
        const y0 = cy + Math.sin(a0) * R;
        const x1 = cx + Math.cos(a1) * R;
        const y1 = cy + Math.sin(a1) * R;
        const large = p.to - p.from > 0.5 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`}
            fill="none"
            stroke={p.color}
            strokeWidth="6"
            strokeLinecap="butt"
            opacity={p.op}
          />
        );
      })}
      <circle cx={marker.x} cy={marker.y} r="8" fill="var(--color-warm-white)" stroke="var(--color-brown)" strokeWidth="2" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="ht-serif"
        style={{ fontSize: 26, fontWeight: 700, fill: "var(--color-brown)" }}
      >
        {day}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        style={{ fontSize: 9.5, fill: "var(--color-warm)", letterSpacing: "0.12em", fontWeight: 500 }}
      >
        DÍA DEL CICLO
      </text>
    </svg>
  );
}

export function ReadingArt() {
  return (
    <svg viewBox="0 0 220 180" width="220" height="180" aria-hidden>
      <g stroke="var(--color-brown)" strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M110 40 Q 80 32 40 40 L40 140 Q 80 132 110 140 Z" fill="var(--color-warm-white)" />
        <path d="M110 40 Q 140 32 180 40 L180 140 Q 140 132 110 140 Z" fill="var(--color-warm-white)" />
        <path d="M110 40 L110 140" />
      </g>
      {[0, 1, 2, 3, 4].map((i) => (
        <Fragment key={i}>
          <line
            x1="50"
            y1={60 + i * 14}
            x2="100"
            y2={60 + i * 14}
            stroke="var(--color-tan)"
            strokeWidth="1"
            opacity={0.8 - i * 0.12}
          />
          <line
            x1="120"
            y1={60 + i * 14}
            x2="170"
            y2={60 + i * 14}
            stroke="var(--color-tan)"
            strokeWidth="1"
            opacity={0.8 - i * 0.12}
          />
        </Fragment>
      ))}
      <line x1="140" y1="48" x2="140" y2="60" stroke="var(--color-accent)" strokeWidth="2" />
    </svg>
  );
}
