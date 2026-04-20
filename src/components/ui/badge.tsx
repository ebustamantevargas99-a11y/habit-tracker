import React from "react";
import { cn } from "./cn";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral" | "accent";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  success: "bg-success-light text-success",
  danger:  "bg-danger-light text-danger",
  warning: "bg-warning-light text-warning",
  info:    "bg-info-light text-info",
  neutral: "bg-brand-cream text-brand-medium",
  accent:  "bg-accent/10 text-accent",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
