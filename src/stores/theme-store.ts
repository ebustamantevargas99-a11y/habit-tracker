import { create } from "zustand";

// ─── Sistema de temas 2.1 (2026-04) ──────────────────────────────────────────
// 9 temas con paletas variadas (3 warmth + 3 light delicate + 3 dark elegant).
// Cada tema define 12 variables CSS de color + 3 de fuente
// (--font-heading / --font-body / --font-mono) en globals.css.

export type ThemeId =
  // Cálidos (default + raíz):
  | "pergamino"   // papel manuscrito cálido + Playfair
  | "zen"         // washi + sumi + jade + Shippori Mincho (japonés)
  | "sakura"      // cerezo: rosa + ciruela + oro + Crimson Pro
  // Claros delicados:
  | "marfil"      // ivory + durazno + dorado suave
  | "lavanda"     // lavanda pálida + violeta + oro + Crimson italic
  | "menta"       // mint fresco + teal profundo + cream
  // Oscuros elegantes:
  | "medianoche"  // azul noche + oro antiguo + cream text
  | "cafe"        // chocolate profundo + cream + dorado
  | "vino";       // burgundy + rosa cream + oro + Crimson

const ALL_THEMES: ThemeId[] = [
  "pergamino", "zen", "sakura",
  "marfil", "lavanda", "menta",
  "medianoche", "cafe", "vino",
];

// Migración desde IDs legacy (warm/ocean/forest/rose + themes v2.0
// descontinuados) → tema equivalente actual.
const LEGACY_MIGRATION: Record<string, ThemeId> = {
  // v1.0 legacy
  warm:       "pergamino",
  ocean:      "medianoche",
  forest:     "menta",
  rose:       "sakura",
  // v2.0 temas descontinuados (mínimo / matrix / nórdico / cyberpunk /
  // atardecer / bosque) — mapeados al equivalente estético más cercano
  minimo:     "marfil",
  matrix:     "medianoche",
  nordico:    "menta",
  cyberpunk:  "vino",
  atardecer:  "sakura",
  bosque:     "cafe",
};

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  initTheme: () => void;
}

function normalizeTheme(raw: string | null): ThemeId {
  if (!raw) return "pergamino";
  if (ALL_THEMES.includes(raw as ThemeId)) return raw as ThemeId;
  if (raw in LEGACY_MIGRATION) return LEGACY_MIGRATION[raw]!;
  return "pergamino";
}

function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // Quita cualquier clase theme-* previa antes de aplicar la nueva.
  const toRemove: string[] = [];
  html.classList.forEach((cls) => {
    if (cls.startsWith("theme-")) toRemove.push(cls);
  });
  toRemove.forEach((cls) => html.classList.remove(cls));
  // Pergamino es el default en :root — no necesita clase.
  if (theme !== "pergamino") html.classList.add(`theme-${theme}`);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "pergamino",

  initTheme: () => {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem("app-theme");
    const theme = normalizeTheme(raw);
    // Si el valor guardado era legacy, persiste el migrado de inmediato.
    if (raw !== theme) localStorage.setItem("app-theme", theme);
    applyTheme(theme);
    set({ theme });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("app-theme", theme);
    }
    set({ theme });
  },
}));
