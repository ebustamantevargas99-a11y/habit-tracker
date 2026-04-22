'use client';
import { todayLocal } from "@/lib/date/local";

import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import { colors } from '@/lib/colors';

interface WeightTabProps {
  weightLog: { date: string; weight: number }[];
  onAddWeight: (entry: { date: string; weight: number }) => Promise<void>;
}

export default function WeightTab({ weightLog: storedLog, onAddWeight }: WeightTabProps) {
  const [goalWeight] = useState(72);
  const [newWeight, setNewWeight] = useState('');

  const displayLog = storedLog.length > 0
    ? storedLog.map((e, i) => ({ day: i + 1, weight: e.weight }))
    : Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        weight: 75.5 - i * 0.08 + Math.sin(i * 0.3) * 0.8,
      }));

  const currentWeight = displayLog[displayLog.length - 1]?.weight || 75;
  const weekAvg = displayLog.slice(-7).reduce((s, w) => s + w.weight, 0) / Math.min(displayLog.length, 7);
  const movingAvg = displayLog.map((entry, i) => {
    const slice = displayLog.slice(Math.max(0, i - 6), i + 1);
    return { day: entry.day, weight: entry.weight, avg: slice.reduce((s, w) => s + w.weight, 0) / slice.length };
  });
  const daysToGoal = Math.abs(currentWeight - goalWeight) > 0.1
    ? Math.round(Math.abs(currentWeight - goalWeight) / 0.08)
    : 0;

  const addWeight = () => {
    if (!newWeight) return;
    onAddWeight({ date: todayLocal(), weight: parseFloat(newWeight) }).catch(() => {});
    setNewWeight('');
  };

  const stats = [
    { label: 'Peso Actual',    value: `${currentWeight.toFixed(1)} kg`, colorClass: 'text-brand-dark'  },
    { label: 'Meta',           value: `${goalWeight} kg`,               colorClass: 'text-accent'       },
    { label: 'Promedio 7d',    value: `${weekAvg.toFixed(1)} kg`,       colorClass: 'text-info'         },
    { label: 'Días para Meta', value: `~${daysToGoal}`,                 colorClass: 'text-warning'      },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} variant="warm" padding="md" className="text-center border-brand-light-cream">
            <div className="text-[11px] text-brand-warm mb-1">{s.label}</div>
            <div className={`font-serif text-2xl font-bold ${s.colorClass}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Add weight entry */}
      <div className="flex gap-3 items-center">
        <input
          type="number" step="0.1" value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          placeholder="Peso de hoy (kg)"
          className="input w-[200px]"
        />
        <button onClick={addWeight} className="btn-primary px-5 py-2">
          Registrar
        </button>
      </div>

      {/* Trend Chart */}
      <Card variant="warm" padding="md" className="border-brand-light-cream">
        <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Tendencia de Peso (30 días)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={movingAvg}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: '8px' }} />
            <Line type="monotone" dataKey="weight" stroke={colors.tan} strokeWidth={1} dot={{ r: 2, fill: colors.tan }} name="Peso" />
            <Line type="monotone" dataKey="avg" stroke={colors.accent} strokeWidth={3} dot={false} name="Media 7d" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
