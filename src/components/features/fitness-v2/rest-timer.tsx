"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, X, Plus, Minus } from "lucide-react";

type Props = {
  initialSeconds: number;
  onDone?: () => void;
  onDismiss?: () => void;
  autoStart?: boolean;
};

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

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      playBeep();
      vibrate();
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
  const pct = initialSeconds > 0 ? (Math.max(0, seconds) / initialSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-brand-dark text-brand-paper rounded-2xl shadow-warm-lg px-6 py-4 flex items-center gap-4 min-w-[280px] max-w-[90vw]">
      {/* Progress ring */}
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#D4A843"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 24}
            strokeDashoffset={(2 * Math.PI * 24) * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-accent-light">
          {seconds <= 0 ? "0:00" : `${mm}:${displaySs}`}
        </div>
      </div>

      {/* Label + controls */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-widest text-brand-light-tan">Descanso</p>
        <p className="font-mono text-2xl font-bold text-accent-light tabular-nums">
          {displayMm}:{displaySs}
        </p>
      </div>

      {/* Adjust buttons */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setSeconds((s) => s + 15)}
          className="p-1 rounded hover:bg-white/10"
          aria-label="Añadir 15s"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => setSeconds((s) => Math.max(0, s - 15))}
          className="p-1 rounded hover:bg-white/10"
          aria-label="Quitar 15s"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* Play/Pause */}
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        className="p-2.5 rounded-full bg-accent text-brand-dark hover:bg-accent-light"
        aria-label={running ? "Pausar" : "Reanudar"}
      >
        {running ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={() => {
          setSeconds(initialSeconds);
          setRunning(true);
        }}
        className="p-2 rounded-full hover:bg-white/10"
        aria-label="Reiniciar"
      >
        <RotateCcw size={14} />
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

function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // ignore
  }
}

function vibrate() {
  if (typeof navigator === "undefined") return;
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}
