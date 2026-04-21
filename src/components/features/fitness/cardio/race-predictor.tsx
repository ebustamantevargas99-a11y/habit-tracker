"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { useUserStore } from "@/stores/user-store";
import {
  predictClassicRaces,
  estimateVo2MaxFromRace,
  classifyVo2Max,
  CLASSIC_RACES,
  type ClassicRace,
} from "@/lib/fitness/cardio";
import { formatDuration, formatPace, normalizeDistanceToKm, type UnitSystem } from "@/lib/fitness/units";
import { paceSecPerKm } from "@/lib/fitness/cardio";

function currentAgeFromBirthDate(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

const PRESETS: { race: ClassicRace; label: string }[] = [
  { race: "5k", label: "5K" },
  { race: "10k", label: "10K" },
  { race: "half", label: "Media maratón" },
  { race: "marathon", label: "Maratón" },
];

const VO2_LABEL: Record<string, { label: string; className: string }> = {
  excellent: { label: "Excelente",   className: "text-success" },
  good:      { label: "Bueno",       className: "text-info" },
  average:   { label: "Promedio",    className: "text-brand-dark" },
  fair:      { label: "Aceptable",   className: "text-warning" },
  poor:      { label: "Mejorable",   className: "text-danger" },
};

export default function RacePredictor() {
  const { user } = useUserStore();
  const units = (user?.profile?.units as UnitSystem) ?? "metric";
  const inferredAge = currentAgeFromBirthDate(user?.profile?.birthDate ?? null) ?? 30;
  const sex: "male" | "female" =
    user?.profile?.biologicalSex === "female" ? "female" : "male";

  const [knownRace, setKnownRace] = useState<ClassicRace | "custom">("5k");
  const [customDistance, setCustomDistance] = useState<string>("");
  const [hrs, setHrs] = useState<string>("0");
  const [mins, setMins] = useState<string>("25");
  const [secs, setSecs] = useState<string>("0");

  const knownDistanceKm =
    knownRace === "custom"
      ? normalizeDistanceToKm(parseFloat(customDistance) || 0, units)
      : CLASSIC_RACES[knownRace];

  const knownTimeSec = useMemo(() => {
    const h = parseInt(hrs, 10) || 0;
    const m = parseInt(mins, 10) || 0;
    const s = parseInt(secs, 10) || 0;
    return h * 3600 + m * 60 + s;
  }, [hrs, mins, secs]);

  const predictions = useMemo(() => {
    if (knownDistanceKm <= 0 || knownTimeSec <= 0) return null;
    return predictClassicRaces(knownDistanceKm, knownTimeSec);
  }, [knownDistanceKm, knownTimeSec]);

  const vo2max = useMemo(() => {
    if (knownDistanceKm <= 0 || knownTimeSec <= 0) return null;
    return estimateVo2MaxFromRace(knownDistanceKm, knownTimeSec);
  }, [knownDistanceKm, knownTimeSec]);

  const vo2classification = vo2max != null
    ? classifyVo2Max(vo2max, inferredAge, sex)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
          Tu mejor tiempo conocido
        </h3>
        <p className="text-brand-warm text-xs m-0 mb-4">
          Ingresa cualquier distancia y tiempo que hayas corrido bien.
          Usamos la fórmula de Riegel (1981) con exponente 1.06 y estimamos
          tu VO₂max con Daniels & Gilbert.
        </p>

        <div className="flex gap-2 flex-wrap mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.race}
              onClick={() => setKnownRace(p.race)}
              className={`px-3 py-1.5 rounded-full text-xs transition ${
                knownRace === p.race
                  ? "bg-accent text-white"
                  : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setKnownRace("custom")}
            className={`px-3 py-1.5 rounded-full text-xs transition ${
              knownRace === "custom"
                ? "bg-accent text-white"
                : "bg-brand-cream text-brand-medium hover:bg-brand-light-tan"
            }`}
          >
            Otra distancia
          </button>
        </div>

        {knownRace === "custom" && (
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Distancia personalizada ({units === "imperial" ? "mi" : "km"})
            </label>
            <input
              type="number"
              step="0.1"
              value={customDistance}
              onChange={(e) => setCustomDistance(e.target.value)}
              placeholder="12.0"
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            />
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Horas
            </label>
            <input
              type="number"
              value={hrs}
              onChange={(e) => setHrs(e.target.value)}
              min="0"
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm text-center"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Min
            </label>
            <input
              type="number"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              min="0"
              max="59"
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm text-center"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Seg
            </label>
            <input
              type="number"
              value={secs}
              onChange={(e) => setSecs(e.target.value)}
              min="0"
              max="59"
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm text-center"
            />
          </div>
        </div>
      </Card>

      {predictions && knownTimeSec > 0 && knownDistanceKm > 0 && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <h3 className="font-serif text-lg text-brand-dark m-0 mb-3">
            Predicciones (Riegel)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(CLASSIC_RACES) as ClassicRace[]).map((race) => {
              const seconds = predictions[race];
              const pace = paceSecPerKm(CLASSIC_RACES[race], seconds);
              return (
                <div
                  key={race}
                  className="bg-brand-warm-white rounded-lg p-3 border border-brand-light-cream"
                >
                  <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
                    {race.toUpperCase()}
                  </p>
                  <p className="font-mono text-2xl text-brand-dark m-0 mt-1">
                    {formatDuration(seconds, { forceHours: seconds >= 3600 })}
                  </p>
                  <p className="text-xs text-brand-warm m-0 mt-0.5">
                    pace {formatPace(pace, units)}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-brand-warm mt-3 m-0">
            La precisión cae fuera del rango 5K–42K. Para tiempos de media o más
            considera que la fatiga acumula más rápido de lo que Riegel predice.
          </p>
        </Card>
      )}

      {vo2max != null && vo2classification && (
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-serif text-lg text-brand-dark m-0">
                VO₂max estimado
              </h3>
              <p className="text-brand-warm text-xs m-0 mt-0.5">
                Fórmula Daniels & Gilbert. Categoría ajustada a tu edad ({inferredAge}) y sexo.
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl text-accent m-0">
                {vo2max.toFixed(1)}
              </p>
              <p className="text-xs text-brand-warm m-0">ml/kg/min</p>
              <p className={`text-sm font-semibold m-0 mt-1 ${VO2_LABEL[vo2classification].className}`}>
                {VO2_LABEL[vo2classification].label}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
