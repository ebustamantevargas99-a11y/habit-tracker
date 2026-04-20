"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const issues = data.issues?.map((i: { message: string }) => i.message).join(", ");
        setError(issues || data.error || "Error al restablecer");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Error de conexión");
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="p-4 rounded-lg bg-danger-light/30 text-danger text-sm mb-4">
          Enlace inválido — falta token. Solicita uno nuevo.
        </div>
        <Link href="/forgot-password" className="text-sm text-accent hover:text-brand-brown">
          Ir a Restablecer contraseña
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 rounded-lg bg-success-light text-success text-sm">
          Contraseña actualizada. Redirigiendo al login…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          Nueva contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres, con mayúscula y número"
          required
          autoFocus
          minLength={8}
          className="w-full px-4 py-3 rounded-button border border-brand-cream bg-brand-paper text-brand-dark focus:outline-none focus:border-accent text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          Confirmar contraseña
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          required
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
        {submitting ? "Actualizando…" : "Restablecer contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-paper px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-cream shadow-warm-lg p-8 md:p-10">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎯</div>
          <h1 className="font-display text-2xl font-bold text-brand-dark m-0">
            Nueva contraseña
          </h1>
          <p className="text-sm text-brand-warm mt-1">
            Establece tu nueva contraseña
          </p>
        </div>
        <Suspense fallback={<p className="text-center text-brand-warm">Cargando…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
