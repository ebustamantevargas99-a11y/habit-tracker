"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/stores/user-store";
import {
  formatDistance,
  formatDuration,
  formatPace,
  distanceUnitLabel,
  normalizeDistanceToKm,
  type UnitSystem,
} from "@/lib/fitness/units";
import { paceSecPerKm } from "@/lib/fitness/cardio";

const ACTIVITY_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: "run",        label: "Running",    emoji: "🏃" },
  { id: "bike",       label: "Bici",       emoji: "🚴" },
  { id: "swim",       label: "Natación",   emoji: "🏊" },
  { id: "row",        label: "Remo",       emoji: "🚣" },
  { id: "walk",       label: "Caminata",   emoji: "🚶" },
  { id: "elliptical", label: "Elíptica",   emoji: "🏋️" },
  { id: "hike",       label: "Senderismo", emoji: "🥾" },
  { id: "other",      label: "Otro",       emoji: "⚡" },
];

interface Shoe {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  retired: boolean;
}

export default function CardioSessionLogger({ onSaved }: { onSaved?: () => void }) {
  const { user } = useUserStore();
  const units = (user?.profile?.units as UnitSystem) ?? "metric";

  const [activityType, setActivityType] = useState("run");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [distanceInput, setDistanceInput] = useState<string>(""); // en la unit del user
  const [avgHr, setAvgHr] = useState<string>("");
  const [maxHr, setMaxHr] = useState<string>("");
  const [rpe, setRpe] = useState<string>("");
  const [elevation, setElevation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [shoeId, setShoeId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [shoes, setShoes] = useState<Shoe[]>([]);

  // Cargar shoes (solo running usará esto)
  useEffect(() => {
    if (activityType !== "run") return;
    api
      .get<Shoe[]>("/fitness/shoes")
      .then((list) => setShoes(list))
      .catch(() => setShoes([]));
  }, [activityType]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  function start() {
    if (elapsedSec === 0) setStartedAt(new Date());
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setElapsedSec(0);
    setStartedAt(null);
    setDistanceInput("");
    setAvgHr("");
    setMaxHr("");
    setRpe("");
    setElevation("");
    setNotes("");
    setShoeId("");
  }

  // Pace preview (si hay distancia + tiempo)
  const distanceKmPreview = useMemo(() => {
    const v = parseFloat(distanceInput);
    if (!Number.isFinite(v) || v <= 0) return null;
    return normalizeDistanceToKm(v, units);
  }, [distanceInput, units]);

  const pacePreview = useMemo(() => {
    if (!distanceKmPreview || elapsedSec <= 0) return null;
    return paceSecPerKm(distanceKmPreview, elapsedSec);
  }, [distanceKmPreview, elapsedSec]);

  async function finish() {
    if (elapsedSec < 10) {
      toast.error("La sesión es demasiado corta (<10 s)");
      return;
    }
    if (!startedAt) {
      toast.error("No se detectó el inicio");
      return;
    }
    setSubmitting(true);
    try {
      const endedAt = new Date(startedAt.getTime() + elapsedSec * 1000);
      const payload = {
        date: startedAt.toISOString().split("T")[0],
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        activityType,
        distanceKm: distanceKmPreview ?? null,
        durationSec: elapsedSec,
        avgPaceSecPerKm: pacePreview,
        avgHr: avgHr ? parseInt(avgHr, 10) : null,
        maxHr: maxHr ? parseInt(maxHr, 10) : null,
        elevationGainM: elevation ? parseFloat(elevation) : null,
        perceivedExertion: rpe ? parseInt(rpe, 10) : null,
        shoeId: shoeId || null,
        notes: notes.trim() || null,
      };
      await api.post("/fitness/cardio", payload);
      toast.success("Sesión guardada. +15 XP");
      reset();
      onSaved?.();
    } catch {
      toast.error("Error guardando la sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card variant="default" padding="md" className="border-brand-light-tan">
      <div className="flex flex-wrap gap-2 mb-4">
        {ACTIVITY_OPTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => setActivityType(a.id)}
            className={`px-3 py-1.5 rounded-full text-xs transition ${
              activityType === a.id
                ? "bg-accent text-white"
                : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            }`}
          >
            {a.emoji} {a.label}
          </button>
        ))}
      </div>

      <div className="text-center my-6">
        <div className="font-mono text-[56px] text-brand-dark tracking-tight leading-none">
          {formatDuration(elapsedSec, { forceHours: true })}
        </div>
        <p className="text-brand-warm text-xs mt-1">
          {running ? "Sesión en curso" : elapsedSec > 0 ? "Pausado" : "Presiona ▶ para empezar"}
        </p>
        {pacePreview != null && (
          <p className="text-accent text-sm mt-2 font-semibold">
            {formatPace(pacePreview, units)}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {!running ? (
          <button
            onClick={start}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-success text-white font-semibold hover:opacity-90 transition"
          >
            <Play size={16} /> {elapsedSec === 0 ? "Empezar" : "Reanudar"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-warning text-white font-semibold hover:opacity-90 transition"
          >
            <Pause size={16} /> Pausar
          </button>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-button bg-brand-cream text-brand-dark hover:bg-brand-light-tan transition"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Distancia ({distanceUnitLabel(units)})
          </label>
          <input
            type="number"
            step="0.01"
            value={distanceInput}
            onChange={(e) => setDistanceInput(e.target.value)}
            placeholder="0.00"
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            HR promedio (bpm)
          </label>
          <input
            type="number"
            value={avgHr}
            onChange={(e) => setAvgHr(e.target.value)}
            placeholder="—"
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            HR máx (bpm)
          </label>
          <input
            type="number"
            value={maxHr}
            onChange={(e) => setMaxHr(e.target.value)}
            placeholder="—"
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            Elevación (m)
          </label>
          <input
            type="number"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            placeholder="—"
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
            RPE (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            placeholder="—"
            className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
          />
        </div>
        {activityType === "run" && shoes.length > 0 && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Zapatilla
            </label>
            <select
              value={shoeId}
              onChange={(e) => setShoeId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            >
              <option value="">Ninguna</option>
              {shoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Sensaciones, ruta, clima…"
          className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm h-20"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={finish}
          disabled={submitting || elapsedSec < 10}
          className="px-6 py-2.5 rounded-button bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition"
        >
          {submitting ? "Guardando…" : "Terminar y guardar"}
        </button>
      </div>

      <div className="mt-4 text-xs text-brand-warm">
        <p className="m-0">
          <strong>Distancia</strong> {distanceKmPreview != null ? formatDistance(distanceKmPreview, units) : "—"} ·
          <strong> Duración</strong> {formatDuration(elapsedSec)} ·
          <strong> Pace</strong> {formatPace(pacePreview, units)}
        </p>
      </div>
    </Card>
  );
}
