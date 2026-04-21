"use client";

import React, { useState } from "react";
import { Tabs, Card } from "@/components/ui";
import ChallengesTab from "../challenges-tab";

const PROGRAMAS_SUBTABS = [
  { id: "activo",      label: "📋 Plan activo" },
  { id: "biblioteca",  label: "📚 Biblioteca" },
  { id: "builder",     label: "🛠️ Builder" },
  { id: "retos",       label: "🏅 Retos" },
];

export default function ProgramasHub() {
  const [subTab, setSubTab] = useState<string>("activo");

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

      {subTab === "activo" && <ActivePlanPlaceholder />}
      {subTab === "biblioteca" && <LibraryPlaceholder />}
      {subTab === "builder" && <BuilderPlaceholder />}
      {subTab === "retos" && <ChallengesTab />}
    </section>
  );
}

function ActivePlanPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Plan activo · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Cuando actives un programa, aquí verás:
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0">
        <li>Timeline de mesociclos con fase actual destacada</li>
        <li>Semana del programa (ej: "Semana 4 de 12 · Intensificación")</li>
        <li>Día del programa → rutina específica para hoy</li>
        <li>Progreso: sets completados vs planeados, peso progresando</li>
        <li>Sugerencia automática de deload si la fatiga acumulada lo pide</li>
      </ul>
    </Card>
  );
}

function LibraryPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Biblioteca de programas · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Plantillas validadas por la comunidad y la literatura:
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0">
        <li>
          <strong>Hipertrofia</strong>: PPL 6 días, Upper/Lower 4 días,
          Arnold split
        </li>
        <li>
          <strong>Fuerza</strong>: 5/3/1 (Wendler), StrongLifts 5×5, Madcow,
          Texas Method
        </li>
        <li>
          <strong>Powerbuilding</strong>: nSuns, PHAT, PHUL
        </li>
        <li>
          <strong>Peaking</strong>: Sheiko, Smolov, bloques cortos para
          competencia
        </li>
      </ul>
    </Card>
  );
}

function BuilderPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Builder custom · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0">
        Crea tu propio programa: semanas, mesociclos, rango RPE por fase,
        ejercicios, sets y repeticiones. La app valida que el volumen esté
        entre MEV y MRV por grupo muscular y sugiere ajustes.
      </p>
    </Card>
  );
}
