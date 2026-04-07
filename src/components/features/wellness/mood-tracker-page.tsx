'use client';

import { useState } from 'react';
import { useWellnessStore } from '@/stores/wellness-store';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

interface MoodEntry {
  date: number;
  mood: number;
}

interface HistoricalMood {
  day: number;
  mood: number | null;
}

interface SleepEntry {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  duration: number;
  dreamJournal: string;
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: 'Diario' | 'Semanal';
  time: string;
  taken: boolean;
}

interface JournalEntry {
  date: string;
  mood: string;
  reflection: string;
  wordCount: number;
}

interface GratitudeEntry {
  date: string;
  items: string[];
}

const MoodTrackerPage = () => {
  const [activeTab, setActiveTab] = useState<'mood' | 'sleep' | 'hydration' | 'medication' | 'journal' | 'gratitude' | 'period' | 'symptoms' | 'freewrite' | 'appointments'>('mood');

  const { saveMoodToday, saveSleepToday, savingMood, savingSleep } = useWellnessStore();

  // MOOD TAB STATE
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleSaveMood = async () => {
    if (!selectedMood) return;
    await saveMoodToday(selectedMood, selectedFactors, notes);
    alert('¡Ánimo registrado!');
  };

  const factors = ['Ejercicio', 'Sueño', 'Social', 'Trabajo', 'Clima', 'Comida', 'Salud', 'Meditación', 'Naturaleza', 'Música'];

  const toggleFactor = (factor: string) => {
    setSelectedFactors(prev =>
      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
    );
  };

  // Sample 30-day mood data
  const moodHistory: HistoricalMood[] = [
    { day: 1, mood: 6 }, { day: 2, mood: 7 }, { day: 3, mood: 5 }, { day: 4, mood: 8 }, { day: 5, mood: 7 },
    { day: 6, mood: 6 }, { day: 7, mood: 9 }, { day: 8, mood: 7 }, { day: 9, mood: 6 }, { day: 10, mood: 8 },
    { day: 11, mood: null }, { day: 12, mood: 5 }, { day: 13, mood: 4 }, { day: 14, mood: 6 }, { day: 15, mood: 8 },
    { day: 16, mood: 7 }, { day: 17, mood: 9 }, { day: 18, mood: 6 }, { day: 19, mood: 7 }, { day: 20, mood: 8 },
    { day: 21, mood: null }, { day: 22, mood: 6 }, { day: 23, mood: 7 }, { day: 24, mood: 5 }, { day: 25, mood: 9 },
    { day: 26, mood: 8 }, { day: 27, mood: 7 }, { day: 28, mood: 8 }, { day: 29, mood: 6 }, { day: 30, mood: 7 },
  ];

  // Chart data for last 30 days (line chart simulation)
  const moodChartData = moodHistory.filter(h => h.mood !== null) as (HistoricalMood & { mood: number })[];

  // SLEEP TAB STATE
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([
    { date: '2026-04-04', bedtime: '23:30', wakeTime: '07:15', quality: 4, duration: 7.75, dreamJournal: 'Sueño tranquilo, descanso profundo' },
    { date: '2026-04-03', bedtime: '00:15', wakeTime: '07:45', quality: 3, duration: 7.5, dreamJournal: 'Interrupciones durante la noche' },
    { date: '2026-04-02', bedtime: '23:00', wakeTime: '06:45', quality: 5, duration: 7.75, dreamJournal: 'Excelente descanso, soñé vivamente' },
    { date: '2026-04-01', bedtime: '23:45', wakeTime: '07:30', quality: 4, duration: 7.75, dreamJournal: 'Buena noche de sueño' },
    { date: '2026-03-31', bedtime: '00:30', wakeTime: '08:00', quality: 2, duration: 7.5, dreamJournal: 'Poco profundo, muchas interrupciones' },
    { date: '2026-03-30', bedtime: '23:15', wakeTime: '07:00', quality: 5, duration: 7.75, dreamJournal: 'Descanso reparador' },
    { date: '2026-03-29', bedtime: '23:00', wakeTime: '06:30', quality: 4, duration: 7.5, dreamJournal: 'Noche normal, sueño estable' },
  ]);
  const [sleepBedtime, setSleepBedtime] = useState('23:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('07:15');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [dreamJournal, setDreamJournal] = useState('');

  const handleSaveSleep = async () => {
    const [bH, bM] = sleepBedtime.split(':').map(Number);
    const [wH, wM] = sleepWakeTime.split(':').map(Number);
    let dur = (wH + wM / 60) - (bH + bM / 60);
    if (dur < 0) dur += 24;
    await saveSleepToday(sleepBedtime, sleepWakeTime, sleepQuality, parseFloat(dur.toFixed(2)), dreamJournal);
    alert('¡Sueño registrado!');
  };

  // HYDRATION TAB STATE
  const [hydrationGoal, setHydrationGoal] = useState(2500);
  const [hydrationToday, setHydrationToday] = useState(1750);
  const [hydrationStreak, setHydrationStreak] = useState(12);
  const [hydrationHistory] = useState([
    { day: 'Lun', ml: 2500 }, { day: 'Mar', ml: 2200 }, { day: 'Mié', ml: 2650 },
    { day: 'Jue', ml: 2500 }, { day: 'Vie', ml: 2400 }, { day: 'Sáb', ml: 2850 },
    { day: 'Dom', ml: 2500 },
  ]);

  // MEDICATION TAB STATE
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: '1', name: 'Vitamina D', dosage: '2000 IU', frequency: 'Diario', time: '08:00', taken: true },
    { id: '2', name: 'Complejo B', dosage: '1 tableta', frequency: 'Diario', time: '08:30', taken: true },
    { id: '3', name: 'Omega-3', dosage: '1000 mg', frequency: 'Diario', time: '12:00', taken: false },
    { id: '4', name: 'Magnesio', dosage: '400 mg', frequency: 'Diario', time: '21:00', taken: false },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');

  const toggleMedicationTaken = (id: string) => {
    setMedications(prev =>
      prev.map(med => med.id === id ? { ...med, taken: !med.taken } : med)
    );
  };

  // JOURNAL TAB STATE
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    { date: '2026-04-04', mood: '😊', reflection: 'Día productivo. Completé mis tareas importantes y pasé tiempo con la familia. Mejores decisiones hoy.', wordCount: 18 },
    { date: '2026-04-03', mood: '😐', reflection: 'Día neutral. Algunas dificultades en el trabajo pero logré resolverlas. Buena sesión de meditación.', wordCount: 17 },
    { date: '2026-04-02', mood: '😄', reflection: 'Excelente día. Ejercicio en la mañana, almuerzo con amigos, aprendí algo nuevo. Muy satisfecho.', wordCount: 17 },
  ]);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalMoodTag, setJournalMoodTag] = useState('😊');
  const [journalText, setJournalText] = useState('');

  // GRATITUDE TAB STATE
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([
    { date: '2026-04-04', items: ['Mi familia', 'Salud', 'Oportunidades'] },
    { date: '2026-04-03', items: ['Amigos', 'Hogar cómodo', 'Trabajo'] },
    { date: '2026-04-02', items: ['Educación', 'Naturaleza', 'Tiempo'] },
  ]);
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');

  // UTILITY FUNCTIONS
  const getMoodColor = (mood: number | null) => {
    if (mood === null) return C.lightTan;
    if (mood <= 3) return C.danger;
    if (mood <= 5) return C.warning;
    if (mood <= 7) return C.accent;
    return C.success;
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😕';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '😊';
    return '😄';
  };

  const getQualityEmoji = (quality: number) => {
    if (quality <= 2) return '😴';
    if (quality <= 3) return '😑';
    if (quality <= 4) return '😊';
    return '😴✨';
  };

  const averageMood = moodChartData.length > 0
    ? (moodChartData.reduce((sum, d) => sum + d.mood, 0) / moodChartData.length).toFixed(1)
    : '0';

  const recordedDays = moodChartData.length;
  const totalDays = 30;

  // SLEEP CALCULATIONS
  const averageSleepDuration = sleepEntries.length > 0
    ? (sleepEntries.reduce((sum, e) => sum + e.duration, 0) / sleepEntries.length).toFixed(1)
    : '0';

  const averageSleepQuality = sleepEntries.length > 0
    ? (sleepEntries.reduce((sum, e) => sum + e.quality, 0) / sleepEntries.length).toFixed(1)
    : '0';

  // MEDICATION ADHERENCE
  const medicationTaken = medications.filter(m => m.taken).length;
  const medicationAdherence = medications.length > 0
    ? Math.round((medicationTaken / medications.length) * 100)
    : 0;

  // HYDRATION CALCULATIONS
  const hydrationPercentage = Math.min(Math.round((hydrationToday / hydrationGoal) * 100), 100);

  // JOURNAL WORD COUNT
  const journalWordCount = journalText.trim().split(/\s+/).length;

  // TAB NAVIGATION
  const tabConfig = [
    { id: 'mood' as const, label: '🎭 Estado de Ánimo' },
    { id: 'sleep' as const, label: '😴 Sueño' },
    { id: 'hydration' as const, label: '💧 Hidratación' },
    { id: 'medication' as const, label: '💊 Medicación' },
    { id: 'journal' as const, label: '📔 Diario' },
    { id: 'gratitude' as const, label: '🙏 Gratitud' },
    { id: 'period' as const, label: '🩸 Ciclo' },
    { id: 'symptoms' as const, label: '🩺 Síntomas' },
    { id: 'freewrite' as const, label: '🧠 Free Your Mind' },
    { id: 'appointments' as const, label: '🏥 Citas Médicas' },
  ];

  return (
    <div style={{ backgroundColor: C.paper, minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: C.dark, margin: '0', fontFamily: 'Georgia, serif' }}>
          Bienestar & Salud
        </h1>
        <p style={{ fontSize: '1rem', color: C.warm, margin: '0.5rem 0 0 0' }}>
          Rastrear tu estado de ánimo, sueño, hidratación y más
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? C.accent : C.lightCream,
              color: activeTab === tab.id ? C.paper : C.dark,
              border: `2px solid ${activeTab === tab.id ? C.accent : C.tan}`,
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {/* === MOOD TAB === */}
        {activeTab === 'mood' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Mood Selection */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
                  🤔 ¿Cómo te sientes hoy?
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                    const emoji = getMoodEmoji(num);
                    const isSelected = selectedMood === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setSelectedMood(num)}
                        style={{
                          fontSize: '2.5rem',
                          backgroundColor: isSelected ? C.accentGlow : 'transparent',
                          border: `3px solid ${isSelected ? C.accent : C.tan}`,
                          borderRadius: '12px',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
                <p style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: '600', color: C.warm, margin: '0' }}>
                  {selectedMood ? `Ánimo seleccionado: ${selectedMood}/10` : 'Selecciona tu ánimo del día'}
                </p>
              </div>

              {/* Factors */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  ⚡ ¿Qué factores influyeron?
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                  {factors.map(factor => {
                    const isSelected = selectedFactors.includes(factor);
                    return (
                      <button
                        key={factor}
                        onClick={() => toggleFactor(factor)}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: isSelected ? C.accent : C.cream,
                          color: isSelected ? C.paper : C.dark,
                          border: `2px solid ${isSelected ? C.accent : C.tan}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                        }}
                      >
                        {factor}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0', fontFamily: 'Georgia, serif' }}>
                  📝 Notas (opcional)
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="¿Algo más que quieras añadir?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${C.tan}`,
                    borderRadius: '6px',
                    backgroundColor: C.paper,
                    color: C.dark,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Heatmap Calendar */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📅 Mapa de Ánimo - Abril
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                    <div
                      key={day}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: C.dark,
                        padding: '0.5rem 0',
                      }}
                    >
                      {day}
                    </div>
                  ))}
                  {moodHistory.map(entry => (
                    <div
                      key={entry.day}
                      style={{
                        aspectRatio: '1',
                        backgroundColor: getMoodColor(entry.mood),
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: C.dark,
                      }}
                      title={entry.mood ? `Día ${entry.day}: Ánimo ${entry.mood}/10` : `Día ${entry.day}: Sin registrar`}
                    >
                      {entry.mood ? entry.mood : '—'}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: C.danger, borderRadius: '4px' }} />
                    <span style={{ color: C.dark }}>Bajo (1-3)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: C.warning, borderRadius: '4px' }} />
                    <span style={{ color: C.dark }}>Neutral (4-6)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: C.success, borderRadius: '4px' }} />
                    <span style={{ color: C.dark }}>Positivo (7-10)</span>
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📈 Tendencia (Últimos 30 días)
                </h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '250px', gap: '0.25rem' }}>
                  {moodChartData.map((entry, idx) => {
                    const height = (entry.mood / 10) * 200;
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: `${height}px`,
                          backgroundColor: getMoodColor(entry.mood),
                          borderRadius: '4px 4px 0 0',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          opacity: 0.8,
                        }}
                        title={`Día ${entry.day}: ${entry.mood}/10`}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem', color: C.warm }}>
                  <span>Día 1</span>
                  <span>Día 30</span>
                </div>
              </div>
            </div>

            {/* Sidebar - Mood Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.accentGlow, border: `2px solid ${C.accent}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  📊 Ánimo Promedio
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.accent, margin: '0' }}>
                  {averageMood}/10
                </p>
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  🌟 Mejor Día
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: C.success, margin: '0' }}>
                  Sábado
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0.25rem 0 0 0' }}>
                  Ánimo: 9/10
                </p>
              </div>

              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  ⚡ Factor Más Positivo
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: C.info, margin: '0' }}>
                  Ejercicio
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0.25rem 0 0 0' }}>
                  Registrado 15 veces
                </p>
              </div>

              <div style={{ backgroundColor: C.warningLight, border: `2px solid ${C.warning}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  📋 Días Registrados
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.warning, margin: '0' }}>
                  {recordedDays}/{totalDays}
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0.25rem 0 0 0' }}>
                  {Math.round((recordedDays / totalDays) * 100)}% completado
                </p>
              </div>

              <div style={{ backgroundColor: C.lightTan, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0' }}>
                  💡 Insight
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0', lineHeight: '1.5' }}>
                  Los días que haces ejercicio, tu ánimo es <strong>2.1 puntos más alto</strong> en promedio.
                </p>
                <p style={{ fontSize: '0.75rem', color: C.warm, margin: '0.5rem 0 0 0' }}>
                  Basado en 25 registros
                </p>
              </div>

              <button
                style={{
                  backgroundColor: C.accent,
                  color: C.paper,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: savingMood ? 'not-allowed' : 'pointer',
                  marginTop: 'auto',
                  opacity: savingMood ? 0.7 : 1,
                }}
                onClick={handleSaveMood}
                disabled={savingMood}
              >
                {savingMood ? 'Guardando...' : '✅ Registrar Ánimo'}
              </button>
            </div>
          </div>
        )}

        {/* === SLEEP TAB === */}
        {activeTab === 'sleep' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Sleep Input */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  Registrar Sueño
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                      🛏️ Hora de Sueño
                    </label>
                    <input
                      type="time"
                      value={sleepBedtime}
                      onChange={(e) => setSleepBedtime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${C.tan}`,
                        borderRadius: '6px',
                        backgroundColor: C.paper,
                        color: C.dark,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                      ☀️ Hora de Despertar
                    </label>
                    <input
                      type="time"
                      value={sleepWakeTime}
                      onChange={(e) => setSleepWakeTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${C.tan}`,
                        borderRadius: '6px',
                        backgroundColor: C.paper,
                        color: C.dark,
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.75rem' }}>
                    ⭐ Calidad del Sueño: {sleepQuality}/5 {getQualityEmoji(sleepQuality)}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    {[1, 2, 3, 4, 5].map(quality => (
                      <button
                        key={quality}
                        onClick={() => setSleepQuality(quality)}
                        style={{
                          width: '50px',
                          height: '50px',
                          backgroundColor: sleepQuality === quality ? C.accent : C.cream,
                          color: sleepQuality === quality ? C.paper : C.dark,
                          border: `2px solid ${sleepQuality === quality ? C.accent : C.tan}`,
                          borderRadius: '8px',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                    💭 Diario de Sueños
                  </label>
                  <textarea
                    value={dreamJournal}
                    onChange={(e) => setDreamJournal(e.target.value)}
                    placeholder="Describe tus sueños o sensaciones de la noche..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${C.tan}`,
                      borderRadius: '6px',
                      backgroundColor: C.paper,
                      color: C.dark,
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      minHeight: '100px',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  style={{
                    backgroundColor: C.accent,
                    color: C.paper,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: savingSleep ? 'not-allowed' : 'pointer',
                    opacity: savingSleep ? 0.7 : 1,
                  }}
                  onClick={handleSaveSleep}
                  disabled={savingSleep}
                >
                  {savingSleep ? 'Guardando...' : '✅ Guardar Sueño'}
                </button>
              </div>

              {/* Sleep History Chart */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📊 Duración de Sueño (Últimos 7 días)
                </h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '250px', gap: '0.75rem', marginBottom: '1rem' }}>
                  {sleepEntries.slice(0, 7).map((entry, idx) => {
                    const height = (entry.duration / 10) * 200;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${height}px`,
                            backgroundColor: C.info,
                            borderRadius: '6px 6px 0 0',
                            cursor: 'pointer',
                          }}
                          title={`${entry.duration}h`}
                        />
                        <span style={{ fontSize: '0.75rem', color: C.dark, marginTop: '0.5rem', fontWeight: '600' }}>
                          {entry.date.split('-')[2]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.85rem', color: C.warm, textAlign: 'center', margin: '0' }}>
                  Promedio: {averageSleepDuration}h
                </p>
              </div>
            </div>

            {/* Sleep Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  ⏱️ Duración Promedio
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.info, margin: '0' }}>
                  {averageSleepDuration}h
                </p>
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  ⭐ Calidad Promedio
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.success, margin: '0' }}>
                  {averageSleepQuality}/5
                </p>
              </div>

              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0' }}>
                  📋 Últimas Noches
                </p>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {sleepEntries.map((entry, idx) => (
                    <div key={idx} style={{ padding: '0.75rem 0', borderBottom: idx < sleepEntries.length - 1 ? `1px solid ${C.tan}` : 'none' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', color: C.dark, margin: '0' }}>
                        {entry.date}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: C.warm, margin: '0.25rem 0 0 0' }}>
                        {entry.duration}h • {entry.quality}/5 ⭐
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === HYDRATION TAB === */}
        {activeTab === 'hydration' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Hydration Progress */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  💧 Hidratación Diaria
                </h2>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '150px',
                    height: '300px',
                    backgroundColor: C.cream,
                    border: `2px solid ${C.info}`,
                    borderRadius: '12px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${hydrationPercentage}%`,
                        backgroundColor: C.info,
                        transition: 'height 0.3s',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: C.dark,
                      zIndex: 10,
                    }}>
                      {hydrationToday}ml
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: C.warm, margin: '1rem 0 0 0', fontWeight: '600' }}>
                    Meta: {hydrationGoal}ml ({hydrationPercentage}%)
                  </p>
                </div>

                {/* Quick Add Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setHydrationToday(prev => prev + 250)}
                    style={{
                      backgroundColor: C.info,
                      color: C.paper,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    +250ml
                  </button>
                  <button
                    onClick={() => setHydrationToday(prev => prev + 500)}
                    style={{
                      backgroundColor: C.info,
                      color: C.paper,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    +500ml
                  </button>
                  <button
                    onClick={() => setHydrationToday(prev => Math.max(0, prev - 250))}
                    style={{
                      backgroundColor: C.warning,
                      color: C.paper,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    -250ml
                  </button>
                </div>

                <button
                  style={{
                    backgroundColor: C.accent,
                    color: C.paper,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  ✅ Guardar Progreso
                </button>
              </div>

              {/* Weekly Trend */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📊 Últimos 7 Días
                </h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '250px', gap: '0.75rem' }}>
                  {hydrationHistory.map((day, idx) => {
                    const height = (day.ml / 3000) * 200;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${height}px`,
                            backgroundColor: C.success,
                            borderRadius: '6px 6px 0 0',
                          }}
                          title={`${day.ml}ml`}
                        />
                        <span style={{ fontSize: '0.75rem', color: C.dark, marginTop: '0.5rem', fontWeight: '600' }}>
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hydration Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  🎯 Progreso Hoy
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.info, margin: '0' }}>
                  {hydrationPercentage}%
                </p>
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  🔥 Racha
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.success, margin: '0' }}>
                  {hydrationStreak}
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0.25rem 0 0 0' }}>
                  días seguidos
                </p>
              </div>

              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0' }}>
                  💡 Consejos
                </p>
                <ul style={{ margin: '0', paddingLeft: '1rem', fontSize: '0.85rem', color: C.dark, lineHeight: '1.6' }}>
                  <li>Bebe 250ml cada 2 horas</li>
                  <li>Aumenta el consumo en el ejercicio</li>
                  <li>Bebe agua antes de comer</li>
                  <li>Mantén una botella contigo</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* === MEDICATION TAB === */}
        {activeTab === 'medication' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Medication List */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  💊 Mis Medicamentos
                </h2>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {medications.map((med) => (
                    <div key={med.id} style={{
                      backgroundColor: C.paper,
                      border: `1px solid ${C.tan}`,
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}>
                      <input
                        type="checkbox"
                        checked={med.taken}
                        onChange={() => toggleMedicationTaken(med.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: C.dark, margin: '0' }}>
                          {med.name}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0.25rem 0 0 0' }}>
                          {med.dosage} • {med.frequency} • {med.time}
                        </p>
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.4rem 0.8rem',
                        backgroundColor: med.taken ? C.successLight : C.warningLight,
                        color: C.dark,
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}>
                        {med.taken ? '✅ Tomado' : '⏳ Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Medication */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  ➕ Añadir Medicamento
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: `1px solid ${C.tan}`,
                      borderRadius: '6px',
                      backgroundColor: C.paper,
                      color: C.dark,
                      fontSize: '0.9rem',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: `1px solid ${C.tan}`,
                      borderRadius: '6px',
                      backgroundColor: C.paper,
                      color: C.dark,
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <button
                  style={{
                    backgroundColor: C.accent,
                    color: C.paper,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  ➕ Añadir
                </button>
              </div>

              {/* Weekly Adherence Chart */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📊 Adherencia Semanal
                </h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '200px', gap: '0.5rem' }}>
                  {[85, 90, 95, 75, 100, 80, 90].map((adherence, idx) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${(adherence / 100) * 150}px`,
                          backgroundColor: adherence >= 90 ? C.success : adherence >= 75 ? C.warning : C.danger,
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <span style={{ fontSize: '0.7rem', color: C.dark, marginTop: '0.5rem', fontWeight: '600' }}>
                        D{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Medication Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  🎯 Adherencia Hoy
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.info, margin: '0' }}>
                  {medicationAdherence}%
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0.25rem 0 0 0' }}>
                  {medicationTaken}/{medications.length}
                </p>
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  📋 Medicamentos
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.success, margin: '0' }}>
                  {medications.length}
                </p>
              </div>

              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0' }}>
                  📌 Recordatorios
                </p>
                <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0', lineHeight: '1.6' }}>
                  Configura notificaciones para no olvidar tus medicamentos. Mantén un registro diario de tu adherencia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* === JOURNAL TAB === */}
        {activeTab === 'journal' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Journal Entry */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  📔 Nueva Entrada
                </h2>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                    📅 Fecha
                  </label>
                  <input
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${C.tan}`,
                      borderRadius: '6px',
                      backgroundColor: C.paper,
                      color: C.dark,
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.75rem' }}>
                    😊 Etiqueta de Ánimo
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {['😢', '😕', '😐', '😊', '😄'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setJournalMoodTag(emoji)}
                        style={{
                          fontSize: '2rem',
                          backgroundColor: journalMoodTag === emoji ? C.accentGlow : C.cream,
                          border: `2px solid ${journalMoodTag === emoji ? C.accent : C.tan}`,
                          borderRadius: '8px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                    ✍️ Reflexión
                  </label>
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="¿Cómo te fue hoy? ¿Qué aprendiste? ¿Cómo te sientes?"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${C.tan}`,
                      borderRadius: '6px',
                      backgroundColor: C.paper,
                      color: C.dark,
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      minHeight: '150px',
                      resize: 'none',
                    }}
                  />
                  <p style={{ fontSize: '0.8rem', color: C.warm, margin: '0.5rem 0 0 0' }}>
                    {journalWordCount} palabras
                  </p>
                </div>

                <button
                  style={{
                    backgroundColor: C.accent,
                    color: C.paper,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  ✅ Guardar Entrada
                </button>
              </div>

              {/* Journal History */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📚 Historial
                </h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {journalEntries.map((entry, idx) => (
                    <div key={idx} style={{ padding: '0.75rem 0', borderBottom: idx < journalEntries.length - 1 ? `1px solid ${C.tan}` : 'none' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0' }}>
                        {entry.mood} {entry.date}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0.25rem 0 0 0' }}>
                        {entry.reflection.substring(0, 60)}...
                      </p>
                      <p style={{ fontSize: '0.75rem', color: C.tan, margin: '0.25rem 0 0 0' }}>
                        {entry.wordCount} palabras
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Journal Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  📝 Total de Entradas
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.info, margin: '0' }}>
                  {journalEntries.length}
                </p>
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  📊 Palabras Totales
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.success, margin: '0' }}>
                  {journalEntries.reduce((sum, e) => sum + e.wordCount, 0)}
                </p>
              </div>

              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0' }}>
                  💡 Promedio por Entrada
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: C.accent, margin: '0' }}>
                  {journalEntries.length > 0 ? Math.round(journalEntries.reduce((sum, e) => sum + e.wordCount, 0) / journalEntries.length) : 0}
                </p>
                <p style={{ fontSize: '0.8rem', color: C.warm, margin: '0.5rem 0 0 0' }}>
                  palabras
                </p>
              </div>
            </div>
          </div>
        )}

        {/* === GRATITUDE TAB === */}
        {activeTab === 'gratitude' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Gratitude Entry */}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  🙏 Hoy estoy agradecido por...
                </h2>
                <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {[
                    { num: 1, value: gratitude1, setter: setGratitude1, prompt: '¿Qué fue lo mejor hoy?' },
                    { num: 2, value: gratitude2, setter: setGratitude2, prompt: '¿Quién te ayudó o inspiró?' },
                    { num: 3, value: gratitude3, setter: setGratitude3, prompt: '¿Qué lección aprendiste?' },
                  ].map((item) => (
                    <div key={item.num}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                        {item.num}. {item.prompt}
                      </label>
                      <input
                        type="text"
                        placeholder={`Entrada ${item.num} de gratitud...`}
                        value={item.value}
                        onChange={(e) => item.setter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${C.tan}`,
                          borderRadius: '6px',
                          backgroundColor: C.paper,
                          color: C.dark,
                          fontSize: '0.95rem',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  style={{
                    backgroundColor: C.accent,
                    color: C.paper,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  ✅ Guardar Gratitud
                </button>
              </div>

              {/* Gratitude History */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📜 Historial
                </h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {gratitudeEntries.map((entry, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: C.paper, borderRadius: '6px', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', color: C.warm, margin: '0 0 0.5rem 0' }}>
                        {entry.date}
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: C.dark }}>
                        {entry.items.map((item, iidx) => (
                          <li key={iidx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gratitude Heatmap */}
              <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                  📅 Mapa de Gratitud - Abril
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                    <div key={day} style={{
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: C.dark,
                      padding: '0.5rem 0',
                    }}>
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const hasEntry = gratitudeEntries.some(e => e.date === `2026-04-${String(idx + 1).padStart(2, '0')}`);
                    return (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          backgroundColor: hasEntry ? C.success : C.cream,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          color: C.dark,
                          cursor: 'pointer',
                        }}
                        title={hasEntry ? `${idx + 1}/4 - Registrado` : `${idx + 1}/4 - Sin registrar`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gratitude Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  🔥 Racha
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: C.info, margin: '0' }}>
                  8
                </p>
                <p style={{ fontSize: '0.85rem', color: C.dark, margin: '0.25rem 0 0 0' }}>
                  días seguidos
                </p>
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                  📊 Total de Entradas
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.success, margin: '0' }}>
                  {gratitudeEntries.length}
                </p>
              </div>

              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0' }}>
                  🏆 Categorías Principales
                </p>
                <div style={{ fontSize: '0.85rem', color: C.dark, lineHeight: '1.8' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Familia:</strong> 12 veces
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Salud:</strong> 8 veces
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Amigos:</strong> 6 veces
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === PERIOD TRACKER TAB === */}
        {activeTab === 'period' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div style={{ backgroundColor: C.dangerLight, border: `2px solid ${C.danger}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: C.danger, fontWeight: '600', marginBottom: '0.5rem' }}>Último Período</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: C.dark, fontFamily: 'Georgia, serif' }}>15 Mar 2026</div>
              </div>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: C.info, fontWeight: '600', marginBottom: '0.5rem' }}>Próximo Estimado</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: C.dark, fontFamily: 'Georgia, serif' }}>12 Abr 2026</div>
              </div>
              <div style={{ backgroundColor: C.warningLight, border: `2px solid ${C.warning}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: C.warning, fontWeight: '600', marginBottom: '0.5rem' }}>Duración Promedio</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: C.dark, fontFamily: 'Georgia, serif' }}>28 días</div>
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                📅 Calendario de Ciclo — Abril 2026
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: C.warm, padding: '4px' }}>{d}</div>
                ))}
                {([...Array.from({ length: 2 }, () => null as number | null), ...Array.from({ length: 30 }, (_, i) => i + 1)] as (number | null)[]).map((day, idx) => {
                  const isPeriod = day !== null && day >= 12 && day <= 16;
                  const isFertile = day !== null && day >= 22 && day <= 26;
                  const isOvulation = day === 24;
                  return (
                    <div key={idx} style={{
                      textAlign: 'center', padding: '8px 4px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: day ? '500' : '400',
                      backgroundColor: isOvulation ? C.accentGlow : isPeriod ? C.dangerLight : isFertile ? C.infoLight : day ? C.paper : 'transparent',
                      color: isPeriod ? C.danger : isOvulation ? C.accent : C.dark,
                      border: day === 5 ? `2px solid ${C.accent}` : '1px solid transparent',
                    }}>
                      {day || ''}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: C.warm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.dangerLight }} /> Período</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.infoLight }} /> Ventana fértil</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.accentGlow }} /> Ovulación</div>
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Síntomas del Ciclo
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['Cólicos', 'Hinchazón', 'Dolor de cabeza', 'Fatiga', 'Cambios de humor', 'Acné', 'Antojos', 'Sensibilidad'].map(symptom => (
                  <button key={symptom} style={{ padding: '10px', backgroundColor: C.lightCream, border: `1px solid ${C.tan}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: C.dark, transition: 'all 0.2s' }}>
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>Historial</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: C.warm }}>Inicio</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: C.warm }}>Duración</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: C.warm }}>Ciclo</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: C.warm }}>Síntomas</th>
                </tr></thead>
                <tbody>
                  {[
                    { start: '15 Mar', dur: '5 días', cycle: '28 días', symptoms: 'Cólicos, Fatiga' },
                    { start: '15 Feb', dur: '4 días', cycle: '29 días', symptoms: 'Leve' },
                    { start: '17 Ene', dur: '5 días', cycle: '28 días', symptoms: 'Cólicos, Hinchazón' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{row.start}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm, textAlign: 'center' }}>{row.dur}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm, textAlign: 'center' }}>{row.cycle}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.symptoms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === SYMPTOM TRACKER TAB === */}
        {activeTab === 'symptoms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Registrar Síntoma
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Síntoma</label>
                  <select style={{ width: '100%', padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option>Dolor de cabeza</option><option>Dolor de espalda</option><option>Fatiga</option><option>Náuseas</option><option>Mareo</option><option>Dolor muscular</option><option>Congestión</option><option>Tos</option><option>Insomnio</option><option>Ansiedad</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Intensidad (1-10)</label>
                  <input type="number" min="1" max="10" defaultValue="5" style={{ width: '100%', padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Duración</label>
                  <select style={{ width: '100%', padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option>Menos de 1 hora</option><option>1-3 horas</option><option>3-6 horas</option><option>Todo el día</option><option>Varios días</option>
                  </select>
                </div>
                <button style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  Registrar
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Historial de Síntomas
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Fecha</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Síntoma</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Intensidad</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Duración</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Notas</th>
                </tr></thead>
                <tbody>
                  {[
                    { date: '5 Abr', symptom: 'Dolor de cabeza', intensity: 6, dur: '3-6 horas', notes: 'Después de trabajo intenso' },
                    { date: '4 Abr', symptom: 'Fatiga', intensity: 4, dur: 'Todo el día', notes: 'Dormí mal' },
                    { date: '3 Abr', symptom: 'Dolor muscular', intensity: 7, dur: '1-3 horas', notes: 'Post-entrenamiento piernas' },
                    { date: '1 Abr', symptom: 'Congestión', intensity: 3, dur: 'Todo el día', notes: 'Cambio de clima' },
                    { date: '30 Mar', symptom: 'Ansiedad', intensity: 5, dur: '3-6 horas', notes: 'Deadline de proyecto' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{row.date}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '500', color: C.dark }}>{row.symptom}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: row.intensity >= 7 ? C.dangerLight : row.intensity >= 4 ? C.warningLight : C.successLight, color: row.intensity >= 7 ? C.danger : row.intensity >= 4 ? C.warning : C.success }}>
                          {row.intensity}/10
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.dur}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1rem', fontSize: '0.85rem', color: C.info }}>
              💡 Correlación detectada: Los días con dolor de cabeza coinciden con menos de 6 horas de sueño. Considera mejorar tu higiene del sueño.
            </div>
          </div>
        )}

        {/* === FREE YOUR MIND TAB === */}
        {activeTab === 'freewrite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: C.dark, margin: '0 0 0.5rem 0', fontFamily: 'Georgia, serif' }}>
                Libera Tu Mente
              </h2>
              <p style={{ fontSize: '0.9rem', color: C.warm, margin: '0 0 1.5rem 0' }}>
                Escribe sin filtro, sin estructura, sin juicio. Solo deja que tus pensamientos fluyan.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {[5, 10, 15].map(min => (
                  <button key={min} style={{ padding: '8px 20px', backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: C.dark }}>
                    {min} min
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Empieza a escribir lo que sea que tengas en mente..."
                style={{
                  width: '100%', minHeight: '300px', padding: '1.5rem', border: `2px solid ${C.lightTan}`,
                  borderRadius: '12px', fontSize: '1rem', lineHeight: '1.8', resize: 'vertical',
                  fontFamily: 'Georgia, serif', color: C.dark, backgroundColor: C.paper,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: C.warm }}>0 palabras</span>
                <button style={{ padding: '10px 24px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                  Guardar Entrada
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Entradas Anteriores
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { date: '4 Abr 2026', words: 342, time: '10 min' },
                  { date: '2 Abr 2026', words: 156, time: '5 min' },
                  { date: '31 Mar 2026', words: 523, time: '15 min' },
                  { date: '28 Mar 2026', words: 278, time: '10 min' },
                ].map((entry, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: C.paper, borderRadius: '8px', border: `1px solid ${C.cream}` }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark }}>{entry.date}</span>
                      <span style={{ fontSize: '0.8rem', color: C.warm, marginLeft: '12px' }}>({entry.time})</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: C.warm }}>{entry.words} palabras</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === MEDICAL APPOINTMENTS TAB === */}
        {activeTab === 'appointments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ padding: '10px 20px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                + Nueva Cita
              </button>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Próximas Citas
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { doctor: 'Dr. García', specialty: 'Medicina General', date: '10 Abr 2026', time: '10:00', location: 'Clínica Central', notes: 'Chequeo anual' },
                  { doctor: 'Dra. López', specialty: 'Dermatología', date: '18 Abr 2026', time: '15:30', location: 'Hospital Sur', notes: 'Revisión lunar' },
                  { doctor: 'Dr. Martínez', specialty: 'Odontología', date: '25 Abr 2026', time: '09:00', location: 'Clínica Dental Smile', notes: 'Limpieza semestral' },
                ].map((apt, i) => (
                  <div key={i} style={{ backgroundColor: C.paper, border: `1px solid ${C.cream}`, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: C.dark }}>{apt.doctor}</div>
                        <div style={{ fontSize: '0.8rem', color: C.warm }}>{apt.specialty}</div>
                      </div>
                      <span style={{ backgroundColor: C.infoLight, color: C.info, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', height: 'fit-content' }}>
                        Pendiente
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: C.dark, marginBottom: '4px' }}>📅 {apt.date} a las {apt.time}</div>
                    <div style={{ fontSize: '0.85rem', color: C.warm, marginBottom: '4px' }}>📍 {apt.location}</div>
                    <div style={{ fontSize: '0.85rem', color: C.warm }}>📝 {apt.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Historial de Citas
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Fecha</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Doctor</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Especialidad</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>Resultado</th>
                </tr></thead>
                <tbody>
                  {[
                    { date: '15 Mar 2026', doctor: 'Dr. García', specialty: 'General', result: 'Todo en orden, análisis de sangre normal' },
                    { date: '20 Feb 2026', doctor: 'Dra. Ruiz', specialty: 'Oftalmología', result: 'Vista estable, nueva receta de lentes' },
                    { date: '10 Ene 2026', doctor: 'Dr. Torres', specialty: 'Traumatología', result: 'Recuperación completa rodilla derecha' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{row.date}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '500', color: C.dark }}>{row.doctor}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.specialty}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodTrackerPage;
