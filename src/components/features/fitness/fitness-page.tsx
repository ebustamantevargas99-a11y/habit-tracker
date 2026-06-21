"use client";

import React, { useEffect } from "react";
import { Tabs, ErrorBanner } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import { useFitnessStore } from "@/stores/fitness-store";
import ResumenHub from "./hubs/resumen-hub";
import EntrenoHub from "./hubs/entreno-hub";
import CuerpoHub from "./hubs/cuerpo-hub";
import RutinasHub from "./hubs/rutinas-hub";

// ─── 4 hubs (rediseño 2026-06) ───────────────────────────────────────────────
// Resumen · inicio: rutina del día, progresión de carga, métricas clave
// Entreno · log de sesión, volumen semanal, récords, historial
// Cuerpo  · peso, composición, medidas, fotos, pasos
// Rutinas · constructor de rutina semanal propia
const HUBS = [
  { id: "resumen", label: "🏠 Resumen" },
  { id: "entreno", label: "🏋️ Entreno" },
  { id: "cuerpo",  label: "👤 Cuerpo" },
  { id: "rutinas", label: "📆 Rutinas" },
];

export default function FitnessPage() {
  const activeTab = useAppStore((s) => s.fitnessTab);
  const setActiveTab = useAppStore((s) => s.setFitnessTab);

  const { initialize: initFitness, error, clearError } = useFitnessStore();

  useEffect(() => {
    initFitness();
  }, [initFitness]);

  // Migrar IDs legacy (pre-rediseño) al hub correspondiente, para no romper
  // deep-links o sessionStorage obsoletos. Cardio y Análisis se eliminaron;
  // su contenido útil (progreso) vive ahora en Resumen.
  useEffect(() => {
    const LEGACY_TO_HUB: Record<string, string> = {
      gym:           "entreno",
      entrenamiento: "entreno",
      volumen:       "entreno",
      records:       "entreno",
      historial:     "entreno",
      cardio:        "entreno",
      analisis:      "resumen",
      programas:     "rutinas",
      plan:          "rutinas",
      retos:         "rutinas",
      metricas:      "cuerpo",
      peso:          "cuerpo",
      pasos:         "cuerpo",
      fotos:         "cuerpo",
    };
    const mapped = LEGACY_TO_HUB[activeTab];
    if (mapped && mapped !== activeTab) setActiveTab(mapped);
  }, [activeTab, setActiveTab]);

  const hubId = HUBS.some((h) => h.id === activeTab) ? activeTab : "resumen";

  return (
    <div>
      <ErrorBanner error={error} onDismiss={clearError} />

      <Tabs
        tabs={HUBS}
        activeTab={hubId}
        onChange={(id) => setActiveTab(id as string)}
        className="mb-6 flex-wrap border-brand-light-tan"
      />

      {hubId === "resumen" && <ResumenHub />}
      {hubId === "entreno" && <EntrenoHub />}
      {hubId === "cuerpo" && <CuerpoHub />}
      {hubId === "rutinas" && <RutinasHub />}
    </div>
  );
}
