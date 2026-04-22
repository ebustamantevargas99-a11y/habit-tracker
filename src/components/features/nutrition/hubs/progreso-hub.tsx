"use client";

/**
 * Hub "Progreso" — gráficas históricas + proyección de peso (Fase 3 real).
 *
 * Cuatro vistas:
 *   - Peso: línea cruda + suavizada 7d + proyección hacia meta + KPIs
 *     (tendencia kg/sem real, ETA, adherencia al plan, clasificación ISSN
 *     del pace)
 *   - Calorías: barras por día vs meta + streak en meta + weekday vs weekend
 *   - Resumen 7d: el legacy SummaryTab con promedios + gráficas pie/line
 *   - Coach IA: prompt contextual para pegar en Claude/ChatGPT/Gemini
 */

import { useState } from "react";
import { Tabs } from "@/components/ui";
import WeightProgressionChart from "../progreso/weight-progression-chart";
import CaloriesPeriodChart from "../progreso/calories-period-chart";
import CoachAIExport from "../progreso/coach-ai-export";
import NutrientReport from "../progreso/nutrient-report";
import { SummaryTab } from "../nutrition-page";

const SUB_TABS = [
  { id: "peso",       label: "⚖️ Peso + proyección" },
  { id: "calorias",   label: "🔥 Calorías" },
  { id: "nutrientes", label: "🧪 Nutrientes 30d" },
  { id: "resumen",    label: "📊 Resumen 7d" },
  { id: "coach",      label: "🤖 Coach IA" },
];

export default function ProgresoHub() {
  const [subTab, setSubTab] = useState("peso");

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Progreso</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Tendencias históricas de peso con regresión lineal real + calorías
          vs meta + adherencia + coach nutricional con tu IA personal.
        </p>
      </header>

      <Tabs
        tabs={SUB_TABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "peso"       && <WeightProgressionChart />}
      {subTab === "calorias"   && <CaloriesPeriodChart />}
      {subTab === "nutrientes" && <NutrientReport />}
      {subTab === "resumen"    && <SummaryTab />}
      {subTab === "coach"      && <CoachAIExport />}
    </section>
  );
}
