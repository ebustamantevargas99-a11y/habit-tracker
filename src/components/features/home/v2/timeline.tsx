"use client";

import { useMemo } from "react";
import SectionHeader from "./primitives/section-header";
import type { TimelineData } from "./types";

interface Props {
  data: TimelineData;
  nowHour?: number;
  nowMin?: number;
}

type LaneItem = { start: number; end: number; label: string };

const LANE_LABEL_WIDTH = 92; // px — cabe "COMIDAS" y "AGENDA" sin truncar

/**
 * Timeline del día por carriles (laned). Cada tipo de tiempo —sueño,
 * foco, gym, comidas, agenda— vive en su propia fila horizontal. Se
 * leen como partituras: se puede ver el solapamiento y la densidad de
 * cada dominio sin que unos bloques pisen a otros.
 *
 * Eje: 06:00 de hoy → 06:00 de mañana (24h). Posiciones en minutos
 * desde 06:00. Los eventos overnight se descomponen antes en dos
 * bandas si cruzan medianoche.
 */
export default function Timeline({
  data,
  nowHour = new Date().getHours(),
  nowMin = new Date().getMinutes(),
}: Props) {
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

  // Convertir meals (que solo tienen `at`) a items tipo banda angosta
  // para poder renderizarlos como diamantes sobre el carril.
  const mealsAsItems: LaneItem[] = data.meals.map((m) => ({
    start: m.at,
    end: m.at,
    label: m.label,
  }));

  return (
    <section>
      <SectionHeader
        eyebrow="Tu día"
        title="Las horas, en capas"
        subtitle="Cada carril es un tipo de tiempo. Se leen como partituras."
      />
      <div className="ht-card mt-5" style={{ padding: 24, animation: "ht-fadeUp .55s 80ms both" }}>
        <div style={{ position: "relative" }}>
          {/* Fila de horas arriba */}
          <div
            className="relative"
            style={{ height: 20, marginLeft: LANE_LABEL_WIDTH, marginBottom: 8 }}
          >
            {hours.map((h) => (
              <div
                key={h.m}
                className="ht-mono"
                style={{
                  position: "absolute",
                  left: pct(h.m),
                  transform: "translateX(-50%)",
                  fontSize: 10,
                  color: "var(--color-warm)",
                }}
              >
                {h.label}
              </div>
            ))}
          </div>

          {/* Carril: Sueño */}
          <Lane label="Sueño" hours={hours} nowMinutes={nowMinutes} pct={pct}>
            {data.sleep.map((s, i) => (
              <div
                key={`sl-${i}`}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: pct(s.start),
                  width: pct(s.end - s.start),
                  background:
                    "color-mix(in oklab, var(--color-tan) 55%, var(--color-warm-white))",
                  borderRadius: 4,
                }}
                title="Sueño"
              />
            ))}
          </Lane>

          {/* Carril: Foco profundo */}
          <Lane label="Foco" hours={hours} nowMinutes={nowMinutes} pct={pct}>
            {data.focus.map((f, i) => (
              <div
                key={`f-${i}`}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: pct(f.start),
                  width: pct(f.end - f.start),
                  background: "color-mix(in oklab, var(--color-cream) 70%, var(--color-tan))",
                  borderRadius: 4,
                  border: "1px solid color-mix(in oklab, var(--color-tan) 70%, transparent)",
                  padding: "4px 8px",
                  fontSize: 10.5,
                  color: "var(--color-brown)",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                title={f.label}
              >
                {f.label}
              </div>
            ))}
          </Lane>

          {/* Carril: Gym */}
          <Lane label="Gym" hours={hours} nowMinutes={nowMinutes} pct={pct}>
            {data.workouts.map((w, i) => (
              <div
                key={`w-${i}`}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: pct(w.start),
                  width: pct(w.end - w.start),
                  background:
                    "color-mix(in oklab, var(--color-danger) 75%, var(--color-accent))",
                  borderRadius: 4,
                  color: "var(--color-paper)",
                  padding: "4px 8px",
                  fontSize: 10.5,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                title={w.label}
              >
                {w.label}
              </div>
            ))}
          </Lane>

          {/* Carril: Comidas (diamantes) */}
          <Lane label="Comidas" hours={hours} nowMinutes={nowMinutes} pct={pct}>
            {mealsAsItems.map((m, i) => (
              <div
                key={`m-${i}`}
                title={m.label}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: pct(m.start),
                  transform: "translate(-50%, -50%) rotate(45deg)",
                  width: 10,
                  height: 10,
                  background: "var(--color-accent)",
                  border: "1.5px solid var(--color-warm-white)",
                }}
              />
            ))}
          </Lane>

          {/* Carril: Agenda / eventos */}
          <Lane label="Agenda" hours={hours} nowMinutes={nowMinutes} pct={pct}>
            {data.events.map((e, i) => (
              <div
                key={`e-${i}`}
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  left: pct(e.start),
                  width: pct(e.end - e.start),
                  background: "transparent",
                  border: "1.5px dashed var(--color-accent)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10.5,
                  color: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                title={e.label}
              >
                {e.label}
              </div>
            ))}
          </Lane>

          {/* Etiqueta AHORA debajo de todos los carriles */}
          <div
            style={{
              marginLeft: LANE_LABEL_WIDTH,
              marginTop: 6,
              fontSize: 10,
              color: "var(--color-accent)",
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            ↑ AHORA · {String(nowHour).padStart(2, "0")}:
            {String(nowMin).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
}

function Lane({
  label,
  hours,
  nowMinutes,
  pct,
  children,
}: {
  label: string;
  hours: Array<{ m: number }>;
  nowMinutes: number;
  pct: (m: number) => string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-stretch mb-1.5">
      <div
        style={{
          width: LANE_LABEL_WIDTH,
          paddingRight: 10,
          fontSize: 10,
          color: "var(--color-warm)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
      <div
        className="flex-1 relative"
        style={{
          height: 26,
          background: "var(--color-paper)",
          borderRadius: 5,
          border: "1px solid var(--color-cream)",
        }}
      >
        {/* Ticks verticales cada 3h */}
        {hours.map((h) => (
          <div
            key={h.m}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: pct(h.m),
              width: 1,
              background: "var(--color-cream)",
              opacity: 0.6,
            }}
          />
        ))}
        {children}
        {/* Línea AHORA */}
        <div
          style={{
            position: "absolute",
            top: -2,
            bottom: -2,
            left: pct(nowMinutes),
            borderLeft: "1px dashed var(--color-accent)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
