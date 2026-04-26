"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  /** Subtítulo en italic debajo del título (opcional). */
  intro?: string;
  /** Última actualización — formato libre, ej. "25 de abril de 2026". */
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Layout compartido para páginas legales (privacy / terms / cookies).
 * Estética editorial alineada con el resto de la app — serif headings,
 * Inter body, paleta de tema activa. Pensado para que sea accesible
 * sin auth (la ruta está en PUBLIC_PATHS del middleware).
 */
export default function LegalLayout({ title, intro, lastUpdated, children }: Props) {
  return (
    <main
      style={{
        background: "var(--color-paper)",
        minHeight: "100vh",
        padding: "48px 24px 96px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mb-8"
          style={{
            fontSize: 13,
            color: "var(--color-warm)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} strokeWidth={1.75} /> Volver
        </Link>

        <header className="mb-10">
          <h1
            className="ht-serif m-0"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              color: "var(--color-brown)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {intro && (
            <p
              className="ht-serif italic"
              style={{
                fontSize: 18,
                color: "var(--color-warm)",
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              {intro}
            </p>
          )}
          <p
            className="ht-mono"
            style={{
              fontSize: 11,
              color: "var(--color-tan)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: 16,
            }}
          >
            Última actualización · {lastUpdated}
          </p>
        </header>

        <div
          className="legal-prose"
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--color-dark)",
          }}
        >
          {children}
        </div>

        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--color-cream)",
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <Link href="/privacy" style={legalLinkStyle}>Privacidad</Link>
          <Link href="/terms" style={legalLinkStyle}>Términos</Link>
          <Link href="/cookies" style={legalLinkStyle}>Cookies</Link>
          <span style={{ color: "var(--color-tan)", marginLeft: "auto" }}>
            Ultimate TRACKER
          </span>
        </footer>
      </div>

      {/* Estilos del prose en línea para no requerir Tailwind Typography */}
      <style>{`
        .legal-prose h2 {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-brown);
          letter-spacing: -0.015em;
          margin: 40px 0 12px;
          line-height: 1.2;
        }
        .legal-prose h3 {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-brown);
          margin: 28px 0 8px;
        }
        .legal-prose p {
          margin: 0 0 16px;
        }
        .legal-prose ul {
          margin: 0 0 16px;
          padding-left: 24px;
        }
        .legal-prose li {
          margin: 6px 0;
        }
        .legal-prose strong {
          color: var(--color-brown);
          font-weight: 600;
        }
        .legal-prose a {
          color: var(--color-accent);
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }
        .legal-prose a:hover {
          color: var(--color-accent-light);
        }
        .legal-prose code {
          font-family: var(--font-mono);
          background: var(--color-cream);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.9em;
          color: var(--color-brown);
        }
        .legal-prose hr {
          border: 0;
          border-top: 1px solid var(--color-cream);
          margin: 32px 0;
        }
      `}</style>
    </main>
  );
}

const legalLinkStyle: React.CSSProperties = {
  color: "var(--color-warm)",
  textDecoration: "none",
};
