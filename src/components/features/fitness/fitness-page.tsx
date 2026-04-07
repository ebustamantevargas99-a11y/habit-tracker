'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { colors } from '@/lib/colors';
import { VOLUME_LANDMARKS } from '@/lib/constants';

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_EXERCISES = [
  { id: 1, name: 'Press Banca', muscleGroup: 'Pecho', lastWeight: 80, lastReps: 8, pr: 90 },
  { id: 2, name: 'Sentadilla', muscleGroup: 'Cuádriceps', lastWeight: 100, lastReps: 6, pr: 120 },
  { id: 3, name: 'Peso Muerto', muscleGroup: 'Espalda', lastWeight: 120, lastReps: 5, pr: 140 },
  { id: 4, name: 'Curl Bíceps', muscleGroup: 'Bíceps', lastWeight: 14, lastReps: 12, pr: 16 },
];

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Core',
  'Pantorrillas',
];

const REST_TIMER_PRESETS = [30, 60, 90, 120, 180] as const;

const WEEKLY_PLAN_DEFAULT: { day: string; type: 'Push' | 'Pull' | 'Legs' | 'Rest'; exercises: string[] }[] = [
  { day: 'Lunes', type: 'Push', exercises: ['Press Banca', 'Press Militar'] },
  { day: 'Martes', type: 'Pull', exercises: ['Peso Muerto', 'Remo'] },
  { day: 'Miércoles', type: 'Legs', exercises: ['Sentadilla', 'Leg Press'] },
  { day: 'Jueves', type: 'Push', exercises: ['Press Inclinado', 'Fondos'] },
  { day: 'Viernes', type: 'Pull', exercises: ['Dominadas', 'Curl'] },
  { day: 'Sábado', type: 'Legs', exercises: ['Sentadilla Búlgara', 'Extensión'] },
  { day: 'Domingo', type: 'Rest', exercises: [] },
];

// ============================================================================
// REST TIMER COMPONENT
// ============================================================================

interface RestTimerProps {
  onDurationChange?: (duration: number) => void;
}

function RestTimer({ onDurationChange }: RestTimerProps) {
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
          if (hasSound) {
            audioRef.current?.play().catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, hasSound]);

  const handleDurationSelect = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
    onDurationChange?.(newDuration);
  };

  const togglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '24px',
        backgroundColor: colors.paper,
        borderRadius: '12px',
        border: `1px solid ${colors.lightTan}`,
      }}
    >
      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: colors.dark, margin: 0 }}>
        Descanso
      </h3>

      {/* Circular Progress Ring */}
      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={colors.lightCream}
          strokeWidth="4"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={colors.accent}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
        <text
          x="80"
          y="80"
          textAnchor="middle"
          dy="0.3em"
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            fill: colors.dark,
            fontFamily: 'Georgia, serif',
          }}
        >
          {formatTime(timeLeft)}
        </text>
      </svg>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {REST_TIMER_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => handleDurationSelect(preset)}
            style={{
              padding: '8px 12px',
              backgroundColor: duration === preset ? colors.accent : colors.lightCream,
              color: duration === preset ? colors.paper : colors.dark,
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (duration !== preset) {
                e.currentTarget.style.backgroundColor = colors.accentLight;
              }
            }}
            onMouseLeave={(e) => {
              if (duration !== preset) {
                e.currentTarget.style.backgroundColor = colors.lightCream;
              }
            }}
          >
            {preset}s
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={togglePlay}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: colors.success,
            color: colors.paper,
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={isRunning ? 'Pausar' : 'Iniciar'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: colors.warning,
            color: colors.paper,
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Reiniciar"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={() => setHasSound(!hasSound)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: hasSound ? colors.info : colors.danger,
            color: colors.paper,
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={hasSound ? 'Sonido encendido' : 'Sonido apagado'}
        >
          {hasSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
      />
    </div>
  );
}

// ============================================================================
// WORKOUT TRACKER COMPONENT
// ============================================================================

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  rpe: number;
}

interface WorkoutExercise {
  id: number;
  name: string;
  muscleGroup: string;
  lastWeight: number;
  lastReps: number;
  pr: number;
  sets: WorkoutSet[];
}

function WorkoutTracker() {
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    SAMPLE_EXERCISES.map((ex) => ({
      ...ex,
      sets: [{ id: '1', weight: ex.lastWeight, reps: ex.lastReps, rpe: 7 }],
    }))
  );

  const addSet = (exerciseId: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: String(Date.now()),
                  weight: ex.lastWeight,
                  reps: ex.lastReps,
                  rpe: 7,
                },
              ],
            }
          : ex
      )
    );
  };

  const removeSet = (exerciseId: number, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex
      )
    );
  };

  const updateSet = (
    exerciseId: number,
    setId: string,
    field: 'weight' | 'reps' | 'rpe',
    value: number
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
            }
          : ex
      )
    );
  };

  const isPR = (exerciseId: number, setId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return false;
    const set = exercise.sets.find((s) => s.id === setId);
    return set ? set.weight >= exercise.pr : false;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
      {/* Main Workout Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            style={{
              backgroundColor: colors.paper,
              border: `1px solid ${colors.lightTan}`,
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <h4
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '18px',
                  color: colors.dark,
                  margin: '0 0 4px 0',
                }}
              >
                {exercise.name}
              </h4>
              <p style={{ color: colors.warm, fontSize: '14px', margin: 0 }}>
                {exercise.muscleGroup} • PR: {exercise.pr}kg
              </p>
            </div>

            {/* Sets Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {exercise.sets.map((set, setIndex) => (
                <div
                  key={set.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1fr 1fr auto auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: colors.lightCream,
                    borderRadius: '8px',
                    border: isPR(exercise.id, set.id) ? `2px solid ${colors.accent}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '14px', color: colors.warm, fontWeight: 'bold' }}>
                    Set {setIndex + 1}
                  </span>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: colors.dark,
                        marginBottom: '4px',
                      }}
                    >
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: `1px solid ${colors.tan}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: colors.dark,
                        marginBottom: '4px',
                      }}
                    >
                      Reps
                    </label>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: `1px solid ${colors.tan}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: colors.dark,
                        marginBottom: '4px',
                      }}
                    >
                      RPE
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={set.rpe}
                      onChange={(e) =>
                        updateSet(exercise.id, set.id, 'rpe', parseInt(e.target.value) || 0)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: `1px solid ${colors.tan}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {isPR(exercise.id, set.id) && (
                    <Trophy
                      size={20}
                      style={{ color: colors.accent, flexShrink: 0 }}
                    />
                  )}

                  <button
                    onClick={() => removeSet(exercise.id, set.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      backgroundColor: colors.dangerLight,
                      color: colors.danger,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    title="Eliminar set"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(exercise.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: colors.accentLight,
                color: colors.dark,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              <Plus size={16} />
              Agregar set
            </button>
          </div>
        ))}
      </div>

      {/* Rest Timer Sidebar */}
      <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
        <RestTimer />
      </div>
    </div>
  );
}

// ============================================================================
// VOLUME TRACKER COMPONENT
// ============================================================================

