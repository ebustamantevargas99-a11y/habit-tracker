"use client";

import { Home, Zap, DollarSign, Dumbbell, Menu } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/components/ui/cn";

const BOTTOM_NAV_ITEMS = [
  { key: "home",         label: "Inicio",     Icon: Home        },
  { key: "productivity", label: "Productiv.", Icon: Zap         },
  { key: "finance",      label: "Finanzas",   Icon: DollarSign  },
  { key: "fitness",      label: "Fitness",    Icon: Dumbbell    },
] as const;

interface MobileBottomNavProps {
  onMenuOpen: () => void;
}

export default function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const { activePage, setActivePage } = useAppStore();

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-30 md:hidden",
        "flex h-16 items-stretch",
        "bg-[var(--color-hero-bg-1)] border-t border-white/10",
      )}
      aria-label="Navegación principal"
    >
      {BOTTOM_NAV_ITEMS.map(({ key, label, Icon }) => {
        const isActive = activePage === key;
        return (
          <button
            key={key}
            onClick={() => setActivePage(key)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 pt-1",
              "transition-colors duration-150",
              isActive
                ? "text-[var(--color-accent-light)]"
                : "text-[var(--color-hero-text)] opacity-50 active:opacity-100",
            )}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={cn("text-[0.625rem] font-medium", isActive && "font-semibold")}>
              {label}
            </span>
          </button>
        );
      })}

      {/* Más — abre el sidebar drawer para el resto de secciones */}
      <button
        onClick={onMenuOpen}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-0.5 pt-1",
          "text-[var(--color-hero-text)] opacity-50 active:opacity-100",
          "transition-colors duration-150",
        )}
        aria-label="Más opciones"
      >
        <Menu size={22} strokeWidth={1.8} />
        <span className="text-[0.625rem] font-medium">Más</span>
      </button>
    </nav>
  );
}
