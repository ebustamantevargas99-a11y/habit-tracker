"use client";

import React, { useState } from "react";
import { Tabs, Card } from "@/components/ui";
import { useFitnessStore } from "@/stores/fitness-store";
import BodyMetricsTab from "../body-metrics-tab";
import WeightTab from "../weight-tab";
import StepsTab from "../steps-tab";
import PhotosTab from "../photos-tab";

const CUERPO_SUBTABS = [
  { id: "peso",        label: "⚖️ Peso" },
  { id: "composicion", label: "🧬 Composición" },
  { id: "medidas",     label: "📏 Medidas" },
  { id: "fotos",       label: "📸 Fotos" },
  { id: "pasos",       label: "👣 Pasos" },
];

export default function CuerpoHub() {
  const [subTab, setSubTab] = useState<string>("peso");

  const { weightLog, stepsLog, addWeight, addSteps, addBodyMetric } =
    useFitnessStore();

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Cuerpo</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Tu composición corporal y métricas físicas — peso, % grasa, masa magra,
          circunferencias, fotos de progreso y pasos diarios.
        </p>
      </header>

      <Tabs
        tabs={CUERPO_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "peso" && (
        <WeightTab weightLog={weightLog} onAddWeight={addWeight} />
      )}

      {subTab === "composicion" && <BodyCompositionPlaceholder />}

      {subTab === "medidas" && <BodyMetricsTab onSave={addBodyMetric} />}

      {subTab === "fotos" && <PhotosTab />}

      {subTab === "pasos" && (
        <StepsTab stepsLog={stepsLog} onAddSteps={addSteps} />
      )}
    </section>
  );
}

// Composición (nuevo — usa BodyComposition model). Placeholder didáctico
// hasta Fase 3 que implementa CRUD + gráfica de evolución.
function BodyCompositionPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Composición corporal · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Separado de "Medidas" — aquí trackeas los valores <em>globales</em> del
        cuerpo: % grasa, masa magra (LBM), masa grasa, agua, grasa visceral,
        masa ósea, BMR.
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0 mb-3">
        <li>
          <strong>Método</strong>: DEXA, báscula bioimpedancia (BIA),
          plicómetro, Navy tape, photo estimate
        </li>
        <li>Cálculo automático de LBM/fatMass desde peso + % grasa</li>
        <li>Gráfica de evolución y comparación mes a mes</li>
        <li>Relación composición ↔ progreso de entreno</li>
      </ul>
      <p className="text-brand-warm text-xs m-0">
        Las <strong>circunferencias</strong> (pecho, cintura, cadera, brazo,
        muslo) siguen en la sub-tab <strong>Medidas</strong>.
      </p>
    </Card>
  );
}
