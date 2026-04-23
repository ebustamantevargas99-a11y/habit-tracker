"use client";

/**
 * Theme selector — 8 temas visuales con preview de paleta + tipografía.
 *
 * Cada card muestra:
 *   · 4 swatches de color (dark, brown, accent, paper)
 *   · Sample del heading en la fuente del tema
 *   · Descripción corta de vibe
 *   · Indicador "Activo" cuando corresponde
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
  /** [bg, text, accent, border] — colores para el preview */
  preview: {
    bg: string;
    text: string;
    accent: string;
    cream: string;
  };
  /** Clase Tailwind o inline para la muestra tipográfica */
  sampleFont: string;
}

const THEMES: ThemeMeta[] = [
  {
    id: "pergamino",
    name: "Pergamino",
    vibe: "Papel cálido · serif clásico",
    emoji: "🕯️",
    preview: { bg: "#F6EEDB", text: "#2E1F14", accent: "#A77A39", cream: "#E8D9BE" },
    sampleFont: "var(--font-playfair)",
  },
  {
    id: "zen",
    name: "Zen 禅",
    vibe: "Papel washi · tinta sumi · jade",
    emoji: "🎋",
    preview: { bg: "#F5F1E8", text: "#1A1714", accent: "#4A7A5C", cream: "#E2DBC8" },
    sampleFont: "var(--font-shippori)",
  },
  {
    id: "minimo",
    name: "Mínimo",
    vibe: "Swiss · blanco total · un acento",
    emoji: "⚪",
    preview: { bg: "#FFFFFF", text: "#1A1A1A", accent: "#D10000", cream: "#E8E8E8" },
    sampleFont: "var(--font-inter)",
  },
  {
    id: "matrix",
    name: "Matrix",
    vibe: "Terminal · fósforo verde · mono",
    emoji: "💻",
    preview: { bg: "#000000", text: "#00FF41", accent: "#FFB000", cream: "#0A1F0D" },
    sampleFont: "var(--font-jetbrains)",
  },
  {
    id: "sakura",
    name: "Sakura 桜",
    vibe: "Cerezo · rosa + ciruela + oro",
    emoji: "🌸",
    preview: { bg: "#FAF0F4", text: "#3E1528", accent: "#C9A85F", cream: "#F3D8E1" },
    sampleFont: "var(--font-crimson)",
  },
  {
    id: "nordico",
    name: "Nórdico",
    vibe: "Fiordos · aurora · nieve",
    emoji: "❄️",
    preview: { bg: "#F4F8FB", text: "#102A43", accent: "#2BB4A9", cream: "#D8E4EE" },
    sampleFont: "var(--font-inter)",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    vibe: "Púrpura oscuro · neón magenta/cian",
    emoji: "🌃",
    preview: { bg: "#0A0120", text: "#F2E8FF", accent: "#FF00C8", cream: "#2E1048" },
    sampleFont: "var(--font-jetbrains)",
  },
  {
    id: "atardecer",
    name: "Atardecer",
    vibe: "Coral · burgundy · naranja quemado",
    emoji: "🌅",
    preview: { bg: "#FDF4E8", text: "#3E1A14", accent: "#D76B3F", cream: "#F5C5A8" },
    sampleFont: "var(--font-playfair)",
  },
  {
    id: "bosque",
    name: "Bosque místico",
    vibe: "Verde profundo · musgo · vela",
    emoji: "🌲",
    preview: { bg: "#EEF4EF", text: "#0E1F14", accent: "#C69B3B", cream: "#CFDED5" },
    sampleFont: "var(--font-crimson)",
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
        Cambia toda la paleta de colores <strong>y la tipografía</strong> de la
        app al instante. 9 temas entre papel, natural, minimalista y retro.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "text-left rounded-xl p-4 transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "ring-2 ring-accent shadow-warm-lg"
                  : "border border-brand-light-tan hover:border-brand-tan",
              )}
              style={{
                backgroundColor: t.preview.bg,
                color: t.preview.text,
              }}
              type="button"
            >
              {/* Emoji + nombre */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p
                    className="text-lg font-semibold m-0"
                    style={{ fontFamily: t.sampleFont, color: t.preview.text }}
                  >
                    {t.emoji} {t.name}
                  </p>
                  <p
                    className="text-[11px] m-0 mt-0.5 opacity-70"
                    style={{ color: t.preview.text }}
                  >
                    {t.vibe}
                  </p>
                </div>
                {isActive && (
                  <span
                    className="shrink-0 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                    style={{
                      backgroundColor: t.preview.accent,
                      color: t.preview.bg,
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Swatches de color */}
              <div className="flex gap-1.5 mb-3">
                {[t.preview.text, t.preview.accent, t.preview.cream, t.preview.bg].map(
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

              {/* Sample tipográfico del heading */}
              <p
                className="m-0 text-base italic"
                style={{
                  fontFamily: t.sampleFont,
                  color: t.preview.accent,
                  letterSpacing: "-0.01em",
                }}
              >
                Aa — Ultimate TRACKER
              </p>

              {/* Bar accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: t.preview.accent }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
