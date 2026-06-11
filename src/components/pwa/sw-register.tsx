"use client";

import { useEffect } from "react";

/**
 * Registra el service worker en producción. Se omite en localhost para no
 * interferir con el HMR de Next en desarrollo (el SW cachea estáticos).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registro fallido — la app sigue funcionando sin SW */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
