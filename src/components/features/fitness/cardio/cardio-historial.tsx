"use client";

import React, { useEffect, useState } from "react";
import { Card, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/stores/user-store";
import {
  formatDistance,
  formatDuration,
  formatPace,
  type UnitSystem,
} from "@/lib/fitness/units";
import { detectNegativeSplit, type SplitRow } from "@/lib/fitness/cardio";

interface CardioSessionRow {
  id: string;
  date: string;
  startedAt: string;
  endedAt: string | null;
  activityType: string;
  distanceKm: number | null;
  durationSec: number;
  avgPaceSecPerKm: number | null;
  avgHr: number | null;
  maxHr: number | null;
  elevationGainM: number | null;
  caloriesBurned: number | null;
  perceivedExertion: number | null;
  splits: SplitRow[] | null;
  shoe: { id: string; name: string; brand: string | null; model: string | null } | null;
  notes: string | null;
}

const ACTIVITY_EMOJI: Record<string, string> = {
  run: "🏃",
  bike: "🚴",
  swim: "🏊",
  row: "🚣",
  walk: "🚶",
  elliptical: "🏋️",
  hike: "🥾",
  other: "⚡",
};

export default function CardioHistorial({ reloadKey = 0 }: { reloadKey?: number }) {
  const { user } = useUserStore();
  const units = (user?.profile?.units as UnitSystem) ?? "metric";

  const [sessions, setSessions] = useState<CardioSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<CardioSessionRow[]>(`/fitness/cardio?days=180`)
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el historial.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
        Cargando historial…
      </Card>
    );
  }
  if (error) {
    return (
      <Card variant="default" padding="md" className="border-danger text-danger text-sm">
        {error}
      </Card>
    );
  }
  if (sessions.length === 0) {
    return (
      <Card variant="default" padding="md" className="border-brand-light-tan text-center">
        <p className="text-brand-dark font-semibold m-0">Sin sesiones todavía</p>
        <p className="text-brand-warm text-xs mt-1 m-0">
          Registra tu primera sesión en <strong>Sesión activa</strong>.
        </p>
      </Card>
    );
  }

  // Summary últimos 7 / 30 días
  const now = Date.now();
  const last7 = sessions.filter(
    (s) => now - new Date(s.startedAt).getTime() < 7 * 86400 * 1000,
  );
  const last30 = sessions.filter(
    (s) => now - new Date(s.startedAt).getTime() < 30 * 86400 * 1000,
  );
  const totalKm = (arr: CardioSessionRow[]) =>
    arr.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
  const totalSec = (arr: CardioSessionRow[]) =>
    arr.reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-base text-brand-dark m-0 mb-3">
          Resumen
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
              Sesiones 7d
            </p>
            <p className="font-mono text-2xl text-brand-dark m-0">{last7.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
              Distancia 7d
            </p>
            <p className="font-mono text-2xl text-brand-dark m-0">
              {formatDistance(totalKm(last7), units)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
              Sesiones 30d
            </p>
            <p className="font-mono text-2xl text-brand-dark m-0">{last30.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-warm font-semibold m-0">
              Tiempo 30d
            </p>
            <p className="font-mono text-2xl text-brand-dark m-0">
              {formatDuration(totalSec(last30), { forceHours: true })}
            </p>
          </div>
        </div>
      </Card>

      {sessions.map((s) => {
        const isNeg =
          s.splits && Array.isArray(s.splits) && detectNegativeSplit(s.splits);
        return (
          <Card key={s.id} variant="default" padding="md" className="border-brand-light-tan">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-2xl">{ACTIVITY_EMOJI[s.activityType] ?? "⚡"}</div>
                <div className="min-w-0">
                  <p className="font-serif text-base text-brand-dark m-0 truncate">
                    {s.activityType.charAt(0).toUpperCase() + s.activityType.slice(1)}
                    {s.shoe ? (
                      <span className="text-brand-warm text-xs ml-2">
                        · 👟 {s.shoe.name}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-brand-warm text-xs m-0">
                    {s.date} · {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isNeg ? (
                      <span className="ml-2 text-success font-semibold">⚡ Negative split</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-warm m-0">
                    Distancia
                  </p>
                  <p className="font-mono text-sm text-brand-dark m-0">
                    {formatDistance(s.distanceKm, units)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-warm m-0">
                    Tiempo
                  </p>
                  <p className="font-mono text-sm text-brand-dark m-0">
                    {formatDuration(s.durationSec, { forceHours: s.durationSec >= 3600 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-warm m-0">
                    Pace
                  </p>
                  <p className={cn("font-mono text-sm m-0", s.avgPaceSecPerKm ? "text-accent" : "text-brand-warm")}>
                    {formatPace(s.avgPaceSecPerKm, units)}
                  </p>
                </div>
              </div>
            </div>
            {(s.avgHr != null || s.elevationGainM != null || s.caloriesBurned != null || s.perceivedExertion != null) && (
              <div className="mt-2 pt-2 border-t border-brand-light-cream flex flex-wrap gap-4 text-xs text-brand-warm">
                {s.avgHr != null && <span>❤️ {s.avgHr} bpm avg</span>}
                {s.maxHr != null && <span>💥 {s.maxHr} bpm max</span>}
                {s.elevationGainM != null && <span>⛰️ +{Math.round(s.elevationGainM)} m</span>}
                {s.caloriesBurned != null && <span>🔥 {Math.round(s.caloriesBurned)} kcal</span>}
                {s.perceivedExertion != null && <span>💪 RPE {s.perceivedExertion}</span>}
              </div>
            )}
            {s.notes && (
              <p className="mt-2 text-xs text-brand-warm italic m-0">{s.notes}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
