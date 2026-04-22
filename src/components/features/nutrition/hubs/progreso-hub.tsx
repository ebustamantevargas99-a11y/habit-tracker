"use client";

/**
 * Hub "Progreso" — gráficas históricas + proyección de peso.
 *
 * Fase 2: skeleton con resumen 7d + placeholders didácticos explicando qué
 * vendrá en Fase 3 (proyección lineal ETA, gráfica calorías vs meta mensual,
 * tendencia macros, adherencia).
 *
 * La infraestructura científica ya está lista:
 *   - /api/nutrition/weight-projection devuelve trend + ETA + adherencia
 *   - src/lib/nutrition/weight-projection.ts regresión lineal
 */

import { Card } from "@/components/ui";
import { TrendingUp, Target, Scale, LineChart } from "lucide-react";
import { SummaryTab } from "../nutrition-page";

export default function ProgresoHub() {
  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-[24px] text-brand-dark m-0">Progreso</h2>
        <p className="text-brand-warm text-sm m-0 mt-1">
          Tendencias históricas de calorías, macros y peso — con proyección
          inteligente hacia tu objetivo.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Resumen 7 días (ya existe) */}
        <SummaryTab />

        {/* Proyección de peso — placeholder Fase 3 */}
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-2 flex items-center gap-2">
            <Target size={18} className="text-accent" /> Proyección de peso (Fase 3)
          </h3>
          <p className="text-brand-warm text-sm m-0 mb-3">
            Cuando tengas meta de peso configurada en <strong>Alimentos →
            Metas</strong> y al menos 2 registros de peso, esta sección mostrará:
          </p>
          <ul className="text-brand-warm text-sm list-disc pl-5 m-0">
            <li>
              <strong>Tendencia real</strong> (regresión lineal OLS sobre tus
              pesos): ej. &quot;bajando 0.4 kg/semana&quot;
            </li>
            <li>
              <strong>ETA a objetivo</strong>: fecha estimada si mantienes la
              tendencia actual
            </li>
            <li>
              <strong>Adherencia al plan</strong>: plan vs real (&quot;vas al 80%
              del pace planificado&quot;)
            </li>
            <li>
              <strong>Peso suavizado</strong> (media móvil 7d) para eliminar
              fluctuaciones de hidratación/glicógeno
            </li>
            <li>
              <strong>Clasificación del pace</strong> (ISSN): conservador /
              moderado / agresivo según % del peso corporal
            </li>
          </ul>
          <p className="text-[11px] text-brand-tan mt-3 m-0">
            Endpoint: <code>GET /api/nutrition/weight-projection</code> ya listo.
          </p>
        </Card>

        {/* Gráfica calorías mensual — placeholder Fase 3 */}
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-2 flex items-center gap-2">
            <LineChart size={18} className="text-accent" /> Calorías mensuales (Fase 3)
          </h3>
          <p className="text-brand-warm text-sm m-0">
            Vista de 30 / 90 / 365 días con línea de ingesta diaria vs meta,
            área sombreada de desviación, y streak de días dentro de rango
            (±10% meta). Incluye desglose de macros (stacked area).
          </p>
        </Card>

        {/* Insights automáticos — placeholder Fase 3 */}
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-2 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" /> Insights automáticos (Fase 3)
          </h3>
          <p className="text-brand-warm text-sm m-0">
            Detección de patrones automáticos — por ejemplo: &quot;los fines de
            semana comes 400 kcal más que en semana&quot;, &quot;tu proteína cae
            los lunes&quot;, &quot;llevas 12 días consecutivos dentro de meta&quot;.
          </p>
        </Card>

        {/* Exportar análisis a IA — placeholder */}
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-2 flex items-center gap-2">
            <Scale size={18} className="text-accent" /> Coach nutricional IA (Fase 3)
          </h3>
          <p className="text-brand-warm text-sm m-0">
            Genera prompt contextualizado con tus últimos 30d de comidas +
            meta + tendencia de peso + bioimpedancia para pegar en Claude/ChatGPT
            y recibir coaching personalizado.
          </p>
        </Card>
      </div>
    </section>
  );
}
