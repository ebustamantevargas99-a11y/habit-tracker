"use client";

import { useEffect, useState } from "react";

const LS_KEY = "ut-home-v2";

/**
 * Feature flag para el nuevo dashboard Home v2.
 * Default: ON (durante beta). Se puede desactivar con ?home=v1.
 * Activación:
 *   - URL `?home=v2` → activa explícitamente y persiste
 *   - URL `?home=v1` → desactiva y persiste en localStorage
 *   - localStorage `ut-home-v2 = "off"` → forzar v1
 * Más adelante, cuando v2 esté con data real, se remueve el flag
 * y el v1 se borra del código.
 */
export function useHomeV2Flag(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("home");
      if (q === "v2") {
        localStorage.setItem(LS_KEY, "on");
        setEnabled(true);
        return;
      }
      if (q === "v1") {
        localStorage.setItem(LS_KEY, "off");
        setEnabled(false);
        return;
      }
      // Sin query param → respetar localStorage. Default = ON si nunca
      // se desactivó manualmente.
      const stored = localStorage.getItem(LS_KEY);
      setEnabled(stored !== "off");
    } catch {
      // localStorage puede fallar en modo privado — default ON.
    }
  }, []);

  return enabled;
}
