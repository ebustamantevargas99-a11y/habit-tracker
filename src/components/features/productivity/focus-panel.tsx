"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Play, Square, Target, TrendingUp, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { fireConfettiDefault } from "@/lib/celebrations/confetti";
import { cn } from "@/components/ui";

type FocusSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  plannedMinutes: number;
  actualMinutes: number | null;
  task: string | null;
  category: string | null;
  interruptions: number;
  rating: number | null;
  notes: string | null;
};

const CATEGORIES = ["work", "study", "creative", "admin"];

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusPanel() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [active, setActive] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Form start
  const [task, setTask] = useState("");
  const [category, setCategory] = useState("work");
  const [plannedMin, setPlannedMin] = useState(90);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<FocusSession[]>("/productivity/focus/sessions");
      setSessions(data);
      setActive(data.find((s) => !s.endedAt) ?? null);
    } catch {
      toast.error("Error cargando");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const elapsedSec = active
    ? Math.floor((now - new Date(active.startedAt).getTime()) / 1000)
    : 0;
  const targetSec = active ? active.plannedMinutes * 60 : 0;
  const progress = targetSec ? Math.min(100, (elapsedSec / targetSec) * 100) : 0;
  const reached = active && elapsedSec >= targetSec;

  async function startSession() {
    try {
      const s = await api.post<FocusSession>("/productivity/focus/sessions", {
        plannedMinutes: plannedMin,
        task: task.trim() || null,
        category,
      });
      setActive(s);
      setSessions((prev) => [s, ...prev]);
      setTask("");
      toast.success("Sesión iniciada");
    } catch {
      toast.error("Error");
    }
  }

  async function endSession() {
    if (!active) return;
    try {
      const s = await api.patch<FocusSession>(`/productivity/focus/sessions/${active.id}`, {});
      setActive(null);
      setSessions((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      if (reached) fireConfettiDefault();
      toast.success(`Sesión completada: ${s.actualMinutes}min`);
    } catch {
      toast.error("Error");
    }
  }

  async function deleteSession(id: string) {
    if (!confirm("¿Borrar?")) return;
    try {
      await api.delete(`/productivity/focus/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Error");
    }
  }

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.endedAt);
    const totalMin = completed.reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0);
    const avg = completed.length ? totalMin / completed.length : 0;
    return { total: completed.length, totalMin, avg: +avg.toFixed(0) };
  }, [sessions]);

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
      {active ? (
        <div className="bg-gradient-to-br from-info to-brand-dark text-brand-paper rounded-2xl p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">Trabajo profundo activo</p>
              {active.task && (
                <p className="font-serif text-lg font-semibold mt-1">{active.task}</p>
              )}
            </div>
            <button
              onClick={endSession}
              className="px-5 py-2.5 rounded-button bg-accent-glow text-brand-dark text-sm font-bold hover:bg-accent flex items-center gap-2"
            >
              <Square size={14} /> Terminar
            </button>
          </div>
          <div className="text-center">
            <div className="text-7xl font-mono font-bold text-accent-glow leading-none">
              {fmt(elapsedSec)}
            </div>
            <p className="text-sm text-white/80 mt-2">
              {reached ? "🎯 Objetivo alcanzado" : `de ${active.plannedMinutes}:00 planeado`}
            </p>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mt-6">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                reached ? "bg-success" : "bg-accent-glow"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
          <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
            Inicia un bloque de Trabajo profundo
          </h3>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="¿En qué vas a enfocarte?"
            className="w-full px-3 py-2 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent mb-3"
          />
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium capitalize transition",
                    category === c
                      ? "bg-info text-white"
                      : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-brand-warm">Minutos:</label>
              <input
                type="number"
                min="5"
                max="480"
                value={plannedMin}
                onChange={(e) => setPlannedMin(parseInt(e.target.value) || 90)}
                className="w-20 px-2 py-1 rounded-button border border-brand-cream bg-brand-paper text-brand-dark text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <button
            onClick={startSession}
            className="w-full px-4 py-2.5 rounded-button bg-info text-white font-semibold hover:bg-info/90 flex items-center justify-center gap-2"
          >
            <Play size={14} /> Iniciar sesión
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Target size={18} />} label="Sesiones" value={stats.total} />
        <StatCard icon={<TrendingUp size={18} />} label="Min totales" value={stats.totalMin} />
        <StatCard icon={<Target size={18} />} label="Prom/sesión" value={`${stats.avg}min`} />
      </div>

      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Histórico
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-brand-warm italic text-center py-6">
            Sin sesiones. Empieza tu primera sesión arriba.
          </p>
        ) : (
          <div className="space-y-1.5">
            {sessions.slice(0, 20).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-cream/30"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    !s.endedAt
                      ? "bg-info animate-pulse"
                      : s.actualMinutes && s.actualMinutes >= s.plannedMinutes
                      ? "bg-success"
                      : "bg-warning"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-dark truncate">
                    {s.task ?? "Sesión sin título"}
                  </p>
                  <p className="text-[11px] text-brand-warm">
                    {new Date(s.startedAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {s.actualMinutes ?? Math.floor(elapsedSec / 60)}/{s.plannedMinutes}min
                    {s.category && ` · ${s.category}`}
                  </p>
                </div>
                {s.endedAt && (
                  <button
                    onClick={() => void deleteSession(s.id)}
                    className="p-1.5 text-brand-warm hover:text-danger rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
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
        <span className="text-info">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-brand-dark leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-brand-warm mt-1.5">{label}</div>
    </div>
  );
}
