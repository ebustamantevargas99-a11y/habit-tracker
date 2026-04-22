"use client";

/**
 * Hub "Alimentos" — consolida FoodsTab (custom foods) + GoalsTab (metas
 * nutricionales). Fase 2 usa la versión legacy; Fase 5 añade recipe builder
 * visual, meta de peso extendida con BMR/TDEE auto-calculado desde profile,
 * y clasificación del weeklyRate según ISSN.
 */

import { useState } from "react";
import { Tabs } from "@/components/ui";
import { FoodsTab, GoalsTab } from "../nutrition-page";

const SUB_TABS = [
  { id: "foods", label: "🥗 Mis Alimentos" },
  { id: "goals", label: "🎯 Metas" },
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
          Tu lista personal de alimentos personalizados + objetivos calóricos
          y de macros. Las metas de peso avanzadas llegan en Fase 5.
        </p>
      </header>

      <Tabs
        tabs={SUB_TABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "foods" && <FoodsTab />}
      {subTab === "goals" && <GoalsTab />}
    </section>
  );
}
