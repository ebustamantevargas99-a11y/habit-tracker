"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui";
import CardioSessionLogger from "../cardio/cardio-session-logger";
import CardioHistorial from "../cardio/cardio-historial";
import ZonesCalculator from "../cardio/zones-calculator";
import RacePredictor from "../cardio/race-predictor";
import ShoeManager from "../cardio/shoe-manager";

const CARDIO_SUBTABS = [
  { id: "hoy",        label: "🏃 Sesión activa" },
  { id: "historial",  label: "📜 Historial" },
  { id: "zones",      label: "❤️ Zonas HR" },
  { id: "predictor",  label: "🎯 Predictor de carreras" },
  { id: "shoes",      label: "👟 Zapatillas" },
];

export default function CardioHub() {
  const [subTab, setSubTab] = useState<string>("hoy");
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Cardio</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Correr, bici, natación, remo — sesión en vivo, zonas cardíacas
          (Karvonen), VO₂max y predictor de carreras (Riegel/Daniels).
        </p>
      </header>

      <Tabs
        tabs={CARDIO_SUBTABS}
        activeTab={subTab}
        onChange={(id) => setSubTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {subTab === "hoy" && (
        <CardioSessionLogger onSaved={() => setReloadKey((k) => k + 1)} />
      )}
      {subTab === "historial" && <CardioHistorial reloadKey={reloadKey} />}
      {subTab === "zones" && <ZonesCalculator />}
      {subTab === "predictor" && <RacePredictor />}
      {subTab === "shoes" && <ShoeManager />}
    </section>
  );
}
