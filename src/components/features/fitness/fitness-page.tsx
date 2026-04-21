"use client";

import React, { useEffect } from "react";
import { Tabs, ErrorBanner } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import { useFitnessStore } from "@/stores/fitness-store";
import GymHub from "./hubs/gym-hub";
import CardioHub from "./hubs/cardio-hub";
import CuerpoHub from "./hubs/cuerpo-hub";
import ProgramasHub from "./hubs/programas-hub";
import AnalisisHub from "./hubs/analisis-hub";

// ─── 5 hubs (ver memory/fitness_redesign_plan.md) ────────────────────────────
// Gym       · entrenamiento de fuerza / hipertrofia
// Cardio    · running, bici, swim, remo — HR zones, VO₂max, race predictor
// Cuerpo    · peso, composición, medidas, fotos, pasos
// Programas · planes estructurados con periodización + retos
// Análisis  · Training Load, Readiness, proyecciones, Coach IA
const HUBS = [
  { id: "gym",       label: "💪 Gym" },
  { id: "cardio",    label: "🏃 Cardio" },
  { id: "cuerpo",    label: "👤 Cuerpo" },
  { id: "programas", label: "📋 Programas" },
  { id: "analisis",  label: "🧠 Análisis" },
];

export default function FitnessPage() {
  const activeTab = useAppStore((s) => s.fitnessTab);
  const setActiveTab = useAppStore((s) => s.setFitnessTab);

  const { initialize: initFitness, error, clearError } = useFitnessStore();

  useEffect(() => {
    initFitness();
  }, [initFitness]);

  // Migrar IDs legacy (pre-redesign) al hub correspondiente, para no romper
  // deep-links o sessionStorage obsoletos.
  useEffect(() => {
    const LEGACY_TO_HUB: Record<string, string> = {
      entrenamiento: "gym",
      volumen:       "gym",
      records:       "gym",
      plan:          "programas",
      retos:         "programas",
      metricas:      "cuerpo",
      peso:          "cuerpo",
      pasos:         "cuerpo",
      fotos:         "cuerpo",
      ayuno:         "gym", // legacy — ayuno ya vive en LifeOS; enviamos a Gym por default
      nuevo:         "gym",
      "volumen-pro": "gym",
    };
    const mapped = LEGACY_TO_HUB[activeTab];
    if (mapped && mapped !== activeTab) setActiveTab(mapped);
  }, [activeTab, setActiveTab]);

  const hubId = HUBS.some((h) => h.id === activeTab) ? activeTab : "gym";

  return (
    <div className="p-6 bg-brand-warm-white min-h-screen">
      <ErrorBanner error={error} onDismiss={clearError} />

      <div className="mb-6">
        <h1 className="font-serif text-[36px] text-brand-dark m-0">Fitness</h1>
        <p className="text-brand-warm text-sm m-0 mt-2">
          Gimnasio, running y composición corporal — al nivel de las mejores
          apps del mundo.
        </p>
      </div>

      <Tabs
        tabs={HUBS}
        activeTab={hubId}
        onChange={(id) => setActiveTab(id as string)}
        className="mb-8 flex-wrap border-brand-light-tan"
      />

      {hubId === "gym" && <GymHub />}
      {hubId === "cardio" && <CardioHub />}
      {hubId === "cuerpo" && <CuerpoHub />}
      {hubId === "programas" && <ProgramasHub />}
      {hubId === "analisis" && <AnalisisHub />}
    </div>
  );
}
