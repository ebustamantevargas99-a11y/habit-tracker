"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const COLORS = {
  paper: "#FFFDF9",
  dark: "#3D2B1F",
  brown: "#6B4226",
  medium: "#8B6542",
  warm: "#A0845C",
  tan: "#C4A882",
  lightTan: "#D4BEA0",
  cream: "#EDE0D4",
  accent: "#B8860B",
  accentLight: "#D4A843",
  danger: "#C0544F",
};

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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "48px 40px",
          backgroundColor: "#fff",
          borderRadius: 20,
          border: `1px solid ${COLORS.cream}`,
          boxShadow: "0 4px 24px rgba(61,43,31,0.10)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <h1
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: 30,
              fontWeight: 700,
              color: COLORS.dark,
              margin: 0,
              letterSpacing: "0.02em",
            }}
          >
            Ultimate <span style={{ letterSpacing: "0.08em" }}>TRACKER</span>
          </h1>
          <p
            style={{
              color: COLORS.warm,
              fontSize: 14,
              marginTop: 6,
              margin: "6px 0 0",
            }}
          >
            {mode === "login"
              ? "Inicia sesión para continuar"
              : "Crea tu cuenta gratuita"}
          </p>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: COLORS.paper,
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
            border: `1px solid ${COLORS.cream}`,
          }}
        >
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.2s",
                backgroundColor: mode === m ? "#fff" : "transparent",
                color: mode === m ? COLORS.dark : COLORS.warm,
                boxShadow: mode === m ? "0 1px 4px rgba(61,43,31,0.12)" : "none",
              }}
            >
              {m === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Honeypot anti-bot (oculto visualmente pero presente para bots) */}
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: COLORS.medium, marginBottom: 6, fontWeight: 500 }}>
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: COLORS.medium, marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, color: COLORS.medium, marginBottom: 6, fontWeight: 500 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
              required
              style={inputStyle}
            />
          </div>

          {twoFactorRequired && mode === "login" && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, color: COLORS.medium, marginBottom: 6, fontWeight: 500 }}>
                Código de verificación (2FA)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                placeholder="6 dígitos o código de respaldo XXXX-XXXX"
                required
                autoFocus
                style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.1em" }}
              />
              <p style={{ fontSize: 12, color: COLORS.warm, marginTop: 6 }}>
                Abre tu app autenticadora (Google Authenticator, Authy, 1Password) e ingresa el código.
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#FFF0EE",
                border: `1px solid ${COLORS.danger}`,
                borderRadius: 8,
                padding: "10px 14px",
                color: COLORS.danger,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              backgroundColor: loading ? COLORS.tan : COLORS.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "background-color 0.2s",
            }}
          >
            {loading
              ? "Cargando..."
              : mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </button>

          {mode === "login" && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a
                href="/forgot-password"
                style={{
                  color: COLORS.warm,
                  fontSize: 13,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${COLORS.cream}`,
  borderRadius: 8,
  fontSize: 14,
  color: COLORS.dark,
  backgroundColor: COLORS.paper,
  fontFamily: "Inter, sans-serif",
  outline: "none",
  boxSizing: "border-box",
};
