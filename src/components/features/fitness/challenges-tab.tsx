'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/components/ui';
import { useFitnessExtendedStore } from '@/stores/fitness-extended-store';

interface Challenge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  totalDays: number;
  completedDays: boolean[];
  category: string;
}

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_OPTIONS = [7, 14, 21, 30, 60, 90];

function getProgress(c: Challenge) {
  const done = c.completedDays.filter(Boolean).length;
  return { done, total: c.totalDays, pct: Math.round((done / c.totalDays) * 100) };
}

export default function ChallengesTab() {
  const { challenges: storeChallenges, addChallenge: storeAddChallenge, toggleChallengeDay, initialize } = useFitnessExtendedStore();
  useEffect(() => { initialize(); }, [initialize]);

  const challenges: Challenge[] = storeChallenges.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: '🏆',
    description: c.description ?? `Reto de ${c.targetValue} días`,
    totalDays: c.targetValue,
    completedDays: Array.from({ length: c.targetValue }, (_, i) => c.completedDays.includes(i)),
    category: c.unit ?? 'Personalizado',
  }));

  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(30);

  useEffect(() => {
    if (challenges.length > 0 && !selectedChallenge) {
      setSelectedChallenge(challenges[0].id);
    }
  }, [challenges.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = challenges.find((c) => c.id === selectedChallenge) ?? challenges[0];

  const addChallenge = () => {
    if (!newName) return;
    storeAddChallenge({ name: newName, totalDays: newDays, category: 'Personalizado' }).then((created) => {
      setSelectedChallenge(created.id);
    });
    setShowNewForm(false);
    setNewName('');
  };

  return (
    <div className="flex gap-6">
      {/* Challenge List */}
      <div className="w-[300px] shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif text-brand-dark m-0">🏆 Retos Activos</h3>
          <button
            type="button"
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-accent text-brand-paper border-none rounded-[6px] px-3 py-1.5 cursor-pointer text-[13px] font-semibold"
          >
            + Nuevo
          </button>
        </div>

        {showNewForm && (
          <div className="p-3 bg-brand-light-cream rounded-lg mb-3 flex flex-col gap-2">
            <input
              placeholder="Nombre del reto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
            />
            <select
              value={newDays}
              onChange={(e) => setNewDays(Number(e.target.value))}
              className="input"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} días</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addChallenge}
              className="p-2 bg-success text-brand-paper border-none rounded-[6px] cursor-pointer font-semibold"
            >
              Crear Reto
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {challenges.map((c) => {
            const p = getProgress(c);
            const isComplete = p.pct === 100;
            const isSelected = selectedChallenge === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChallenge(c.id)}
                className={cn(
                  'p-3.5 rounded-[10px] cursor-pointer text-left border transition-all',
                  isSelected
                    ? 'border-2 border-accent bg-accent-glow'
                    : isComplete
                      ? 'border border-brand-tan bg-success-light'
                      : 'border border-brand-tan bg-brand-paper',
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{c.emoji}</span>
                  <span className="font-semibold text-brand-dark text-[14px] flex-1">{c.name}</span>
                  {isComplete && <span>✅</span>}
                </div>
                <div className="w-full h-1.5 bg-brand-cream rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', isComplete ? 'bg-success' : 'bg-accent')}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
                <div className="text-[12px] text-brand-warm mt-1">{p.done}/{p.total} días · {p.pct}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Challenge Detail */}
      <div className="flex-1">
        {current ? (() => {
          const p = getProgress(current);
          return (
            <div className="flex flex-col gap-5">
              {/* Header Stats */}
              <div className="bg-brand-paper border border-brand-tan rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[32px]">{current.emoji}</span>
                  <div>
                    <h2 className="font-serif text-brand-dark m-0 text-[22px]">{current.name}</h2>
                    <p className="text-brand-warm m-0 mt-1 text-[13px]">{current.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Progreso',    value: `${p.pct}%`,          colorClass: 'text-accent'   },
                    { label: 'Completados', value: `${p.done}/${p.total}`, colorClass: 'text-success'  },
                    { label: 'Restantes',   value: `${p.total - p.done}`, colorClass: 'text-info'     },
                    { label: 'Categoría',   value: current.category,      colorClass: 'text-warning'  },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-3 bg-brand-light-cream rounded-lg">
                      <div className={cn('text-xl font-bold', s.colorClass)}>{s.value}</div>
                      <div className="text-[12px] text-brand-warm">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-brand-paper border border-brand-tan rounded-xl p-5">
                <h3 className="font-serif text-brand-dark m-0 mb-4 text-base">📊 Barra de Progreso</h3>
                <div className="w-full h-6 bg-brand-cream rounded-xl overflow-hidden relative">
                  <div
                    className="h-full rounded-xl transition-all bg-gradient-to-r from-accent to-accent-light"
                    style={{ width: `${p.pct}%` }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-bold text-brand-dark">
                    {p.pct}%
                  </div>
                </div>
              </div>

              {/* Day Grid */}
              <div className="bg-brand-paper border border-brand-tan rounded-xl p-5">
                <h3 className="font-serif text-brand-dark m-0 mb-4 text-base">📅 Calendario del Reto</h3>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_HEADERS.map((d) => (
                    <div key={d} className="text-center text-[12px] font-semibold text-brand-warm p-1">{d}</div>
                  ))}
                  {current.completedDays.map((done, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleChallengeDay(current.id, i)}
                      className={cn(
                        'aspect-square w-full rounded-lg border-none cursor-pointer text-[13px] font-semibold flex items-center justify-center transition-all',
                        done ? 'bg-success text-brand-paper' : 'bg-brand-light-cream text-brand-dark hover:bg-brand-cream',
                      )}
                    >
                      {done ? '✓' : i + 1}
                    </button>
                  ))}
                </div>
                {p.pct === 100 && (
                  <div className="mt-5 p-4 rounded-[10px] text-center bg-gradient-to-br from-accent-glow to-success-light">
                    <span className="text-[32px]">🏆</span>
                    <p className="font-serif text-brand-dark text-lg font-semibold m-0 mt-2">
                      ¡Reto Completado! ¡Felicidades!
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          <div className="text-center p-15 text-brand-warm">
            Selecciona un reto para ver los detalles
          </div>
        )}
      </div>
    </div>
  );
}
