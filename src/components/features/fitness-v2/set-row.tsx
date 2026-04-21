"use client";

import { Check, X, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type SetType =
  | "straight"
  | "warmup"
  | "dropset"
  | "restpause"
  | "myoreps"
  | "cluster"
  | "superset"
  | "amrap"
  | "failure";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
  isWarmup?: boolean;
  setType?: SetType;
  tempo?: string | null;
  groupId?: string | null;
};

// Etiqueta corta para el indicador de set type (columna #)
const SET_TYPE_BADGE: Record<SetType, { label: string; className: string }> = {
  straight:  { label: "",   className: "text-brand-warm" },
  warmup:    { label: "W",  className: "text-warning" },
  dropset:   { label: "D",  className: "text-info" },
  restpause: { label: "RP", className: "text-info" },
  myoreps:   { label: "M",  className: "text-info" },
  cluster:   { label: "C",  className: "text-info" },
  superset:  { label: "S",  className: "text-accent" },
  amrap:     { label: "∞",  className: "text-accent" },
  failure:   { label: "F",  className: "text-danger" },
};

const SET_TYPE_MENU: { value: SetType; label: string; hint: string }[] = [
  { value: "straight",  label: "Straight",    hint: "set normal" },
  { value: "warmup",    label: "Warmup",      hint: "no cuenta para volumen" },
  { value: "dropset",   label: "Dropset",     hint: "peso cae sin descanso" },
  { value: "restpause", label: "Rest-pause",  hint: "mini-sets con 15s descanso" },
  { value: "myoreps",   label: "Myo-reps",    hint: "activación + mini sets" },
  { value: "cluster",   label: "Cluster",     hint: "reps con 10-20s intra-set" },
  { value: "superset",  label: "Superset",    hint: "sin descanso con otro ej." },
  { value: "amrap",     label: "AMRAP",       hint: "tantas reps como puedas" },
  { value: "failure",   label: "Failure",     hint: "hasta el fallo total" },
];

type Props = {
  set: WorkoutSet;
  previousBest?: { weight: number; reps: number } | null;
  onChange: (patch: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onDelete: () => void;
};

export default function SetRow({
  set,
  previousBest,
  onChange,
  onComplete,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const beatPrevious =
    previousBest != null &&
    set.completed &&
    set.weight * set.reps > previousBest.weight * previousBest.reps;

  const effType: SetType = set.isWarmup ? "warmup" : set.setType ?? "straight";
  const badge = SET_TYPE_BADGE[effType];
  const isNonCountingSet = effType === "warmup";

  function setType(next: SetType) {
    onChange({
      setType: next,
      isWarmup: next === "warmup",
    });
    setMenuOpen(false);
  }

  return (
    <div
      className={`grid grid-cols-[28px_64px_1fr_1fr_1fr_28px_28px_28px] gap-1.5 items-center px-2 py-1.5 rounded-lg text-sm ${
        set.completed
          ? isNonCountingSet
            ? "bg-warning-light/30"
            : "bg-success-light/40"
          : "hover:bg-brand-cream/50"
      }`}
    >
      {/* Set number / badge */}
      <div
        className={`text-center font-bold text-xs ${badge.className}`}
        title={
          effType === "straight" ? `Serie ${set.setNumber}` : SET_TYPE_MENU.find((m) => m.value === effType)?.label
        }
      >
        {badge.label || set.setNumber}
      </div>

      {/* Previous best */}
      <div className="text-xs text-brand-warm text-center truncate">
        {previousBest ? `${previousBest.weight}×${previousBest.reps}` : "—"}
      </div>

      {/* Weight */}
      <input
        type="number"
        step="0.5"
        value={set.weight || ""}
        onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
        placeholder="kg"
        className="w-full px-2 py-1.5 rounded border border-brand-cream text-center text-brand-dark text-sm bg-brand-paper focus:outline-none focus:border-accent"
      />

      {/* Reps */}
      <input
        type="number"
        value={set.reps || ""}
        onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
        placeholder="reps"
        className="w-full px-2 py-1.5 rounded border border-brand-cream text-center text-brand-dark text-sm bg-brand-paper focus:outline-none focus:border-accent"
      />

      {/* RPE */}
      <input
        type="number"
        step="0.5"
        min="1"
        max="10"
        value={set.rpe ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange({ rpe: v === "" ? null : parseFloat(v) });
        }}
        placeholder="RPE"
        className="w-full px-2 py-1.5 rounded border border-brand-cream text-center text-brand-dark text-sm bg-brand-paper focus:outline-none focus:border-accent"
        title={
          set.rpe != null
            ? `RPE ${set.rpe} → RIR ${Math.round((10 - set.rpe) * 10) / 10}`
            : "Rate of Perceived Exertion (0-10)"
        }
      />

      {/* Complete checkbox */}
      <button
        type="button"
        onClick={onComplete}
        aria-label={set.completed ? "Marcar incompleto" : "Completar serie"}
        className={`relative w-7 h-7 rounded-md flex items-center justify-center transition ${
          set.completed
            ? isNonCountingSet
              ? "bg-warning text-white"
              : "bg-success text-white"
            : "border-2 border-brand-tan hover:bg-brand-cream"
        }`}
      >
        {set.completed && <Check size={14} />}
        {beatPrevious && (
          <span className="absolute text-[9px] -mt-6 ml-6 bg-warning text-white px-1 rounded font-bold">
            PR
          </span>
        )}
      </button>

      {/* More menu (set type + tempo) */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Tipo de serie"
          className="w-7 h-7 rounded-md flex items-center justify-center text-brand-warm hover:bg-brand-cream transition"
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div className="absolute top-full right-0 mt-1 z-20 bg-brand-paper rounded-lg border border-brand-tan shadow-warm w-64 py-1.5 text-xs">
            <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Tipo de serie
            </div>
            <div className="max-h-56 overflow-y-auto">
              {SET_TYPE_MENU.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`w-full px-3 py-1.5 text-left hover:bg-brand-cream flex justify-between items-center gap-2 ${
                    effType === opt.value ? "bg-brand-cream font-semibold" : ""
                  }`}
                >
                  <span className="text-brand-dark">{opt.label}</span>
                  <span className="text-[10px] text-brand-warm">{opt.hint}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-brand-tan mt-1 px-3 pt-2 pb-1">
              <label className="block text-[10px] uppercase tracking-widest text-brand-warm font-semibold mb-1">
                Tempo (ecc-pause-con-pause)
              </label>
              <input
                type="text"
                value={set.tempo ?? ""}
                onChange={(e) =>
                  onChange({ tempo: e.target.value.trim() || null })
                }
                placeholder="3-1-1-2"
                className="w-full px-2 py-1 rounded border border-brand-cream text-xs bg-brand-warm-white focus:outline-none focus:border-accent"
              />
              <p className="text-[10px] text-brand-warm mt-1">
                Formato: eccentric-pause-concentric-pause en segundos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar serie"
        className="w-7 h-7 rounded-md flex items-center justify-center text-brand-warm hover:bg-danger-light hover:text-danger transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}
