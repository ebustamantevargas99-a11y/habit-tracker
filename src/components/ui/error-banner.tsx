"use client";
import { X } from "lucide-react";

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger-light border border-danger text-danger text-sm mb-4">
      <span className="flex-1">{error}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded hover:bg-danger hover:text-white transition-colors"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </div>
  );
}
