"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 429) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al enviar. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }
      if (res.status === 429) {
        setError("Demasiadas solicitudes. Espera unos minutos.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-paper px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-cream shadow-warm-lg p-8 md:p-10">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-brand-dark m-0">
            Ultimate <span className="tracking-[0.1em]">TRACKER</span>
          </h1>
          <div className="flex items-center justify-center gap-2 my-3">
            <span className="h-px w-6 bg-brand-warm/40" />
            <span className="w-1 h-1 rounded-full bg-accent" />
            <span className="h-px w-6 bg-brand-warm/40" />
          </div>
          <p className="font-display italic text-brand-warm text-sm m-0">
            Restablecer contraseña
          </p>
          <p className="text-xs text-brand-warm/70 mt-1">
            Te enviaremos un enlace por email.
          </p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-lg bg-success-light text-success text-sm">
              Si existe una cuenta con ese email, te enviamos un enlace.
              Revisa tu bandeja de entrada y spam.
            </div>
            <Link
              href="/login"
              className="inline-block text-sm text-accent hover:text-brand-brown"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-button border border-brand-cream bg-brand-paper text-brand-dark focus:outline-none focus:border-accent text-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger-light/30 border border-danger/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-button bg-accent text-white font-semibold text-sm hover:bg-brand-brown disabled:opacity-40 transition"
            >
              {submitting ? "Enviando…" : "Enviar enlace"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-brand-warm hover:text-brand-dark"
              >
                ← Volver
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
