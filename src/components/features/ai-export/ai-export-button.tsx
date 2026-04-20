"use client";

import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import AIExportModal from "./ai-export-modal";
import type { ExportScope } from "@/lib/ai-export/types";

type Props = {
  scope?: ExportScope;
  label?: string;
  title?: string;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  className?: string;
};

const variants = {
  primary:
    "bg-accent text-white hover:bg-brand-brown",
  ghost:
    "text-brand-medium hover:bg-brand-cream hover:text-brand-dark",
  outline:
    "border border-brand-tan text-brand-dark hover:bg-brand-cream",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function AIExportButton({
  scope = "daily",
  label = "Exportar a IA",
  title,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-button font-semibold transition ${variants[variant]} ${sizes[size]} ${className}`}
      >
        <Sparkles size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        {children ?? label}
      </button>
      <AIExportModal
        open={open}
        onClose={() => setOpen(false)}
        initialScope={scope}
        title={title}
      />
    </>
  );
}
