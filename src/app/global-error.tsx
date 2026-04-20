"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            fontFamily: "system-ui, sans-serif",
            background: "#fafafa",
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Error crítico
            </h1>
            <p style={{ color: "#555", marginBottom: "1rem" }}>
              La aplicación no pudo cargar. Intenta de nuevo en unos segundos.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#999",
                  fontFamily: "monospace",
                  marginBottom: "1rem",
                }}
              >
                ref: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                background: "#111",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
