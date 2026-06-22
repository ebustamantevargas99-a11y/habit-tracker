import React from "react";
import { cn } from "./cn";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

type TabsVariant = "underline" | "segmented" | "pill";

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: TabsVariant;
}

// Variantes con estilo "boxed" (Tailwind inline) — el default "underline" sigue
// usando las clases globales .tab-* para no alterar el resto de módulos.
const VARIANTS: Record<
  "segmented" | "pill",
  { bar: string; item: string; active: string }
> = {
  // Control segmentado (track + tarjeta blanca activa). Para navegación primaria.
  segmented: {
    bar: "inline-flex flex-wrap gap-1 p-1 rounded-xl bg-brand-cream/70 border border-brand-light-tan",
    item: "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-none bg-transparent text-brand-warm hover:text-brand-dark transition-colors duration-200",
    active: "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none bg-brand-paper text-brand-dark shadow-sm",
  },
  // Píldoras (sin track, activa en acento). Para navegación secundaria.
  pill: {
    bar: "flex flex-wrap gap-2",
    item: "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer border-none bg-transparent text-brand-warm hover:bg-brand-light-cream hover:text-brand-dark transition-colors duration-200",
    active: "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer border-none bg-accent text-white shadow-sm",
  },
};

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "underline",
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={cn("tab-bar", className)} role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(isActive ? "tab-item-active" : "tab-item")}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  const s = VARIANTS[variant];
  return (
    <div className={cn(s.bar, className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={isActive ? s.active : s.item}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
