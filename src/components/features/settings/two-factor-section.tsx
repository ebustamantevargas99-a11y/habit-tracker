"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Copy, Loader2, X } from "lucide-react";
import { api } from "@/lib/api-client";

type Status = { enabled: boolean; backupCodesRemaining: number };

type SetupResponse = { secret: string; qrCode: string };
type EnableResponse = { message: string; backupCodes: string[] };

export default function TwoFactorSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Setup flow state
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Post-enable — show backup codes
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Disable flow
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState("");
  const [disableToken, setDisableToken] = useState("");

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const s = await api.get<Status>("/user/2fa/status");
      setStatus(s);
    } catch {
      toast.error("Error cargando estado 2FA");
    } finally {
      setLoadingStatus(false);
    }
  }

  async function startSetup() {
    setSubmitting(true);
    try {
      const res = await api.post<SetupResponse>("/user/2fa/setup", {});
      setSetup(res);
    } catch {
      toast.error("Error iniciando 2FA");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<EnableResponse>("/user/2fa/enable", { token });
      setBackupCodes(res.backupCodes);
      setSetup(null);
      setToken("");
      toast.success("2FA activado");
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error activando 2FA");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/user/2fa/disable", { password, token: disableToken });
      toast.success("2FA desactivado");
      setDisabling(false);
      setPassword("");
      setDisableToken("");
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desactivando");
    } finally {
      setSubmitting(false);
    }
  }

  function copyBackupCodes() {
    if (!backupCodes) return;
    void navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Códigos copiados");
  }

  function downloadBackupCodes() {
    if (!backupCodes) return;
    const content = `Ultimate TRACKER — Códigos de respaldo 2FA\nGuarda este archivo en lugar seguro.\n\n${backupCodes.join("\n")}\n\nCada código sirve UNA sola vez.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ultimate-tracker-2fa-backup.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loadingStatus) {
    return (
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <Loader2 size={18} className="animate-spin inline mr-2" />
        Cargando estado 2FA…
      </div>
    );
  }

  // Estado: mostrando códigos de respaldo post-activación
  if (backupCodes) {
    return (
      <div className="bg-success-light/30 rounded-xl p-6 border-2 border-success">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={20} className="text-success" />
          <h3 className="font-serif text-brand-dark text-xl m-0">
            Códigos de respaldo
          </h3>
        </div>
        <p className="text-sm text-brand-dark mb-4">
          <strong>Guarda estos 10 códigos ahora.</strong> Cada uno sirve UNA sola vez si
          pierdes acceso a tu autenticador. Después de cerrar esta sección no los podrás
          ver de nuevo.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
          {backupCodes.map((code, i) => (
            <div
              key={i}
              className="bg-white rounded-lg px-3 py-2 border border-brand-cream"
            >
              {code}
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={copyBackupCodes}
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold flex items-center gap-2 hover:bg-brand-brown"
          >
            <Copy size={14} /> Copiar
          </button>
          <button
            onClick={downloadBackupCodes}
            className="px-4 py-2 rounded-button border border-brand-tan text-brand-dark text-sm font-semibold hover:bg-brand-cream"
          >
            Descargar .txt
          </button>
          <button
            onClick={() => setBackupCodes(null)}
            className="px-4 py-2 rounded-button text-brand-warm text-sm hover:bg-brand-cream"
          >
            Ya los guardé, cerrar
          </button>
        </div>
      </div>
    );
  }

  // Estado: mostrando QR code para setup
  if (setup) {
    return (
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-brand-dark text-xl m-0">Configurar 2FA</h3>
          <button onClick={() => setSetup(null)} className="text-brand-warm hover:text-brand-dark">
            <X size={16} />
          </button>
        </div>
        <ol className="list-decimal list-inside text-sm text-brand-medium space-y-2 mb-4">
          <li>
            Instala una app autenticadora: <strong>Google Authenticator</strong>,{" "}
            <strong>Authy</strong>, <strong>1Password</strong>, o similar.
          </li>
          <li>Escanea este código QR con la app:</li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={setup.qrCode}
            alt="Código QR para 2FA"
            className="rounded-lg border border-brand-cream bg-white p-2"
            width={260}
            height={260}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-warm mb-1">
              ¿No puedes escanear? Introduce este código manualmente:
            </p>
            <code className="block bg-brand-cream/50 rounded px-3 py-2 text-sm font-mono break-all">
              {setup.secret}
            </code>
          </div>
        </div>
        <form onSubmit={confirmEnable} className="space-y-3">
          <label className="block text-sm font-medium text-brand-dark">
            3. Ingresa el código de 6 dígitos que muestra tu app:
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            autoFocus
            className="w-40 text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-button border border-brand-cream bg-white text-brand-dark focus:outline-none focus:border-accent"
          />
          <div>
            <button
              type="submit"
              disabled={submitting || token.length !== 6}
              className="px-5 py-2.5 rounded-button bg-accent text-white font-semibold text-sm hover:bg-brand-brown disabled:opacity-40 flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Activar 2FA
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Estado: 2FA desactivado — botón para setup
  if (!status?.enabled) {
    return (
      <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={20} className="text-warning" />
          <h3 className="font-serif text-brand-dark text-xl m-0">
            Autenticación de dos factores (2FA)
          </h3>
        </div>
        <p className="text-sm text-brand-warm mb-4">
          Con 2FA, aun si alguien roba tu contraseña no podrá entrar sin tu dispositivo.
          Recomendado fuertemente para cuentas con datos sensibles.
        </p>
        <button
          onClick={startSetup}
          disabled={submitting}
          className="px-5 py-2.5 rounded-button bg-accent text-white font-semibold text-sm hover:bg-brand-brown disabled:opacity-40"
        >
          {submitting ? "Generando…" : "Activar 2FA"}
        </button>
      </div>
    );
  }

  // Estado: 2FA activo
  return (
    <div className="bg-brand-paper rounded-xl p-6 border border-brand-tan">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={20} className="text-success" />
        <h3 className="font-serif text-brand-dark text-xl m-0">
          2FA activada ✓
        </h3>
      </div>
      <p className="text-sm text-brand-warm mb-2">
        Tu cuenta está protegida con autenticación de dos factores.
      </p>
      <p className="text-xs text-brand-warm mb-4">
        Códigos de respaldo disponibles: <strong>{status.backupCodesRemaining}</strong>
      </p>

      {!disabling ? (
        <button
          onClick={() => setDisabling(true)}
          className="px-4 py-2 rounded-button border border-danger text-danger text-sm hover:bg-danger-light/50"
        >
          Desactivar 2FA
        </button>
      ) : (
        <form onSubmit={confirmDisable} className="space-y-3 max-w-md mt-4 pt-4 border-t border-brand-cream">
          <p className="text-sm text-brand-dark font-semibold">
            Confirma contraseña + código TOTP o de respaldo:
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña actual"
            required
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-sm"
          />
          <input
            type="text"
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value)}
            placeholder="Código TOTP (6 dígitos) o de respaldo (XXXX-XXXX)"
            required
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream bg-brand-paper text-sm font-mono"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-button bg-danger text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Desactivando…" : "Desactivar"}
            </button>
            <button
              type="button"
              onClick={() => setDisabling(false)}
              className="px-4 py-2 rounded-button text-brand-warm text-sm hover:bg-brand-cream"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
