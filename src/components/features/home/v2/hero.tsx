"use client";

import { Sparkles, ArrowUpRight } from "lucide-react";
import LifeScoreRing from "./primitives/life-score-ring";
import { formatFechaLarga, greetingFor, lifeScoreMessage } from "./primitives/helpers";

interface Props {
  hour: number;
  score: number;
  scorePrev: number;
  userName: string;
  showCierre: boolean;
  onCierreClick?: () => void;
  onResumenClick?: () => void;
}

/**
 * Hero Momentum — saludo serif grande + Life Score ring.
 * El fondo es un gradiente de tokens hero-bg-1/2 que se ajusta por tema.
 */
export default function Hero({
  hour,
  score,
  scorePrev,
  userName,
  showCierre,
  onCierreClick,
  onResumenClick,
}: Props) {
  const greeting = greetingFor(hour, userName);
  const dateStr = formatFechaLarga(new Date());
  const msg = lifeScoreMessage(score);

  return (
    <section
      className="ht-card ht-fade-up relative overflow-hidden"
      style={{
        padding: "44px 40px",
        background:
          "linear-gradient(135deg, var(--color-hero-bg-1) 0%, var(--color-hero-bg-2) 100%)",
      }}
    >
      <HeroNoise />
      <div
        className="hero-grid-v2 relative grid items-center gap-12"
        style={{ gridTemplateColumns: "1fr auto" }}
      >
        <div className="flex flex-col gap-4">
          <div
            className="ht-eyebrow"
            style={{ color: "var(--color-hero-text)", opacity: 0.58 }}
          >
            {dateStr}
          </div>
          <h1
            className="ht-serif leading-[1.04] m-0"
            style={{
              fontSize: "clamp(30px, 4.2vw, 56px)",
              color: "var(--color-hero-text)",
              letterSpacing: "-0.02em",
              fontWeight: 700,
            }}
          >
            {greeting}.
          </h1>
          <p
            className="ht-serif italic m-0"
            style={{
              fontSize: "clamp(17px, 1.6vw, 21px)",
              color: "var(--color-hero-text)",
              opacity: 0.75,
              maxWidth: 540,
              lineHeight: 1.45,
            }}
          >
            {msg}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {showCierre && (
              <button
                type="button"
                onClick={onCierreClick}
                className="inline-flex items-center gap-2 rounded-[14px] transition"
                style={{
                  background: "var(--color-dark)",
                  color: "var(--color-paper)",
                  padding: "16px 22px",
                  fontSize: 15,
                  fontWeight: 500,
                  border: "1px solid var(--color-dark)",
                }}
              >
                <Sparkles size={17} strokeWidth={1.75} /> Cierre del día → Copiar a IA
              </button>
            )}
            <button
              type="button"
              onClick={onResumenClick}
              className="inline-flex items-center gap-2 rounded-[14px] transition"
              style={{
                background: "transparent",
                color: "var(--color-hero-text)",
                padding: "16px 22px",
                fontSize: 15,
                fontWeight: 500,
                border: "1px solid var(--color-tan)",
              }}
            >
              Resumen semanal <ArrowUpRight size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <LifeScoreRing score={score} prev={scorePrev} size={200} />
      </div>
    </section>
  );
}

function HeroNoise() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.18,
        pointerEvents: "none",
      }}
    >
      <filter id="ht-hero-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ht-hero-noise)" />
    </svg>
  );
}
