"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "ut-pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check dismissal
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const ms = parseInt(dismissed, 10);
      if (Date.now() - ms < DISMISS_DURATION_MS) return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar después de 20s para no ser intrusivo
      setTimeout(() => setVisible(true), 20000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm bg-brand-paper border border-brand-cream rounded-2xl shadow-warm-lg p-4 z-50 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 text-brand-warm hover:bg-brand-cream rounded-full"
      >
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-brand-dark text-sm">
            Instalar Ultimate TRACKER
          </p>
          <p className="text-xs text-brand-warm mt-0.5">
            Accede más rápido desde tu home screen. Sin tienda de apps.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 rounded-button text-xs text-brand-warm hover:bg-brand-cream"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
