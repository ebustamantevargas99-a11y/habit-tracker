"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui";
import ActivePlan from "../programas/active-plan";
import TemplateLibrary from "../programas/template-library";
import ProgramBuilder from "../programas/program-builder";
import ChallengesTab from "../challenges-tab";

const PROGRAMAS_SUBTABS = [
  { id: "activo",      label: "📋 Plan activo" },
  { id: "biblioteca",  label: "📚 Biblioteca" },
  { id: "builder",     label: "🛠️ Builder" },
  { id: "retos",       label: "🏅 Retos" },
];

export default function ProgramasHub() {
  const [subTab, setSubTab] = useState<string>("activo");
  const [reloadKey, setReloadKey] = useState(0);

  const bumpReload = () => setReloadKey((k) => k + 1);

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Programas</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Planes estructurados con periodización científica. Linear, DUP,
          Block, Conjugate — acumulación → intensificación → realización →
          deload.
        </p>
      </header>

      <Tabs
        tabs={PROGRAMAS_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "activo" && <ActivePlan reloadKey={reloadKey} />}
      {subTab === "biblioteca" && (
        <TemplateLibrary
          onActivated={() => {
            bumpReload();
            setSubTab("activo");
          }}
        />
      )}
      {subTab === "builder" && (
        <ProgramBuilder
          onCreated={() => {
            bumpReload();
            setSubTab("activo");
          }}
        />
      )}
      {subTab === "retos" && <ChallengesTab />}
    </section>
  );
}
