"use client";

/**
 * Theme selector — 8 temas neutros elegantes en 2 grupos.
 *
 * Claros (4):  Pergamino · Marfil · Perla · Lino
 * Oscuros (4): Café · Carbón · Pizarra · Ónice
 *
 * Sin colores chillones — acentos en bronce, brass, rose gold, oro antiguo.
 * Click aplica el tema al instante (CSS vars en html.theme-<id>).
 */

import { Check } from "lucide-react";
import { useThemeStore, type ThemeId } from "@/stores/theme-store";
import { cn } from "@/components/ui";

interface ThemeMeta {
  id: ThemeId;
  name: string;
  vibe: string;
  emoji: string;
  group: "light" | "dark";
  preview: {
    bg: string;
    text: string;
    accent: string;
    cream: string;
  };
}

const THEMES: ThemeMeta[] = [
  // ─── Claros ──────────────────────────────────────────────────────────
  {
    id: "pergamino",
    name: "Pergamino",
    vibe: "Papel cálido · manuscrito",
    emoji: "🕯️",
    group: "light",
    preview: { bg: "#F6EEDB", text: "#2E1F14", accent: "#A77A39", cream: "#E8D9BE" },
  },
  {
    id: "marfil",
    name: "Marfil",
    vibe: "Ivory · durazno · dorado suave",
    emoji: "🤍",
    group: "light",
    preview: { bg: "#FFF9F0", text: "#3B2E20", accent: "#C99969", cream: "#EDDEC0" },
  },
  {
    id: "perla",
    name: "Perla",
    vibe: "Gris frío · bronce cálido",
    emoji: "🐚",
    group: "light",
    preview: { bg: "#F8F8F9", text: "#2B2B33", accent: "#8B7355", cream: "#D8D8DC" },
  },
  {
    id: "lino",
    name: "Lino",
    vibe: "Avena natural · taupe · sage",
    emoji: "🌾",
    group: "light",
    preview: { bg: "#F8F2E6", text: "#3E3528", accent: "#7A8B6C", cream: "#E2D8C4" },
  },

  // ─── Oscuros ─────────────────────────────────────────────────────────
  {
    id: "cafe",
    name: "Café",
    vibe: "Chocolate cálido · cream · dorado",
    emoji: "☕",
    group: "dark",
    preview: { bg: "#1A100A", text: "#EFD9BA", accent: "#D4A843", cream: "#3E2B1C" },
  },
  {
    id: "carbon",
    name: "Carbón",
    vibe: "Charcoal cálido · bronce",
    emoji: "⚫",
    group: "dark",
    preview: { bg: "#151413", text: "#E8E4DE", accent: "#B08C5A", cream: "#2A2825" },
  },
  {
    id: "pizarra",
    name: "Pizarra",
    vibe: "Slate gris-azulado · brass",
    emoji: "🪨",
    group: "dark",
    preview: { bg: "#12161C", text: "#DDE4EA", accent: "#C9A46B", cream: "#232830" },
  },
  {
    id: "onice",
    name: "Ónice",
    vibe: "Casi negro · cream · rose gold",
    emoji: "🖤",
    group: "dark",
    preview: { bg: "#0A0806", text: "#EEE6E0", accent: "#B8967A", cream: "#1F1A17" },
  },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
      <h3 className="font-serif text-brand-dark text-xl m-0 mb-1">
        🎨 Tema visual
      </h3>
      <p className="text-sm text-brand-warm m-0 mb-5">
        Cambia toda la paleta al instante. 8 temas neutros elegantes —
        4 claros + 4 oscuros. Click para aplicar.
      </p>

      {(["light", "dark"] as const).map((group) => (
        <div key={group} className="mb-5 last:mb-0">
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
            {group === "light" ? "Claros" : "Oscuros"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {THEMES.filter((t) => t.group === group).map((t) => (
              <ThemeCard
                key={t.id}
                meta={t}
                active={theme === t.id}
                onClick={() => setTheme(t.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemeCard({
  meta,
  active,
  onClick,
}: {
  meta: ThemeMeta;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-xl p-4 transition-all duration-200 relative overflow-hidden",
        active
          ? "ring-2 ring-accent shadow-warm-lg"
          : "border border-brand-light-tan hover:border-brand-tan",
      )}
      style={{
        backgroundColor: meta.preview.bg,
        color: meta.preview.text,
      }}
      type="button"
    >
      {/* Emoji + nombre */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p
            className="text-base font-semibold m-0"
            style={{ fontFamily: "var(--font-playfair)", color: meta.preview.text }}
          >
            {meta.emoji} {meta.name}
          </p>
          <p
            className="text-[11px] m-0 mt-0.5 opacity-70"
            style={{ color: meta.preview.text }}
          >
            {meta.vibe}
          </p>
        </div>
        {active && (
          <span
            className="shrink-0 rounded-full w-5 h-5 flex items-center justify-center"
            style={{
              backgroundColor: meta.preview.accent,
              color: meta.preview.bg,
            }}
          >
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Swatches */}
      <div className="flex gap-1.5 mb-3">
        {[meta.preview.text, meta.preview.accent, meta.preview.cream, meta.preview.bg].map(
          (c, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full"
              style={{
                backgroundColor: c,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
          ),
        )}
      </div>

      {/* Sample tipográfico */}
      <p
        className="m-0 text-sm italic"
        style={{
          fontFamily: "var(--font-playfair)",
          color: meta.preview.accent,
          letterSpacing: "-0.01em",
        }}
      >
        Aa — Ultimate TRACKER
      </p>

      {/* Barra superior de accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: meta.preview.accent }}
      />
    </button>
  );
}
