"use client";

import { PieChart, BarChart3, TrendingUp } from "lucide-react";

/** Stub — se completa en Fase 4 con Sankey + cashflow + category growth + FIRE + affordability + what-if. */
export default function AnalysisView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-8 text-center">
          <PieChart size={32} className="mx-auto text-brand-warm mb-3" />
          <h3 className="font-serif text-base font-semibold text-brand-dark">
            Sankey chart
          </h3>
          <p className="text-xs text-brand-warm mt-1">
            De dónde viene tu dinero → a dónde va
          </p>
        </div>
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-8 text-center">
          <BarChart3 size={32} className="mx-auto text-brand-warm mb-3" />
          <h3 className="font-serif text-base font-semibold text-brand-dark">
            Cashflow multi-mes
          </h3>
          <p className="text-xs text-brand-warm mt-1">
            12 meses de ingresos vs gastos vs ahorro
          </p>
        </div>
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-8 text-center">
          <TrendingUp size={32} className="mx-auto text-brand-warm mb-3" />
          <h3 className="font-serif text-base font-semibold text-brand-dark">
            FIRE calculator
          </h3>
          <p className="text-xs text-brand-warm mt-1">
            ¿Cuándo te retiras?
          </p>
        </div>
      </div>

      <div className="bg-brand-cream/30 border border-brand-cream rounded-xl p-8 text-center">
        <p className="font-semibold text-brand-medium mb-2">Fase 4 · Análisis pro próximamente</p>
        <ul className="text-sm text-brand-warm space-y-1">
          <li>📊 <b>Sankey chart</b> — flujo del dinero</li>
          <li>📈 <b>Cashflow 12 meses</b> — ingresos vs gastos stacked</li>
          <li>🌱 <b>Savings rate trendline</b> — tu % ahorro mes a mes</li>
          <li>🔥 <b>FIRE calculator</b> — proyección de retiro basada en tu savings rate</li>
          <li>💭 <b>"¿Puedes permitirte X?"</b> — input de compra + análisis de impacto</li>
          <li>🎲 <b>Simulador What-if</b> — cambia gastos o ingresos y ve el impacto</li>
          <li>📊 <b>Category growth YoY</b> — en qué gastas más año a año</li>
          <li>✨ <b>Insights IA</b> — prompt estructurado para Claude/ChatGPT</li>
        </ul>
      </div>
    </div>
  );
}
