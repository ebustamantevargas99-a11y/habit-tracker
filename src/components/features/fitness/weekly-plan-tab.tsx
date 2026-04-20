'use client';

import React, { useState } from 'react';
import { Check, Edit2 } from 'lucide-react';
import { cn } from '@/components/ui';
import { EnginePlanDay, PlanExercise, EXERCISE_NAMES } from './fitness-engine';

function getTypeClass(type: string): string {
  switch (type) {
    case 'Push': return 'bg-warning text-brand-paper';
    case 'Pull': return 'bg-info text-brand-paper';
    case 'Legs': return 'bg-success text-brand-paper';
    case 'Rest': return 'bg-danger text-brand-paper';
    default:     return 'bg-brand-warm text-brand-paper';
  }
}

interface WeeklyPlanTabProps {
  plan: EnginePlanDay[];
  onPlanChange: (plan: EnginePlanDay[]) => void;
}

export default function WeeklyPlanTab({ plan, onPlanChange }: WeeklyPlanTabProps) {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editType, setEditType] = useState<string>('');
  const [addingExToDay, setAddingExToDay] = useState<number | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newExSets, setNewExSets] = useState(3);
  const [newExRepMin, setNewExRepMin] = useState(8);
  const [newExRepMax, setNewExRepMax] = useState(12);

  const handleEditSave = (index: number) => {
    onPlanChange(plan.map((day, i) =>
      i === index ? { ...day, type: editType as EnginePlanDay['type'] } : day,
    ));
    setEditingDay(null);
  };

  const handleAddExercise = (dayIndex: number) => {
    if (!newExName.trim()) return;
    const newEx: PlanExercise = { name: newExName.trim(), sets: newExSets, repMin: newExRepMin, repMax: newExRepMax };
    onPlanChange(plan.map((day, i) =>
      i === dayIndex ? { ...day, exercises: [...day.exercises, newEx] } : day,
    ));
    setNewExName(''); setNewExSets(3); setNewExRepMin(8); setNewExRepMax(12);
    setAddingExToDay(null);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    onPlanChange(plan.map((day, i) =>
      i === dayIndex ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIndex) } : day,
    ));
  };

  return (
    <div className="grid grid-cols-7 gap-3">
      {plan.map((day, index) => (
        <div
          key={index}
          className="bg-brand-paper border-2 border-brand-light-tan rounded-xl p-4 flex flex-col gap-[10px]"
        >
          <h4 className="font-serif text-sm text-brand-dark m-0">{day.day}</h4>

          {/* Type row */}
          {editingDay === index ? (
            <div className="flex gap-1.5">
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="flex-1 p-1.5 border border-brand-tan rounded-[6px] text-xs"
              >
                {(['Push', 'Pull', 'Legs', 'Rest'] as const).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleEditSave(index)}
                className="flex items-center justify-center w-7 h-7 bg-success text-brand-paper border-none rounded-[6px] cursor-pointer"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1.5">
              <span className={cn('inline-block px-[10px] py-1 rounded-[6px] text-xs font-bold', getTypeClass(day.type))}>
                {day.type}
              </span>
              <button
                type="button"
                onClick={() => { setEditingDay(index); setEditType(day.type); }}
                title="Cambiar tipo"
                className="flex items-center justify-center w-6 h-6 bg-brand-light-cream text-brand-dark border-none rounded-[4px] cursor-pointer hover:bg-brand-cream transition-colors"
              >
                <Edit2 size={12} />
              </button>
            </div>
          )}

          {/* Exercises */}
          {day.type !== 'Rest' && (
            <div className="flex flex-col gap-[5px]">
              {day.exercises.map((ex, exIndex) => (
                <div
                  key={exIndex}
                  className="p-1.5 bg-brand-light-cream rounded-[6px] text-[11px] text-brand-dark flex justify-between items-start gap-1"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{ex.name}</div>
                    <div className="text-brand-warm mt-[1px]">{ex.sets}×{ex.repMin}-{ex.repMax}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(index, exIndex)}
                    title="Eliminar"
                    className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-danger-light text-danger border-none cursor-pointer text-[11px] shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add exercise to day */}
              {addingExToDay === index ? (
                <div className="bg-brand-warm-white border border-brand-tan rounded-lg p-[10px] flex flex-col gap-2">
                  <select
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    className="w-full p-1.5 border border-brand-tan rounded-[4px] text-[11px]"
                  >
                    <option value="">— Ejercicio —</option>
                    {EXERCISE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: 'Series', value: newExSets,   onChange: (v: number) => setNewExSets(v) },
                      { label: 'Rep mín', value: newExRepMin, onChange: (v: number) => setNewExRepMin(v) },
                      { label: 'Rep máx', value: newExRepMax, onChange: (v: number) => setNewExRepMax(v) },
                    ].map(({ label, value, onChange }) => (
                      <div key={label}>
                        <div className="text-[10px] text-brand-warm mb-[2px]">{label}</div>
                        <input
                          type="number" min={1} value={value}
                          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
                          className="w-full p-1 border border-brand-tan rounded-[4px] text-[11px] box-border"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingExToDay(null)}
                      className="flex-1 p-[5px] bg-brand-light-cream text-brand-dark border-none rounded-[4px] cursor-pointer text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExercise(index)}
                      disabled={!newExName}
                      className={cn(
                        'flex-1 p-[5px] text-brand-paper border-none rounded-[4px] text-[11px] font-bold',
                        newExName ? 'bg-accent cursor-pointer' : 'bg-brand-light-tan cursor-not-allowed',
                      )}
                    >
                      OK
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddingExToDay(index); setNewExName(''); }}
                  className="w-full p-[5px] bg-transparent text-accent border border-dashed border-accent rounded-[6px] cursor-pointer text-[11px] font-bold hover:bg-accent-glow/30 transition-colors"
                >
                  + Ejercicio
                </button>
              )}
            </div>
          )}

          {day.type === 'Rest' && (
            <div className="p-4 bg-danger-light rounded-[6px] text-center text-xs text-danger font-bold">
              Descanso
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
