"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, cn } from "@/components/ui";
import { useUserStore } from "@/stores/user-store";
import { karvonenZones, tanakaMaxHr } from "@/lib/fitness/cardio";

const ZONE_COLOR: Record<number, string> = {
  1: "bg-info/60",
  2: "bg-success/70",
  3: "bg-warning/70",
  4: "bg-accent/80",
  5: "bg-danger/70",
};

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

export default function ZonesCalculator() {
  const { user } = useUserStore();
  const inferredAge = currentAgeFromBirthDate(user?.profile?.birthDate ?? null);

  const [ageInput, setAgeInput] = useState<string>(
    inferredAge != null ? String(inferredAge) : "30",
  );
  const [restingInput, setRestingInput] = useState<string>("60");
  const [maxOverrideInput, setMaxOverrideInput] = useState<string>("");

  useEffect(() => {
    if (inferredAge != null) setAgeInput(String(inferredAge));
  }, [inferredAge]);

  const age = Math.max(10, Math.min(100, parseInt(ageInput, 10) || 0));
  const rest = Math.max(30, Math.min(120, parseInt(restingInput, 10) || 0));
  const maxOverride = maxOverrideInput ? parseInt(maxOverrideInput, 10) : null;

  const maxHr = maxOverride ?? tanakaMaxHr(age);

  const zones = useMemo(() => {
    try {
      return karvonenZones(age, rest, maxOverride ? { maxHr: maxOverride } : {});
    } catch {
      return [];
    }
  }, [age, rest, maxOverride]);

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-lg text-brand-dark m-0 mb-1">
          Tus zonas cardíacas
        </h3>
        <p className="text-brand-warm text-xs m-0 mb-4">
          Calculado con el método Karvonen (Heart Rate Reserve). Ingresa tu
          FC en reposo por la mañana antes de levantarte para mejor precisión.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              Edad
            </label>
            <input
              type="number"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              HR en reposo (bpm)
            </label>
            <input
              type="number"
              value={restingInput}
              onChange={(e) => setRestingInput(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold">
              HR máx medida (opcional)
            </label>
            <input
              type="number"
              value={maxOverrideInput}
              onChange={(e) => setMaxOverrideInput(e.target.value)}
              placeholder={`Tanaka: ${tanakaMaxHr(age)}`}
              className="w-full mt-1 px-3 py-2 rounded border border-brand-cream bg-brand-paper text-sm"
            />
          </div>
        </div>

        <p className="text-[11px] text-brand-warm mt-3 m-0">
          <strong>HR máx estimada:</strong> {maxHr} bpm
          {maxOverride ? " (override)" : " (Tanaka 2001)"} ·{" "}
          <strong>HR reserva:</strong> {maxHr - rest} bpm
        </p>
      </Card>

      <div className="flex flex-col gap-2">
        {zones.map((z) => (
          <Card
            key={z.zone}
            variant="default"
            padding="md"
            className="border-brand-light-tan"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className={cn("rounded-full w-10 h-10 flex items-center justify-center text-white font-bold", ZONE_COLOR[z.zone])}>
                {z.zone}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-base text-brand-dark m-0">
                  Z{z.zone} — {z.name}
                </h4>
                <p className="text-brand-warm text-xs mt-0.5 m-0">{z.purpose}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg text-brand-dark m-0">
                  {z.minBpm}–{z.maxBpm} <span className="text-xs text-brand-warm">bpm</span>
                </p>
                <p className="text-[11px] text-brand-warm m-0">
                  {Math.round(z.minPctHrr * 100)}–{Math.round(z.maxPctHrr * 100)}% HRR
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
