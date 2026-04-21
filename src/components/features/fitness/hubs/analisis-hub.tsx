"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui";
import TrainingLoadChart from "../analisis/training-load-chart";
import ReadinessCheck from "../analisis/readiness-check";
import OneRMProjections from "../analisis/one-rm-projections";
import CoachAIExport from "../analisis/coach-ai-export";

const ANALISIS_SUBTABS = [
  { id: "load",         label: "📈 Training Load" },
  { id: "readiness",    label: "🔋 Readiness" },
  { id: "proyecciones", label: "🎯 Proyecciones 1RM" },
  { id: "coach",        label: "🤖 Coach IA" },
];

export default function AnalisisHub() {
  const [subTab, setSubTab] = useState<string>("load");

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Análisis</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          El cerebro científico del módulo. Training Load (Banister ATL/CTL/TSB),
          Readiness diaria, proyecciones 1RM avanzadas y exportación a tu IA
          personal para coaching contextual.
        </p>
      </header>

      <Tabs
        tabs={ANALISIS_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "load" && <TrainingLoadChart />}
      {subTab === "readiness" && <ReadinessCheck />}
      {subTab === "proyecciones" && <OneRMProjections />}
      {subTab === "coach" && <CoachAIExport />}
    </section>
  );
}
