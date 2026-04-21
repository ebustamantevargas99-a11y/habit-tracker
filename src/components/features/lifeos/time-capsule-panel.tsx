"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Lock, Unlock, Plus, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";

type Capsule = {
  id: string;
  unlockAt: string;
  opened: boolean;
  openedAt: string | null;
  createdAt: string;
  ready: boolean;
  message: string | null;
};

const PRESETS = [
  { months: 1, label: "En 1 mes" },
  { months: 3, label: "En 3 meses" },
  { months: 6, label: "En 6 meses" },
  { months: 12, label: "En 1 año" },
];

export default function TimeCapsulePanel() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [months, setMonths] = useState(3);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<Capsule[]>("/lifeos/time-capsules");
      setCapsules(data);
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createCapsule() {
    if (!message.trim()) {
      toast.error("Escribe un mensaje");
      return;
    }
    setSaving(true);
    try {
      const unlockAt = new Date();
      unlockAt.setMonth(unlockAt.getMonth() + months);
      const c = await api.post<Capsule>("/lifeos/time-capsules", {
        message: message.trim(),
        unlockAt: unlockAt.toISOString(),
      });
      setCapsules((prev) => [...prev, c].sort((a, b) => a.unlockAt.localeCompare(b.unlockAt)));
      setMessage("");
      toast.success(`Cápsula sellada hasta ${unlockAt.toLocaleDateString("es-MX")}`);
    } catch {
      toast.error("Error");
    } finally {
      setSaving(false);
    }
  }

  async function openCapsule(id: string) {
    try {
      const updated = await api.post<Capsule>(`/lifeos/time-capsules/${id}`, {});
      // Recargar para obtener el mensaje desencriptado
      await refresh();
      fireConfettiCelebration();
      toast.success("🎉 Cápsula abierta");
    } catch {
      toast.error("Aún no puedes abrirla");
    }
  }

  async function deleteCapsule(id: string) {
    if (!confirm("¿Borrar cápsula? El mensaje se perderá.")) return;
    try {
      await api.delete(`/lifeos/time-capsules/${id}`);
      setCapsules((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Error");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-warm">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-warning/20 to-brand-paper border border-brand-cream rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Clock size={22} className="text-warning mt-0.5" />
          <div>
            <h2 className="font-display text-xl font-bold text-brand-dark m-0">
              Cápsula del tiempo
            </h2>
            <p className="text-xs text-brand-warm mt-0.5">
              Escribe un mensaje a ti mismo en el futuro. Se desbloqueará en la fecha que elijas.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Querido yo del futuro…

Quiero contarte que hoy..."
          className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent resize-y min-h-[120px]"
        />
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.months}
                onClick={() => setMonths(p.months)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition",
                  months === p.months
                    ? "bg-warning text-white"
                    : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={createCapsule}
            disabled={saving || !message.trim()}
            className="ml-auto px-5 py-2 rounded-button bg-warning text-white text-sm font-semibold hover:bg-warning/90 disabled:opacity-40 flex items-center gap-2"
          >
            <Lock size={14} /> Sellar cápsula
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {capsules.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-8">
            Sin cápsulas aún. Sella la primera arriba.
          </p>
        ) : (
          capsules.map((c) => {
            const unlock = new Date(c.unlockAt);
            const daysUntil = Math.ceil(
              (unlock.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div
                key={c.id}
                className={cn(
                  "bg-brand-paper border rounded-xl p-4 transition",
                  c.ready && !c.opened
                    ? "border-accent bg-accent/5 shadow-warm"
                    : "border-brand-cream"
                )}
              >
                <div className="flex items-start gap-3">
                  {c.opened ? (
                    <Unlock size={20} className="text-success mt-0.5 shrink-0" />
                  ) : c.ready ? (
                    <Unlock size={20} className="text-accent mt-0.5 shrink-0" />
                  ) : (
                    <Lock size={20} className="text-brand-warm mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-warm">
                      {c.opened
                        ? `Abierta el ${new Date(c.openedAt!).toLocaleDateString("es-MX")}`
                        : c.ready
                        ? "¡Lista para abrir!"
                        : `Se abre el ${unlock.toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })} · en ${daysUntil} días`}
                    </p>
                    {(c.opened || c.ready) && c.message && (
                      <p className="text-sm text-brand-dark mt-2 whitespace-pre-wrap">
                        {c.message}
                      </p>
                    )}
                    {c.ready && !c.opened && (
                      <button
                        onClick={() => void openCapsule(c.id)}
                        className="mt-3 px-4 py-1.5 rounded-button bg-accent text-white text-xs font-semibold hover:bg-brand-brown"
                      >
                        Abrir cápsula
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => void deleteCapsule(c.id)}
                    className="p-1.5 text-brand-warm hover:text-danger rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
