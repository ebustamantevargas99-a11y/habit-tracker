"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui";
import { useFitnessStore } from "@/stores/fitness-store";
import BodyMetricsTab from "../body-metrics-tab";
import BodyCompositionTab from "../body-composition-tab";
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

      {subTab === "composicion" && <BodyCompositionTab />}

      {subTab === "medidas" && <BodyMetricsTab onSave={addBodyMetric} />}

      {subTab === "fotos" && <PhotosTab />}

      {subTab === "pasos" && (
        <StepsTab stepsLog={stepsLog} onAddSteps={addSteps} />
      )}
    </section>
  );
}
