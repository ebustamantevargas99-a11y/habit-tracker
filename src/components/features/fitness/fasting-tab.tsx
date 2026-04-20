'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/components/ui';
import { useFitnessExtendedStore } from '@/stores/fitness-extended-store';

const PROTOCOLS = [
  { id: '16/8',  fastHours: 16, eatHours: 8,  label: '16/8 — Estándar'    },
  { id: '18/6',  fastHours: 18, eatHours: 6,  label: '18/6 — Intermedio'  },
  { id: '20/4',  fastHours: 20, eatHours: 4,  label: '20/4 — Guerrero'    },
  { id: 'OMAD',  fastHours: 23, eatHours: 1,  label: 'OMAD — Una comida'  },
] as const;

const ZONES = [
  { start: 0,  end: 4,  label: 'Digestión',       bgClass: 'bg-brand-light-tan',    desc: 'El cuerpo procesa la última comida'   },
  { start: 4,  end: 8,  label: 'Quema de grasa',  bgClass: 'bg-warning-light',      desc: 'Se agotan reservas de glucógeno'      },
  { start: 8,  end: 12, label: 'Autofagia',        bgClass: 'bg-accent-glow',        desc: 'Reciclaje celular activado'           },
  { start: 12, end: 16, label: 'Ketosis',          bgClass: 'bg-accent-light',       desc: 'Producción de cuerpos cetónicos'      },
  { start: 16, end: 24, label: 'Reparación celular', bgClass: 'bg-success-light',   desc: 'Regeneración profunda'                },
];

export default function FastingTab() {
  const { fastingLogs, startFast, completeFast, initialize } = useFitnessExtendedStore();
  useEffect(() => { initialize(); }, [initialize]);

  const [selectedProtocol, setSelectedProtocol] = useState<typeof PROTOCOLS[number]>(PROTOCOLS[0]);
  const [isFasting, setIsFasting] = useState(false);
  const [activeFastId, setActiveFastId] = useState<string | null>(null);
  const [elapsedHours, setElapsedHours] = useState(0);

  const fastingHistory = fastingLogs.map((f) => {
    const start = new Date(f.startTime);
    const end = f.endTime ? new Date(f.endTime) : null;
    const duration = end ? Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) / 10 : 0;
    const targetH = f.targetHours;
    const protocol = targetH >= 23 ? 'OMAD' : targetH >= 20 ? '20/4' : targetH >= 18 ? '18/6' : '16/8';
    return { date: start.toISOString().split('T')[0], protocol, duration, completed: f.completed };
  });

  const handleToggleFast = () => {
    if (isFasting) {
      if (activeFastId) {
        completeFast(activeFastId, elapsedHours >= selectedProtocol.fastHours);
        setActiveFastId(null);
      }
      setIsFasting(false);
    } else {
      startFast(selectedProtocol.fastHours).then((log) => {
        setActiveFastId(log.id);
        setElapsedHours(0);
        setIsFasting(true);
      });
    }
  };

  const progress = Math.min((elapsedHours / selectedProtocol.fastHours) * 100, 100);
  const currentZone = ZONES.find((z) => elapsedHours >= z.start && elapsedHours < z.end) ?? ZONES[ZONES.length - 1];
  const circumference = 2 * Math.PI * 70;
  const strokeOffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Protocol Selector */}
      <div className="flex gap-3">
        {PROTOCOLS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedProtocol(p)}
            className={cn(
              'flex-1 p-3 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-all',
              selectedProtocol.id === p.id
                ? 'bg-accent text-brand-paper border-accent'
                : 'bg-brand-warm-white text-brand-dark border-brand-light-cream hover:bg-brand-cream',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer + Zones */}
      <div className="grid grid-cols-2 gap-5">
        {/* Timer */}
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-8 text-center">
          <div className="relative w-[180px] h-[180px] mx-auto mb-5">
            <svg width="180" height="180" className="-rotate-90">
              <circle cx="90" cy="90" r="70" fill="none" className="stroke-brand-light-cream" strokeWidth="10" />
              <circle
                cx="90" cy="90" r="70" fill="none"
                className={cn(progress >= 100 ? 'stroke-success' : 'stroke-accent')}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="font-serif text-[36px] font-bold text-brand-dark">
                {Math.floor(elapsedHours)}:{String(Math.round((elapsedHours % 1) * 60)).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-brand-warm">de {selectedProtocol.fastHours}h</div>
            </div>
          </div>

          <div className="text-sm font-semibold text-brand-dark mb-2">Zona: {currentZone.label}</div>
          <div className="text-xs text-brand-warm mb-5">{currentZone.desc}</div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleToggleFast}
              className={cn(
                'px-6 py-2.5 rounded-lg text-brand-paper text-[13px] font-semibold border-none cursor-pointer',
                isFasting ? 'bg-danger' : 'bg-success',
              )}
            >
              {isFasting ? 'Detener Ayuno' : 'Iniciar Ayuno'}
            </button>
          </div>

          <div className="mt-4">
            <input
              type="range" min="0" max="24" step="0.5" value={elapsedHours}
              onChange={(e) => setElapsedHours(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-[10px] text-brand-warm">Simular tiempo transcurrido</div>
          </div>
        </div>

        {/* Zones */}
        <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
          <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Zonas de Beneficio</h3>
          <div className="flex flex-col gap-2">
            {ZONES.map((zone) => {
              const inZone = elapsedHours >= zone.start;
              const isCurrent = elapsedHours >= zone.start && elapsedHours < zone.end;
              return (
                <div
                  key={zone.label}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all',
                    inZone ? zone.bgClass : 'bg-brand-light-cream',
                    inZone ? 'opacity-100' : 'opacity-50',
                  )}
                >
                  <div className="w-10 text-[11px] font-semibold text-brand-dark shrink-0">
                    {zone.start}-{zone.end}h
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-brand-dark">{zone.label}</div>
                    <div className="text-[11px] text-brand-warm">{zone.desc}</div>
                  </div>
                  {isCurrent && (
                    <div className="text-[10px] font-bold text-accent bg-accent-glow px-2 py-0.5 rounded-lg">
                      ACTUAL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-brand-warm-white border border-brand-light-cream rounded-xl p-5">
        <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Historial de Ayunos</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Fecha', 'Protocolo', 'Duración', 'Estado'].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'px-3 py-2 text-[11px] font-semibold text-brand-warm border-b-2 border-brand-tan',
                    i < 2 ? 'text-left' : 'text-center',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fastingHistory.map((h, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-[13px] text-brand-dark border-b border-brand-light-cream">{h.date}</td>
                <td className="px-3 py-2 text-[13px] text-brand-warm border-b border-brand-light-cream">{h.protocol}</td>
                <td className="px-3 py-2 text-[13px] text-center font-semibold text-brand-dark border-b border-brand-light-cream">{h.duration}h</td>
                <td className="px-3 py-2 text-center border-b border-brand-light-cream">
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-xl text-[11px] font-semibold',
                    h.completed ? 'bg-success-light text-success' : 'bg-danger-light text-danger',
                  )}>
                    {h.completed ? 'Completado' : 'Parcial'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
