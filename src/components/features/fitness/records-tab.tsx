'use client';

import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/components/ui';
import { Card } from '@/components/ui';
import { colors } from '@/lib/colors';
import { LivePR, TonelagePoint } from './fitness-engine';

interface RecordsTabProps {
  liveRecords: LivePR[];
  tonelageHistory: Record<string, TonelagePoint[]>;
}

export default function RecordsTab({ liveRecords, tonelageHistory }: RecordsTabProps) {
  const [selectedExercise, setSelectedExercise] = useState(liveRecords[0]?.exercise ?? '');
  const newPRsThisMonth = liveRecords.filter(r => r.isNewPR).length;
  const chartData = tonelageHistory[selectedExercise] ?? [];

  // Empty state — sin PRs registrados (user nuevo, o tras reset de datos).
  if (liveRecords.length === 0) {
    return (
      <div className="bg-brand-paper rounded-xl p-10 border border-brand-light-tan text-center">
        <div className="flex justify-center mb-3">
          <Trophy size={36} className="text-brand-tan" />
        </div>
        <h3 className="font-serif text-xl text-brand-dark m-0">
          Aún no tienes PRs registrados
        </h3>
        <p className="text-brand-warm text-sm m-0 mt-2 max-w-md mx-auto">
          Completa una sesión de <strong>Hoy</strong> con peso × reps y el sistema
          detecta automáticamente tu primer 1RM estimado (Epley / Helms).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Gold Banner */}
      <div className="bg-accent-glow border-2 border-accent rounded-xl p-5 text-center">
        <div className="flex justify-center mb-3">
          <Trophy size={32} className="text-accent" />
        </div>
        <h3 className="font-serif text-2xl text-brand-dark m-0">
          {newPRsThisMonth} PRs nuevos este mes
        </h3>
        <p className="text-brand-dark text-[13px] m-0 mt-2">¡Excelente progreso! Sigue así.</p>
      </div>

      {/* PR Table */}
      <Card variant="default" padding="none" className="border-brand-light-tan overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand-light-cream">
              {['Ejercicio', '1RM', '5RM', '10RM', 'Cambio Mensual'].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'px-4 py-3 font-serif text-brand-dark border-b border-brand-tan',
                    i === 0 ? 'text-left' : 'text-center',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liveRecords.map((pr, index) => {
              const monthChange = Math.round((pr.oneRM - pr.prevOneRM) * 10) / 10;
              return (
                <tr
                  key={index}
                  className={cn(
                    'border-b border-brand-light-cream',
                    pr.isNewPR ? 'bg-accent-glow' : index % 2 === 0 ? 'bg-brand-paper' : 'bg-brand-warm-white',
                  )}
                >
                  <td className="px-4 py-3 text-brand-dark font-semibold">
                    {pr.isNewPR && <span className="mr-1.5">🏆</span>}
                    {pr.exercise}
                  </td>
                  <td className={cn('px-4 py-3 text-center', pr.isNewPR ? 'text-accent' : 'text-brand-dark')}>
                    <span className="text-base font-bold">{pr.oneRM}kg</span>
                  </td>
                  <td className="px-4 py-3 text-center text-brand-dark">{pr.fiveRM}kg</td>
                  <td className="px-4 py-3 text-center text-brand-dark">{pr.tenRM}kg</td>
                  <td className={cn('px-4 py-3 text-center font-bold', monthChange >= 0 ? 'text-success' : 'text-danger')}>
                    {monthChange >= 0 ? '+' : ''}{monthChange}kg
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Tonelage Chart */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-base text-brand-dark m-0 mb-4">Historial de Tonelaje</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          {liveRecords.map((pr) => (
            <button
              key={pr.exercise}
              type="button"
              onClick={() => setSelectedExercise(pr.exercise)}
              className={cn(
                'px-3 py-1.5 rounded-[6px] text-xs cursor-pointer transition-all border-none',
                selectedExercise === pr.exercise
                  ? 'bg-accent text-brand-paper font-bold'
                  : 'bg-brand-light-cream text-brand-dark font-normal hover:bg-brand-cream',
              )}
            >
              {pr.exercise}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightTan} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: colors.warm }} />
            <YAxis tick={{ fontSize: 11, fill: colors.warm }} />
            <Tooltip
              contentStyle={{ backgroundColor: colors.paper, border: `1px solid ${colors.tan}`, borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Tonelaje']}
            />
            <Line
              type="monotone" dataKey="volume"
              stroke={colors.warning} strokeWidth={2}
              dot={{ fill: colors.accent, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: colors.accent }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
