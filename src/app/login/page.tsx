"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [formLoadedAt] = useState(() => Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            website,
            formFilledIn: Date.now() - formLoadedAt,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error al registrar");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        twoFactorToken: twoFactorRequired ? twoFactorToken : "",
        redirect: false,
      });

      if (result?.error) {
        const code = String(result.error);
        if (code.includes("TwoFactorRequired")) {
          setTwoFactorRequired(true);
          setError("");
        } else if (code.includes("TwoFactorInvalid")) {
          setError("Código 2FA inválido. Intenta de nuevo.");
        } else if (code.includes("AccountLocked")) {
          setError("Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta en 30 min.");
        } else {
          setError("Email o contraseña incorrectos");
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 font-sans">
      {/* ─── Background layers ─────────────────────────────────────────── */}
      {/* Base gradient entre Pergamino y Marfil */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#FFF9F0_0%,#F6EEDB_50%,#F1E6CF_100%)]" />
      {/* Orbe de acento superior derecho — depth + warmth */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 90% 10%, #C79B55 0%, transparent 60%)",
        }}
      />
      {/* Orbe de acento inferior izquierdo */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 5% 95%, #A77A39 0%, transparent 55%)",
        }}
      />
      {/* Línea decorativa art-deco superior */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,transparent,#C79B55,transparent)]" />

      {/* Decoraciones de esquina sutiles */}
      <p className="absolute top-8 left-8 font-display italic text-xs text-brand-warm/50 tracking-wide hidden md:block">
        Ultimate TRACKER
      </p>
      <p className="absolute bottom-8 right-8 font-mono text-[10px] text-brand-warm/50 tracking-widest uppercase hidden md:block">
        beta · 2026
      </p>

      {/* ─── Card ───────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-[22px] shadow-[0_20px_60px_-15px_rgba(61,43,31,0.25),0_4px_20px_-5px_rgba(61,43,31,0.1)] border border-white p-10 md:p-12">
          {/* Header */}
          <header className="text-center mb-8">
            <h1
              className="font-display font-bold text-brand-dark m-0 leading-none"
              style={{
                fontSize: "clamp(2rem, 5vw, 2.5rem)",
                letterSpacing: "-0.01em",
              }}
            >
              Ultimate{" "}
              <span className="tracking-[0.12em] font-black">TRACKER</span>
            </h1>
            {/* Divisor dorado */}
            <div className="flex items-center justify-center gap-3 mt-5 mb-4">
              <span className="h-px w-8 bg-brand-warm/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="h-px w-8 bg-brand-warm/40" />
            </div>
            <p className="font-display italic text-brand-warm text-sm m-0">
              {mode === "login"
                ? "Bienvenido de vuelta"
                : "Crea tu cuenta gratuita"}
            </p>
          </header>

          {/* Tabs login / register */}
          <div className="flex bg-brand-paper/80 rounded-[10px] p-1 mb-7 border border-brand-cream">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-[8px] text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-white text-brand-dark shadow-[0_1px_4px_rgba(61,43,31,0.12)]"
                    : "text-brand-warm hover:text-brand-dark"
                }`}
                type="button"
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot anti-bot */}
            {mode === "register" && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                }}
              >
                <label htmlFor="website_url">Website (déjalo vacío)</label>
                <input
                  type="text"
                  id="website_url"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            )}

            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-brand-medium mb-1.5 tracking-wide">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className={INPUT}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-medium mb-1.5 tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-medium mb-1.5 tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "register" ? "Mínimo 8 caracteres" : "••••••••"
                }
                required
                className={INPUT}
              />
            </div>

            {twoFactorRequired && mode === "login" && (
              <div>
                <label className="block text-xs font-semibold text-brand-medium mb-1.5 tracking-wide">
                  Código 2FA
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  placeholder="6 dígitos o XXXX-XXXX"
                  required
                  autoFocus
                  className={`${INPUT} font-mono tracking-[0.1em]`}
                />
                <p className="text-[11px] text-brand-warm mt-1.5">
                  Abre tu app autenticadora (Google Authenticator, Authy, 1Password).
                </p>
              </div>
            )}

            {error && (
              <div className="bg-danger-light/50 border border-danger/30 rounded-lg px-3.5 py-2.5 text-danger text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[10px] text-white font-semibold text-sm transition-all bg-gradient-to-br from-[#A77A39] to-[#C79B55] hover:from-[#8F6829] hover:to-[#B58B45] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_-4px_rgba(167,122,57,0.5)]"
            >
              {loading
                ? "Cargando…"
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>

            {mode === "login" && (
              <div className="text-center pt-1">
                <a
                  href="/forgot-password"
                  className="text-brand-warm hover:text-brand-dark text-xs font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}
          </form>
        </div>

        {/* Feature strip debajo del card — qué es Ultimate TRACKER */}
        <div className="mt-8 flex items-center justify-center gap-5 flex-wrap text-[11px] text-brand-warm/80 font-medium tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" />
            Hábitos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" />
            Fitness
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" />
            Nutrición
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" />
            Finanzas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" />
            Análisis IA
          </span>
        </div>
      </div>
    </div>
  );
}

const INPUT =
  "w-full px-3.5 py-2.5 bg-white/70 border border-brand-cream rounded-[10px] text-sm text-brand-dark placeholder:text-brand-warm/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition font-sans";
