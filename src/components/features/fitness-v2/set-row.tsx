"use client";

import { Check, X } from "lucide-react";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
  isWarmup?: boolean;
};

type Props = {
  set: WorkoutSet;
  previousBest?: { weight: number; reps: number } | null;
  onChange: (patch: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onDelete: () => void;
};

export default function SetRow({ set, previousBest, onChange, onComplete, onDelete }: Props) {
  const beatPrevious =
    previousBest != null &&
    set.completed &&
    set.weight * set.reps > previousBest.weight * previousBest.reps;

  return (
    <div
      className={`grid grid-cols-[32px_80px_1fr_1fr_1fr_32px_32px] gap-2 items-center px-2 py-1.5 rounded-lg text-sm ${
        set.completed ? "bg-success-light/40" : "hover:bg-brand-cream/50"
      }`}
    >
      {/* Set number */}
      <div
        className={`text-center font-bold text-xs ${
          set.isWarmup ? "text-warning" : "text-brand-warm"
        }`}
      >
        {set.isWarmup ? "W" : set.setNumber}
      </div>

      {/* Previous best reference */}
      <div className="text-xs text-brand-warm text-center">
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
      />

      {/* Complete checkbox */}
      <button
        type="button"
        onClick={onComplete}
        aria-label={set.completed ? "Marcar incompleto" : "Completar serie"}
        className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
          set.completed
            ? "bg-success text-white"
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
