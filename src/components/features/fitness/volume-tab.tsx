'use client';

import React, { useMemo } from 'react';
import { cn } from '@/components/ui';
import { Card } from '@/components/ui';
import { BASE_WEEKLY_VOLUME } from './fitness-engine';

const VOLUME_DATA_BASE = [
  { group: 'Pecho',          mev: 8,  mav: 20, mrv: 22 },
  { group: 'Espalda',        mev: 8,  mav: 22, mrv: 25 },
  { group: 'Hombros',        mev: 6,  mav: 14, mrv: 18 },
  { group: 'Bíceps',         mev: 4,  mav: 10, mrv: 15 },
  { group: 'Tríceps',        mev: 4,  mav: 12, mrv: 16 },
  { group: 'Cuádriceps',     mev: 8,  mav: 18, mrv: 24 },
  { group: 'Isquiotibiales', mev: 6,  mav: 12, mrv: 18 },
  { group: 'Glúteos',        mev: 6,  mav: 14, mrv: 20 },
  { group: 'Core',           mev: 4,  mav: 8,  mrv: 10 },
  { group: 'Pantorrillas',   mev: 4,  mav: 10, mrv: 15 },
];

function getVolCls(vol: number, mav: number, mrv: number): string {
  if (vol > mrv) return 'text-danger';
  if (vol > mav) return 'text-warning';
  return 'text-success';
}

function getVolFill(vol: number, mav: number, mrv: number): string {
  if (vol > mrv) return 'fill-danger';
  if (vol > mav) return 'fill-warning';
  return 'fill-success';
}

function getStatusLabel(vol: number, mav: number, mrv: number): string {
  if (vol > mrv) return 'Exceso';
  if (vol > mav) return 'Alto';
  return 'Óptimo';
}

interface VolumeTabProps {
  sessionVolume: Record<string, number>;
}

export default function VolumeTab({ sessionVolume }: VolumeTabProps) {
  const volumeData = useMemo(() =>
    VOLUME_DATA_BASE.map(d => ({
      ...d,
      volume: Math.round(((BASE_WEEKLY_VOLUME[d.group] ?? 0) + (sessionVolume[d.group] ?? 0)) * 10) / 10,
    })),
  [sessionVolume]);

  return (
    <div className="flex flex-col gap-6">
      {/* Volume Bars */}
      <div className="flex flex-col gap-5">
        {volumeData.map((data) => {
          const maxVal = data.mrv * 1.2;
          const mevPct = (data.mev / maxVal) * 100;
          const mavPct = (data.mav / maxVal) * 100;
          const mrvPct = (data.mrv / maxVal) * 100;
          const volumePct = (data.volume / maxVal) * 100;

          return (
            <Card key={data.group} variant="default" padding="md" className="border-brand-light-tan">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-serif text-base text-brand-dark m-0">{data.group}</h4>
                  <p className="text-brand-warm text-xs mt-1 m-0">
                    {data.volume} sets • {getStatusLabel(data.volume, data.mav, data.mrv)}
                  </p>
                </div>
                <span className={cn('text-xl font-bold', getVolCls(data.volume, data.mav, data.mrv))}>
                  {data.volume}
                </span>
              </div>

              {/* SVG Volume Bar */}
              <svg width="100%" height="40" className="mb-2">
                {/* Background */}
                <rect x="0" y="10" width="100%" height="20" className="fill-brand-light-cream" rx="4" />
                {/* Volume bar */}
                <rect
                  x="0" y="10"
                  width={`${volumePct}%`} height="20"
                  className={getVolFill(data.volume, data.mav, data.mrv)}
                  rx="4"
                  opacity="0.8"
                />
                {/* MEV marker */}
                <rect x={`${mevPct}%`} y="0" width="2" height="40" className="fill-info" />
                {/* MAV marker */}
                <rect x={`${mavPct}%`} y="0" width="2" height="40" className="fill-warning" />
                {/* MRV marker */}
                <rect x={`${mrvPct}%`} y="0" width="2" height="40" className="fill-danger" />
              </svg>

              {/* Labels */}
              <div className="grid grid-cols-4 gap-2 text-[11px] text-brand-warm text-center">
                <div>MEV: {data.mev}</div>
                <div>MAV: {data.mav}</div>
                <div>MRV: {data.mrv}</div>
                <div>Actual: {data.volume}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card variant="default" padding="md" className="border-brand-light-tan flex gap-6 justify-center flex-wrap">
        {[
          { label: 'Óptimo',                   cls: 'bg-success' },
          { label: 'Alto (Acercándose a MRV)',  cls: 'bg-warning' },
          { label: 'Exceso (Sobre MRV)',        cls: 'bg-danger'  },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn('w-5 h-5 rounded-[4px]', cls)} />
            <span className="text-sm text-brand-dark">{label}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
