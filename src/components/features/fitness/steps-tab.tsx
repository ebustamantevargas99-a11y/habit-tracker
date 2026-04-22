'use client';
import { todayLocal } from "@/lib/date/local";

import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/components/ui';
import { Card } from '@/components/ui';
import { colors } from '@/lib/colors';

interface StepsTabProps {
  stepsLog: { date: string; steps: number }[];
  onAddSteps: (entry: { date: string; steps: number }) => Promise<void>;
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getHeatClass(steps: number, goal: number): string {
  if (steps >= goal)           return 'bg-success text-brand-paper';
  if (steps >= goal * 0.75)   return 'bg-accent-light text-brand-dark';
  if (steps >= goal * 0.5)    return 'bg-warning-light text-brand-dark';
  if (steps >= goal * 0.25)   return 'bg-brand-light-tan text-brand-dark';
  return 'bg-brand-light-cream text-brand-warm';
}

export default function StepsTab({ stepsLog: storedLog, onAddSteps }: StepsTabProps) {
  const [dailyGoal] = useState(10000);
  const [todaySteps, setTodaySteps] = useState(() => {
    const today = todayLocal();
    return storedLog.find((e) => e.date === today)?.steps ?? 0;
  });

  const handleStepsBlur = () => {
    if (todaySteps > 0) {
      onAddSteps({ date: todayLocal(), steps: todaySteps }).catch(() => {});
    }
  };

  const weekData = DAYS.map((day, i) => {
    const entry = storedLog[storedLog.length - 7 + i];
    return { day, steps: entry?.steps ?? 0 };
  });
  weekData[6] = { day: 'Dom', steps: todaySteps };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const monthGrid = React.useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      steps: Math.floor(Math.random() * 15000) + 2000,
    })),
  []);

  const weekAvg = Math.round(weekData.reduce((s, d) => s + d.steps, 0) / 7);
  const distance = (todaySteps * 0.0008).toFixed(1);
  const calories = Math.round(todaySteps * 0.04);
  const pct = Math.min(Math.round((todaySteps / dailyGoal) * 100), 100);

  const circumference = 2 * Math.PI * 60;
  const strokeOffset = circumference * (1 - pct / 100);

  const stats = [
    { label: 'Pasos Hoy',   value: todaySteps.toLocaleString(), colorClass: 'text-accent'   },
    { label: 'Distancia',   value: `${distance} km`,            colorClass: 'text-info'     },
    { label: 'Calorías',    value: `${calories} kcal`,          colorClass: 'text-warning'  },
    { label: 'Promedio 7d', value: weekAvg.toLocaleString(),    colorClass: 'text-success'  },
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

      {/* Progress Ring */}
      <Card variant="warm" padding="md" className="border-brand-light-cream flex items-center gap-8">
        <div className="relative w-[140px] h-[140px] shrink-0">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r="60" fill="none" className="stroke-brand-light-cream" strokeWidth="10" />
            <circle
              cx="70" cy="70" r="60" fill="none"
              className={cn(pct >= 100 ? 'stroke-success' : 'stroke-accent')}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
            />
          </svg>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="font-serif text-[28px] font-bold text-brand-dark">{pct}%</div>
            <div className="text-[10px] text-brand-warm">de meta</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex gap-3 items-center mb-3">
            <input
              type="number" value={todaySteps}
              onChange={(e) => setTodaySteps(parseInt(e.target.value) || 0)}
              onBlur={handleStepsBlur}
              className="input w-[140px]"
            />
            <span className="text-xs text-brand-warm">pasos hoy</span>
          </div>
          <div className="text-xs text-brand-warm">
            Meta: {dailyGoal.toLocaleString()} pasos · {pct >= 100 ? 'Meta cumplida!' : `Faltan ${(dailyGoal - todaySteps).toLocaleString()}`}
          </div>
        </div>
      </Card>

      {/* Weekly Bar Chart */}
      <Card variant="warm" padding="md" className="border-brand-light-cream">
        <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Pasos de la Semana</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: '8px' }} />
            <Bar dataKey="steps" name="Pasos" radius={[6, 6, 0, 0]}>
              {weekData.map((entry, i) => (
                <Cell key={i} fill={entry.steps >= dailyGoal ? colors.success : colors.accent} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Heatmap */}
      <Card variant="warm" padding="md" className="border-brand-light-cream">
        <h3 className="text-sm font-semibold text-brand-dark m-0 mb-4">Heatmap Mensual</h3>
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((d) => (
            <div
              key={d.day}
              title={`Día ${d.day}: ${d.steps.toLocaleString()} pasos`}
              className={cn(
                'aspect-square rounded-[4px] flex items-center justify-center text-[10px] font-semibold w-full',
                getHeatClass(d.steps, dailyGoal),
              )}
            >
              {d.day}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-3 mt-3 text-[10px] text-brand-warm flex-wrap">
          {[
            { label: '<25%',    cls: 'bg-brand-light-cream'  },
            { label: '25-50%',  cls: 'bg-brand-light-tan'    },
            { label: '50-75%',  cls: 'bg-warning-light'      },
            { label: '75-99%',  cls: 'bg-accent-light'       },
            { label: 'Meta!',   cls: 'bg-success'            },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded-[2px]', cls)} />
              {label}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
