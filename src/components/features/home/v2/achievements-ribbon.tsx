"use client";

import { Lock, Flame, Target } from "lucide-react";
import SectionHeader from "./primitives/section-header";
import type { HomeV2Data } from "./types";

const QUOTES = [
  { text: "Lo que haces cada día importa más que lo que haces de vez en cuando.", author: "Gretchen Rubin" },
  { text: "No somos lo que decimos; somos lo que repetimos.", author: "Aristóteles" },
  { text: "La disciplina es elegirse mañana antes de que llegue el mañana.", author: "—" },
  { text: "Los pequeños pasos se vuelven paisajes.", author: "—" },
] as const;

// Hitos alineados con src/lib/habit-utils.ts (MILESTONES). Cada hito
// mapea a un label amigable y —opcionalmente— la fase de arraigo que
// representa. Cuando el user cruza un hito, celebramos con confetti;
// aquí solo mostramos "el próximo".
const MILESTONES: Array<{ days: number; label: string; phase?: string }> = [
  { days: 7,    label: "1 semana consecutiva",   phase: "Iniciando"       },
  { days: 21,   label: "3 semanas consecutivas", phase: "Formándose"      },
  { days: 66,   label: "2 meses consecutivos",   phase: "Fortaleciéndose" },
  { days: 92,   label: "Hábito arraigado",       phase: "Casi arraigado"  },
  { days: 100,  label: "100 días consecutivos"                            },
  { days: 365,  label: "1 año de constancia"                              },
  { days: 500,  label: "500 días"                                         },
  { days: 1000, label: "1000 días"                                        },
];

function nextMilestoneFor(streak: number): { days: number; label: string; remaining: number } {
  const next = MILESTONES.find((m) => m.days > streak);
  if (!next) {
    // Superó todos los hitos — celebración indefinida.
    return { days: streak, label: "Más allá de los hitos", remaining: 0 };
  }
  return { days: next.days, label: next.label, remaining: next.days - streak };
}

interface Props {
  data: HomeV2Data;
}

export default function AchievementsRibbon({ data }: Props) {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const pct = data.badge.done / data.badge.total;
  const milestone = nextMilestoneFor(data.habitsToday.topStreak);

  return (
    <section>
      <SectionHeader eyebrow="Logros" title="Lo que se acerca" />
      <div
        className="ht-card mt-5"
        style={{ padding: 24, animation: "ht-fadeUp .55s 80ms both" }}
      >
        <div
          className="grid items-center gap-6"
          style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
        >
          {/* Próximo badge */}
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                background: "color-mix(in oklab, var(--color-cream) 70%, var(--color-warm-white))",
                border: "1px dashed var(--color-tan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-warm)",
              }}
            >
              <Lock size={22} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="ht-eyebrow" style={{ fontSize: 10 }}>
                Próximo badge
              </div>
              <div
                className="ht-serif"
                style={{ fontSize: 16, lineHeight: 1.2, fontWeight: 500, color: "var(--color-brown)" }}
              >
                {data.badge.name}
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "var(--color-cream)",
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    background: "var(--color-accent)",
                    transition: "width 900ms cubic-bezier(.2, .7, .2, 1)",
                  }}
                />
              </div>
              <div
                className="ht-mono"
                style={{ fontSize: 11, color: "var(--color-warm)" }}
              >
                {data.badge.done} / {data.badge.total} días
              </div>
            </div>
          </div>

          {/* Streak global */}
          <div className="flex items-center gap-4 justify-center">
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                background: "color-mix(in oklab, var(--color-accent) 18%, var(--color-warm-white))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
              }}
            >
              <Flame size={24} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="ht-eyebrow" style={{ fontSize: 10 }}>
                Racha global
              </div>
              <div className="ht-serif ht-num-big" style={{ fontSize: 30, lineHeight: 1 }}>
                {data.habitsToday.topStreak}{" "}
                <span style={{ fontSize: 14, color: "var(--color-warm)", fontWeight: 400 }}>días</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-warm)" }}>Tu racha más larga</div>
            </div>
          </div>

          {/* Milestone dinámico basado en el streak actual */}
          <div className="flex items-center gap-4 justify-end">
            <div className="flex flex-col gap-1 items-end text-right">
              <div className="ht-eyebrow" style={{ fontSize: 10 }}>
                Próximo milestone
              </div>
              <div
                className="ht-serif"
                style={{
                  fontSize: 16,
                  lineHeight: 1.2,
                  color: "var(--color-brown)",
                  fontWeight: 500,
                }}
              >
                {milestone.label}
              </div>
              <div className="ht-mono" style={{ fontSize: 11, color: "var(--color-warm)" }}>
                {milestone.remaining > 0
                  ? `faltan ${milestone.remaining} día${milestone.remaining === 1 ? "" : "s"}`
                  : "meta alcanzada"}
              </div>
            </div>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                background: "color-mix(in oklab, var(--color-tan) 40%, var(--color-warm-white))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-brown)",
              }}
            >
              <Target size={22} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <hr
          style={{
            height: 1,
            border: 0,
            background: "var(--color-cream)",
            margin: "24px 0 20px",
          }}
        />

        <div className="text-center">
          <p
            className="ht-serif italic m-0 mx-auto"
            style={{
              fontSize: 17,
              color: "var(--color-warm)",
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <div
            className="ht-mono"
            style={{
              fontSize: 10.5,
              color: "var(--color-warm)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 10,
              opacity: 0.8,
            }}
          >
            — {quote.author}
          </div>
        </div>
      </div>
    </section>
  );
}
