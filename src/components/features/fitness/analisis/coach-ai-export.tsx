"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";

interface CoachExportResponse {
  prompt: string;
  days: number;
  generatedAt: string;
  stats: {
    workouts: number;
    cardioSessions: number;
    readinessChecks: number;
    prs: number;
    weightLogs: number;
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
        `/fitness/coach-export?days=${days}`,
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
      toast.success("Prompt copiado. Pégalo en Claude/ChatGPT/Gemini.");
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }

  function openClaude() {
    if (!data) return;
    copyToClipboard();
    window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");
  }

  function openChatGpt() {
    if (!data) return;
    copyToClipboard();
    window.open("https://chat.openai.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
          Exportar análisis a tu IA
        </h3>
        <p className="text-brand-warm text-sm m-0 mb-4">
          Generamos un prompt ultra-contextual con tus datos (gym, cardio,
          readiness, training load, PRs, peso). Lo pegas en tu Claude/ChatGPT/Gemini
          personal y recibes coaching específico <strong>sin que nosotros
          paguemos un centavo de LLM</strong>. Tus datos nunca salen de tu browser.
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

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-brand-dark text-brand-cream font-semibold text-sm hover:bg-brand-brown transition disabled:opacity-40"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Armando prompt…" : data ? "Regenerar" : "Generar prompt"}
        </button>
      </Card>

      {data && (
        <>
          <Card variant="default" padding="md" className="border-brand-light-tan">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white font-semibold text-sm hover:opacity-90 transition"
              >
                <Copy size={14} /> Copiar prompt
              </button>
              <button
                onClick={openClaude}
                className="flex items-center gap-2 px-4 py-2 rounded-button bg-brand-cream text-brand-dark text-sm hover:bg-brand-light-tan transition"
              >
                <ExternalLink size={14} /> Abrir Claude.ai
              </button>
              <button
                onClick={openChatGpt}
                className="flex items-center gap-2 px-4 py-2 rounded-button bg-brand-cream text-brand-dark text-sm hover:bg-brand-light-tan transition"
              >
                <ExternalLink size={14} /> Abrir ChatGPT
              </button>
              <span className="text-xs text-brand-warm">
                {data.stats.workouts} gym · {data.stats.cardioSessions} cardio ·
                {" "}{data.stats.readinessChecks} readiness · {data.stats.prs} PRs
              </span>
            </div>
            <pre className="bg-brand-warm-white border border-brand-light-cream rounded-md p-4 text-xs text-brand-dark overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
              {data.prompt}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
}
