"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import SectionHeader from "./primitives/section-header";
import TreeSVG, { STATE_LABEL } from "./primitives/tree-svg";
import type { HabitState, HabitV2 } from "./types";

const ORDER: readonly HabitState[] = [
  "no_started",
  "starting",
  "forming",
  "strengthening",
  "near_rooted",
  "rooted",
] as const;

interface Props {
  habits: HabitV2[];
}

export default function HabitForest({ habits }: Props) {
  const [hover, setHover] = useState<HabitV2 | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const rootedCount = habits.filter((h) => h.state === "rooted").length;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);

  const onEnter = (e: React.MouseEvent<HTMLDivElement>, h: HabitV2) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = scrollRef.current?.getBoundingClientRect();
    if (!parent) return;
    setHoverPos({ x: rect.left - parent.left + rect.width / 2, y: rect.top - parent.top });
    setHover(h);
  };

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section>
      <SectionHeader
        eyebrow="Habit Forest"
        title="Tu bosque de hábitos"
        subtitle="Cada planta crece contigo. Lo que riegas, echa raíces."
        right={
          <div className="flex items-center gap-2">
            <Chip>{rootedCount} arraigados</Chip>
            <ChipAccent>
              <Flame size={12} strokeWidth={1.75} /> Streak máx. {maxStreak}d
            </ChipAccent>
          </div>
        }
      />

      <div
        className="ht-card mt-5 relative"
        style={{
          padding: "28px 8px 32px",
          animation: "ht-fadeUp .55s 80ms both",
          overflow: "hidden",
        }}
      >
        <ScrollBtn dir="left" onClick={() => scroll(-1)} />
        <ScrollBtn dir="right" onClick={() => scroll(1)} />

        <div
          ref={scrollRef}
          className="ht-scroll-x flex gap-1 relative"
          style={{
            padding: "0 32px 8px",
            maskImage:
              "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
          }}
        >
          {habits.map((h, i) => (
            <div
              key={h.name}
              onMouseEnter={(e) => onEnter(e, h)}
              onMouseLeave={() => setHover(null)}
              className="text-center flex-shrink-0 cursor-pointer"
              style={{
                width: 110,
                animation: `ht-grow .5s ${80 + i * 60}ms both cubic-bezier(.2, .7, .2, 1)`,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 140,
                  margin: "0 auto",
                  transition: "filter .3s ease, transform .3s ease",
                  filter:
                    hover?.name === h.name
                      ? "drop-shadow(0 6px 14px color-mix(in oklab, var(--color-accent) 45%, transparent))"
                      : "none",
                  transform: hover?.name === h.name ? "translateY(-4px)" : "none",
                }}
              >
                <TreeSVG state={h.state} />
              </div>
              <div
                className="ht-serif"
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--color-brown)",
                  marginTop: 6,
                  lineHeight: 1.2,
                  padding: "0 4px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {h.name}
              </div>
              {h.streak > 0 ? (
                <div
                  className="flex items-center gap-1 justify-center mt-1"
                  style={{ fontSize: 11, color: "var(--color-warm)" }}
                >
                  <Flame size={11} strokeWidth={1.75} color="var(--color-accent)" />
                  <span className="ht-mono">{h.streak}d</span>
                </div>
              ) : (
                <div
                  className="italic mt-1"
                  style={{ fontSize: 10.5, color: "var(--color-warm)", opacity: 0.7 }}
                >
                  empieza hoy
                </div>
              )}
            </div>
          ))}
        </div>

        {hover && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: hoverPos.x,
              top: hoverPos.y - 8,
              transform: "translate(-50%, -100%)",
              background: "var(--color-dark)",
              color: "var(--color-paper)",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, .35)",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{hover.name}</div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>
              {STATE_LABEL[hover.state]} · fuerza {hover.strength}%
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 8,
                height: 8,
                background: "var(--color-dark)",
              }}
            />
          </div>
        )}

        <div
          className="flex items-center justify-center gap-4 flex-wrap"
          style={{
            padding: "16px 32px 0",
            marginTop: 8,
            borderTop: "1px solid var(--color-cream)",
            fontSize: 10.5,
            color: "var(--color-warm)",
          }}
        >
          {ORDER.map((s, i) => (
            <span key={s} className="flex items-center gap-3">
              <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
                {STATE_LABEL[s]}
              </span>
              {i < ORDER.length - 1 && <span style={{ opacity: 0.4 }}>→</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded-full"
      style={{
        padding: "4px 10px",
        fontSize: 11,
        letterSpacing: "0.02em",
        background: "color-mix(in oklab, var(--color-cream) 80%, transparent)",
        color: "var(--color-warm)",
        border: "1px solid color-mix(in oklab, var(--color-tan) 45%, transparent)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ChipAccent({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded-full"
      style={{
        padding: "4px 10px",
        fontSize: 11,
        letterSpacing: "0.02em",
        color: "var(--color-accent)",
        background: "color-mix(in oklab, var(--color-accent) 14%, var(--color-warm-white))",
        border: "1px solid color-mix(in oklab, var(--color-accent) 28%, transparent)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ScrollBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Anterior" : "Siguiente"}
      style={{
        position: "absolute",
        top: 72,
        [dir]: 8,
        zIndex: 5,
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--color-warm-white)",
        border: "1px solid var(--color-cream)",
        color: "var(--color-brown)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {dir === "left" ? (
        <ChevronLeft size={18} strokeWidth={1.75} />
      ) : (
        <ChevronRight size={18} strokeWidth={1.75} />
      )}
    </button>
  );
}
