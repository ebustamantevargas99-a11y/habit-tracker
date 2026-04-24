"use client";

import { useEffect, useMemo, useRef } from "react";

interface Props {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
  fillOpacity?: number;
  delay?: number;
}

/**
 * Sparkline SVG con animación de trazado progresivo (strokeDashoffset).
 * No usa librería externa para quedar ligero y permitir theming via
 * CSS vars (stroke puede ser "var(--color-accent)").
 */
export default function Sparkline({
  data,
  w = 200,
  h = 40,
  stroke = "var(--color-accent)",
  fillOpacity = 0.12,
  delay = 0,
}: Props) {
  const { path, areaPath, pts } = useMemo(() => {
    if (!data || data.length < 2) return { path: "", areaPath: "", pts: [] as [number, number][] };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const step = w / (data.length - 1);
    const points: [number, number][] = data.map((v, i) => [
      i * step,
      h - ((v - min) / span) * (h - 4) - 2,
    ]);
    const lineD = points
      .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1))
      .join(" ");
    const areaD = `${lineD} L ${w} ${h} L 0 ${h} Z`;
    return { path: lineD, areaPath: areaD, pts: points };
  }, [data, w, h]);

  const pathRef = useRef<SVGPathElement | null>(null);
  const gradId = useMemo(() => `ht-spark-grad-${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const len = el.getTotalLength?.() ?? 300;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = reduce ? "0" : `${len}`;
    // force reflow
    el.getBoundingClientRect();
    el.style.transition = reduce
      ? "none"
      : `stroke-dashoffset 900ms cubic-bezier(.2, .7, .2, 1) ${delay}ms`;
    el.style.strokeDashoffset = "0";
  }, [path, delay]);

  if (!path) return null;
  const lastPt = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={fillOpacity * 2} />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPt && <circle cx={lastPt[0]} cy={lastPt[1]} r="2.2" fill={stroke} />}
    </svg>
  );
}
