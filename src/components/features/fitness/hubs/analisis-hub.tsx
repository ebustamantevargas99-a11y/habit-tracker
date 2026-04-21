"use client";

import React, { useState } from "react";
import { Tabs, Card } from "@/components/ui";

const ANALISIS_SUBTABS = [
  { id: "load",       label: "📈 Training Load" },
  { id: "readiness",  label: "🔋 Readiness" },
  { id: "proyecciones", label: "🎯 Proyecciones" },
  { id: "coach",      label: "🤖 Coach IA" },
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

      {subTab === "load" && <TrainingLoadPlaceholder />}
      {subTab === "readiness" && <ReadinessPlaceholder />}
      {subTab === "proyecciones" && <ProjectionsPlaceholder />}
      {subTab === "coach" && <CoachPlaceholder />}
    </section>
  );
}

function TrainingLoadPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Training Load · próximamente (Banister)
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Modelo científico estándar de carga de entrenamiento:
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0 mb-3">
        <li>
          <strong>ATL</strong> (Acute Training Load): fatiga reciente, ventana 7
          días. Sube fuerte tras cada sesión.
        </li>
        <li>
          <strong>CTL</strong> (Chronic Training Load): tu fitness real, ventana
          42 días. Sube lento y baja lento.
        </li>
        <li>
          <strong>TSB</strong> (Training Stress Balance) = CTL − ATL. Tu "forma":
          positivo → fresco para PR, negativo → acumulando fatiga, muy negativo
          → riesgo de lesión / sobreentrenamiento.
        </li>
      </ul>
      <p className="text-brand-warm text-xs m-0">
        Cada Workout calcula un TRIMP (Training Impulse) que alimenta ATL y CTL.
      </p>
    </Card>
  );
}

function ReadinessPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Readiness diaria · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Check-in matinal con 5 sliders (sueño, dolor muscular, energía, humor,
        motivación) + opcional HR en reposo y HRV si tienes wearable. La app
        calcula un score 0–100 y te recomienda:
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0">
        <li>
          <span className="text-success font-semibold">Go hard</span> (85+):
          sesión dura, intentar PR
        </li>
        <li>
          <span className="text-info font-semibold">Moderate</span> (65-84):
          entreno normal, RPE 7-8
        </li>
        <li>
          <span className="text-warning font-semibold">Light</span> (40-64):
          volumen reducido, RPE 6-7, técnica
        </li>
        <li>
          <span className="text-danger font-semibold">Rest</span> (&lt;40):
          descanso activo, paseo, mobility
        </li>
      </ul>
    </Card>
  );
}

function ProjectionsPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Proyecciones de 1RM · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Además del Epley simple (ya lo tienes), añadimos:
      </p>
      <ul className="text-brand-warm text-sm list-disc pl-5 m-0">
        <li>Curve fit exponencial para plateaus realistas</li>
        <li>Proyección a 4/8/12 semanas ajustada por fase del programa</li>
        <li>
          Ajuste por TSB actual: si estás muy cansado, la proyección se modera
        </li>
        <li>Detección automática de estancamiento (3+ sesiones sin progreso)</li>
      </ul>
    </Card>
  );
}

function CoachPlaceholder() {
  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0 mb-2">
        Coach IA · próximamente
      </h3>
      <p className="text-brand-warm text-sm m-0 mb-3">
        Botón "Exportar análisis fitness a IA" que genera un prompt estructurado
        con todos tus datos relevantes (volumen semanal, PRs recientes, TSB,
        readiness, nutrición, sueño) y tu pregunta específica. Lo pegas en
        Claude/ChatGPT/Gemini y recibes coaching personalizado.
      </p>
      <p className="text-brand-warm text-xs m-0">
        Sin costo de LLM propio — el análisis lo hace tu IA favorita con tu
        propia suscripción.
      </p>
    </Card>
  );
}
