import { create } from "zustand";

// ─── Sistema de temas 2.0 (2026-04) ──────────────────────────────────────────
// 8 temas completos con paletas diferenciadas y tipografía propia.
// Cada tema se define en globals.css como .theme-<id> con 12 variables CSS
// de color + 3 de fuente (--font-heading / --font-body / --font-mono).

export type ThemeId =
  | "pergamino"   // default — papel manuscrito cálido + Playfair
  | "zen"         // japonés — washi + sumi + jade + Shippori Mincho
  | "minimo"      // Dieter Rams — blanco + negro + rojo
  | "matrix"      // terminal retro — negro + fósforo verde
  | "sakura"      // cerezo en flor — rosa + ciruela + oro
  | "nordico"     // fiordos + aurora + nieve
  | "cyberpunk"   // púrpura oscuro + neón magenta/cian
  | "atardecer"   // coral + burgundy + naranja quemado
  | "bosque";     // bosque místico — verde profundo + vela

const ALL_THEMES: ThemeId[] = [
  "pergamino", "zen", "minimo", "matrix",
  "sakura", "nordico", "cyberpunk", "atardecer", "bosque",
];

// Migración desde IDs legacy (warm/ocean/forest/rose) → temas equivalentes.
const LEGACY_MIGRATION: Record<string, ThemeId> = {
  warm:   "pergamino",
  ocean:  "nordico",
  forest: "bosque",
  rose:   "sakura",
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
