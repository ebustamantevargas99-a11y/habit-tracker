import { create } from "zustand";

export type ThemeId = "warm" | "ocean" | "forest" | "rose";

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  initTheme: () => void;
}

function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("theme-ocean", "theme-forest", "theme-rose");
  if (theme !== "warm") html.classList.add(`theme-${theme}`);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "warm",

  initTheme: () => {
    if (typeof localStorage === "undefined") return;
    const saved = (localStorage.getItem("app-theme") as ThemeId) || "warm";
    applyTheme(saved);
    set({ theme: saved });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof localStorage !== "undefined") localStorage.setItem("app-theme", theme);
    set({ theme });
  },
}));
