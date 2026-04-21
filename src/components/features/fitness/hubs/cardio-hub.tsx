"use client";

import React, { useState } from "react";
import { Tabs, Card } from "@/components/ui";

const CARDIO_SUBTABS = [
  { id: "hoy",       label: "🏃 Sesión activa" },
  { id: "historial", label: "📜 Historial" },
  { id: "zones",     label: "❤️ Zonas HR" },
  { id: "predictor", label: "🎯 Race predictor" },
];

export default function CardioHub() {
  const [subTab, setSubTab] = useState<string>("hoy");

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Cardio</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Running, bici, natación, remo — sesión en vivo, zonas cardíacas
          (Karvonen), VO₂max y predictor de carreras (Riegel/Daniels).
        </p>
      </header>

      <Tabs
        tabs={CARDIO_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "hoy" && <CardioSessionPlaceholder />}
      {subTab === "historial" && <CardioHistorialPlaceholder />}
      {subTab === "zones" && <ZonesPlaceholder />}
      {subTab === "predictor" && <PredictorPlaceholder />}
    </section>
  );
}

// ─── Placeholders didácticos (contenido real se implementa en Fase 3) ───────
// Los placeholders explican qué va a vivir ahí + por qué importa, para que
// el user entienda el roadmap sin sentir que la tab está "vacía".

function CardioSessionPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Sesión activa · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Timer en vivo para cardio con registro manual (distancia + duración) o
        GPS del navegador opcional. Al terminar, la sesión calcula pace, zones
        de HR (Karvonen), y kilometraje acumulado de tu zapatilla activa.
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0">
        <li>Start / Pause / Stop con timer preciso</li>
        <li>Input manual o auto-pace con GPS (Haversine)</li>
        <li>Split por km en vivo</li>
        <li>Zonas HR detectadas si introduces ritmo cardíaco</li>
      </ul>
    </Card>
  );
}

function CardioHistorialPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Historial · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0">
        Lista cronológica de tus sesiones de cardio con distancia, pace,
        zonas HR y calorías estimadas. Filtrable por tipo de actividad.
      </p>
    </Card>
  );
}

function ZonesPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Zonas cardíacas · próximamente (Karvonen)
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Calculadora basada en tu edad + frecuencia cardíaca en reposo.
        Devuelve 5 zonas — desde recuperación (Z1) hasta VO₂max (Z5) — con el
        rango de BPM recomendado para cada zona.
      </p>
      <p className="text-brand-warm text-xs m-0">
        Fórmula: HR_target = ((HR_max − HR_rest) × %) + HR_rest. HR_max
        estimado con Tanaka (208 − 0.7·edad).
      </p>
    </Card>
  );
}

function PredictorPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Race predictor · próximamente (Riegel / Daniels)
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Con tu mejor tiempo conocido (5k, 10k, media o maratón), predice los
        otros usando la fórmula de Riegel (T₂ = T₁ × (D₂/D₁)^1.06) y te da
        un VDOT estimado a la Jack Daniels.
      </p>
      <p className="text-brand-warm text-xs m-0">
        Ajustado por edad (age-graded) para que la meta sea realista.
      </p>
    </Card>
  );
}
