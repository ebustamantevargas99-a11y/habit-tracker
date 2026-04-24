"use client";

import SectionHeader from "./primitives/section-header";
import type { RadarData } from "./types";

interface Props {
  data: RadarData;
}

/**
 * Radar chart SVG con 7 ejes. Esta semana vs semana anterior.
 * Los puntos se dibujan en orden contrahorario (stagger) al cargar.
 */
export default function Radar({ data }: Props) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const axes = data.categories;
  const N = axes.length;
  const R = size / 2 - 60;

  const pointsFor = (vals: number[]): Array<[number, number]> =>
    vals.map((v, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      const r = (v / 100) * R;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    });

  const thisPts = pointsFor(data.thisWeek);
  const lastPts = pointsFor(data.lastWeek);
  const polyStr = (pts: Array<[number, number]>) => pts.map((p) => p.join(",")).join(" ");

  const labelFor = (i: number): [number, number] => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = R + 26;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  const avg = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
  const deltaAvg = avg(data.thisWeek) - avg(data.lastWeek);

  return (
    <section>
      <SectionHeader
        eyebrow="Equilibrio"
        title="Tu vida en balance"
        subtitle="Siete dimensiones que se sostienen entre sí — esta semana frente a la anterior."
      />
      <div
        className="ht-card mt-5"
        style={{ padding: 24, animation: "ht-fadeUp .55s 80ms both" }}
      >
        <div
          className="radar-grid-v2 grid gap-8 items-center"
          style={{ gridTemplateColumns: "1fr auto" }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 460 }} aria-hidden>
              {/* Anillos */}
              {[0.25, 0.5, 0.75, 1].map((f, i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={R * f}
                  fill="none"
                  stroke="var(--color-cream)"
                  strokeWidth="1"
                  strokeDasharray={i === 3 ? undefined : "2 3"}
                />
              ))}
              {/* Ejes */}
              {axes.map((_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={cx + Math.cos(angle) * R}
                    y2={cy + Math.sin(angle) * R}
                    stroke="var(--color-cream)"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Semana anterior */}
              <polygon
                points={polyStr(lastPts)}
                fill="none"
                stroke="var(--color-warm)"
                strokeWidth="1.25"
                strokeDasharray="3 4"
                opacity="0.6"
              />
              {/* Esta semana */}
              <polygon
                points={polyStr(thisPts)}
                fill="var(--color-accent)"
                fillOpacity="0.22"
                stroke="var(--color-accent)"
                strokeWidth="1.75"
                style={{ animation: "ht-fadeUp 700ms 300ms both" }}
              />
              {/* Puntos con stagger */}
              {thisPts.map((p, i) => {
                const revI = (N - i) % N;
                return (
                  <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r="4"
                    fill="var(--color-accent)"
                    stroke="var(--color-warm-white)"
                    strokeWidth="1.5"
                    style={{ animation: `ht-grow .45s ${400 + revI * 80}ms both` }}
                  />
                );
              })}
              {/* Labels */}
              {axes.map((lbl, i) => {
                const [lx, ly] = labelFor(i);
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
                const anchor =
                  Math.cos(angle) < -0.25 ? "end" : Math.cos(angle) > 0.25 ? "start" : "middle";
                return (
                  <text
                    key={lbl}
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    style={{
                      fontSize: 12,
                      fill: "var(--color-warm)",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-col gap-5" style={{ minWidth: 220 }}>
            <div className="flex flex-col gap-1">
              <div className="ht-eyebrow">Esta semana</div>
              <div className="ht-serif ht-num-big" style={{ fontSize: 36 }}>
                {Math.round(avg(data.thisWeek))}
              </div>
              <div style={{ fontSize: 12, color: deltaAvg >= 0 ? "var(--color-good)" : "var(--color-danger)" }}>
                {deltaAvg >= 0 ? "+" : ""}
                {Math.round(deltaAvg * 10) / 10} vs. anterior
              </div>
            </div>
            <hr
              style={{
                height: 1,
                border: 0,
                background: "var(--color-cream)",
                margin: 0,
              }}
            />
            <div className="flex flex-col gap-2">
              {data.categories.map((c, i) => {
                const d = data.thisWeek[i] - data.lastWeek[i];
                return (
                  <div key={c} className="flex items-center justify-between" style={{ fontSize: 12.5 }}>
                    <span style={{ color: "var(--color-warm)" }}>{c}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className="ht-mono"
                        style={{ color: "var(--color-dark)", fontWeight: 500 }}
                      >
                        {data.thisWeek[i]}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: d >= 0 ? "var(--color-good)" : "var(--color-danger)",
                          minWidth: 26,
                          textAlign: "right",
                        }}
                      >
                        {d >= 0 ? "+" : ""}
                        {d}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="flex gap-3 flex-wrap"
              style={{ fontSize: 11, color: "var(--color-warm)" }}
            >
              <span className="flex items-center gap-1">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "var(--color-accent)",
                    borderRadius: 2,
                    opacity: 0.7,
                  }}
                />{" "}
                esta semana
              </span>
              <span className="flex items-center gap-1">
                <span
                  style={{
                    width: 10,
                    height: 2,
                    background: "var(--color-warm)",
                    marginTop: 4,
                  }}
                />{" "}
                anterior
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
