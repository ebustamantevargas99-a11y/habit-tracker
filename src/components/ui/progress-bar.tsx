import React from "react";
import { cn } from "./cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;         // Tailwind bg class e.g. "bg-accent"
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "bg-accent",
  showLabel = false,
  size = "sm",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("progress-track", size === "md" ? "h-2.5" : "h-1.5")}>
        {/* Dynamic width must stay inline */}
        <div className={cn("progress-fill", color)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs text-brand-medium">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
