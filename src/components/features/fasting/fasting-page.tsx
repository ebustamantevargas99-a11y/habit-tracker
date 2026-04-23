"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Play, Square, Trash2, Clock, Flame, TrendingUp, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";
import AIExportButton from "@/components/features/ai-export/ai-export-button";
import { cn } from "@/components/ui";

type FastingSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  targetHours: number;
  protocol: string | null;
  notes: string | null;
};

const PROTOCOLS = [
  { hours: 16, label: "16:8", description: "Ayuno más popular, 8h de ventana de comida" },
  { hours: 18, label: "18:6", description: "Intermedio, 6h ventana. Mayor quema" },
  { hours: 20, label: "20:4", description: "Warrior Diet, 4h ventana" },
  { hours: 24, label: "24h", description: "OMAD (One Meal A Day) extendido" },
  { hours: 36, label: "36h", description: "Extended fast. Solo ocasional" },
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FastingPage() {
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [active, setActive] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      const all = await api.get<FastingSession[]>("/fasting/sessions?limit=50");
      setSessions(all);
      setActive(all.find((s) => !s.endedAt) ?? null);
    } catch {
      toast.error("Error cargando ayunos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Tick cada segundo si hay ayuno activo
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const elapsed = active ? now - new Date(active.startedAt).getTime() : 0;
  const targetMs = active ? active.targetHours * 3600 * 1000 : 0;
  const progress = active ? Math.min(100, (elapsed / targetMs) * 100) : 0;
  const reachedTarget = active && elapsed >= targetMs;

  async function startFast(hours: number, protocol?: string) {
    try {
      const session = await api.post<FastingSession>("/fasting/sessions", {
        targetHours: hours,
        protocol: protocol ?? `${hours}:${24 - hours}`,
      });
      setActive(session);
      setSessions((prev) => [session, ...prev]);
      toast.success(`Ayuno ${hours}h iniciado`);
    } catch {
      toast.error("Error iniciando ayuno");
    }
  }

  async function endFast() {
    if (!active) return;
    try {
      const updated = await api.patch<FastingSession>(`/fasting/sessions/${active.id}`, {});
      setActive(null);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (reachedTarget) {
        fireConfettiCelebration();
        toast.success("🎉 ¡Ayuno completado! Gran trabajo.");
      } else {
        const hoursDone = (elapsed / 3600000).toFixed(1);
        toast.success(`Ayuno terminado: ${hoursDone}h`);
      }
    } catch {
      toast.error("Error cerrando ayuno");
    }
  }

  async function deleteFast(id: string) {
    if (!confirm("¿Borrar este registro de ayuno?")) return;
    try {
      await api.delete(`/fasting/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Borrado");
    } catch {
      toast.error("Error borrando");
    }
  }

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.endedAt);
    const totalHours = completed.reduce((sum, s) => {
      const ms = new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime();
      return sum + ms / 3600000;
    }, 0);
    const avgHours = completed.length ? totalHours / completed.length : 0;
    const completedTarget = completed.filter((s) => {
      const ms = new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime();
      return ms / 3600000 >= s.targetHours;
    }).length;
    return {
      total: completed.length,
      avgHours: +avgHours.toFixed(1),
      completedTarget,
      successRate: completed.length
        ? Math.round((completedTarget / completed.length) * 100)
        : 0,
    };
  }, [sessions]);

  if (loading) {
    return (
      <div className="text-center py-12 text-brand-warm">
        <Loader2 className="inline mr-2 animate-spin" size={20} />
        Cargando ayunos…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-dark m-0">
            Ayuno intermitente
          </h1>
          <p className="text-sm text-brand-warm mt-1">
            {stats.total} ayunos · {stats.successRate}% de éxito · {stats.avgHours}h promedio
          </p>
        </div>
        <AIExportButton
          scope="holistic"
          label="Analizar con IA"
          title="Análisis de ayuno"
          variant="outline"
          size="md"
        />
      </div>

      {/* Timer en vivo */}
      {active ? (
        <div className="bg-gradient-hero rounded-2xl p-8 text-brand-paper">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-1">
                Ayuno activo · objetivo {active.targetHours}h
              </p>
              <p className="text-[11px] text-brand-light-cream">
                Inició {new Date(active.startedAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
            <button
              onClick={endFast}
              className="px-5 py-2.5 rounded-button bg-accent-glow text-[#2E1F14] text-sm font-bold hover:bg-accent flex items-center gap-2"
            >
              <Square size={14} /> Romper ayuno
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="text-6xl font-mono font-bold text-accent-glow leading-none mb-3">
              {formatDuration(elapsed)}
            </div>
            <p className="text-sm text-brand-light-cream">
              {reachedTarget
                ? "🎉 ¡Objetivo alcanzado! Puedes romper el ayuno."
                : `Faltan ${formatDuration(targetMs - elapsed)} para tu objetivo`}
            </p>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                reachedTarget ? "bg-success" : "bg-accent-glow"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-brand-light-tan mt-2">
            <span>0h</span>
            <span>{progress.toFixed(0)}%</span>
            <span>{active.targetHours}h</span>
          </div>
        </div>
      ) : (
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-6">
          <h2 className="font-serif text-lg font-semibold text-brand-dark mb-1">
            Elige un protocolo e inicia
          </h2>
          <p className="text-xs text-brand-warm mb-4">
            El timer corre en vivo. Puedes cerrar la ventana sin perder el progreso.
          </p>
          <div className="grid grid-cols-5 gap-3">
            {PROTOCOLS.map((p) => (
              <button
                key={p.hours}
                onClick={() => startFast(p.hours, p.label)}
                className="bg-brand-warm-white border border-brand-cream rounded-xl p-4 hover:border-accent hover:bg-accent/5 transition text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Play size={14} className="text-accent" />
                  <span className="text-lg font-bold text-brand-dark">{p.label}</span>
                </div>
                <p className="text-[11px] text-brand-warm leading-tight">{p.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={<Flame size={18} />}
          label="Ayunos completados"
          value={stats.completedTarget}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Promedio por ayuno"
          value={`${stats.avgHours}h`}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Tasa de éxito"
          value={`${stats.successRate}%`}
        />
        <StatCard
          icon={<Flame size={18} />}
          label="Ayunos totales"
          value={stats.total}
        />
      </div>

      {/* Histórico */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Histórico ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-6">
            Sin registros. Inicia tu primer ayuno arriba.
          </p>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((s) => {
              const start = new Date(s.startedAt);
              const end = s.endedAt ? new Date(s.endedAt) : null;
              const durationMs = end ? end.getTime() - start.getTime() : now - start.getTime();
              const durationH = durationMs / 3600000;
              const success = durationH >= s.targetHours;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-cream/30"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      !end ? "bg-accent animate-pulse" : success ? "bg-success" : "bg-warning"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-brand-dark">
                        {s.protocol ?? `${s.targetHours}h`}
                      </span>
                      <span className="text-brand-warm">
                        {start.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="font-mono text-xs text-brand-medium">
                        {durationH.toFixed(1)}h / {s.targetHours}h
                      </span>
                    </div>
                  </div>
                  {end && (
                    <button
                      onClick={() => void deleteFast(s.id)}
                      className="p-1.5 text-brand-warm hover:text-danger hover:bg-danger-light/30 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-accent">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-brand-dark leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-brand-warm mt-1.5">{label}</div>
    </div>
  );
}
