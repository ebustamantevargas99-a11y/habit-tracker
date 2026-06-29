"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, X, Volume2 } from "lucide-react";

type Props = {
  initialSeconds: number;
  onDone?: () => void;
  onDismiss?: () => void;
  autoStart?: boolean;
};

// ─── Singleton AudioContext ────────────────────────────────────────────────────
// AudioContext must be created/resumed inside a user-gesture handler.
// We create it the first time the user interacts with the timer (play/pause/adjust),
// then reuse it when the alarm fires (which happens automatically with no gesture).

let _ctx: AudioContext | null = null;

function getOrCreateCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
  } catch {
    return null;
  }
  return _ctx;
}

// Called on every user interaction with the timer so the context stays "running".
// Exported so workout-logger can prime the context on the set-completion gesture,
// before the timer mounts (autoStart) — the only reliable way to un-suspend on iOS.
export function primeAudio() {
  const ctx = getOrCreateCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function touchAudioCtx() {
  primeAudio();
}

async function playAlarm() {
  const ctx = getOrCreateCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  // Three-beep pattern: two short + one longer at higher pitch
  const beep = (t: number, freq: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
  };

  const now = ctx.currentTime;
  beep(now, 880, 0.14);
  beep(now + 0.22, 880, 0.14);
  beep(now + 0.44, 1100, 0.35);
}

function vibrate() {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.([200, 100, 200, 100, 300]);
}

function notifyIfHidden() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    new Notification("⏱️ ¡Descanso terminado!", {
      body: "Ya puedes hacer tu próximo set.",
      icon: "/favicon.ico",
      tag: "rest-timer-done",
      silent: true, // sound already played via Web Audio
    });
  } catch {}
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function RestTimer({
  initialSeconds,
  onDone,
  onDismiss,
  autoStart = true,
}: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Touch the AudioContext when the component mounts with autoStart — this won't
  // resume a suspended context (no gesture), but it creates it so the singleton
  // is ready. The actual resume happens when the user interacts.
  useEffect(() => {
    getOrCreateCtx();
  }, []);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      void playAlarm();
      vibrate();
      notifyIfHidden();
      onDoneRef.current?.();
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  const mm = Math.floor(Math.max(0, seconds) / 60);
  const ss = Math.max(0, seconds) % 60;
  const displayMm = String(mm).padStart(2, "0");
  const displaySs = String(ss).padStart(2, "0");
  const pct =
    initialSeconds > 0 ? (Math.max(0, seconds) / initialSeconds) * 100 : 0;

  const handleToggle = () => {
    touchAudioCtx();
    setRunning((r) => !r);
  };

  const handleAdjust = (delta: number) => {
    touchAudioCtx();
    setSeconds((s) => Math.max(0, s + delta));
  };

  const handleReset = () => {
    touchAudioCtx();
    setSeconds(initialSeconds);
    setRunning(true);
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-brand-dark text-brand-paper rounded-2xl shadow-warm-lg px-6 py-4 flex items-center gap-4 min-w-[280px] max-w-[90vw]">
      {/* Progress ring */}
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="3"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#D4A843"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 24}
            strokeDashoffset={2 * Math.PI * 24 * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-accent-light">
          {seconds <= 0 ? "0:00" : `${mm}:${displaySs}`}
        </div>
      </div>

      {/* Label + time */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-widest text-brand-light-tan">
          Descanso
        </p>
        <p className="font-mono text-2xl font-bold text-accent-light tabular-nums">
          {displayMm}:{displaySs}
        </p>
      </div>

      {/* Play/Pause */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2.5 rounded-full bg-accent text-brand-dark hover:bg-accent-light"
        aria-label={running ? "Pausar" : "Reanudar"}
      >
        {running ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={handleReset}
        className="p-2 rounded-full hover:bg-white/10"
        aria-label="Reiniciar"
      >
        <RotateCcw size={14} />
      </button>

      {/* Test sound */}
      <button
        type="button"
        onClick={() => {
          touchAudioCtx();
          void playAlarm();
        }}
        className="p-2 rounded-full hover:bg-white/10 opacity-60 hover:opacity-100"
        aria-label="Probar sonido"
        title="Probar sonido"
      >
        <Volume2 size={14} />
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={onDismiss}
        className="p-2 rounded-full hover:bg-white/10"
        aria-label="Cerrar timer"
      >
        <X size={14} />
      </button>
    </div>
  );
}
