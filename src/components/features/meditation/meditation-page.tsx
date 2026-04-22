"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { Play, Square, Pause, Flame, Clock, Wind, Sparkles, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/components/ui";
import { fireConfettiCelebration } from "@/lib/celebrations/confetti";
import AIExportButton from "@/components/features/ai-export/ai-export-button";

type MeditationSession = {
  id: string;
  date: string;
  durationMinutes: number;
  type: string;
  moodBefore: number | null;
  moodAfter: number | null;
  notes: string | null;
  createdAt: string;
};

const PRESETS = [
  { minutes: 1, label: "1 min", description: "Respiración rápida" },
  { minutes: 5, label: "5 min", description: "Micro-pausa" },
  { minutes: 10, label: "10 min", description: "Meditación corta" },
  { minutes: 20, label: "20 min", description: "Práctica estándar" },
  { minutes: 30, label: "30 min", description: "Sesión profunda" },
];

const TYPES = [
  { id: "mindfulness", label: "Mindfulness" },
  { id: "breathing",   label: "Respiración" },
  { id: "guided",      label: "Guiada" },
  { id: "yoga",        label: "Yoga" },
  { id: "body-scan",   label: "Body scan" },
];

function fmtTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MeditationPage() {
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Timer state
  const [targetSec, setTargetSec] = useState(300); // 5min default
  const [remainingSec, setRemainingSec] = useState(300);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [type, setType] = useState<string>("mindfulness");
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<MeditationSession[]>("/meditation/sessions?limit=60");
      setSessions(data);
    } catch {
      toast.error("Error cargando sesiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Tick del timer
  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setRunning(false);
          fireConfettiCelebration();
          setShowCompleteModal(true);
          // Sound beep
          try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 800;
            g.gain.value = 0.1;
            o.start();
            setTimeout(() => o.stop(), 400);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, paused]);

  function chooseDuration(min: number) {
    if (running) return;
    setTargetSec(min * 60);
    setRemainingSec(min * 60);
  }

  function start() {
    setRunning(true);
    setPaused(false);
  }

  function pause() {
    setPaused((p) => !p);
  }

  function stop() {
    if (!confirm("¿Detener la sesión sin guardar?")) return;
    setRunning(false);
    setPaused(false);
    setRemainingSec(targetSec);
  }

  async function logSession(minutes: number) {
    try {
      const s = await api.post<MeditationSession>("/meditation/sessions", {
        durationMinutes: minutes,
        type,
        moodBefore,
        moodAfter,
      });
      setSessions((prev) => [s, ...prev]);
      setShowCompleteModal(false);
      setRemainingSec(targetSec);
      setMoodBefore(null);
      setMoodAfter(null);
      toast.success(`${minutes} minutos registrados`);
    } catch {
      toast.error("Error guardando");
    }
  }

  async function deleteSession(id: string) {
    if (!confirm("¿Borrar esta sesión?")) return;
    try {
      await api.delete(`/meditation/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Error borrando");
    }
  }

  const stats = useMemo(() => {
    const totalMin = sessions.reduce((s, x) => s + x.durationMinutes, 0);
    const totalSessions = sessions.length;

    // Streak: días consecutivos con al menos 1 sesión
    const dateSet = new Set(sessions.map((s) => s.date));
    let streak = 0;
    const d = new Date();
    while (true) {
      const dStr = d.toISOString().split("T")[0];
      if (dateSet.has(dStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        if (streak === 0) {
          // permitir 0 si hoy no hay pero ayer sí (flexible)
          const y = new Date(d);
          y.setDate(y.getDate() - 1);
          const yStr = y.toISOString().split("T")[0];
          if (dateSet.has(yStr)) {
            // skip today, empezar desde ayer
            d.setDate(d.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return { totalMin, totalSessions, streak };
  }, [sessions]);

  const progress = targetSec > 0 ? ((targetSec - remainingSec) / targetSec) * 100 : 0;

  if (loading) {
    return (
      <div className="text-center py-12 text-brand-warm">
        <Loader2 className="inline animate-spin mr-2" size={20} />
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-dark m-0">Meditación</h1>
          <p className="text-sm text-brand-warm mt-1">
            {stats.totalSessions} sesiones · {stats.totalMin} minutos totales · streak {stats.streak} día{stats.streak !== 1 ? "s" : ""}
          </p>
        </div>
        <AIExportButton
          scope="holistic"
          label="Analizar con IA"
          title="Análisis de meditación"
          variant="outline"
          size="md"
        />
      </div>

      {/* Timer */}
      <div className="bg-gradient-to-br from-brand-dark to-brand-brown rounded-2xl p-10 text-center text-brand-paper">
        <div className="mb-6 flex justify-center gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => !running && setType(t.id)}
              disabled={running}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition",
                type === t.id
                  ? "bg-accent-glow text-brand-dark"
                  : "bg-white/10 text-brand-light-tan hover:bg-white/20",
                running && "opacity-40 cursor-not-allowed"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Progress ring */}
        <div className="relative inline-block">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke="#F0D78C"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Wind size={20} className="text-accent-glow mb-2" />
            <div className="text-5xl font-mono font-bold text-accent-glow leading-none">
              {fmtTimer(remainingSec)}
            </div>
            <p className="text-xs uppercase tracking-widest text-brand-light-tan mt-2">
              {running ? (paused ? "En pausa" : "Respirando…") : "Listo"}
            </p>
          </div>
        </div>

        {/* Presets */}
        {!running && (
          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => chooseDuration(p.minutes)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition",
                  targetSec === p.minutes * 60
                    ? "bg-accent-glow text-brand-dark"
                    : "bg-white/10 text-brand-light-tan hover:bg-white/20"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-6">
          {!running ? (
            <button
              onClick={start}
              className="px-8 py-3 rounded-button bg-accent-glow text-brand-dark font-bold hover:bg-accent flex items-center gap-2"
            >
              <Play size={16} /> Comenzar
            </button>
          ) : (
            <>
              <button
                onClick={pause}
                className="px-6 py-3 rounded-button bg-white/20 text-brand-paper hover:bg-white/30 flex items-center gap-2"
              >
                <Pause size={16} /> {paused ? "Reanudar" : "Pausar"}
              </button>
              <button
                onClick={stop}
                className="px-6 py-3 rounded-button bg-danger/80 text-white hover:bg-danger flex items-center gap-2"
              >
                <Square size={16} /> Detener
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Sparkles size={18} />} label="Sesiones" value={stats.totalSessions} />
        <StatCard icon={<Clock size={18} />} label="Minutos totales" value={stats.totalMin} />
        <StatCard icon={<Flame size={18} />} label="Streak" value={`${stats.streak}d`} />
      </div>

      {/* Log manual */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Registrar sesión manual
        </h3>
        <div className="flex gap-2 flex-wrap">
          {[5, 10, 15, 20, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => void logSession(m)}
              className="px-3 py-1.5 rounded-button border border-brand-cream text-brand-dark text-xs hover:border-accent hover:bg-accent/5"
            >
              +{m} min
            </button>
          ))}
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-brand-paper border border-brand-cream rounded-xl p-5">
        <h3 className="font-serif text-base font-semibold text-brand-dark mb-3">
          Últimas sesiones
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-brand-warm text-center py-6 italic">
            Sin sesiones todavía. Usa el timer arriba para empezar.
          </p>
        ) : (
          <div className="space-y-1.5">
            {sessions.slice(0, 15).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-cream/30"
              >
                <Wind size={14} className="text-accent" />
                <span className="font-semibold text-brand-dark text-sm">
                  {s.durationMinutes} min
                </span>
                <span className="text-xs text-brand-warm capitalize">{s.type}</span>
                <span className="text-xs text-brand-tan">
                  {new Date(s.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </span>
                {s.moodBefore && s.moodAfter && (
                  <span className="text-[11px] text-brand-medium">
                    mood {s.moodBefore} → {s.moodAfter}
                  </span>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => void deleteSession(s.id)}
                  className="p-1.5 text-brand-warm hover:text-danger rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete modal */}
      {showCompleteModal && (
        <CompleteModal
          minutes={Math.round(targetSec / 60)}
          moodBefore={moodBefore}
          setMoodBefore={setMoodBefore}
          moodAfter={moodAfter}
          setMoodAfter={setMoodAfter}
          onSave={() => void logSession(Math.round(targetSec / 60))}
          onSkip={() => {
            setShowCompleteModal(false);
            setRemainingSec(targetSec);
          }}
        />
      )}
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

function CompleteModal({
  minutes,
  moodBefore,
  setMoodBefore,
  moodAfter,
  setMoodAfter,
  onSave,
  onSkip,
}: {
  minutes: number;
  moodBefore: number | null;
  setMoodBefore: (n: number | null) => void;
  moodAfter: number | null;
  setMoodAfter: (n: number | null) => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-paper rounded-2xl w-full max-w-md shadow-warm-lg p-6">
        <h2 className="font-display text-xl font-bold text-brand-dark m-0 mb-1">
          🎉 Sesión completa
        </h2>
        <p className="text-sm text-brand-warm mb-5">
          {minutes} minutos registrados. ¿Cómo te sientes?
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
              Mood antes (opcional)
            </label>
            <MoodSlider value={moodBefore} onChange={setMoodBefore} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2 block">
              Mood después (opcional)
            </label>
            <MoodSlider value={moodAfter} onChange={setMoodAfter} />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onSkip}
            className="px-5 py-2 rounded-button text-sm text-brand-warm hover:bg-brand-cream"
          >
            No guardar
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown"
          >
            Guardar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function MoodSlider({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            "flex-1 py-2 rounded text-xs font-semibold transition",
            value === n
              ? "bg-accent text-white"
              : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
