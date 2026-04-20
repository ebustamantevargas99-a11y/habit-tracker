import React from "react";
import { cn } from "./cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  className?: string;
}

const trendConfig = {
  up:     { icon: TrendingUp,   color: "text-success" },
  down:   { icon: TrendingDown, color: "text-danger"  },
  stable: { icon: Minus,        color: "text-brand-medium" },
};

export function StatCard({ label, value, unit, icon, trend, trendLabel, className }: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : "";

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label">{label}</p>
        {icon && <span className="text-brand-medium shrink-0">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="stat-value">{value}</span>
        {unit && <span className="text-xs text-brand-medium">{unit}</span>}
      </div>
      {trend && TrendIcon && (
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon size={12} />
          {trendLabel && <span>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
