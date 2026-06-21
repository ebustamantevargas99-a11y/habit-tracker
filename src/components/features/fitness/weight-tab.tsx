'use client';
import { todayLocal, parseLocalDateStr } from "@/lib/date/local";

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

const GOAL_KEY = 'fitness_weight_goal';

export default function WeightTab({ weightLog: storedLog, onAddWeight }: WeightTabProps) {
  const [newWeight, setNewWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [goalInput, setGoalInput] = useState('');

  // Meta de peso editable (persistida localmente — no existe campo en el perfil).
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(GOAL_KEY);
      if (saved) {
        setGoalWeight(parseFloat(saved));
        setGoalInput(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveGoal = () => {
    const v = parseFloat(goalInput);
    if (!isFinite(v) || v <= 0) {
      setGoalWeight(null);
      try { localStorage.removeItem(GOAL_KEY); } catch { /* ignore */ }
      return;
    }
    setGoalWeight(v);
    try { localStorage.setItem(GOAL_KEY, String(v)); } catch { /* ignore */ }
  };

  // Sólo datos reales — sin curva inventada cuando no hay registros.
  const sorted = [...storedLog].sort((a, b) => a.date.localeCompare(b.date));
  const hasData = sorted.length > 0;

  const movingAvg = sorted.map((entry, i) => {
    const slice = sorted.slice(Math.max(0, i - 6), i + 1);
    return {
      label: entry.date.slice(5),
      weight: entry.weight,
      avg: slice.reduce((s, w) => s + w.weight, 0) / slice.length,
    };
  });

  const currentWeight = hasData ? sorted[sorted.length - 1].weight : null;
  const last7 = sorted.slice(-7);
  const weekAvg = last7.length
    ? last7.reduce((s, w) => s + w.weight, 0) / last7.length
    : null;

  // Días para la meta: ritmo REAL (kg/día) entre primer y último registro,
  // sólo si nos estamos moviendo hacia la meta. Si no, "—".
  let daysToGoal: number | null = null;
  if (goalWeight != null && currentWeight != null && sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = Math.max(
      1,
      (parseLocalDateStr(last.date).getTime() - parseLocalDateStr(first.date).getTime()) / 86400000,
    );
    const pace = (last.weight - first.weight) / span; // kg/día con signo
    const remaining = goalWeight - currentWeight;
    if (Math.abs(remaining) > 0.1 && pace !== 0 && Math.sign(pace) === Math.sign(remaining)) {
      daysToGoal = Math.round(Math.abs(remaining) / Math.abs(pace));
    }
  }

  const addWeight = () => {
    if (!newWeight) return;
    onAddWeight({ date: todayLocal(), weight: parseFloat(newWeight) }).catch(() => {});
    setNewWeight('');
  };

  const stats = [
    { label: 'Peso Actual',    value: currentWeight != null ? `${currentWeight.toFixed(1)} kg` : '—', colorClass: 'text-brand-dark' },
    { label: 'Meta',           value: goalWeight != null ? `${goalWeight} kg` : '—',                  colorClass: 'text-accent'     },
    { label: 'Promedio 7d',    value: weekAvg != null ? `${weekAvg.toFixed(1)} kg` : '—',             colorClass: 'text-info'       },
    { label: 'Días para Meta', value: daysToGoal != null ? `~${daysToGoal}` : '—',                    colorClass: 'text-warning'    },
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

      {/* Add weight entry + goal */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="number" step="0.1" value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          placeholder="Peso de hoy (kg)"
          className="input w-[170px]"
        />
        <button onClick={addWeight} className="btn-primary px-5 py-2">
          Registrar
        </button>
        <div className="flex gap-2 items-center ml-auto">
          <input
            type="number" step="0.1" value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={saveGoal}
            placeholder="Meta (kg)"
            className="input w-[120px]"
          />
          <span className="text-xs text-brand-warm">tu meta</span>
        </div>
      </div>

      {/* Trend Chart */}
      <Card variant="warm" padding="md" className="border-brand-light-cream">
        <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Tendencia de Peso</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={movingAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: '8px' }} />
              <Line type="monotone" dataKey="weight" stroke={colors.tan} strokeWidth={1} dot={{ r: 2, fill: colors.tan }} name="Peso" />
              <Line type="monotone" dataKey="avg" stroke={colors.accent} strokeWidth={3} dot={false} name="Media 7d" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <p className="text-brand-dark font-semibold m-0">Aún no hay registros de peso</p>
            <p className="text-brand-warm text-xs m-0 mt-1">
              Registra tu peso de hoy y aquí verás tu tendencia real.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
