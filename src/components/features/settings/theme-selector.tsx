"use client";

/**
 * Theme selector — 9 temas visuales con preview de paleta + tipografía.
 *
 * Cada card muestra:
 *   · Background y texto del tema (preview "real" del look)
 *   · 4 swatches de color (dark, accent, cream, paper)
 *   · Sample del heading en la fuente del tema
 *   · Vibe description
 *   · Badge "CLARO" / "OSCURO" para orientar
 *   · Indicador activo
 *
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
  group: "warm" | "light" | "dark";
  preview: {
    bg: string;
    text: string;
    accent: string;
    cream: string;
  };
  sampleFont: string;
}

const THEMES: ThemeMeta[] = [
  // ─── Cálidos (default + raíz) ────────────────────────────────────────
  {
    id: "pergamino",
    name: "Pergamino",
    vibe: "Papel cálido · serif clásico",
    emoji: "🕯️",
    group: "warm",
    preview: { bg: "#F6EEDB", text: "#2E1F14", accent: "#A77A39", cream: "#E8D9BE" },
    sampleFont: "var(--font-playfair)",
  },
  {
    id: "zen",
    name: "Zen 禅",
    vibe: "Papel washi · tinta sumi · jade",
    emoji: "🎋",
    group: "warm",
    preview: { bg: "#F5F1E8", text: "#1A1714", accent: "#4A7A5C", cream: "#E2DBC8" },
    sampleFont: "var(--font-shippori)",
  },
  {
    id: "sakura",
    name: "Sakura 桜",
    vibe: "Cerezo · rosa + ciruela + oro",
    emoji: "🌸",
    group: "warm",
    preview: { bg: "#FAF0F4", text: "#3E1528", accent: "#C9A85F", cream: "#F3D8E1" },
    sampleFont: "var(--font-crimson)",
  },

  // ─── Claros delicados ────────────────────────────────────────────────
  {
    id: "marfil",
    name: "Marfil",
    vibe: "Ivory · durazno · dorado suave",
    emoji: "🤍",
    group: "light",
    preview: { bg: "#FFF9F0", text: "#3B2E20", accent: "#C99969", cream: "#EDDEC0" },
    sampleFont: "var(--font-playfair)",
  },
  {
    id: "lavanda",
    name: "Lavanda",
    vibe: "Pálida · violeta · femenina",
    emoji: "💜",
    group: "light",
    preview: { bg: "#F8F3FD", text: "#2D1F3A", accent: "#9678C9", cream: "#D9C7E6" },
    sampleFont: "var(--font-crimson)",
  },
  {
    id: "menta",
    name: "Menta",
    vibe: "Fresca · teal · cream",
    emoji: "🌿",
    group: "light",
    preview: { bg: "#F2FAF6", text: "#1F3E2B", accent: "#3E9D7A", cream: "#BCD6C6" },
    sampleFont: "var(--font-playfair)",
  },

  // ─── Oscuros elegantes ───────────────────────────────────────────────
  {
    id: "medianoche",
    name: "Medianoche",
    vibe: "Azul noche · oro antiguo",
    emoji: "🌙",
    group: "dark",
    preview: { bg: "#0E1220", text: "#E8E8F0", accent: "#D4A85F", cream: "#2A2F4A" },
    sampleFont: "var(--font-playfair)",
  },
  {
    id: "cafe",
    name: "Café",
    vibe: "Chocolate · cream · dorado",
    emoji: "☕",
    group: "dark",
    preview: { bg: "#1A100A", text: "#EFD9BA", accent: "#D4A843", cream: "#3E2B1C" },
    sampleFont: "var(--font-playfair)",
  },
  {
    id: "vino",
    name: "Vino",
    vibe: "Burgundy · rosa cream · oro",
    emoji: "🍷",
    group: "dark",
    preview: { bg: "#1A0A10", text: "#F0E4EC", accent: "#D4A85F", cream: "#3E2030" },
    sampleFont: "var(--font-crimson)",
  },
];

const GROUP_LABELS: Record<"warm" | "light" | "dark", string> = {
  warm:  "Cálidos",
  light: "Claros delicados",
  dark:  "Oscuros elegantes",
};

export default function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
      <h3 className="font-serif text-brand-dark text-xl m-0 mb-1">
        🎨 Tema visual
      </h3>
      <p className="text-sm text-brand-warm m-0 mb-5">
        Cambia toda la paleta y la <strong>tipografía</strong> al instante.
        9 temas en 3 grupos — click para aplicar.
      </p>

      {(["warm", "light", "dark"] as const).map((group) => (
        <div key={group} className="mb-5 last:mb-0">
          <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0 mb-2">
            {GROUP_LABELS[group]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p
            className="text-lg font-semibold m-0"
            style={{ fontFamily: meta.sampleFont, color: meta.preview.text }}
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
        className="m-0 text-base italic"
        style={{
          fontFamily: meta.sampleFont,
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
