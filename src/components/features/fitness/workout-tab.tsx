'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/components/ui';
import { Button, Input, Card } from '@/components/ui';
import {
  EngineExercise, EngineSet,
  REST_TIMER_PRESETS, EXERCISE_NAMES, EXERCISE_IMPACT, MUSCLE_GROUPS,
  epley1RM, getProgressionSuggestion,
} from './fitness-engine';

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimer() {
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (hasSound) audioRef.current?.play().catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, hasSound]);

  const handleDurationSelect = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
  };

  const progress = (1 - timeLeft / duration) * 100;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-brand-paper rounded-xl border border-brand-light-tan">
      <h3 className="font-serif text-lg text-brand-dark m-0">Descanso</h3>

      {/* Circular Progress Ring */}
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r="70" fill="none" className="stroke-brand-light-cream" strokeWidth="4" />
        <circle
          cx="80" cy="80" r="70" fill="none"
          className="stroke-accent [transition:stroke-dashoffset_0.3s_ease]"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        <text
          x="80" y="80"
          textAnchor="middle"
          dy="0.3em"
          fontSize="32"
          fontWeight="bold"
          fill="var(--color-dark)"
          fontFamily="Georgia, serif"
          className="rotate-90 origin-center"
          style={{ transform: 'rotate(90deg)', transformOrigin: '80px 80px' }}
        >
          {formatTime(timeLeft)}
        </text>
      </svg>

      {/* Preset Buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {REST_TIMER_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => handleDurationSelect(preset)}
            className={cn(
              'px-3 py-2 rounded-[6px] text-xs font-bold cursor-pointer transition-all border-none',
              duration === preset
                ? 'bg-accent text-brand-paper'
                : 'bg-brand-light-cream text-brand-dark hover:bg-accent-light',
            )}
          >
            {preset}s
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          title={isRunning ? 'Pausar' : 'Iniciar'}
          className="flex items-center justify-center w-10 h-10 bg-success text-brand-paper border-none rounded-full cursor-pointer transition-all hover:opacity-90"
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={() => { setIsRunning(false); setTimeLeft(duration); }}
          title="Reiniciar"
          className="flex items-center justify-center w-10 h-10 bg-warning text-brand-paper border-none rounded-full cursor-pointer transition-all hover:opacity-90"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={() => setHasSound(!hasSound)}
          title={hasSound ? 'Sonido encendido' : 'Sonido apagado'}
          className={cn(
            'flex items-center justify-center w-10 h-10 text-brand-paper border-none rounded-full cursor-pointer transition-all hover:opacity-90',
            hasSound ? 'bg-info' : 'bg-danger',
          )}
        >
          {hasSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" />
    </div>
  );
}

// ─── Workout Tab ──────────────────────────────────────────────────────────────

interface WorkoutTabProps {
  exercises: EngineExercise[];
  onExercisesChange: (exercises: EngineExercise[]) => void;
  isSaving: boolean;
  onFinish: () => void;
}

export default function WorkoutTab({ exercises, onExercisesChange, isSaving, onFinish }: WorkoutTabProps) {
  const updateExercises = (updater: (prev: EngineExercise[]) => EngineExercise[]) => {
    onExercisesChange(updater(exercises));
  };

  // — Add exercise form —
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCustomName, setNewExCustomName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExWeight, setNewExWeight] = useState(0);
  const [newExRepMin, setNewExRepMin] = useState(8);
  const [newExRepMax, setNewExRepMax] = useState(12);

  const handleAddExercise = () => {
    const name = newExName === '__custom__' ? newExCustomName.trim() : newExName;
    if (!name) return;
    const impactKeys = Object.keys(EXERCISE_IMPACT[name] ?? {});
    const muscle = newExMuscle || impactKeys[0] || 'Otro';
    const newEx: EngineExercise = {
      id: Date.now(), name, muscleGroup: muscle,
      lastWeight: newExWeight, lastReps: newExRepMin, pr: 0,
      sets: [{ id: String(Date.now() + 1), weight: newExWeight, reps: newExRepMin, rpe: 7 }],
      repMin: newExRepMin, repMax: newExRepMax, lastWeekReps: [],
    };
    updateExercises((prev) => [...prev, newEx]);
    setNewExName(''); setNewExCustomName(''); setNewExMuscle('');
    setNewExWeight(0); setNewExRepMin(8); setNewExRepMax(12); setShowAddForm(false);
  };

  const removeExercise = (id: number) =>
    updateExercises((prev) => prev.filter((ex) => ex.id !== id));

  const addSet = (id: number) =>
    updateExercises((prev) =>
      prev.map((ex) =>
        ex.id === id
          ? { ...ex, sets: [...ex.sets, { id: String(Date.now()), weight: ex.lastWeight, reps: ex.lastReps, rpe: 7 }] }
          : ex,
      ),
    );

  const removeSet = (exerciseId: number, setId: string) =>
    updateExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((s: EngineSet) => s.id !== setId) } : ex,
      ),
    );

  const updateSet = (exerciseId: number, setId: string, field: 'weight' | 'reps' | 'rpe', value: number) =>
    updateExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s: EngineSet) => (s.id === setId ? { ...s, [field]: value } : s)) }
          : ex,
      ),
    );

  const isPR = (exerciseId: number, setId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return false;
    const set = ex.sets.find((s) => s.id === setId);
    return set ? set.weight >= ex.pr : false;
  };

  const getBest1RM = (exercise: EngineExercise) =>
    exercise.sets.reduce((best, s) => {
      const est = epley1RM(s.weight, s.reps);
      return est > best ? est : best;
    }, 0);

  const isFormDisabled = !newExName || (newExName === '__custom__' && !newExCustomName.trim());

  return (
    <div className="flex flex-col gap-4">
      {exercises.length === 0 && (
        <Card variant="default" padding="md" className="border-dashed border-2 border-brand-light-tan text-center">
          <p className="text-brand-dark font-semibold m-0">
            Sin ejercicios en esta sesión
          </p>
          <p className="text-brand-warm text-xs m-0 mt-1">
            Usa el <strong>logger pro</strong> de arriba para agregar ejercicios
            con el selector, o pulsa <strong>&ldquo;Agregar ejercicio&rdquo;</strong>{" "}
            al pie de esta sección.
          </p>
        </Card>
      )}
      <div className="grid grid-cols-[1fr_280px] gap-6">
        {/* Main Workout Grid */}
        <div className="flex flex-col gap-5">
          {exercises.map((exercise) => (
            <Card key={exercise.id} variant="default" padding="md" className="border-brand-light-tan">
              {/* Exercise Header */}
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-lg text-brand-dark m-0 mb-1">{exercise.name}</h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(exercise.id)}
                        title="Eliminar ejercicio"
                        className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-danger-light text-danger border-none cursor-pointer text-xs shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-brand-warm text-sm m-0">
                      {exercise.muscleGroup} • PR actual: {exercise.pr > 0 ? `${exercise.pr}kg` : '—'}
                      {getBest1RM(exercise) > 0 && (
                        <span className={cn(
                          'ml-2 px-2 py-[2px] rounded-lg text-xs',
                          getBest1RM(exercise) > exercise.pr
                            ? 'bg-accent-glow text-accent font-bold'
                            : 'bg-brand-light-cream text-brand-warm',
                        )}>
                          {getBest1RM(exercise) > exercise.pr ? '🏆 ' : ''}
                          1RM est. {getBest1RM(exercise)}kg
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Progression suggestion */}
                  {(() => {
                    const s = getProgressionSuggestion(exercise.lastWeight, exercise.lastWeekReps, exercise.repMin, exercise.repMax);
                    return (
                      <div className="text-right">
                        <div className="text-[11px] text-brand-warm mb-[2px]">Objetivo esta sesión</div>
                        <div className={cn('text-xs font-bold', s.weight > exercise.lastWeight ? 'text-success' : 'text-accent')}>
                          {s.label}
                        </div>
                        <div className="text-[10px] text-brand-warm">
                          Rango: {exercise.repMin}-{exercise.repMax} reps
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sets */}
              <div className="flex flex-col gap-3 mb-4">
                {exercise.sets.map((set, setIndex) => {
                  const est1RM = epley1RM(set.weight, set.reps);
                  const isNewPR = est1RM > exercise.pr && set.weight > 0 && set.reps > 0;
                  return (
                    <div
                      key={set.id}
                      className={cn(
                        'grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] items-center gap-3 p-3 rounded-lg box-border',
                        isNewPR ? 'bg-accent-glow' : 'bg-brand-light-cream',
                        (isPR(exercise.id, set.id) || isNewPR) ? 'border-2 border-accent' : 'border-0',
                      )}
                    >
                      <div>
                        <span className="text-sm text-brand-warm font-bold block">Set {setIndex + 1}</span>
                        {est1RM > 0 && (
                          <span className={cn('text-[10px]', isNewPR ? 'text-accent font-bold' : 'text-brand-warm')}>
                            ~{est1RM}kg
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-brand-dark mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-brand-tan rounded-[4px] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-brand-dark mb-1">Reps</label>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-brand-tan rounded-[4px] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-brand-dark mb-1">RPE</label>
                        <input
                          type="number"
                          min="1" max="10"
                          value={set.rpe}
                          onChange={(e) => updateSet(exercise.id, set.id, 'rpe', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-brand-tan rounded-[4px] text-sm"
                        />
                      </div>

                      {isPR(exercise.id, set.id) && <Trophy size={20} className="text-accent shrink-0" />}

                      <button
                        onClick={() => removeSet(exercise.id, set.id)}
                        title="Eliminar set"
                        className="flex items-center justify-center w-8 h-8 bg-danger-light text-danger border-none rounded-[6px] cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => addSet(exercise.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-light text-brand-dark border-none rounded-[6px] cursor-pointer text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> Agregar set
              </button>
            </Card>
          ))}

          {/* Add Exercise */}
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-transparent text-accent border-2 border-dashed border-accent rounded-xl cursor-pointer text-sm font-bold w-full justify-center transition-all hover:bg-accent-glow/30"
            >
              <Plus size={18} /> Agregar ejercicio
            </button>
          ) : (
            <Card variant="default" padding="md" className="border-brand-tan flex flex-col gap-[14px]">
              <h4 className="font-serif text-base text-brand-dark m-0">Nuevo ejercicio</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-dark mb-1">Ejercicio</label>
                  <select
                    value={newExName}
                    onChange={(e) => {
                      setNewExName(e.target.value);
                      if (e.target.value !== '__custom__') {
                        const keys = Object.keys(EXERCISE_IMPACT[e.target.value] ?? {});
                        setNewExMuscle(keys[0] ?? '');
                      }
                    }}
                    className="w-full px-2 py-2 border border-brand-tan rounded-[6px] text-sm"
                  >
                    <option value="">— Selecciona —</option>
                    {EXERCISE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                    <option value="__custom__">Otro (personalizado)…</option>
                  </select>
                </div>
                {newExName === '__custom__' && (
                  <div>
                    <label className="block text-xs text-brand-dark mb-1">Nombre personalizado</label>
                    <input
                      type="text"
                      value={newExCustomName}
                      onChange={(e) => setNewExCustomName(e.target.value)}
                      placeholder="Ej: Prensa inclinada"
                      className="w-full px-2 py-2 border border-brand-tan rounded-[6px] text-sm box-border"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-brand-dark mb-1">Grupo muscular</label>
                  <select
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value)}
                    className="w-full px-2 py-2 border border-brand-tan rounded-[6px] text-sm"
                  >
                    <option value="">— Auto —</option>
                    {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-dark mb-1">Peso inicial (kg)</label>
                  <input
                    type="number"
                    value={newExWeight}
                    onChange={(e) => setNewExWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 border border-brand-tan rounded-[6px] text-sm box-border"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-dark mb-1">Reps mín.</label>
                  <input
                    type="number"
                    value={newExRepMin}
                    onChange={(e) => setNewExRepMin(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-2 border border-brand-tan rounded-[6px] text-sm box-border"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-dark mb-1">Reps máx.</label>
                  <input
                    type="number"
                    value={newExRepMax}
                    onChange={(e) => setNewExRepMax(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-2 border border-brand-tan rounded-[6px] text-sm box-border"
                  />
                </div>
              </div>
              <div className="flex gap-[10px] justify-end">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary" size="sm" type="button"
                  disabled={isFormDisabled}
                  onClick={handleAddExercise}
                >
                  Agregar
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Rest Timer Sidebar */}
        <div className="sticky top-6 h-fit">
          <RestTimer />
        </div>
      </div>

      {/* Finish Session */}
      <div className="flex justify-end">
        <Button
          variant="primary" size="lg"
          loading={isSaving}
          onClick={onFinish}
          className="font-serif"
        >
          {isSaving ? 'Guardando…' : 'Finalizar Sesión'}
        </Button>
      </div>
    </div>
  );
}
