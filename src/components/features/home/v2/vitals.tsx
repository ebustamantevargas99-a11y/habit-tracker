"use client";

import Sparkline from "./primitives/sparkline";
import SectionHeader from "./primitives/section-header";
import { useCountUp } from "./primitives/use-count-up";
import type { EnabledModulesV2, HomeV2Data } from "./types";

interface Tile {
  label: string;
  value: number;
  unit?: string;
  spark: number[];
  delta: number | null;
  suffix?: string;
}

interface StatTileProps extends Tile {
  delay: number;
}

function StatTile({ label, value, unit, spark, delta, suffix, delay }: StatTileProps) {
  const animated = useCountUp(value, 800, delay);
  const shown = Math.round(animated).toLocaleString("es-MX");
  const dChip = delta == null ? null : delta >= 0 ? "good" : "bad";

  return (
    <div
      className="ht-card ht-card-interactive flex flex-col gap-2.5"
      style={{
        padding: 20,
        animation: `ht-fadeUp .55s ${delay}ms both cubic-bezier(.2, .7, .2, 1)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="ht-eyebrow" style={{ fontSize: 10 }}>
          {label}
        </div>
        {delta != null && (
          <span
            className="inline-flex items-center font-semibold rounded-full"
            style={{
              fontSize: 10,
              padding: "2px 8px",
              border: "1px solid",
              letterSpacing: "0.02em",
              color:
                dChip === "good" ? "var(--color-good)" : "var(--color-danger)",
              background:
                dChip === "good"
                  ? "color-mix(in oklab, var(--color-good) 14%, var(--color-warm-white))"
                  : "color-mix(in oklab, var(--color-danger) 14%, var(--color-warm-white))",
              borderColor:
                dChip === "good"
                  ? "color-mix(in oklab, var(--color-good) 25%, transparent)"
                  : "color-mix(in oklab, var(--color-danger) 25%, transparent)",
            }}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
            {suffix || ""}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <div className="ht-serif ht-num-big" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
          {shown}
        </div>
        {unit && <div style={{ fontSize: 12, color: "var(--color-warm)", fontWeight: 500 }}>{unit}</div>}
      </div>
      {spark && <Sparkline data={spark} w={200} h={36} delay={delay + 120} />}
    </div>
  );
}

interface Props {
  modules: EnabledModulesV2;
  data: HomeV2Data;
}

export default function Vitals({ modules, data }: Props) {
  const tiles: Tile[] = [];

  tiles.push({
    label: "Life Score",
    value: data.lifeScore,
    unit: "/100",
    spark: data.sparks.lifeScore,
    delta: data.lifeScore - data.lifeScorePrev,
    suffix: "",
  });

  // Delta de hábitos hoy vs promedio últimos 7d — aproximación desde el
  // sparkline (penúltimos 7 días vs hoy).
  const habitsSpark = data.sparks.habits;
  const habitsAvg7 =
    habitsSpark.length >= 8
      ? habitsSpark.slice(-8, -1).reduce((a, b) => a + b, 0) / 7
      : 0;
  const habitsDelta = Math.round(data.habitsToday.done - habitsAvg7);

  tiles.push({
    label: "Hábitos hoy",
    value: data.habitsToday.done,
    unit: `/ ${data.habitsToday.total}`,
    spark: data.sparks.habits,
    delta: habitsSpark.length > 0 ? habitsDelta : null,
    suffix: "",
  });

  if (modules.fitness) {
    const prev = data.fitness.volumePrev;
    const deltaPct =
      prev > 0
        ? Math.round(((data.fitness.volumeKg - prev) / prev) * 100)
        : null;
    tiles.push({
      label: "Volumen semana",
      value: data.fitness.volumeKg,
      unit: "kg",
      spark: data.sparks.volume,
      delta: deltaPct,
      suffix: "%",
    });
  }

  if (modules.nutrition) {
    const goal = data.nutrition.goal || 2000;
    const kcalDelta =
      data.nutrition.kcal > 0
        ? Math.round(((data.nutrition.kcal - goal) / goal) * 100)
        : null;
    tiles.push({
      label: "Calorías hoy",
      value: data.nutrition.kcal,
      unit: `/ ${goal}`,
      spark: data.sparks.kcal,
      delta: kcalDelta,
      suffix: "%",
    });
  }

  if (modules.finance) {
    tiles.push({
      label: "Ahorro mes",
      value: data.finance.pct,
      unit: "%",
      spark: data.sparks.saving,
      delta: data.finance.pct - data.finance.pctPrev,
      suffix: "pp",
    });
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Vitales"
        title="Pulso del momento"
        subtitle="Los números que te importan, respirando a tu ritmo."
      />
      <div
        className="grid gap-4 mt-5"
        style={{
          gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))`,
        }}
      >
        {tiles.map((t, i) => (
          <StatTile key={t.label} {...t} delay={120 + i * 90} />
        ))}
      </div>
    </section>
  );
}
