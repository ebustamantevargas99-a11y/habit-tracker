import React from "react";
import { cn } from "./cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "warm" | "cream";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-6",
};

const variantMap = {
  default: "card",
  warm:    "card-warm",
  cream:   "card-cream",
};

export function Card({ variant = "warm", padding = "md", className, children, ...props }: CardProps) {
  return (
    <div className={cn(variantMap[variant], paddingMap[padding], className)} {...props}>
      {children}
    </div>
  );
}
