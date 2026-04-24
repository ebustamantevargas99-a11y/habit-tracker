"use client";

import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function SectionHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div className="flex flex-col gap-2">
        <div className="ht-eyebrow">{eyebrow}</div>
        <h2
          className="ht-serif font-bold leading-tight m-0"
          style={{ fontSize: "clamp(22px, 2.4vw, 30px)", color: "var(--color-brown)", letterSpacing: "-0.015em" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="ht-serif italic m-0"
            style={{ color: "var(--color-warm)", fontSize: 15, maxWidth: 560 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
