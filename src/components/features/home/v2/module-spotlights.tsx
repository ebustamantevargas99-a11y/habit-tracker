"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import SectionHeader from "./primitives/section-header";
import {
  NutritionArt,
  FinanceArt,
  FitnessArt,
  CycleArt,
  ReadingArt,
} from "./primitives/spotlight-art";
import type { EnabledModulesV2, HomeV2Data } from "./types";

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  kpi: string;
  detail: string;
  art: React.ReactNode;
}

interface Props {
  modules: EnabledModulesV2;
  data: HomeV2Data;
}

export default function ModuleSpotlights({ modules, data }: Props) {
  const slides: Slide[] = [];

  if (modules.nutrition) {
    slides.push({
      key: "nutrition",
      eyebrow: "Nutrición",
      title: "Tus macros de hoy",
      kpi: `${data.nutrition.kcal} / ${data.nutrition.goal} kcal`,
      detail: `${Math.round((data.nutrition.kcal / data.nutrition.goal) * 100)}% del objetivo diario`,
      art: <NutritionArt data={data.nutrition} />,
    });
  }
  if (modules.finance) {
    slides.push({
      key: "finance",
      eyebrow: "Finanzas",
      title: "Ahorro de este mes",
      kpi: `$${data.finance.savedMonth.toLocaleString("es-MX")}`,
      detail: `${data.finance.pct}% del ingreso · +${data.finance.pct - data.finance.pctPrev}pp vs. mes anterior`,
      art: <FinanceArt pct={data.finance.pct} />,
    });
  }
  if (modules.fitness) {
    slides.push({
      key: "fitness",
      eyebrow: "Fitness",
      title: "Volumen semanal",
      kpi: `${data.fitness.volumeKg.toLocaleString("es-MX")} kg`,
      detail: `${data.fitness.sessionsWeek} sesiones esta semana · +${Math.round(
        ((data.fitness.volumeKg - data.fitness.volumePrev) / data.fitness.volumePrev) * 100,
      )}%`,
      art: <FitnessArt vol={data.fitness.volumeKg} />,
    });
  }
  if (modules.menstrualCycle) {
    slides.push({
      key: "cycle",
      eyebrow: "Ciclo",
      title: `Día ${data.cycle.day}`,
      kpi: data.cycle.phase.charAt(0).toUpperCase() + data.cycle.phase.slice(1),
      detail: `${data.cycle.length - data.cycle.day} días para el siguiente ciclo`,
      art: <CycleArt day={data.cycle.day} length={data.cycle.length} />,
    });
  }
  if (modules.reading) {
    slides.push({
      key: "reading",
      eyebrow: "Lectura",
      title: "Lectura en curso",
      kpi: "20 min de hoy",
      detail: "17 días consecutivos",
      art: <ReadingArt />,
    });
  }

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= slides.length) setIdx(0);
  }, [slides.length, idx]);

  if (slides.length === 0) return null;
  const slide = slides[idx] ?? slides[0];

  return (
    <section>
      <SectionHeader
        eyebrow="Detalle por módulo"
        title="Un vistazo al resto"
        subtitle="Cada módulo en su mejor ángulo del día."
        right={
          <div className="flex items-center gap-2">
            <DotBtn onClick={() => setIdx((idx - 1 + slides.length) % slides.length)}>
              <ChevronLeft size={16} strokeWidth={1.75} />
            </DotBtn>
            <DotBtn onClick={() => setIdx((idx + 1) % slides.length)}>
              <ChevronRight size={16} strokeWidth={1.75} />
            </DotBtn>
          </div>
        }
      />

      <div
        className="ht-card mt-5"
        style={{ padding: 0, overflow: "hidden", animation: "ht-fadeUp .55s 80ms both" }}
      >
        <div
          className="grid items-stretch"
          style={{
            gridTemplateColumns: "1fr auto",
            minHeight: 280,
            background:
              "linear-gradient(120deg, var(--color-warm-white) 0%, color-mix(in oklab, var(--color-cream) 50%, var(--color-warm-white)) 100%)",
          }}
        >
          <div
            className="flex flex-col gap-4 justify-center"
            style={{ padding: "36px 40px" }}
          >
            <div className="ht-eyebrow">{slide.eyebrow}</div>
            <h3
              className="ht-serif m-0"
              style={{
                fontSize: "clamp(22px, 2.4vw, 30px)",
                lineHeight: 1.1,
                color: "var(--color-brown)",
                fontWeight: 700,
                letterSpacing: "-0.015em",
              }}
            >
              {slide.title}
            </h3>
            <div className="ht-serif ht-num-big" style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
              {slide.kpi}
            </div>
            <div style={{ color: "var(--color-warm)", fontSize: 14 }}>{slide.detail}</div>
            <div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[12px] transition mt-2"
                style={{
                  background: "var(--color-dark)",
                  color: "var(--color-paper)",
                  padding: "12px 18px",
                  fontSize: 14,
                  fontWeight: 500,
                  border: "1px solid var(--color-dark)",
                }}
              >
                Ver detalle <ArrowRight size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ padding: 32, minWidth: 280 }}
          >
            {slide.art}
          </div>
        </div>

        <div
          className="flex items-center justify-center gap-2"
          style={{
            padding: "16px 0 20px",
            borderTop: "1px solid var(--color-cream)",
          }}
        >
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === idx ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: i === idx ? "var(--color-accent)" : "var(--color-tan)",
                border: 0,
                cursor: "pointer",
                padding: 0,
                transition: "all .25s ease",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DotBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: "1px solid var(--color-cream)",
        background: "var(--color-warm-white)",
        color: "var(--color-brown)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
