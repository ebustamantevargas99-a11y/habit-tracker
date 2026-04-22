"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import AIExportModal from "./ai-export-modal";
import type { ExportScope } from "@/lib/ai-export/types";

const PAGE_TO_SCOPE: Record<string, ExportScope> = {
  home: "daily",
  fitness: "fitness",
  nutrition: "nutrition",
  finance: "finance",
  wellness: "wellness",
  productivity: "habits",
  plan: "weekly",
  organization: "holistic",
  settings: "holistic",
};

const PAGE_TITLE: Record<string, string> = {
  home: "Cierre del día",
  fitness: "Análisis de fitness",
  nutrition: "Análisis de nutrición",
  finance: "Análisis financiero",
  wellness: "Análisis de bienestar",
  productivity: "Análisis de hábitos",
  plan: "Resumen semanal",
  organization: "Análisis holístico",
  settings: "Exportar perfil completo",
};

export default function FloatingAIButton() {
  const [open, setOpen] = useState(false);
  const { activePage } = useAppStore();
  const scope = PAGE_TO_SCOPE[activePage] ?? "daily";
  const title = PAGE_TITLE[activePage] ?? "Exportar a IA";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Exportar a IA"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-accent text-white font-semibold text-sm shadow-warm-lg hover:bg-brand-brown transition-transform hover:scale-105 group"
      >
        <Sparkles size={18} className="group-hover:animate-pulse" />
        <span>Analizar con IA</span>
      </button>
      <AIExportModal
        open={open}
        onClose={() => setOpen(false)}
        initialScope={scope}
        title={title}
      />
    </>
  );
}
