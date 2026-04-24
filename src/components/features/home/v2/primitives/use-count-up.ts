"use client";

import { useEffect, useState } from "react";

/**
 * Cuenta desde 0 hasta `target` con easeOutExpo, duración configurable.
 * Respeta `prefers-reduced-motion`: si el user lo tiene activado, salta
 * directo al valor final.
 */
export function useCountUp(target: number, duration = 900, delay = 0): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduceMotion) {
      setVal(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / duration));
      const eased = 1 - Math.pow(2, -10 * t);
      setVal(target * (t < 0 ? 0 : eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return val;
}
