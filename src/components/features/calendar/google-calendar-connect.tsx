"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Link2, Unlink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

interface Status {
  configured: boolean;
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
}

/**
 * Conectar / sincronizar Google Calendar (solo lectura). Vive en el sidebar
 * del calendario. El flujo OAuth ocurre en /api/calendar/google/connect.
 */
export default function GoogleCalendarConnect({ onSynced }: { onSynced?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await api.get<Status>("/calendar/google/status"));
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Auto-sincronizar al abrir el calendario: si está conectado y la última
  // sync fue hace > 2 min, jala los cambios de Google en silencio (es
  // incremental, barato). Así los cambios que hagas en Google aparecen
  // automáticamente sin apretar nada. Una vez por montaje.
  useEffect(() => {
    if (!status?.connected || autoSynced) return;
    setAutoSynced(true);
    const stale =
      !status.lastSyncedAt ||
      Date.now() - new Date(status.lastSyncedAt).getTime() > 2 * 60 * 1000;
    if (!stale) return;
    api
      .post<{ imported: number }>("/calendar/google/sync", {})
      .then(() => {
        void loadStatus();
        onSynced?.();
      })
      .catch(() => {
        /* silencioso: el botón manual sigue disponible */
      });
  }, [status, autoSynced, loadStatus, onSynced]);

  // Mostrar resultado del callback (?google=connected|error) una sola vez.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    if (!g) return;
    if (g === "connected") {
      toast.success("Google Calendar conectado y sincronizado");
      void loadStatus();
      onSynced?.();
    } else if (g === "error") {
      const reason = params.get("reason");
      toast.error(
        reason === "no_refresh_token"
          ? "Reintenta: Google no envió permiso de actualización"
          : "No se pudo conectar Google Calendar",
      );
    }
    // Limpiar los params para no repetir el toast al navegar.
    params.delete("google");
    params.delete("reason");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, [loadStatus, onSynced]);

  if (!status) return null;
  if (!status.configured) return null; // backend sin credenciales → no mostrar

  async function sync() {
    setSyncing(true);
    try {
      const r = await api.post<{ imported: number; removed: number }>(
        "/calendar/google/sync",
        {},
      );
      toast.success(`Sincronizado · ${r.imported} eventos`);
      await loadStatus();
      onSynced?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    if (!confirm("¿Desconectar Google Calendar? Puedes elegir borrar también los eventos importados.")) {
      return;
    }
    const alsoDelete = confirm(
      "¿Borrar también los eventos ya importados de Google? (Aceptar = borrar · Cancelar = conservarlos)",
    );
    try {
      await api.post("/calendar/google/disconnect", { deleteEvents: alsoDelete });
      toast.success("Google Calendar desconectado");
      await loadStatus();
      onSynced?.();
    } catch {
      toast.error("Error al desconectar");
    }
  }

  if (!status.connected) {
    return (
      <div className="px-3 py-2.5 border-t border-brand-cream">
        <a
          href="/api/calendar/google/connect"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-button bg-brand-warm-white border border-brand-cream text-xs font-semibold text-brand-dark hover:border-accent transition"
        >
          <Link2 size={13} /> Conectar Google Calendar
        </a>
        <p className="text-[10px] text-brand-tan text-center mt-1.5 m-0">
          Importa tus eventos de Google (solo lectura)
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 border-t border-brand-cream flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-success shrink-0" />
        <span className="text-[11px] text-brand-dark truncate flex-1" title={status.email ?? ""}>
          {status.email ?? "Google Calendar"}
        </span>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={sync}
          disabled={syncing}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-button bg-accent text-white text-[11px] font-semibold hover:bg-brand-brown disabled:opacity-50 transition"
        >
          {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {syncing ? "Sincronizando…" : "Sincronizar"}
        </button>
        <button
          onClick={disconnect}
          className="px-2 py-1.5 rounded-button border border-brand-cream text-brand-warm hover:text-danger hover:border-danger/40 transition"
          title="Desconectar"
          aria-label="Desconectar Google Calendar"
        >
          <Unlink size={12} />
        </button>
      </div>
      {status.lastSyncedAt && (
        <p className="text-[10px] text-brand-tan text-center m-0">
          Última sync:{" "}
          {new Date(status.lastSyncedAt).toLocaleString("es-MX", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
