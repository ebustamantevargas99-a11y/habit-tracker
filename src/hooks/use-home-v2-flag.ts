"use client";

import { useEffect, useState } from "react";

const LS_KEY = "ut-home-v2";

/**
 * Feature flag para el nuevo dashboard Home v2.
 * Activación:
 *   - URL `?home=v2` → activa y persiste en localStorage
 *   - URL `?home=v1` → desactiva y persiste
 *   - localStorage `ut-home-v2 = "on"` → activa
 * Mientras esté en beta, se controla así. Más adelante habrá toggle en
 * Ajustes → Apariencia.
 */
export function useHomeV2Flag(): boolean {
  const [enabled, setEnabled] = useState(false);

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
      setEnabled(localStorage.getItem(LS_KEY) === "on");
    } catch {
      // localStorage puede fallar en modo privado — noop.
    }
  }, []);

  return enabled;
}
