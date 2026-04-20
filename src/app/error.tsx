"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Algo salió mal
        </h1>
        <p className="text-neutral-600">
          Ocurrió un error inesperado. Ya quedó registrado y lo estamos
          revisando.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-700 transition"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
