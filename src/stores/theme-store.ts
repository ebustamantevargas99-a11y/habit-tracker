import { create } from "zustand";

// ─── Sistema de temas 2.2 (2026-04) ──────────────────────────────────────────
// 8 temas neutros elegantes: 4 claros + 4 oscuros. Sin colores chillones.
// Acentos en bronce / brass / rose gold / oro antiguo.
// Cada tema define 12 variables de color + 3 de fuente en globals.css.

export type ThemeId =
  // Claros (4):
  | "pergamino"   // default · papel manuscrito cálido
  | "marfil"      // ivory + durazno + dorado suave
  | "perla"       // gris frío elegante + bronce
  | "lino"        // lino natural avena + sage muted
  // Oscuros (4):
  | "cafe"        // chocolate cálido + cream + dorado
  | "carbon"      // charcoal + bronce
  | "pizarra"     // slate gris-azulado + brass
  | "onice";      // casi negro + rose gold

const ALL_THEMES: ThemeId[] = [
  "pergamino", "marfil", "perla", "lino",
  "cafe", "carbon", "pizarra", "onice",
];

// Migración desde IDs legacy (v1.0 + v2.0 + v2.1) → tema actual equivalente.
const LEGACY_MIGRATION: Record<string, ThemeId> = {
  // v1.0
  warm:        "pergamino",
  ocean:       "pizarra",
  forest:      "lino",
  rose:        "perla",
  // v2.0 (deprecated)
  minimo:      "perla",
  matrix:      "onice",
  nordico:     "pizarra",
  cyberpunk:   "onice",
  atardecer:   "pergamino",
  bosque:      "lino",
  // v2.1 (deprecated)
  zen:         "lino",
  sakura:      "marfil",
  lavanda:     "perla",
  menta:       "lino",
  medianoche:  "pizarra",
  vino:        "onice",
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
