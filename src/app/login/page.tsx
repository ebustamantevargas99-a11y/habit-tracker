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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
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
        redirect: false,
      });

      if (result?.error) {
        setError("Email o contraseña incorrectos");
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
              fontFamily: "Georgia, serif",
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.dark,
              margin: 0,
            }}
          >
            Ultimate Habit Tracker
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