function VolumeTracker() {
  const [volumeData] = useState([
    { group: 'Pecho', volume: 18, mev: 8, mav: 20, mrv: 22 },
    { group: 'Espalda', volume: 22, mev: 8, mav: 22, mrv: 25 },
    { group: 'Hombros', volume: 15, mev: 6, mav: 14, mrv: 18 },
    { group: 'Bíceps', volume: 12, mev: 4, mav: 10, mrv: 15 },
    { group: 'Tríceps', volume: 14, mev: 4, mav: 12, mrv: 16 },
    { group: 'Cuádriceps', volume: 20, mev: 8, mav: 18, mrv: 24 },
    { group: 'Isquiotibiales', volume: 11, mev: 6, mav: 12, mrv: 18 },
    { group: 'Glúteos', volume: 10, mev: 6, mav: 14, mrv: 20 },
    { group: 'Core', volume: 8, mev: 4, mav: 8, mrv: 10 },
    { group: 'Pantorrillas', volume: 6, mev: 4, mav: 10, mrv: 15 },
  ]);

  const getVolumeColor = (volume: number, mav: number, mrv: number) => {
    if (volume > mrv) return colors.danger;
    if (volume > mav) return colors.warning;
    return colors.success;
  };

  const getStatusLabel = (volume: number, mav: number, mrv: number) => {
    if (volume > mrv) return 'Exceso';
    if (volume > mav) return 'Alto';
    return 'Óptimo';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Volume Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {volumeData.map((data) => {
          const maxVal = data.mrv * 1.2;
          const mevPct = (data.mev / maxVal) * 100;
          const mavPct = (data.mav / maxVal) * 100;
          const mrvPct = (data.mrv / maxVal) * 100;
          const volumePct = (data.volume / maxVal) * 100;
          const color = getVolumeColor(data.volume, data.mav, data.mrv);

          return (
            <div
              key={data.group}
              style={{
                backgroundColor: colors.paper,
                border: `1px solid ${colors.lightTan}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h4
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '16px',
                      color: colors.dark,
                      margin: 0,
                    }}
                  >
                    {data.group}
                  </h4>
                  <p style={{ color: colors.warm, fontSize: '12px', margin: '4px 0 0 0' }}>
                    {data.volume} sets • {getStatusLabel(data.volume, data.mav, data.mrv)}
                  </p>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>
                  {data.volume}
                </div>
              </div>

              {/* SVG Volume Bar */}
              <svg width="100%" height="40" style={{ marginBottom: '8px' }}>
                {/* MEV marker */}
                <rect x={`${mevPct}%`} y="0" width="2" height="40" fill={colors.info} />
                {/* MAV marker */}
                <rect x={`${mavPct}%`} y="0" width="2" height="40" fill={colors.warning} />
                {/* MRV marker */}
                <rect x={`${mrvPct}%`} y="0" width="2" height="40" fill={colors.danger} />
                {/* Volume bar */}
                <rect
                  x="0"
                  y="10"
                  width={`${volumePct}%`}
                  height="20"
                  fill={color}
                  rx="4"
                  opacity="0.8"
                />
                {/* Background */}
                <rect x="0" y="10" width="100%" height="20" fill={colors.lightCream} rx="4" />
              </svg>

              {/* Labels */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  fontSize: '11px',
                  color: colors.warm,
                  textAlign: 'center',
                }}
              >
                <div>MEV: {data.mev}</div>
                <div>MAV: {data.mav}</div>
                <div>MRV: {data.mrv}</div>
                <div>Actual: {data.volume}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          backgroundColor: colors.paper,
          border: `1px solid ${colors.lightTan}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: colors.success,
              borderRadius: '4px',
            }}
          />
          <span style={{ fontSize: '14px', color: colors.dark }}>Óptimo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: colors.warning,
              borderRadius: '4px',
            }}
          />
          <span style={{ fontSize: '14px', color: colors.dark }}>Alto (Acercándose a MRV)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: colors.danger,
              borderRadius: '4px',
            }}
          />
          <span style={{ fontSize: '14px', color: colors.dark }}>Exceso (Sobre MRV)</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WEEKLY WORKOUT PLAN COMPONENT
// ============================================================================

interface WeeklyDay {
  day: string;
  type: 'Push' | 'Pull' | 'Legs' | 'Rest';
  exercises: string[];
}

function WeeklyWorkoutPlan() {
  const [plan, setPlan] = useState<WeeklyDay[]>(WEEKLY_PLAN_DEFAULT);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editType, setEditType] = useState<string>('');

  const handleEditStart = (index: number, type: string) => {
    setEditingDay(index);
    setEditType(type);
  };

  const handleEditSave = (index: number) => {
    setPlan((prev) =>
      prev.map((day, i) =>
        i === index ? { ...day, type: editType as 'Push' | 'Pull' | 'Legs' | 'Rest' } : day
      )
    );
    setEditingDay(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Push':
        return colors.warning;
      case 'Pull':
        return colors.info;
      case 'Legs':
        return colors.success;
      case 'Rest':
        return colors.danger;
      default:
        return colors.warm;
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px',
      }}
    >
      {plan.map((day, index) => (
        <div
          key={index}
          style={{
            backgroundColor: colors.paper,
            border: `2px solid ${colors.lightTan}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <h4
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                color: colors.dark,
                margin: 0,
              }}
            >
              {day.day}
            </h4>
          </div>

          {editingDay === index ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: `1px solid ${colors.tan}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="Push">Push</option>
                <option value="Pull">Pull</option>
                <option value="Legs">Legs</option>
                <option value="Rest">Rest</option>
              </select>
              <button
                onClick={() => handleEditSave(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  backgroundColor: colors.success,
                  color: colors.paper,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  backgroundColor: getTypeColor(day.type),
                  color: colors.paper,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                {day.type}
              </div>
              {day.type !== 'Rest' && (
                <button
                  onClick={() => handleEditStart(index, day.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    backgroundColor: colors.lightCream,
                    color: colors.dark,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          )}

          {day.type !== 'Rest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {day.exercises.map((ex, exIndex) => (
                <div
                  key={exIndex}
                  style={{
                    padding: '8px',
                    backgroundColor: colors.lightCream,
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: colors.dark,
                  }}
                >
                  {ex}
                </div>
              ))}
            </div>
          )}

          {day.type === 'Rest' && (
            <div
              style={{
                padding: '20px',
                backgroundColor: colors.dangerLight,
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '13px',
                color: colors.danger,
                fontWeight: 'bold',
              }}
            >
              Descanso
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PR BOARD COMPONENT
// ============================================================================

function PRBoard() {
  const [prData] = useState([
    { exercise: 'Press Banca', oneRM: 95, fiveRM: 85, tenRM: 75, monthChange: '+5kg' },
    { exercise: 'Sentadilla', oneRM: 130, fiveRM: 120, tenRM: 110, monthChange: '+10kg' },
    { exercise: 'Peso Muerto', oneRM: 150, fiveRM: 140, tenRM: 130, monthChange: '+5kg' },
    { exercise: 'Curl Bíceps', oneRM: 18, fiveRM: 16, tenRM: 14, monthChange: '+2kg' },
  ]);

  const newPRsThisMonth = 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Gold Banner */}
      <div
        style={{
          backgroundColor: colors.accentGlow,
          border: `2px solid ${colors.accent}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <Trophy size={32} color={colors.accent} />
        </div>
        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: colors.dark,
            margin: 0,
          }}
        >
          {newPRsThisMonth} PRs nuevos este mes
        </h3>
        <p style={{ color: colors.dark, fontSize: '13px', margin: '8px 0 0 0' }}>
          ¡Excelente progreso! Sigue así.
        </p>
      </div>

      {/* PR Table */}
      <div
        style={{
          backgroundColor: colors.paper,
          border: `1px solid ${colors.lightTan}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: colors.lightCream }}>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontFamily: 'Georgia, serif',
                  color: colors.dark,
                  borderBottom: `1px solid ${colors.tan}`,
                }}
              >
                Ejercicio
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontFamily: 'Georgia, serif',
                  color: colors.dark,
                  borderBottom: `1px solid ${colors.tan}`,
                }}
              >
                1RM
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontFamily: 'Georgia, serif',
                  color: colors.dark,
                  borderBottom: `1px solid ${colors.tan}`,
                }}
              >
                5RM
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontFamily: 'Georgia, serif',
                  color: colors.dark,
                  borderBottom: `1px solid ${colors.tan}`,
                }}
              >
                10RM
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontFamily: 'Georgia, serif',
                  color: colors.dark,
                  borderBottom: `1px solid ${colors.tan}`,
                }}
              >
                Cambio Mensual
              </th>
            </tr>
          </thead>
          <tbody>
            {prData.map((pr, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: `1px solid ${colors.lightCream}`,
                  backgroundColor: index % 2 === 0 ? colors.paper : colors.warmWhite,
                }}
              >
                <td
                  style={{
                    padding: '12px 16px',
                    color: colors.dark,
                    fontWeight: '600',
                  }}
                >
                  {pr.exercise}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: colors.dark,
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{pr.oneRM}kg</span>
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: colors.dark,
                  }}
                >
                  {pr.fiveRM}kg
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: colors.dark,
                  }}
                >
                  {pr.tenRM}kg
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: colors.success,
                    fontWeight: 'bold',
                  }}
                >
                  {pr.monthChange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// BODY METRICS COMPONENT
// ============================================================================

function BodyMetrics() {
  const [weight, setWeight] = useState(75);
  const [bodyFat, setBodyFat] = useState(18);
  const [height] = useState(1.75);

  const [measurements, setMeasurements] = useState({
    chest: 100,
    waist: 80,
    arms: 35,
    thighs: 55,
    calves: 38,
  });

  const bmi = parseFloat((weight / (height * height)).toFixed(1));
  const bmr = Math.round(88.362 + 13.397 * weight + 4.799 * height * 100 - 5.677 * 30); // Assuming 30 age

  const [weightTrend] = useState([
    { date: 'Day 1', weight: 78 },
    { date: 'Day 5', weight: 77 },
    { date: 'Day 10', weight: 76.5 },
    { date: 'Day 15', weight: 76 },
    { date: 'Day 20', weight: 75.5 },
    { date: 'Day 25', weight: 75 },
    { date: 'Day 30', weight: 74.5 },
  ]);

  const radarData = [
    { metric: 'Pecho', value: measurements.chest, fullMark: 120 },
    { metric: 'Cintura', value: measurements.waist, fullMark: 100 },
    { metric: 'Brazos', value: measurements.arms, fullMark: 50 },
    { metric: 'Muslos', value: measurements.thighs, fullMark: 70 },
    { metric: 'Pantorrillas', value: measurements.calves, fullMark: 50 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Weight & Body Fat Inputs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: colors.paper,
            border: `1px solid ${colors.lightTan}`,
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              color: colors.dark,
              marginBottom: '12px',
            }}
          >
            Peso
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <input
              type="range"
              min="50"
              max="100"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: colors.dark, minWidth: '50px' }}>
              {weight} kg
            </span>
          </div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            step="0.5"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${colors.tan}`,
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: colors.paper,
            border: `1px solid ${colors.lightTan}`,
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              color: colors.dark,
              marginBottom: '12px',
            }}
          >
            Grasa Corporal
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <input
              type="range"
              min="5"
              max="40"
              step="0.5"
              value={bodyFat}
              onChange={(e) => setBodyFat(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: colors.dark, minWidth: '50px' }}>
              {bodyFat}%
            </span>
          </div>
          <input
            type="number"
            value={bodyFat}
            onChange={(e) => setBodyFat(parseFloat(e.target.value) || 0)}
            step="0.5"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${colors.tan}`,
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {/* Calculated Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: colors.accentGlow,
            border: `2px solid ${colors.accent}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: colors.dark, fontSize: '13px', margin: '0 0 8px 0' }}>IMC</p>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: colors.dark,
              fontFamily: 'Georgia, serif',
            }}
          >
            {bmi}
          </div>
          <p style={{ color: colors.warm, fontSize: '12px', margin: '8px 0 0 0' }}>
            {bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obeso'}
          </p>
        </div>

        <div
          style={{
            backgroundColor: colors.infoLight,
            border: `2px solid ${colors.info}`,
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: colors.dark, fontSize: '13px', margin: '0 0 8px 0' }}>BMR</p>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: colors.dark,
              fontFamily: 'Georgia, serif',
            }}
          >
            {bmr}
          </div>
          <p style={{ color: colors.warm, fontSize: '12px', margin: '8px 0 0 0' }}>
            Calorías/día
          </p>
        </div>
      </div>

      {/* Weight Trend Chart */}
      <div
        style={{
          backgroundColor: colors.paper,
          border: `1px solid ${colors.lightTan}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: colors.dark,
            margin: '0 0 16px 0',
          }}
        >
          Tendencia de Peso (30 días)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
            <XAxis dataKey="date" stroke={colors.warm} />
            <YAxis stroke={colors.warm} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.paper,
                border: `1px solid ${colors.tan}`,
              }}
              labelStyle={{ color: colors.dark }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={colors.warning}
              dot={{ fill: colors.accent, r: 4 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Measurements Inputs */}
      <div
        style={{
          backgroundColor: colors.paper,
          border: `1px solid ${colors.lightTan}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: colors.dark,
            margin: '0 0 16px 0',
          }}
        >
          Medidas Corporales (cm)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: colors.dark,
                  marginBottom: '6px',
                  textTransform: 'capitalize',
                }}
              >
                {key === 'chest' && 'Pecho'}
                {key === 'waist' && 'Cintura'}
                {key === 'arms' && 'Brazos'}
                {key === 'thighs' && 'Muslos'}
                {key === 'calves' && 'Pantorrillas'}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) =>
                  setMeasurements((prev) => ({
                    ...prev,
                    [key]: parseFloat(e.target.value) || 0,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${colors.tan}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div
        style={{
          backgroundColor: colors.paper,
          border: `1px solid ${colors.lightTan}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: colors.dark,
            margin: '0 0 16px 0',
          }}
        >
          Análisis de Medidas
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={colors.lightCream} />
            <PolarAngleAxis dataKey="metric" stroke={colors.warm} />
            <PolarRadiusAxis stroke={colors.warm} />
            <Radar
              name="Medidas"
              dataKey="value"
              stroke={colors.accent}
              fill={colors.accentGlow}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// WEIGHT TRACKER COMPONENT
// ============================================================================

function WeightTracker() {
  const [goalWeight] = useState(72);
  const [weightLog, setWeightLog] = useState(
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      weight: 75.5 - i * 0.08 + Math.sin(i * 0.3) * 0.8 + (Math.random() - 0.5) * 0.4,
    }))
  );
  const [newWeight, setNewWeight] = useState("");

  const currentWeight = weightLog[weightLog.length - 1]?.weight || 75;
  const weekAvg = weightLog.slice(-7).reduce((s, w) => s + w.weight, 0) / 7;
  const movingAvg = weightLog.map((entry, i) => {
    const slice = weightLog.slice(Math.max(0, i - 6), i + 1);
    return { day: entry.day, weight: entry.weight, avg: slice.reduce((s, w) => s + w.weight, 0) / slice.length };
  });
  const daysToGoal = Math.abs(currentWeight - goalWeight) > 0.1 ? Math.round(Math.abs(currentWeight - goalWeight) / 0.08) : 0;

  const addWeight = () => {
    if (!newWeight) return;
    setWeightLog([...weightLog, { day: weightLog.length + 1, weight: parseFloat(newWeight) }]);
    setNewWeight("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Peso Actual", value: `${currentWeight.toFixed(1)} kg`, color: colors.dark },
          { label: "Meta", value: `${goalWeight} kg`, color: colors.accent },
          { label: "Promedio 7d", value: `${weekAvg.toFixed(1)} kg`, color: colors.info },
          { label: "Días para Meta", value: `~${daysToGoal}`, color: colors.warning },
        ].map((c) => (
          <div key={c.label} style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: colors.warm, marginBottom: "4px" }}>{c.label}</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="Peso de hoy (kg)" style={{ padding: "10px 16px", border: `1px solid ${colors.tan}`, borderRadius: "8px", fontSize: "14px", width: "200px" }} />
        <button onClick={addWeight} style={{ padding: "10px 20px", background: colors.accent, color: colors.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Registrar</button>
      </div>

      <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: colors.dark, marginBottom: "16px" }}>Tendencia de Peso (30 días)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={movingAvg}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: "8px" }} />
            <Line type="monotone" dataKey="weight" stroke={colors.tan} strokeWidth={1} dot={{ r: 2, fill: colors.tan }} name="Peso" />
            <Line type="monotone" dataKey="avg" stroke={colors.accent} strokeWidth={3} dot={false} name="Media 7d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// STEPS TRACKER COMPONENT
// ============================================================================

function StepsTracker() {
  const [dailyGoal] = useState(10000);
  const [todaySteps, setTodaySteps] = useState(7432);
  const weekData = [
    { day: "Lun", steps: 8234 }, { day: "Mar", steps: 11250 }, { day: "Mié", steps: 6890 },
    { day: "Jue", steps: 9540 }, { day: "Vie", steps: 12100 }, { day: "Sáb", steps: 5430 }, { day: "Dom", steps: todaySteps },
  ];
  const monthGrid = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    steps: Math.floor(Math.random() * 15000) + 2000,
  }));

  const weekAvg = Math.round(weekData.reduce((s, d) => s + d.steps, 0) / 7);
  const distance = (todaySteps * 0.0008).toFixed(1);
  const calories = Math.round(todaySteps * 0.04);
  const pct = Math.min(Math.round((todaySteps / dailyGoal) * 100), 100);

  const getHeatColor = (steps: number) => {
    if (steps >= dailyGoal) return colors.success;
    if (steps >= dailyGoal * 0.75) return colors.accentLight;
    if (steps >= dailyGoal * 0.5) return colors.warningLight;
    if (steps >= dailyGoal * 0.25) return colors.lightTan;
    return colors.lightCream;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Pasos Hoy", value: todaySteps.toLocaleString(), color: colors.accent },
          { label: "Distancia", value: `${distance} km`, color: colors.info },
          { label: "Calorías", value: `${calories} kcal`, color: colors.warning },
          { label: "Promedio 7d", value: weekAvg.toLocaleString(), color: colors.success },
        ].map((c) => (
          <div key={c.label} style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: colors.warm, marginBottom: "4px" }}>{c.label}</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", fontFamily: "Georgia, serif", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Progress Ring */}
      <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
          <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="60" fill="none" stroke={colors.lightCream} strokeWidth="10" />
            <circle cx="70" cy="70" r="60" fill="none" stroke={pct >= 100 ? colors.success : colors.accent} strokeWidth="10" strokeDasharray={2 * Math.PI * 60} strokeDashoffset={2 * Math.PI * 60 * (1 - pct / 100)} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Georgia, serif", color: colors.dark }}>{pct}%</div>
            <div style={{ fontSize: "10px", color: colors.warm }}>de meta</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <input type="number" value={todaySteps} onChange={(e) => setTodaySteps(parseInt(e.target.value) || 0)} style={{ padding: "8px 12px", border: `1px solid ${colors.tan}`, borderRadius: "6px", fontSize: "14px", width: "140px" }} />
            <span style={{ fontSize: "12px", color: colors.warm }}>pasos hoy</span>
          </div>
          <div style={{ fontSize: "12px", color: colors.warm }}>
            Meta: {dailyGoal.toLocaleString()} pasos · {pct >= 100 ? "Meta cumplida!" : `Faltan ${(dailyGoal - todaySteps).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: colors.dark, marginBottom: "16px" }}>Pasos de la Semana</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.lightCream} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: colors.warmWhite, border: `1px solid ${colors.tan}`, borderRadius: "8px" }} />
            <Bar dataKey="steps" name="Pasos" radius={[6, 6, 0, 0]}>
              {weekData.map((entry, i) => (
                <Cell key={i} fill={entry.steps >= dailyGoal ? colors.success : colors.accent} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Heatmap */}
      <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: colors.dark, marginBottom: "16px" }}>Heatmap Mensual</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {monthGrid.map((d) => (
            <div key={d.day} style={{ width: "100%", aspectRatio: "1", background: getHeatColor(d.steps), borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "600", color: d.steps >= dailyGoal ? colors.paper : colors.warm }} title={`Día ${d.day}: ${d.steps.toLocaleString()} pasos`}>
              {d.day}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", fontSize: "10px", color: colors.warm }}>
          {[
            { label: "<25%", color: colors.lightCream },
            { label: "25-50%", color: colors.lightTan },
            { label: "50-75%", color: colors.warningLight },
            { label: "75-99%", color: colors.accentLight },
            { label: "Meta!", color: colors.success },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FASTING TRACKER COMPONENT
// ============================================================================

function FastingTracker() {
  const protocols = [
    { id: "16/8", fastHours: 16, eatHours: 8, label: "16/8 — Estándar" },
    { id: "18/6", fastHours: 18, eatHours: 6, label: "18/6 — Intermedio" },
    { id: "20/4", fastHours: 20, eatHours: 4, label: "20/4 — Guerrero" },
    { id: "OMAD", fastHours: 23, eatHours: 1, label: "OMAD — Una comida" },
  ];

  const [selectedProtocol, setSelectedProtocol] = useState(protocols[0]);
  const [isFasting, setIsFasting] = useState(false);
  const [elapsedHours, setElapsedHours] = useState(12.5);

  const zones = [
    { start: 0, end: 4, label: "Digestión", color: colors.lightTan, desc: "El cuerpo procesa la última comida" },
    { start: 4, end: 8, label: "Quema de grasa", color: colors.warningLight, desc: "Se agotan reservas de glucógeno" },
    { start: 8, end: 12, label: "Autofagia", color: colors.accentGlow, desc: "Reciclaje celular activado" },
    { start: 12, end: 16, label: "Ketosis", color: colors.accentLight, desc: "Producción de cuerpos cetónicos" },
    { start: 16, end: 24, label: "Reparación celular", color: colors.successLight, desc: "Regeneración profunda" },
  ];

  const fastingHistory = [
    { date: "2026-04-04", protocol: "16/8", duration: 16.2, completed: true },
    { date: "2026-04-03", protocol: "16/8", duration: 17.1, completed: true },
    { date: "2026-04-02", protocol: "18/6", duration: 14.5, completed: false },
    { date: "2026-04-01", protocol: "16/8", duration: 16.0, completed: true },
    { date: "2026-03-31", protocol: "16/8", duration: 16.8, completed: true },
  ];

  const progress = Math.min((elapsedHours / selectedProtocol.fastHours) * 100, 100);
  const currentZone = zones.find((z) => elapsedHours >= z.start && elapsedHours < z.end) || zones[zones.length - 1];
  const circumference = 2 * Math.PI * 70;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Protocol Selector */}
      <div style={{ display: "flex", gap: "12px" }}>
        {protocols.map((p) => (
          <button key={p.id} onClick={() => setSelectedProtocol(p)} style={{ flex: 1, padding: "12px", background: selectedProtocol.id === p.id ? colors.accent : colors.warmWhite, color: selectedProtocol.id === p.id ? colors.paper : colors.dark, border: `1px solid ${selectedProtocol.id === p.id ? colors.accent : colors.lightCream}`, borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer + Zones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Timer */}
        <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "32px", textAlign: "center" }}>
          <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto 20px" }}>
            <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="90" cy="90" r="70" fill="none" stroke={colors.lightCream} strokeWidth="10" />
              <circle cx="90" cy="90" r="70" fill="none" stroke={progress >= 100 ? colors.success : colors.accent} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: "bold", fontFamily: "Georgia, serif", color: colors.dark }}>
                {Math.floor(elapsedHours)}:{String(Math.round((elapsedHours % 1) * 60)).padStart(2, "0")}
              </div>
              <div style={{ fontSize: "11px", color: colors.warm }}>de {selectedProtocol.fastHours}h</div>
            </div>
          </div>

          <div style={{ fontSize: "14px", fontWeight: "600", color: colors.dark, marginBottom: "8px" }}>
            Zona: {currentZone.label}
          </div>
          <div style={{ fontSize: "12px", color: colors.warm, marginBottom: "20px" }}>
            {currentZone.desc}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button onClick={() => { setIsFasting(!isFasting); if (!isFasting) setElapsedHours(0); }} style={{ padding: "10px 24px", background: isFasting ? colors.danger : colors.success, color: colors.paper, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              {isFasting ? "Detener Ayuno" : "Iniciar Ayuno"}
            </button>
          </div>

          {/* Slider to simulate time */}
          <div style={{ marginTop: "16px" }}>
            <input type="range" min="0" max="24" step="0.5" value={elapsedHours} onChange={(e) => setElapsedHours(parseFloat(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: "10px", color: colors.warm }}>Simular tiempo transcurrido</div>
          </div>
        </div>

        {/* Zones */}
        <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: colors.dark, marginBottom: "16px" }}>Zonas de Beneficio</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {zones.map((zone) => {
              const inZone = elapsedHours >= zone.start;
              return (
                <div key={zone.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: inZone ? zone.color : colors.lightCream, borderRadius: "8px", opacity: inZone ? 1 : 0.5, transition: "all 0.3s" }}>
                  <div style={{ width: "40px", fontSize: "11px", fontWeight: "600", color: colors.dark }}>
                    {zone.start}-{zone.end}h
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: colors.dark }}>{zone.label}</div>
                    <div style={{ fontSize: "11px", color: colors.warm }}>{zone.desc}</div>
                  </div>
                  {inZone && elapsedHours >= zone.start && elapsedHours < zone.end && (
                    <div style={{ fontSize: "10px", fontWeight: "700", color: colors.accent, background: colors.accentGlow, padding: "2px 8px", borderRadius: "8px" }}>ACTUAL</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ background: colors.warmWhite, border: `1px solid ${colors.lightCream}`, borderRadius: "12px", padding: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: colors.dark, marginBottom: "16px" }}>Historial de Ayunos</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: colors.warm, borderBottom: `2px solid ${colors.tan}` }}>Fecha</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: colors.warm, borderBottom: `2px solid ${colors.tan}` }}>Protocolo</th>
              <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: colors.warm, borderBottom: `2px solid ${colors.tan}` }}>Duración</th>
              <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: colors.warm, borderBottom: `2px solid ${colors.tan}` }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {fastingHistory.map((h, i) => (
              <tr key={i}>
                <td style={{ padding: "8px 12px", fontSize: "13px", color: colors.dark, borderBottom: `1px solid ${colors.lightCream}` }}>{h.date}</td>
                <td style={{ padding: "8px 12px", fontSize: "13px", color: colors.warm, borderBottom: `1px solid ${colors.lightCream}` }}>{h.protocol}</td>
                <td style={{ padding: "8px 12px", fontSize: "13px", textAlign: "center", fontWeight: "600", color: colors.dark, borderBottom: `1px solid ${colors.lightCream}` }}>{h.duration}h</td>
                <td style={{ padding: "8px 12px", textAlign: "center", borderBottom: `1px solid ${colors.lightCream}` }}>
                  <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", background: h.completed ? colors.successLight : colors.dangerLight, color: h.completed ? colors.success : colors.danger }}>
                    {h.completed ? "Completado" : "Parcial"}
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

// ============================================================================
// CHALLENGES COMPONENT
// ============================================================================

interface Challenge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  totalDays: number;
  completedDays: boolean[];
  category: string;
}

function ChallengesTracker() {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1', name: '30 Días de Abdominales', emoji: '🔥', description: 'Rutina diaria de abs progresiva',
      totalDays: 30, completedDays: Array.from({ length: 30 }, (_, i) => i < 12), category: 'Fuerza',
    },
    {
      id: '2', name: '10K Pasos Diarios', emoji: '🚶', description: 'Caminar 10,000 pasos cada día',
      totalDays: 30, completedDays: Array.from({ length: 30 }, (_, i) => i < 18), category: 'Cardio',
    },
    {
      id: '3', name: 'Flexiones Progresivas', emoji: '💪', description: 'De 10 a 50 flexiones en 30 días',
      totalDays: 30, completedDays: Array.from({ length: 30 }, (_, i) => i < 8), category: 'Fuerza',
    },
    {
      id: '4', name: 'Yoga Matutino', emoji: '🧘', description: '15 minutos de yoga cada mañana',
      totalDays: 21, completedDays: Array.from({ length: 21 }, (_, i) => i < 21), category: 'Flexibilidad',
    },
    {
      id: '5', name: 'Sentadillas 30 Días', emoji: '🦵', description: 'Aumentar sentadillas progresivamente',
      totalDays: 30, completedDays: Array.from({ length: 30 }, (_, i) => i < 5), category: 'Fuerza',
    },
  ]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('1');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(30);

  const current = challenges.find(c => c.id === selectedChallenge);

  const toggleDay = (challengeId: string, dayIndex: number) => {
    setChallenges(prev => prev.map(c => {
      if (c.id !== challengeId) return c;
      const updated = [...c.completedDays];
      updated[dayIndex] = !updated[dayIndex];
      return { ...c, completedDays: updated };
    }));
  };

  const addChallenge = () => {
    if (!newName) return;
    const ch: Challenge = {
      id: Date.now().toString(), name: newName, emoji: '🎯',
      description: `Reto de ${newDays} días`, totalDays: newDays,
      completedDays: Array(newDays).fill(false), category: 'Personalizado',
    };
    setChallenges(prev => [...prev, ch]);
    setSelectedChallenge(ch.id);
    setShowNewForm(false);
    setNewName('');
  };

  const getProgress = (c: Challenge) => {
    const done = c.completedDays.filter(Boolean).length;
    return { done, total: c.totalDays, pct: Math.round((done / c.totalDays) * 100) };
  };

  const getStreakFromEnd = (days: boolean[]) => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (!days[i]) {
        // Find last completed
        for (let j = i; j >= 0; j--) {
          if (days[j]) { streak++; } else break;
        }
        return streak;
      }
      streak++;
    }
    return streak;
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px', borderRadius: '8px', border: `1px solid ${colors.tan}`,
    fontSize: '0.9rem', backgroundColor: colors.cream, width: '100%',
  };

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      {/* Challenge List */}
      <div style={{ width: '300px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Georgia, serif', color: colors.dark, margin: 0 }}>🏆 Retos Activos</h3>
          <button onClick={() => setShowNewForm(!showNewForm)} style={{
            backgroundColor: colors.accent, color: colors.paper, border: 'none',
            borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
          }}>+ Nuevo</button>
        </div>

        {showNewForm && (
          <div style={{ padding: '12px', backgroundColor: colors.lightCream, borderRadius: '8px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input placeholder="Nombre del reto" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
            <select value={newDays} onChange={e => setNewDays(Number(e.target.value))} style={inputStyle}>
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={21}>21 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
            <button onClick={addChallenge} style={{ padding: '8px', backgroundColor: colors.success, color: colors.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Crear Reto</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {challenges.map(c => {
            const p = getProgress(c);
            const isComplete = p.pct === 100;
            return (
              <button key={c.id} onClick={() => setSelectedChallenge(c.id)} style={{
                padding: '14px', borderRadius: '10px', border: selectedChallenge === c.id ? `2px solid ${colors.accent}` : `1px solid ${colors.tan}`,
                backgroundColor: selectedChallenge === c.id ? colors.accentGlow : isComplete ? colors.successLight : colors.paper,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{c.emoji}</span>
                  <span style={{ fontWeight: '600', color: colors.dark, fontSize: '0.9rem', flex: 1 }}>{c.name}</span>
                  {isComplete && <span style={{ fontSize: '1rem' }}>✅</span>}
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: colors.cream, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.pct}%`, height: '100%', backgroundColor: isComplete ? colors.success : colors.accent, borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: colors.warm, marginTop: '4px' }}>{p.done}/{p.total} días · {p.pct}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Challenge Detail */}
      <div style={{ flex: 1 }}>
        {current ? (() => {
          const p = getProgress(current);
          return (
            <div>
              {/* Header */}
              <div style={{ backgroundColor: colors.paper, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.tan}`, marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{current.emoji}</span>
                  <div>
                    <h2 style={{ fontFamily: 'Georgia, serif', color: colors.dark, margin: 0, fontSize: '1.4rem' }}>{current.name}</h2>
                    <p style={{ color: colors.warm, margin: '4px 0 0 0', fontSize: '0.85rem' }}>{current.description}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Progreso', value: `${p.pct}%`, color: colors.accent },
                    { label: 'Completados', value: `${p.done}/${p.total}`, color: colors.success },
                    { label: 'Restantes', value: `${p.total - p.done}`, color: colors.info },
                    { label: 'Categoría', value: current.category, color: colors.warning },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '12px', backgroundColor: colors.lightCream, borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.75rem', color: colors.warm }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ backgroundColor: colors.paper, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.tan}`, marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Georgia, serif', color: colors.dark, margin: '0 0 16px 0', fontSize: '1rem' }}>📊 Barra de Progreso</h3>
                <div style={{ width: '100%', height: '24px', backgroundColor: colors.cream, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${p.pct}%`, height: '100%', borderRadius: '12px', transition: 'width 0.5s ease',
                    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})`,
                  }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.8rem', fontWeight: '700', color: colors.dark }}>
                    {p.pct}%
                  </div>
                </div>
              </div>

              {/* Day Grid */}
              <div style={{ backgroundColor: colors.paper, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.tan}` }}>
                <h3 style={{ fontFamily: 'Georgia, serif', color: colors.dark, margin: '0 0 16px 0', fontSize: '1rem' }}>📅 Calendario del Reto</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: colors.warm, padding: '4px' }}>{d}</div>
                  ))}
                  {current.completedDays.map((done, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(current.id, i)}
                      style={{
                        width: '100%', aspectRatio: '1', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        backgroundColor: done ? colors.success : colors.lightCream,
                        color: done ? colors.paper : colors.dark,
                        fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </button>
                  ))}
                </div>
                {p.pct === 100 && (
                  <div style={{
                    marginTop: '20px', padding: '16px', borderRadius: '10px', textAlign: 'center',
                    background: `linear-gradient(135deg, ${colors.accentGlow}, ${colors.successLight})`,
                  }}>
                    <span style={{ fontSize: '2rem' }}>🏆</span>
                    <p style={{ fontFamily: 'Georgia, serif', color: colors.dark, fontSize: '1.1rem', fontWeight: '600', margin: '8px 0 0 0' }}>
                      ¡Reto Completado! ¡Felicidades!
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.warm }}>
            Selecciona un reto para ver los detalles
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS PHOTOS COMPONENT
// ============================================================================

interface ProgressPhoto {
  id: string;
  date: string;
  label: string;
  category: 'Frente' | 'Lado' | 'Espalda';
  notes: string;
  weight?: number;
  bodyFat?: number;
}

function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([
    { id: 'p1', date: '2026-01-15', label: 'Inicio del programa', category: 'Frente', notes: 'Punto de partida', weight: 82.5, bodyFat: 18.0 },
    { id: 'p2', date: '2026-02-15', label: 'Mes 1', category: 'Frente', notes: 'Primeros cambios visibles', weight: 80.1, bodyFat: 16.5 },
    { id: 'p3', date: '2026-03-15', label: 'Mes 2', category: 'Frente', notes: 'Definición en abdomen', weight: 78.8, bodyFat: 15.2 },
    { id: 'p4', date: '2026-01-15', label: 'Inicio - Lateral', category: 'Lado', notes: 'Punto de partida lateral', weight: 82.5, bodyFat: 18.0 },
    { id: 'p5', date: '2026-03-15', label: 'Mes 2 - Lateral', category: 'Lado', notes: 'Mejora en postura', weight: 78.8, bodyFat: 15.2 },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | 'Frente' | 'Lado' | 'Espalda'>('Todas');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<[string | null, string | null]>([null, null]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhoto, setNewPhoto] = useState<Partial<ProgressPhoto>>({ category: 'Frente', date: new Date().toISOString().split('T')[0] });

  const filtered = selectedCategory === 'Todas' ? photos : photos.filter((p) => p.category === selectedCategory);
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const compareA = photos.find((p) => p.id === comparePhotos[0]);
  const compareB = photos.find((p) => p.id === comparePhotos[1]);

  const handleAddPhoto = () => {
    if (!newPhoto.label || !newPhoto.date) return;
    const photo: ProgressPhoto = {
      id: `p${Date.now()}`,
      date: newPhoto.date || new Date().toISOString().split('T')[0],
      label: newPhoto.label || 'Sin título',
      category: (newPhoto.category as ProgressPhoto['category']) || 'Frente',
      notes: newPhoto.notes || '',
      weight: newPhoto.weight,
      bodyFat: newPhoto.bodyFat,
    };
    setPhotos([...photos, photo]);
    setShowAddForm(false);
    setNewPhoto({ category: 'Frente', date: new Date().toISOString().split('T')[0] });
  };

  const toggleCompareSelection = (id: string) => {
    if (comparePhotos[0] === id) setComparePhotos([null, comparePhotos[1]]);
    else if (comparePhotos[1] === id) setComparePhotos([comparePhotos[0], null]);
    else if (!comparePhotos[0]) setComparePhotos([id, comparePhotos[1]]);
    else if (!comparePhotos[1]) setComparePhotos([comparePhotos[0], id]);
    else setComparePhotos([id, comparePhotos[1]]);
  };

  const cardS: React.CSSProperties = {
    backgroundColor: colors.paper,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.cream}`,
    boxShadow: '0 4px 12px rgba(61,43,31,0.06)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header + Controls */}
      <div style={{ ...cardS, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: colors.dark, margin: 0 }}>📸 Fotos de Progreso</h2>
          <p style={{ color: colors.warm, fontSize: '13px', margin: '4px 0 0' }}>Documenta tu transformación visual</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: `1px solid ${compareMode ? colors.accent : colors.cream}`,
              backgroundColor: compareMode ? `${colors.accent}15` : colors.paper, color: compareMode ? colors.accent : colors.brown,
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            {compareMode ? '✕ Salir Comparar' : '🔄 Comparar'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              backgroundColor: colors.accent, color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            + Nueva Foto
          </button>
        </div>
      </div>

      {/* Add Photo Form */}
      {showAddForm && (
        <div style={{ ...cardS, border: `2px solid ${colors.accent}20` }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: colors.dark, margin: '0 0 16px' }}>Registrar Nueva Foto</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.brown, display: 'block', marginBottom: '4px' }}>Título</label>
              <input value={newPhoto.label || ''} onChange={(e) => setNewPhoto({ ...newPhoto, label: e.target.value })}
                placeholder="Ej: Mes 3 - Frente" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.cream}`, fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.brown, display: 'block', marginBottom: '4px' }}>Fecha</label>
              <input type="date" value={newPhoto.date || ''} onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.cream}`, fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.brown, display: 'block', marginBottom: '4px' }}>Categoría</label>
              <select value={newPhoto.category || 'Frente'} onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value as ProgressPhoto['category'] })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.cream}`, fontSize: '13px', boxSizing: 'border-box' }}>
                <option value="Frente">Frente</option>
                <option value="Lado">Lado</option>
                <option value="Espalda">Espalda</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.brown, display: 'block', marginBottom: '4px' }}>Peso (kg)</label>
              <input type="number" value={newPhoto.weight || ''} onChange={(e) => setNewPhoto({ ...newPhoto, weight: parseFloat(e.target.value) || undefined })}
                placeholder="78.5" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.cream}`, fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.brown, display: 'block', marginBottom: '4px' }}>% Grasa</label>
              <input type="number" value={newPhoto.bodyFat || ''} onChange={(e) => setNewPhoto({ ...newPhoto, bodyFat: parseFloat(e.target.value) || undefined })}
                placeholder="15.2" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.cream}`, fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.brown, display: 'block', marginBottom: '4px' }}>Notas</label>
              <input value={newPhoto.notes || ''} onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                placeholder="Observaciones..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.cream}`, fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${colors.cream}`, backgroundColor: 'transparent', color: colors.brown, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
            <button onClick={handleAddPhoto} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: colors.accent, color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Guardar Registro</button>
          </div>
          <p style={{ color: colors.warm, fontSize: '11px', margin: '12px 0 0', fontStyle: 'italic' }}>💡 Las fotos se subirán desde tu dispositivo cuando la app esté en producción. Por ahora se registran los datos asociados.</p>
        </div>
      )}

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['Todas', 'Frente', 'Lado', 'Espalda'] as const).map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backgroundColor: selectedCategory === cat ? colors.accent : colors.paper,
            color: selectedCategory === cat ? '#fff' : colors.brown,
            border: `1px solid ${selectedCategory === cat ? colors.accent : colors.cream}`,
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Compare Mode */}
      {compareMode && (
        <div style={{ ...cardS, border: `2px dashed ${colors.accent}40` }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: colors.dark, margin: '0 0 16px' }}>Comparación Lado a Lado</h3>
          {compareA && compareB ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[compareA, compareB].map((photo) => (
                <div key={photo.id} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '100%', aspectRatio: '3/4', backgroundColor: colors.cream, borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                    border: `1px solid ${colors.lightTan}`,
                  }}>
                    <span style={{ fontSize: '48px' }}>📷</span>
                  </div>
                  <p style={{ fontWeight: 700, color: colors.dark, fontSize: '14px', margin: '0 0 4px' }}>{photo.label}</p>
                  <p style={{ color: colors.warm, fontSize: '12px', margin: '0 0 8px' }}>{new Date(photo.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {photo.weight && <span style={{ fontSize: '13px', color: colors.brown }}>⚖️ {photo.weight} kg</span>}
                    {photo.bodyFat && <span style={{ fontSize: '13px', color: colors.brown }}>📊 {photo.bodyFat}%</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: colors.warm, fontSize: '13px', textAlign: 'center' }}>Selecciona 2 fotos de la galería para comparar</p>
          )}
          {compareA && compareB && compareA.weight && compareB.weight && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: `${colors.accent}08`, borderRadius: '12px', border: `1px solid ${colors.accent}20` }}>
              <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: colors.dark, margin: '0 0 12px' }}>📈 Cambios Detectados</h4>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '12px', color: colors.warm }}>Peso</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '16px', color: compareB.weight <= compareA.weight ? '#7A9E3E' : '#C0544F' }}>
                    {(compareB.weight - compareA.weight).toFixed(1)} kg
                  </p>
                </div>
                {compareA.bodyFat && compareB.bodyFat && (
                  <div>
                    <span style={{ fontSize: '12px', color: colors.warm }}>% Grasa</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '16px', color: compareB.bodyFat <= compareA.bodyFat ? '#7A9E3E' : '#C0544F' }}>
                      {(compareB.bodyFat - compareA.bodyFat).toFixed(1)}%
                    </p>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: '12px', color: colors.warm }}>Tiempo entre fotos</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '16px', color: colors.dark }}>
                    {Math.round((new Date(compareB.date).getTime() - new Date(compareA.date).getTime()) / (1000 * 60 * 60 * 24))} días
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Timeline */}
      <div style={{ ...cardS }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: colors.dark, margin: '0 0 20px' }}>📅 Timeline de Transformación</h3>
        {sorted.length === 0 ? (
          <p style={{ color: colors.warm, fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>No hay fotos en esta categoría. ¡Agrega tu primera foto!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {sorted.map((photo) => {
              const isSelected = comparePhotos.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => compareMode && toggleCompareSelection(photo.id)}
                  style={{
                    borderRadius: '12px', overflow: 'hidden',
                    border: isSelected ? `3px solid ${colors.accent}` : `1px solid ${colors.cream}`,
                    cursor: compareMode ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    backgroundColor: isSelected ? `${colors.accent}08` : colors.warmWhite,
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '3/4', backgroundColor: colors.cream,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <span style={{ fontSize: '40px', opacity: 0.6 }}>📷</span>
                    <span style={{
                      position: 'absolute', top: '8px', left: '8px', backgroundColor: colors.dark, color: '#fff',
                      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px',
                    }}>
                      {photo.category}
                    </span>
                    {isSelected && (
                      <span style={{
                        position: 'absolute', top: '8px', right: '8px', backgroundColor: colors.accent, color: '#fff',
                        width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '14px', fontWeight: 700,
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontWeight: 700, color: colors.dark, fontSize: '13px', margin: '0 0 2px' }}>{photo.label}</p>
                    <p style={{ color: colors.warm, fontSize: '11px', margin: '0 0 6px' }}>
                      {new Date(photo.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {photo.weight && (
                        <span style={{ fontSize: '11px', color: colors.brown, backgroundColor: `${colors.cream}80`, padding: '2px 6px', borderRadius: '4px' }}>
                          ⚖️ {photo.weight} kg
                        </span>
                      )}
                      {photo.bodyFat && (
                        <span style={{ fontSize: '11px', color: colors.brown, backgroundColor: `${colors.cream}80`, padding: '2px 6px', borderRadius: '4px' }}>
                          📊 {photo.bodyFat}%
                        </span>
                      )}
                    </div>
                    {photo.notes && <p style={{ color: colors.warm, fontSize: '11px', margin: '6px 0 0', fontStyle: 'italic' }}>{photo.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        <div style={{ ...cardS, textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 4px' }}>📸</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: colors.dark, margin: '0 0 4px' }}>{photos.length}</p>
          <p style={{ fontSize: '12px', color: colors.warm }}>Fotos Registradas</p>
        </div>
        <div style={{ ...cardS, textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 4px' }}>📅</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: colors.dark, margin: '0 0 4px' }}>
            {photos.length >= 2 ? Math.round((new Date(sorted[sorted.length - 1]?.date || '').getTime() - new Date(sorted[0]?.date || '').getTime()) / (1000 * 60 * 60 * 24)) : 0}
          </p>
          <p style={{ fontSize: '12px', color: colors.warm }}>Días de Tracking</p>
        </div>
        <div style={{ ...cardS, textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 4px' }}>⚖️</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: colors.dark, margin: '0 0 4px' }}>
            {photos.length >= 2 && sorted[0]?.weight && sorted[sorted.length - 1]?.weight
              ? `${((sorted[sorted.length - 1]?.weight || 0) - (sorted[0]?.weight || 0)).toFixed(1)}`
              : '—'}
          </p>
          <p style={{ fontSize: '12px', color: colors.warm }}>Cambio de Peso (kg)</p>
        </div>
        <div style={{ ...cardS, textAlign: 'center' }}>
          <p style={{ fontSize: '28px', margin: '0 0 4px' }}>📊</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: colors.dark, margin: '0 0 4px' }}>
            {photos.length >= 2 && sorted[0]?.bodyFat && sorted[sorted.length - 1]?.bodyFat
              ? `${((sorted[sorted.length - 1]?.bodyFat || 0) - (sorted[0]?.bodyFat || 0)).toFixed(1)}%`
              : '—'}
          </p>
          <p style={{ fontSize: '12px', color: colors.warm }}>Cambio % Grasa</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FITNESS PAGE COMPONENT
// ============================================================================

export default function FitnessPage() {
  const [activeTab, setActiveTab] = useState<string>('entrenamiento');

  const tabs = [
    { id: 'entrenamiento', label: 'Entrenamiento Activo' },
    { id: 'volumen', label: 'Volumen Muscular' },
    { id: 'plan', label: 'Plan Semanal' },
    { id: 'records', label: 'Récords Personales' },
    { id: 'metricas', label: 'Métricas del Cuerpo' },
    { id: 'peso', label: 'Peso' },
    { id: 'pasos', label: 'Pasos' },
    { id: 'ayuno', label: 'Ayuno' },
    { id: 'retos', label: 'Retos' },
    { id: 'fotos', label: 'Fotos de Progreso' },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: colors.warmWhite, minHeight: '100vh' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            color: colors.dark,
            margin: 0,
          }}
        >
          Fitness
        </h1>
        <p style={{ color: colors.warm, fontSize: '14px', margin: '8px 0 0 0' }}>
          Tu progreso hacia tus objetivos de entrenamiento
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: `2px solid ${colors.lightTan}`,
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? colors.dark : colors.warm,
              border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${colors.accent}` : 'none',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'entrenamiento' && <WorkoutTracker />}
        {activeTab === 'volumen' && <VolumeTracker />}
        {activeTab === 'plan' && <WeeklyWorkoutPlan />}
        {activeTab === 'records' && <PRBoard />}
        {activeTab === 'metricas' && <BodyMetrics />}
        {activeTab === 'peso' && <WeightTracker />}
        {activeTab === 'pasos' && <StepsTracker />}
        {activeTab === 'ayuno' && <FastingTracker />}
        {activeTab === 'retos' && <ChallengesTracker />}
        {activeTab === 'fotos' && <ProgressPhotos />}
      </div>
    </div>
  );
}
