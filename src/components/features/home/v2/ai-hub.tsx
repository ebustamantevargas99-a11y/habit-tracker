"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Dumbbell,
  Salad,
  DollarSign,
  CalendarDays,
  BarChart3,
  Brain,
} from "lucide-react";
import SectionHeader from "./primitives/section-header";
import AIExportModal from "@/components/features/ai-export/ai-export-modal";
import type { ExportScope } from "@/lib/ai-export/types";
import { cn } from "@/components/ui";

interface AnalysisCard {
  key: ExportScope;
  label: string;
  desc: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
  featured?: boolean;
}

const CARDS: AnalysisCard[] = [
  {
    key: "daily",
    label: "Cierre del día",
    desc: "Hábitos, nutrición y foco de hoy en un solo contexto listo para tu IA.",
    icon: CalendarDays,
    accent: "#B8860B",
    bg: "rgba(184,134,11,0.08)",
    featured: true,
  },
  {
    key: "weekly",
    label: "Revisión semanal",
    desc: "Tendencias y victorias de los últimos 7 días agregados en un prompt.",
    icon: BarChart3,
    accent: "#2563eb",
    bg: "rgba(37,99,235,0.07)",
    featured: true,
  },
  {
    key: "habits",
    label: "Mis hábitos",
    desc: "Rachas, consistencia y patrones de tus hábitos para que la IA los analice.",
    icon: Flame,
    accent: "#dc2626",
    bg: "rgba(220,38,38,0.07)",
  },
  {
    key: "fitness",
    label: "Entrenamiento",
    desc: "Volumen, progresión y PRs de tus últimas sesiones de fitness.",
    icon: Dumbbell,
    accent: "#7c3aed",
    bg: "rgba(124,58,237,0.07)",
  },
  {
    key: "nutrition",
    label: "Nutrición",
    desc: "Macros, calorías y patrones de alimentación de esta semana.",
    icon: Salad,
    accent: "#16a34a",
    bg: "rgba(22,163,74,0.07)",
  },
  {
    key: "finance",
    label: "Finanzas",
    desc: "Gastos, ingresos y categorías del mes para análisis financiero.",
    icon: DollarSign,
    accent: "#0891b2",
    bg: "rgba(8,145,178,0.07)",
  },
  {
    key: "holistic",
    label: "Perfil completo",
    desc: "Todo tu historial en un solo snapshot. El análisis más profundo.",
    icon: Brain,
    accent: "#B8860B",
    bg: "rgba(184,134,11,0.06)",
    featured: true,
  },
];

export default function AIHub() {
  const [openScope, setOpenScope] = useState<ExportScope | null>(null);

  const featured = CARDS.filter((c) => c.featured);
  const secondary = CARDS.filter((c) => !c.featured);

  return (
    <section>
      <SectionHeader
        eyebrow="Análisis con IA"
        title="Llévate tu data a tu IA favorita"
        subtitle="Genera el contexto ideal para Claude, ChatGPT o Gemini. Un clic, pegas el prompt, y obtienes el análisis."
      />

      {/* Featured row — 3 cards grandes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {featured.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setOpenScope(card.key)}
              className="group text-left rounded-2xl border border-brand-tan bg-brand-paper p-6 flex flex-col gap-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              style={{ animation: `ht-fadeUp .5s ${i * 70}ms both` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.bg, color: card.accent }}
              >
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h3
                  className="font-serif m-0 mb-1 text-[1.1rem] font-bold leading-tight"
                  style={{ color: "var(--color-brown)" }}
                >
                  {card.label}
                </h3>
                <p
                  className="text-[0.8rem] leading-relaxed m-0"
                  style={{ color: "var(--color-warm)" }}
                >
                  {card.desc}
                </p>
              </div>
              <div
                className="flex items-center gap-1 text-[0.75rem] font-semibold group-hover:gap-2 transition-all"
                style={{ color: card.accent }}
              >
                <Sparkles size={12} strokeWidth={1.75} />
                Generar prompt
                <ArrowRight
                  size={12}
                  strokeWidth={2}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary row — 4 cards compactas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        {secondary.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setOpenScope(card.key)}
              className="group text-left rounded-xl border border-brand-tan bg-brand-paper p-4 flex flex-col gap-3 hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              style={{ animation: `ht-fadeUp .5s ${(i + 3) * 70}ms both` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: card.bg, color: card.accent }}
              >
                <Icon size={16} strokeWidth={1.75} />
              </div>
              <div>
                <h4
                  className="font-serif m-0 mb-0.5 text-[0.9rem] font-bold leading-tight"
                  style={{ color: "var(--color-brown)" }}
                >
                  {card.label}
                </h4>
                <p
                  className="text-[0.72rem] leading-snug m-0 line-clamp-2"
                  style={{ color: "var(--color-warm)" }}
                >
                  {card.desc}
                </p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-[0.7rem] font-semibold mt-auto"
                )}
                style={{ color: card.accent }}
              >
                <ArrowRight
                  size={11}
                  strokeWidth={2}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
                Analizar
              </div>
            </button>
          );
        })}
      </div>

      <AIExportModal
        open={openScope !== null}
        onClose={() => setOpenScope(null)}
        initialScope={openScope ?? "daily"}
        title={
          CARDS.find((c) => c.key === openScope)?.label ?? "Análisis con IA"
        }
      />
    </section>
  );
}
