'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/components/ui';
import { Card } from '@/components/ui';
import { api } from '@/lib/api-client';

// ─── Tipos del endpoint /api/fitness/volume ──────────────────────────────────

interface MuscleVolumeRow {
  muscle: string;
  sets: number;
  effectiveSets: number;
  mv: number;
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrv: number;
  status: 'under' | 'mev' | 'mav' | 'mrv' | 'over';
}

interface VolumeResponse {
  days: number;
  since: string;
  totalWorkouts: number;
  muscles: MuscleVolumeRow[];
}

// ─── Helpers display ─────────────────────────────────────────────────────────

// El landmark "Hombros (lateral)" se muestra como "Hombros" en la UI.
function prettyMuscle(key: string): string {
  if (key === 'Hombros (lateral)') return 'Hombros';
  return key;
}

function statusLabel(status: MuscleVolumeRow['status']): string {
  switch (status) {
    case 'under':
      return 'Debajo de MV';
    case 'mev':
      return 'En MEV (mínimo)';
    case 'mav':
      return 'Óptimo';
    case 'mrv':
      return 'Alto (cerca de MRV)';
    case 'over':
      return 'Exceso (sobre MRV)';
  }
}

function statusFill(status: MuscleVolumeRow['status']): string {
  switch (status) {
    case 'under':
      return 'fill-brand-light-tan';
    case 'mev':
      return 'fill-info';
    case 'mav':
      return 'fill-success';
    case 'mrv':
      return 'fill-warning';
    case 'over':
      return 'fill-danger';
  }
}

function statusText(status: MuscleVolumeRow['status']): string {
  switch (status) {
    case 'under':
      return 'text-brand-warm';
    case 'mev':
      return 'text-info';
    case 'mav':
      return 'text-success';
    case 'mrv':
      return 'text-warning';
    case 'over':
      return 'text-danger';
  }
}

// ─── Componente ──────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { days: 7, label: '7 días' },
  { days: 14, label: '14 días' },
  { days: 28, label: '28 días' },
];

interface VolumeTabProps {
  /** Volumen opcional de la sesión activa (se suma al histórico) */
  sessionVolume?: Record<string, number>;
}

export default function VolumeTab({ sessionVolume = {} }: VolumeTabProps) {
  const [data, setData] = useState<VolumeResponse | null>(null);
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<VolumeResponse>(`/fitness/volume?days=${days}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo cargar el volumen.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="flex flex-col gap-6">
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-base text-brand-dark m-0">
              Volumen por grupo muscular
            </h3>
            <p className="text-brand-warm text-xs mt-1 m-0">
              Sets efectivos en los últimos {days} días · {data?.totalWorkouts ?? 0}{' '}
              entrenamiento{data?.totalWorkouts === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs transition',
                  days === opt.days
                    ? 'bg-accent text-white'
                    : 'bg-brand-cream text-brand-medium hover:bg-brand-light-tan',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center text-brand-warm text-sm">
          Cargando volumen real desde tu histórico…
        </Card>
      ) : error ? (
        <Card variant="default" padding="md" className="border-danger text-danger text-sm">
          {error}
        </Card>
      ) : !data || data.totalWorkouts === 0 ? (
        <Card variant="default" padding="md" className="border-brand-light-tan text-center">
          <p className="text-brand-dark font-semibold m-0 mb-1">
            Sin entrenamientos en los últimos {days} días
          </p>
          <p className="text-brand-warm text-xs m-0">
            Registra una sesión en <strong>Entrenamiento Activo</strong> y vuelve aquí
            — los sets efectivos se calculan automáticamente por grupo muscular.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {data.muscles.map((row) => {
            const extra = sessionVolume[row.muscle] ?? sessionVolume[prettyMuscle(row.muscle)] ?? 0;
            const total = row.sets + extra;
            const maxVal = Math.max(row.mrv * 1.25, total + 2);
            const mevPct = (row.mev / maxVal) * 100;
            const mavLowPct = (row.mavLow / maxVal) * 100;
            const mavHighPct = (row.mavHigh / maxVal) * 100;
            const mrvPct = (row.mrv / maxVal) * 100;
            const volumePct = (total / maxVal) * 100;
            return (
              <Card
                key={row.muscle}
                variant="default"
                padding="md"
                className="border-brand-light-tan"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-serif text-base text-brand-dark m-0">
                      {prettyMuscle(row.muscle)}
                    </h4>
                    <p className={cn('text-xs mt-1 m-0', statusText(row.status))}>
                      {total} sets · {statusLabel(row.status)}
                      {extra > 0 ? (
                        <span className="text-brand-warm"> (+{extra} sesión activa)</span>
                      ) : null}
                    </p>
                  </div>
                  <span className={cn('text-xl font-bold', statusText(row.status))}>
                    {total}
                  </span>
                </div>

                <svg width="100%" height="40" className="mb-2">
                  <rect x="0" y="10" width="100%" height="20" className="fill-brand-light-cream" rx="4" />
                  <rect
                    x="0"
                    y="10"
                    width={`${Math.min(100, volumePct)}%`}
                    height="20"
                    className={statusFill(row.status)}
                    rx="4"
                    opacity="0.85"
                  />
                  {/* Landmark markers */}
                  <line x1={`${mevPct}%`} x2={`${mevPct}%`} y1="4" y2="36" className="stroke-info" strokeWidth="2" />
                  <line x1={`${mavLowPct}%`} x2={`${mavLowPct}%`} y1="4" y2="36" className="stroke-success" strokeWidth="2" strokeDasharray="3,2" />
                  <line x1={`${mavHighPct}%`} x2={`${mavHighPct}%`} y1="4" y2="36" className="stroke-warning" strokeWidth="2" />
                  <line x1={`${mrvPct}%`} x2={`${mrvPct}%`} y1="4" y2="36" className="stroke-danger" strokeWidth="2" />
                </svg>

                <div className="grid grid-cols-4 gap-2 text-[11px] text-brand-warm text-center">
                  <div>MEV {row.mev}</div>
                  <div>MAV {row.mavLow}–{row.mavHigh}</div>
                  <div>MRV {row.mrv}</div>
                  <div>Efectivos {row.effectiveSets}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card
        variant="default"
        padding="md"
        className="border-brand-light-tan flex gap-5 justify-center flex-wrap"
      >
        {[
          { label: 'MEV · mínimo efectivo', cls: 'bg-info' },
          { label: 'MAV · óptimo', cls: 'bg-success' },
          { label: 'MRV · máximo recuperable', cls: 'bg-warning' },
          { label: 'Exceso', cls: 'bg-danger' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn('w-4 h-4 rounded-sm', cls)} />
            <span className="text-xs text-brand-dark">{label}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
