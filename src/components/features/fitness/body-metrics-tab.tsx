'use client';

import React, { useState } from 'react';
import {
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import { colors } from '@/lib/colors';

export interface BodyMetricEntry {
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  armLeft?: number;
  armRight?: number;
  thighLeft?: number;
  thighRight?: number;
}

interface BodyMetricsTabProps {
  onSave: (metric: BodyMetricEntry) => Promise<void>;
}

const MEASUREMENT_LABELS: Record<string, string> = {
  chest: 'Pecho',
  waist: 'Cintura',
  arms: 'Brazos',
  thighs: 'Muslos',
  calves: 'Pantorrillas',
};

export default function BodyMetricsTab({ onSave }: BodyMetricsTabProps) {
  const [weight, setWeight] = useState(75);
  const [bodyFat, setBodyFat] = useState(18);
  const [height] = useState(1.75);
  const [measurements, setMeasurements] = useState({
    chest: 100, waist: 80, arms: 35, thighs: 55, calves: 38,
  });

  const [weightTrend] = useState([
    { date: 'Day 1', weight: 78 },
    { date: 'Day 5', weight: 77 },
    { date: 'Day 10', weight: 76.5 },
    { date: 'Day 15', weight: 76 },
    { date: 'Day 20', weight: 75.5 },
    { date: 'Day 25', weight: 75 },
    { date: 'Day 30', weight: 74.5 },
  ]);

  const bmi = parseFloat((weight / (height * height)).toFixed(1));
  const bmr = Math.round(88.362 + 13.397 * weight + 4.799 * height * 100 - 5.677 * 30);

  const radarData = [
    { metric: 'Pecho',        value: measurements.chest,  fullMark: 120 },
    { metric: 'Cintura',      value: measurements.waist,  fullMark: 100 },
    { metric: 'Brazos',       value: measurements.arms,   fullMark: 50  },
    { metric: 'Muslos',       value: measurements.thighs, fullMark: 70  },
    { metric: 'Pantorrillas', value: measurements.calves, fullMark: 50  },
  ];

  const bmiLabel = bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obeso';

  return (
    <div className="flex flex-col gap-6">
      {/* Weight & Body Fat Inputs */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weight */}
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <label className="block font-serif text-base text-brand-dark mb-3">Peso</label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="range" min="50" max="100" step="0.5" value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-bold text-brand-dark min-w-[50px]">{weight} kg</span>
          </div>
          <input
            type="number" value={weight} step="0.5"
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="input"
          />
        </Card>

        {/* Body Fat */}
        <Card variant="default" padding="md" className="border-brand-light-tan">
          <label className="block font-serif text-base text-brand-dark mb-3">Grasa Corporal</label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="range" min="5" max="40" step="0.5" value={bodyFat}
              onChange={(e) => setBodyFat(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-bold text-brand-dark min-w-[50px]">{bodyFat}%</span>
          </div>
          <input
            type="number" value={bodyFat} step="0.5"
            onChange={(e) => setBodyFat(parseFloat(e.target.value) || 0)}
            className="input"
          />
        </Card>
      </div>

      {/* Calculated Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-accent-glow border-2 border-accent rounded-xl p-5 text-center">
          <p className="text-brand-dark text-[13px] m-0 mb-2">IMC</p>
          <div className="font-serif text-[32px] font-bold text-brand-dark">{bmi}</div>
          <p className="text-brand-warm text-xs m-0 mt-2">{bmiLabel}</p>
        </div>
        <div className="bg-info-light border-2 border-info rounded-xl p-5 text-center">
          <p className="text-brand-dark text-[13px] m-0 mb-2">BMR</p>
          <div className="font-serif text-[32px] font-bold text-brand-dark">{bmr}</div>
          <p className="text-brand-warm text-xs m-0 mt-2">Calorías/día</p>
        </div>
      </div>

      {/* Weight Trend Chart */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-base text-brand-dark m-0 mb-4">Tendencia de Peso (30 días)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
            <XAxis dataKey="date" stroke={colors.warm} />
            <YAxis stroke={colors.warm} />
            <Tooltip
              contentStyle={{ backgroundColor: colors.paper, border: `1px solid ${colors.tan}` }}
              labelStyle={{ color: colors.dark }}
            />
            <Line type="monotone" dataKey="weight" stroke={colors.warning} strokeWidth={2} dot={{ fill: colors.accent, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Measurements Inputs */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-base text-brand-dark m-0 mb-4">Medidas Corporales (cm)</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key}>
              <label className="input-label">{MEASUREMENT_LABELS[key]}</label>
              <input
                type="number" value={value}
                onChange={(e) => setMeasurements((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                className="input"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => onSave({
              date: new Date().toISOString().split('T')[0],
              weight, bodyFat,
              chest: measurements.chest, waist: measurements.waist,
              armLeft: measurements.arms, armRight: measurements.arms,
              thighLeft: measurements.thighs, thighRight: measurements.thighs,
            }).catch(() => {})}
            className="btn-primary px-5 py-2 text-[13px]"
          >
            Guardar medidas
          </button>
        </div>
      </Card>

      {/* Radar Chart */}
      <Card variant="default" padding="md" className="border-brand-light-tan">
        <h3 className="font-serif text-base text-brand-dark m-0 mb-4">Análisis de Medidas</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={colors.lightCream} />
            <PolarAngleAxis dataKey="metric" stroke={colors.warm} />
            <PolarRadiusAxis stroke={colors.warm} />
            <Radar name="Medidas" dataKey="value" stroke={colors.accent} fill={colors.accentGlow} fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
