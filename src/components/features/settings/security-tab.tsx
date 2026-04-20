"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Key, Activity, AlertTriangle, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

type SecurityEvent = {
  id: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const EVENT_LABELS: Record<string, { label: string; icon: string; severity: "info" | "warn" | "danger" }> = {
  login_success: { label: "Inicio de sesión", icon: "🔓", severity: "info" },
  login_failed: { label: "Intento fallido de login", icon: "⚠️", severity: "warn" },
  register: { label: "Cuenta creada", icon: "👤", severity: "info" },
  logout: { label: "Cierre de sesión", icon: "🔒", severity: "info" },
  password_reset_requested: { label: "Reset de password solicitado", icon: "📧", severity: "info" },
  password_reset_completed: { label: "Password restablecido", icon: "✅", severity: "info" },
  password_changed: { label: "Password cambiado", icon: "🔑", severity: "info" },
  email_verified: { label: "Email verificado", icon: "✉️", severity: "info" },
  email_verification_sent: { label: "Email de verificación enviado", icon: "📤", severity: "info" },
  account_deleted: { label: "Cuenta eliminada", icon: "🗑️", severity: "danger" },
  data_exported: { label: "Datos exportados", icon: "📥", severity: "info" },
  "2fa_enabled": { label: "2FA activado", icon: "🛡️", severity: "info" },
  "2fa_disabled": { label: "2FA desactivado", icon: "⚠️", severity: "warn" },
  rate_limited: { label: "Rate limit alcanzado", icon: "🚦", severity: "warn" },
  suspicious_activity: { label: "Actividad sospechosa", icon: "🚨", severity: "danger" },
};

export default function SecurityTab() {
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    void loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const res = await api.get<{ events: SecurityEvent[] }>("/user/security-events?limit=50");
      setEvents(res.events);
    } catch {
      toast.error("No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPw === currentPw) {
      toast.error("La nueva contraseña debe ser distinta a la actual");
      return;
    }
    setChanging(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Error al cambiar password");
        return;
      }
      toast.success("Contraseña actualizada. Serás redirigido al login.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Change Password */}
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-accent" />
          <h3 className="font-serif text-brand-dark text-xl m-0">Cambiar contraseña</h3>
        </div>
        <p className="text-sm text-brand-warm mb-4">
          Al cambiar tu contraseña, todas tus sesiones activas se cerrarán. Validamos contra la base
          de passwords filtrados (HaveIBeenPwned) para rechazar contraseñas comprometidas.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Contraseña actual"
            required
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Nueva contraseña (min 8, mayúscula + número)"
            required
            minLength={8}
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Confirmar nueva contraseña"
            required
            minLength={8}
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={changing || !currentPw || !newPw || !confirmPw}
            className="px-5 py-2.5 rounded-button bg-accent text-white font-semibold text-sm hover:bg-brand-brown disabled:opacity-40 transition flex items-center gap-2"
          >
            {changing && <Loader2 size={14} className="animate-spin" />}
            Cambiar contraseña
          </button>
        </form>
      </div>

      {/* Activity Log */}
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-accent" />
            <h3 className="font-serif text-brand-dark text-xl m-0">Actividad reciente</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadEvents();
            }}
            className="text-xs text-brand-warm hover:text-brand-dark"
          >
            Refrescar
          </button>
        </div>
        <p className="text-sm text-brand-warm mb-4">
          Últimos 50 eventos de seguridad en tu cuenta. Si ves algo que no hiciste,{" "}
          <strong>cambia tu contraseña inmediatamente</strong>.
        </p>

        {loading && (
          <div className="text-center py-8 text-brand-warm text-sm">
            <Loader2 size={18} className="animate-spin inline mr-2" />
            Cargando…
          </div>
        )}

        {!loading && events && events.length === 0 && (
          <p className="text-sm text-brand-warm text-center py-8">
            Sin actividad registrada aún.
          </p>
        )}

        {!loading && events && events.length > 0 && (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {events.map((ev) => {
              const meta = EVENT_LABELS[ev.eventType] ?? {
                label: ev.eventType,
                icon: "📋",
                severity: "info" as const,
              };
              const bg =
                meta.severity === "danger"
                  ? "bg-danger-light/30"
                  : meta.severity === "warn"
                    ? "bg-warning-light/30"
                    : "bg-brand-cream/30";
              return (
                <div
                  key={ev.id}
                  className={`flex items-start gap-3 px-3 py-2 rounded-lg ${bg}`}
                >
                  <span className="text-lg shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-dark">{meta.label}</p>
                    <p className="text-xs text-brand-warm">
                      {new Date(ev.createdAt).toLocaleString()}
                      {ev.ipAddress && ` · IP ${ev.ipAddress}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security overview */}
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-accent" />
          <h3 className="font-serif text-brand-dark text-xl m-0">Protecciones activas</h3>
        </div>
        <ul className="space-y-2 text-sm text-brand-dark">
          <li className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Contraseña hasheada con bcrypt (13 rondas)
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Bloqueo de cuenta tras 5 intentos fallidos de login (30 min)
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Sesiones invalidadas al cambiar contraseña
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Validación anti-password-filtrado (HaveIBeenPwned)
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Rate limit distribuido (Upstash Redis)
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-success shrink-0" />
            Audit log de eventos sensibles (esta página)
          </li>
          <li className="flex items-center gap-2 text-brand-warm">
            <AlertTriangle size={14} className="text-warning shrink-0" />
            2FA (autenticación de dos factores) — próximamente
          </li>
        </ul>
      </div>
    </div>
  );
}
