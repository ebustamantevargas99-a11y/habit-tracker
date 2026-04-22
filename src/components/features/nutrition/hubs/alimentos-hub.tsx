"use client";

/**
 * Hub "Alimentos" — consolida tres secciones:
 *   - 🥗 Mis Alimentos: lista custom de foods (legacy FoodsTab)
 *   - 🎯 Meta avanzada: wizard BMR/TDEE + peso objetivo + ISSN pace + macros
 *     auto-calculados (Fase 5)
 *   - ⚙️ Metas manuales: override numérico directo (legacy GoalsTab)
 */

import { useState } from "react";
import { Tabs } from "@/components/ui";
import { FoodsTab, GoalsTab } from "../nutrition-page";
import GoalWizard from "../alimentos/goal-wizard";

const SUB_TABS = [
  { id: "foods",    label: "🥗 Mis Alimentos" },
  { id: "wizard",   label: "🎯 Meta avanzada" },
  { id: "manual",   label: "⚙️ Metas manuales" },
];

export default function AlimentosHub() {
  const [subTab, setSubTab] = useState("foods");

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">
          Alimentos y Metas
        </h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Tu lista personal de alimentos + wizard de meta avanzada con BMR/TDEE
          auto-calculado (Mifflin-St Jeor) + macros distribuidos según ISSN
          + override manual si ya sabes exactamente qué calorías quieres.
        </p>
      </header>

      <Tabs
        tabs={SUB_TABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "foods"  && <FoodsTab />}
      {subTab === "wizard" && <GoalWizard />}
      {subTab === "manual" && <GoalsTab />}
    </section>
  );
}
