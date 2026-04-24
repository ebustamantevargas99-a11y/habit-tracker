"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import SectionHeader from "./primitives/section-header";
import type { TimelineData } from "./types";

interface Props {
  data: TimelineData;
  nowHour?: number;
  nowMin?: number;
}

/**
 * Timeline horizontal del día. Eje: 06:00 hoy → 06:00 mañana (24h).
 * Posiciones en minutos desde 06:00 (total 1440).
 */
export default function Timeline({ data, nowHour = new Date().getHours(), nowMin = new Date().getMinutes() }: Props) {
  const nowMinutes = useMemo(() => {
    let t = (nowHour - 6) * 60 + nowMin;
    if (t < 0) t += 24 * 60;
    return t;
  }, [nowHour, nowMin]);

  const total = 24 * 60;
  const pct = (m: number) => `${(m / total) * 100}%`;

  const hours: Array<{ h: number; m: number; label: string }> = [];
  for (let h = 0; h <= 24; h += 3) {
    const label = ((6 + h) % 24).toString().padStart(2, "0") + ":00";
    hours.push({ h, m: h * 60, label });
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Tu día"
        title="Las horas, tejidas"
        subtitle="Lo que ya ocurrió, lo que viene. Cada bloque es un fragmento del día."
        right={
          <span
            className="inline-flex items-center gap-1.5 font-semibold rounded-full"
            style={{
              padding: "4px 10px",
              fontSize: 11,
              letterSpacing: "0.02em",
              color: "var(--color-accent)",
              background: "color-mix(in oklab, var(--color-accent) 14%, var(--color-warm-white))",
              border: "1px solid color-mix(in oklab, var(--color-accent) 28%, transparent)",
            }}
          >
            <Clock size={12} strokeWidth={1.75} />
            Ahora · {String(nowHour).padStart(2, "0")}:{String(nowMin).padStart(2, "0")}
          </span>
        }
      />

      <div
        className="ht-card mt-5"
        style={{ padding: 28, animation: "ht-fadeUp .55s 80ms both" }}
      >
        <div style={{ position: "relative", padding: "56px 0 44px" }}>
          <div
            style={{
              position: "relative",
              height: 54,
              borderRadius: 12,
              background: "var(--color-warm-white)",
              border: "1px solid var(--color-cream)",
              overflow: "visible",
            }}
          >
            {/* Sueño */}
            {data.sleep.map((s, i) => (
              <div
                key={`sl-${i}`}
                title="Sueño"
                style={{
                  position: "absolute",
                  top: 6,
                  bottom: 6,
                  left: pct(s.start),
                  width: pct(s.end - s.start),
                  background:
                    "color-mix(in oklab, var(--color-tan) 55%, var(--color-warm-white))",
                  borderRadius: 6,
                }}
              />
            ))}

            {/* Focus */}
            {data.focus.map((f, i) => (
              <div
                key={`f-${i}`}
                title={f.label}
                style={{
                  position: "absolute",
                  top: 10,
                  bottom: 10,
                  left: pct(f.start),
                  width: pct(f.end - f.start),
                  background: "color-mix(in oklab, var(--color-cream) 70%, var(--color-tan))",
                  borderRadius: 5,
                  border: "1px solid color-mix(in oklab, var(--color-tan) 70%, transparent)",
                }}
              />
            ))}

            {/* Eventos */}
            {data.events.map((e, i) => (
              <div
                key={`e-${i}`}
                title={e.label}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: pct(e.start),
                  width: pct(e.end - e.start),
                  background: "transparent",
                  border: "1.5px dashed var(--color-accent)",
                  borderRadius: 5,
                }}
              />
            ))}

            {/* Workouts */}
            {data.workouts.map((w, i) => (
              <div
                key={`w-${i}`}
                title={w.label}
                style={{
                  position: "absolute",
                  top: 10,
                  bottom: 10,
                  left: pct(w.start),
                  width: pct(w.end - w.start),
                  background:
                    "color-mix(in oklab, var(--color-danger) 75%, var(--color-accent))",
                  borderRadius: 5,
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, .15)",
                }}
              />
            ))}

            {/* Comidas */}
            {data.meals.map((m, i) => (
              <div
                key={`m-${i}`}
                title={m.label}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: pct(m.at),
                  transform: "translate(-50%, -50%) rotate(45deg)",
                  width: 12,
                  height: 12,
                  background: "var(--color-accent)",
                  border: "1.5px solid var(--color-warm-white)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, .12)",
                }}
              />
            ))}

            {/* Etiquetas de hora */}
            {hours.map((h) => (
              <div
                key={`lbl-${h.m}`}
                className="ht-mono"
                style={{
                  position: "absolute",
                  bottom: -22,
                  left: pct(h.m),
                  transform: "translateX(-50%)",
                  fontSize: 10,
                  color: "var(--color-warm)",
                }}
              >
                {h.label}
              </div>
            ))}

            {/* Ticks */}
            {hours.map((h) => (
              <div
                key={`tick-${h.m}`}
                style={{
                  position: "absolute",
                  top: -6,
                  bottom: -6,
                  left: pct(h.m),
                  width: 1,
                  background: "var(--color-cream)",
                }}
              />
            ))}

            {/* AHORA */}
            <div
              style={{
                position: "absolute",
                top: -48,
                bottom: -36,
                left: pct(nowMinutes),
                borderLeft: "1px dashed var(--color-accent)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -6,
                  left: -28,
                  width: 56,
                  textAlign: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--color-accent)",
                  background: "var(--color-warm-white)",
                  padding: "2px 0",
                  borderRadius: 4,
                  border: "1px solid var(--color-accent)",
                }}
              >
                AHORA
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 44,
                  left: -4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  boxShadow: "0 0 0 3px color-mix(in oklab, var(--color-accent) 25%, transparent)",
                  animation: "ht-breathe 2.4s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-5 mt-6"
          style={{ fontSize: 11.5, color: "var(--color-warm)" }}
        >
          <LegendChip
            color="color-mix(in oklab, var(--color-tan) 55%, var(--color-warm-white))"
            label="Sueño"
          />
          <LegendChip
            color="color-mix(in oklab, var(--color-cream) 70%, var(--color-tan))"
            label="Foco profundo"
          />
          <LegendChip
            color="color-mix(in oklab, var(--color-danger) 75%, var(--color-accent))"
            label="Gym"
          />
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 10,
                height: 10,
                background: "var(--color-accent)",
                transform: "rotate(45deg)",
              }}
            />{" "}
            Comida
          </div>
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 12,
                height: 8,
                border: "1.5px dashed var(--color-accent)",
                borderRadius: 2,
              }}
            />{" "}
            Evento
          </div>
        </div>
      </div>
    </section>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ width: 18, height: 10, background: color, borderRadius: 3 }} /> {label}
    </div>
  );
}
