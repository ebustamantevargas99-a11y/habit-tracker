"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";

interface CoachExportResponse {
  prompt: string;
  days: number;
  generatedAt: string;
  stats: {
    daysLogged: number;
    weightRecords: number;
    bodyCompositions: number;
    bloodMarkers?: number;
    deficientNutrients?: number;
    excessNutrients?: number;
  };
}

const RANGE_OPTIONS = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

export default function CoachAIExport() {
  const [data, setData] = useState<CoachExportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  async function generate() {
    setLoading(true);
    try {
      const r = await api.get<CoachExportResponse>(
        `/nutrition/coach-export?days=${days}`,
      );
      setData(r);
    } catch {
      toast.error("No se pudo generar el prompt");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.prompt);
      toast.success("Prompt copiado. Pégalo en Claude / ChatGPT / Gemini.");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function openClaude() {
    if (!data) return;
    void copyToClipboard();
    window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");
  }
  function openChatGpt() {
    if (!data) return;
    void copyToClipboard();
    window.open("https://chat.openai.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1 flex items-center gap-2">
          <Sparkles size={18} className="text-accent" /> Coach nutricional con IA
        </h3>
        <p className="text-brand-warm text-sm m-0 mb-4">
          Genera un prompt contextual con tu perfil + meta + ingesta + tendencia
          de peso + bioimpedancia. Lo pegas en tu IA personal (Claude/ChatGPT/
          Gemini) y recibes coaching específico.{" "}
          <strong>Cero costo LLM de nuestro lado</strong> — tu data nunca sale de
          tu navegador.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs transition",
                days === opt.days
                  ? "bg-accent text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-brand-dark text-brand-cream font-semibold text-sm hover:bg-brand-brown transition disabled:opacity-40"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Armando prompt…" : data ? "Regenerar" : "Generar prompt"}
          </button>
          <button
            onClick={() => {
              const url = `/api/nutrition/export?format=csv&days=${days}`;
              // Descarga forzada
              const a = document.createElement("a");
              a.href = url;
              a.download = "";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-brand-cream text-brand-dark text-sm font-semibold hover:bg-brand-light-tan"
            type="button"
            title="Descarga CSV con diario de comidas + totales + peso + composición + marcadores"
          >
            <Download size={16} /> Exportar CSV {days}d
          </button>
        </div>
      </Card>

      {data && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90"
            >
              <Copy size={14} /> Copiar prompt
            </button>
            <button
              onClick={openClaude}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-brand-cream text-brand-dark text-sm hover:bg-brand-light-tan"
            >
              <ExternalLink size={14} /> Abrir Claude.ai
            </button>
            <button
              onClick={openChatGpt}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-brand-cream text-brand-dark text-sm hover:bg-brand-light-tan"
            >
              <ExternalLink size={14} /> Abrir ChatGPT
            </button>
            <div className="flex items-center gap-2 text-xs text-brand-warm flex-wrap">
              <span>
                {data.stats.daysLogged}d · {data.stats.weightRecords} pesos ·{" "}
                {data.stats.bodyCompositions} comp
              </span>
              {(data.stats.bloodMarkers ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-danger-light/40 text-danger font-semibold">
                  {data.stats.bloodMarkers} marcadores
                </span>
              )}
              {(data.stats.deficientNutrients ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-warning-light/40 text-warning font-semibold">
                  {data.stats.deficientNutrients} deficiencias
                </span>
              )}
              {(data.stats.excessNutrients ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-info/20 text-info font-semibold">
                  {data.stats.excessNutrients} excesos
                </span>
              )}
            </div>
          </div>
          <pre className="bg-brand-warm-white border border-brand-light-cream rounded-md p-4 text-xs text-brand-dark overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
            {data.prompt}
          </pre>
        </Card>
      )}
    </div>
  );
}
