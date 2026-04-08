'use client';

import { useState, useEffect } from 'react';
import { useWellnessStore } from '@/stores/wellness-store';
import { useAppStore, type WellnessTab } from '@/stores/app-store';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

// ── Hydration palette: pastel blue ──────────────────────────────────────────
function hydrationColor(pct: number): string {
  if (pct <= 0)   return '#F5EDE3';
  if (pct < 25)   return '#E8F4FD';
  if (pct < 50)   return '#BDDFF5';
  if (pct < 75)   return '#7DC3EA';
  if (pct < 100)  return '#4AAAD6';
  return '#2E8BC0';
}

// ── Medication palette: pastel yellow ───────────────────────────────────────
function medColor(pct: number): string {
  if (pct <= 0)   return '#F5EDE3';
  if (pct < 40)   return '#FDF6DC';
  if (pct < 70)   return '#FAE89A';
  if (pct < 100)  return '#F5D547';
  return '#D4A843';
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
}

type HydrationLog  = Record<string, number>;          // date → ml
type MedicationLog = Record<string, number>;           // date → adherence %

const HYDRATION_LOG_KEY   = 'hydration_log';
const HYDRATION_GOAL_KEY  = 'hydration_goal';
const MEDICATION_LOG_KEY  = 'medication_log';
const SLEEP_GOAL_KEY      = 'sleep_goal';
const DEFAULT_HYDRO_GOAL  = 2500;
const DEFAULT_SLEEP_GOAL  = 8;

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function saveLS(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthShort  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const getDaysInMonth     = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => { const d = new Date(y, m, 1).getDay(); return (d + 6) % 7; };

// ─────────────────────────────────────────────────────────────────────────────

const MoodTrackerPage = () => {
  const { wellnessSubTab, setWellnessSubTab } = useAppStore();
  const [activeTab, setActiveTab] = useState<WellnessTab>(wellnessSubTab);
  const { saveSleepToday, savingSleep, sleepLogs, deleteSleepLog, initialize } = useWellnessStore();

  useEffect(() => { setActiveTab(wellnessSubTab); }, [wellnessSubTab]);
  useEffect(() => { initialize(); }, [initialize]);

  const switchTab = (tab: WellnessTab) => { setActiveTab(tab); setWellnessSubTab(tab); };

  // ── SLEEP STATE ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [sleepDate, setSleepDate]         = useState(today);
  const [sleepBedtime, setSleepBedtime]   = useState('23:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality]   = useState(3);
  const [sleepNotes, setSleepNotes]       = useState('');
  const [sleepSuccess, setSleepSuccess]   = useState(false);
  const [sleepError, setSleepError]       = useState('');
  const [sleepGoal, setSleepGoal]         = useState(DEFAULT_SLEEP_GOAL);
  const [editingSleepGoal, setEditingSleepGoal] = useState(false);
  const [sleepGoalInput, setSleepGoalInput]     = useState('');
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  useEffect(() => { setSleepGoal(loadLS(SLEEP_GOAL_KEY, DEFAULT_SLEEP_GOAL)); }, []);

  const saveSleepGoal = () => {
    const g = parseFloat(sleepGoalInput);
    if (!isNaN(g) && g > 0) { setSleepGoal(g); saveLS(SLEEP_GOAL_KEY, g); }
    setEditingSleepGoal(false);
  };

  const handleSaveSleep = async () => {
    setSleepError('');
    const [bH, bM] = sleepBedtime.split(':').map(Number);
    const [wH, wM] = sleepWakeTime.split(':').map(Number);
    let dur = (wH + wM / 60) - (bH + bM / 60);
    if (dur < 0) dur += 24;
    try {
      await saveSleepToday(sleepBedtime, sleepWakeTime, sleepQuality, parseFloat(dur.toFixed(2)), sleepNotes, sleepDate);
      setSleepSuccess(true);
      setSleepNotes('');
      setTimeout(() => setSleepSuccess(false), 3000);
    } catch (e) {
      setSleepError(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const handleDeleteSleep = async (id: string) => {
    setDeletingId(id);
    try { await deleteSleepLog(id); }
    catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const avgSleepDur  = sleepLogs.length > 0 ? (sleepLogs.reduce((s, e) => s + e.durationHours, 0) / sleepLogs.length).toFixed(1) : null;
  const avgSleepQual = sleepLogs.length > 0 ? (sleepLogs.reduce((s, e) => s + e.quality, 0) / sleepLogs.length).toFixed(1) : null;
  const getQualityEmoji = (q: number) => q <= 1 ? '😫' : q <= 2 ? '😞' : q <= 3 ? '😑' : q <= 4 ? '😊' : '😄';

  // ── HYDRATION STATE ──────────────────────────────────────────────────────
  const [hydrationLog, setHydrationLog]     = useState<HydrationLog>({});
  const [hydrationGoal, setHydrationGoal]   = useState(DEFAULT_HYDRO_GOAL);
  const [editingGoal, setEditingGoal]       = useState(false);
  const [goalInput, setGoalInput]           = useState('');
  const [hydrationView, setHydrationView]   = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [hydrationMonth, setHydrationMonth] = useState(() => new Date());
  const [hydrationYear, setHydrationYear]   = useState(() => new Date().getFullYear());
  const [hydrationSession, setHydrationSession] = useState(0); // ml added this session (not yet saved)
  const [savedToday, setSavedToday]         = useState(false);

  useEffect(() => {
    setHydrationLog(loadLS(HYDRATION_LOG_KEY, {}));
    setHydrationGoal(loadLS(HYDRATION_GOAL_KEY, DEFAULT_HYDRO_GOAL));
  }, []);

  const hydrationSavedToday = hydrationLog[today] ?? 0;
  const hydrationCurrent    = hydrationSavedToday + hydrationSession;
  const hydrationPct        = Math.min(Math.round((hydrationCurrent / hydrationGoal) * 100), 100);

  const addWater = (ml: number) => setHydrationSession(prev => prev + ml);

  const resetSession = () => { setHydrationSession(0); setSavedToday(false); };

  const saveDayHydration = () => {
    if (hydrationCurrent <= 0) return;
    const updated = { ...hydrationLog, [today]: hydrationCurrent };
    setHydrationLog(updated);
    saveLS(HYDRATION_LOG_KEY, updated);
    setHydrationSession(0);
    setSavedToday(true);
    setTimeout(() => setSavedToday(false), 3000);
  };

  const saveHydroGoal = () => {
    const g = parseInt(goalInput);
    if (!isNaN(g) && g > 0) { setHydrationGoal(g); saveLS(HYDRATION_GOAL_KEY, g); }
    setEditingGoal(false);
  };

  const annualHydroData = Array.from({ length: 12 }, (_, m) => {
    const days = getDaysInMonth(hydrationYear, m);
    let total = 0, count = 0;
    for (let d = 1; d <= days; d++) {
      const key = `${hydrationYear}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if ((hydrationLog[key] ?? 0) > 0) { total += hydrationLog[key]; count++; }
    }
    return { month: m, avg: count > 0 ? Math.round(total / count) : 0, count };
  });
  const maxHydroAvg = Math.max(...annualHydroData.map(d => d.avg), hydrationGoal);

  // ── MEDICATION STATE ─────────────────────────────────────────────────────
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: '1', name: 'Vitamina D',  dosage: '2000 IU',   frequency: 'Diario', time: '08:00', taken: true  },
    { id: '2', name: 'Complejo B',  dosage: '1 tableta', frequency: 'Diario', time: '08:30', taken: true  },
    { id: '3', name: 'Omega-3',     dosage: '1000 mg',   frequency: 'Diario', time: '12:00', taken: false },
    { id: '4', name: 'Magnesio',    dosage: '400 mg',    frequency: 'Diario', time: '21:00', taken: false },
  ]);
  const [newMedName,   setNewMedName]   = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime,   setNewMedTime]   = useState('08:00');
  const [medLog, setMedLog]             = useState<MedicationLog>({});
  const [medView, setMedView]           = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [medMonth, setMedMonth]         = useState(() => new Date());
  const [medYear, setMedYear]           = useState(() => new Date().getFullYear());

  useEffect(() => { setMedLog(loadLS(MEDICATION_LOG_KEY, {})); }, []);

  const toggleMedicationTaken = (id: string) =>
    setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));

  const addMedication = () => {
    if (!newMedName.trim()) return;
    setMedications(prev => [...prev, { id: Date.now().toString(), name: newMedName, dosage: newMedDosage, frequency: 'Diario', time: newMedTime, taken: false }]);
    setNewMedName(''); setNewMedDosage(''); setNewMedTime('08:00');
  };

  const removeMedication = (id: string) => setMedications(prev => prev.filter(m => m.id !== id));

  const medTaken     = medications.filter(m => m.taken).length;
  const medAdherence = medications.length > 0 ? Math.round((medTaken / medications.length) * 100) : 0;

  const saveMedDay = () => {
    if (medications.length === 0) return;
    const pct = Math.round((medTaken / medications.length) * 100);
    const updated = { ...medLog, [today]: pct };
    setMedLog(updated);
    saveLS(MEDICATION_LOG_KEY, updated);
  };

  // Auto-save medication adherence on toggle
  useEffect(() => {
    if (medications.length === 0) return;
    const pct = Math.round((medTaken / medications.length) * 100);
    const updated = { ...medLog, [today]: pct };
    setMedLog(updated);
    saveLS(MEDICATION_LOG_KEY, updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medications]);

  const annualMedData = Array.from({ length: 12 }, (_, m) => {
    const days = getDaysInMonth(medYear, m);
    let total = 0, count = 0;
    for (let d = 1; d <= days; d++) {
      const key = `${medYear}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if ((medLog[key] ?? 0) > 0) { total += medLog[key]; count++; }
    }
    return { month: m, avg: count > 0 ? Math.round(total / count) : 0, count };
  });
  const maxMedAvg = Math.max(...annualMedData.map(d => d.avg), 100);

  // ── SHARED STYLES ────────────────────────────────────────────────────────
  const tabConfig: { id: WellnessTab; label: string }[] = [
    { id: 'sleep',     label: '😴 Sleep Tracker'  },
    { id: 'hydration', label: '💧 Hydration'       },
    { id: 'medication',label: '💊 Medication'      },
    { id: 'period',    label: '🩸 Menstrual Cycle' },
    { id: 'healthlog', label: '🏥 Health Log'      },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', border: `1px solid ${C.tan}`,
    borderRadius: '6px', backgroundColor: C.paper, color: C.dark, fontSize: '0.95rem',
  };
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px',
    padding: '1.5rem', marginBottom: '1.5rem', ...extra,
  });
  const subTabBtn = (active: boolean, color: string): React.CSSProperties => ({
    padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
    backgroundColor: active ? color : C.lightCream,
    color: active ? C.paper : C.dark,
    border: `2px solid ${active ? color : C.tan}`,
    transition: 'all 0.2s',
  });

  // Reusable heatmap builder
  const renderHeatmap = (
    log: Record<string, number>,
    month: Date,
    onPrev: () => void,
    onNext: () => void,
    title: string,
    colorFn: (pct: number) => string,
    goal: number,
    unitLabel: (v: number) => string,
    textDarkThreshold: number,
    borderColor: string,
  ) => {
    const yr = month.getFullYear();
    const mo = month.getMonth();
    const daysInMo  = getDaysInMonth(yr, mo);
    const firstDay  = getFirstDayOfMonth(yr, mo);
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];
    return (
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: 0, fontFamily: 'Georgia, serif' }}>
            {title} — {monthNames[mo]} {yr}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onPrev} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>‹</button>
            <button onClick={onNext} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>›</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '600', color: C.warm, paddingBottom: '6px' }}>{d}</div>
          ))}
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const key = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const val  = log[key] ?? 0;
            const pct  = goal > 0 ? (val / goal) * 100 : 0;
            const bg   = colorFn(pct);
            const isToday = key === today;
            const dark = pct >= textDarkThreshold;
            return (
              <div key={key} title={val > 0 ? `${unitLabel(val)} (${Math.round(pct)}%)` : 'Sin registro'} style={{
                aspectRatio: '1', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: bg, borderRadius: '6px',
                border: isToday ? `2px solid ${borderColor}` : '2px solid transparent',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: isToday ? '700' : '500', color: dark ? '#2c2c00' : C.dark, lineHeight: 1.2 }}>{day}</span>
                {val > 0 && (
                  <span style={{ fontSize: '0.5rem', color: dark ? '#2c2c00' : C.warm, lineHeight: 1.1 }}>{unitLabel(val)}</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: C.warm, marginRight: '2px' }}>Menos</span>
          {[0, 20, 45, 70, 90, 100].map(p => (
            <div key={p} style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: colorFn(p), border: `1px solid ${borderColor}44` }} title={`${p}%`} />
          ))}
          <span style={{ fontSize: '0.75rem', color: C.warm, marginLeft: '2px' }}>Meta</span>
        </div>
      </div>
    );
  };

  const renderAnnualChart = (
    data: { month: number; avg: number; count: number }[],
    year: number,
    onPrev: () => void,
    onNext: () => void,
    title: string,
    colorFn: (pct: number) => string,
    goal: number,
    maxVal: number,
    unitSuffix: string,
  ) => (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: 0, fontFamily: 'Georgia, serif' }}>
          {title} — {year}
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onPrev} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>‹</button>
          <button onClick={onNext} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>›</button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '150px', paddingBottom: '4px', borderBottom: `2px solid ${C.lightTan}` }}>
        {data.map(({ month: m, avg, count }) => {
          const pct      = maxVal > 0 ? (avg / maxVal) * 100 : 0;
          const bgColor  = avg === 0 ? C.cream : colorFn((avg / goal) * 100);
          const isCurMo  = m === new Date().getMonth() && year === new Date().getFullYear();
          return (
            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '3px' }}>
              <div
                title={avg > 0 ? `${avg}${unitSuffix} prom. (${count} días)` : 'Sin datos'}
                style={{
                  width: '100%', height: `${Math.max(avg > 0 ? pct : 2, 2)}%`,
                  backgroundColor: bgColor,
                  borderRadius: '4px 4px 0 0',
                  border: isCurMo ? `2px solid ${C.accent}` : `1px solid ${avg > 0 ? '#ccc' : C.tan}`,
                  transition: 'height 0.3s', minHeight: '3px',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        {data.map(({ month: m }) => (
          <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: C.warm }}>{monthShort[m]}</div>
        ))}
      </div>
      {data.some(d => d.count > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '16px' }}>
          {data.filter(d => d.count > 0).map(d => (
            <div key={d.month} style={{ backgroundColor: C.warmWhite, border: `1px solid ${C.lightTan}`, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: C.warm }}>{monthNames[d.month]}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: C.accent }}>{d.avg}{unitSuffix}</div>
              <div style={{ fontSize: '0.65rem', color: C.warm }}>{d.count} días</div>
            </div>
          ))}
        </div>
      )}
      {!data.some(d => d.count > 0) && (
        <p style={{ color: C.warm, textAlign: 'center', padding: '1.5rem 0', margin: 0, fontSize: '0.9rem' }}>
          Sin datos para {year}.
        </p>
      )}
    </div>
  );

  return (
    <div style={{ backgroundColor: C.paper }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: C.dark, margin: '0', fontFamily: 'Georgia, serif' }}>
          Bienestar & Salud
        </h1>
        <p style={{ fontSize: '1rem', color: C.warm, margin: '0.5rem 0 0 0' }}>
          Registra tu sueño, hidratación, medicamentos y más
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabConfig.map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
            backgroundColor: activeTab === tab.id ? C.accent : C.lightCream,
            color: activeTab === tab.id ? C.paper : C.dark,
            border: `2px solid ${activeTab === tab.id ? C.accent : C.tan}`,
            borderRadius: '8px', padding: '0.75rem 1.25rem',
            fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      <div>

        {/* ═══════════════════════ SLEEP ═══════════════════════ */}
        {activeTab === 'sleep' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              <div style={card()}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  😴 Registrar Sueño
                </h2>

                {/* Date */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                    📅 Fecha
                    {sleepDate !== today && (
                      <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: C.warning, fontWeight: '400' }}>Registrando para fecha pasada</span>
                    )}
                  </label>
                  <input type="date" value={sleepDate} max={today} onChange={e => setSleepDate(e.target.value)} style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>🌙 Hora de Dormir</label>
                    <input type="time" value={sleepBedtime} onChange={e => setSleepBedtime(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>☀️ Hora de Despertar</label>
                    <input type="time" value={sleepWakeTime} onChange={e => setSleepWakeTime(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.75rem' }}>
                    ⭐ Calidad del Sueño: {sleepQuality}/5 {getQualityEmoji(sleepQuality)}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1,2,3,4,5].map(q => (
                      <button key={q} onClick={() => setSleepQuality(q)} style={{
                        width: '50px', height: '50px',
                        backgroundColor: sleepQuality >= q ? C.accent : C.cream,
                        color: sleepQuality >= q ? C.paper : C.dark,
                        border: `2px solid ${sleepQuality >= q ? C.accent : C.tan}`,
                        borderRadius: '8px', fontSize: '1.5rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
                      }}>★</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>📝 Notas (opcional)</label>
                  <textarea value={sleepNotes} onChange={e => setSleepNotes(e.target.value)} placeholder="¿Algo a notar sobre tu sueño?"
                    style={{ ...inputStyle, minHeight: '70px', resize: 'none', fontFamily: 'inherit' }} />
                </div>

                {sleepError && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: C.dangerLight, border: `1px solid ${C.danger}`, borderRadius: '6px', color: C.danger, fontSize: '0.9rem' }}>
                    ⚠️ {sleepError}
                  </div>
                )}
                {sleepSuccess && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: C.successLight, border: `1px solid ${C.success}`, borderRadius: '6px', color: C.success, fontSize: '0.9rem' }}>
                    ✅ ¡Sueño registrado exitosamente!
                  </div>
                )}

                <button onClick={handleSaveSleep} disabled={savingSleep} style={{
                  backgroundColor: savingSleep ? C.tan : C.accent, color: C.paper,
                  border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem',
                  fontSize: '1rem', fontWeight: '600', cursor: savingSleep ? 'not-allowed' : 'pointer', width: '100%',
                }}>
                  {savingSleep ? 'Guardando...' : '💾 Guardar Sueño'}
                </button>
              </div>

              {/* History */}
              <div style={card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` })}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>📋 Historial</h2>
                {sleepLogs.length === 0 ? (
                  <p style={{ color: C.warm, textAlign: 'center', padding: '2rem 0', margin: 0, fontSize: '0.9rem' }}>
                    Sin registros aún. ¡Empieza registrando tu sueño de hoy!
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                        {['Fecha','Dormida','Despertar','Duración','Calidad',''].map(h => (
                          <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sleepLogs.map((e) => (
                        <tr key={e.id} style={{ borderBottom: `1px solid ${C.cream}` }}>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{e.date}</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{e.bedtime}</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{e.wakeTime}</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '600', color: C.dark }}>{e.durationHours}h</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.accent }}>{'★'.repeat(e.quality)}</td>
                          <td style={{ padding: '8px' }}>
                            <button
                              onClick={() => handleDeleteSleep(e.id)}
                              disabled={deletingId === e.id}
                              title="Eliminar registro"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: deletingId === e.id ? C.tan : C.danger, fontSize: '1rem', padding: '2px 6px', borderRadius: '4px' }}
                            >
                              {deletingId === e.id ? '…' : '🗑'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>⏱ Promedio de Sueño</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.info, margin: '0' }}>{avgSleepDur ? `${avgSleepDur}h` : '—'}</p>
              </div>
              <div style={{ backgroundColor: C.accentGlow, border: `2px solid ${C.accent}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>⭐ Calidad Promedio</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.accent, margin: '0' }}>{avgSleepQual ? `${avgSleepQual}/5` : '—'}</p>
              </div>
              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>📅 Noches Registradas</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.success, margin: '0' }}>{sleepLogs.length}</p>
              </div>

              {/* Editable sleep goal */}
              <div style={{ backgroundColor: C.warningLight, border: `2px solid ${C.warning}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>🎯 Meta de Sueño</p>
                {editingSleepGoal ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="number" value={sleepGoalInput} step="0.5" min="1" max="16"
                      onChange={e => setSleepGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveSleepGoal(); if (e.key === 'Escape') setEditingSleepGoal(false); }}
                      autoFocus
                      style={{ width: '70px', padding: '6px', border: `1px solid ${C.warning}`, borderRadius: '6px', textAlign: 'center', fontSize: '1rem', fontWeight: '600', color: C.dark, backgroundColor: C.paper }}
                    />
                    <span style={{ fontSize: '0.85rem', color: C.dark }}>h</span>
                    <button onClick={saveSleepGoal} style={{ padding: '6px 10px', backgroundColor: C.warning, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✓</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: C.warning, margin: '0 0 0.5rem 0' }}>{sleepGoal}h</p>
                    <button onClick={() => { setSleepGoalInput(String(sleepGoal)); setEditingSleepGoal(true); }} style={{
                      padding: '4px 14px', border: `1px solid ${C.warning}`, borderRadius: '6px',
                      backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: C.warning, fontWeight: '600',
                    }}>✏️ Editar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ HYDRATION ═══════════════════════ */}
        {activeTab === 'hydration' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {([['daily','📅 Diario'],['monthly','📆 Mensual'],['annual','📊 Anual']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setHydrationView(id)} style={subTabBtn(hydrationView === id, C.info)}>{label}</button>
                ))}
              </div>

              {/* Daily */}
              {hydrationView === 'daily' && (
                <div style={card()}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                    💧 Hidratación Diaria
                  </h2>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{
                      width: '120px', height: '240px', backgroundColor: C.cream, border: `2px solid ${C.info}`,
                      borderRadius: '12px', display: 'flex', alignItems: 'flex-end',
                      position: 'relative', overflow: 'hidden', flexShrink: 0,
                    }}>
                      <div style={{ width: '100%', height: `${hydrationPct}%`, backgroundColor: C.info, transition: 'height 0.4s ease' }} />
                      <div style={{ position: 'absolute', fontSize: '1rem', fontWeight: '700', color: hydrationPct > 50 ? C.paper : C.dark, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }}>
                        {hydrationPct}%
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                        {hydrationCurrent} ml / {hydrationGoal} ml
                        {hydrationSavedToday > 0 && hydrationSession > 0 && (
                          <span style={{ fontSize: '0.8rem', color: C.warm, marginLeft: '8px' }}>(guardado: {hydrationSavedToday}ml + sesión: {hydrationSession}ml)</span>
                        )}
                      </p>
                      <div style={{ width: '100%', height: '12px', backgroundColor: C.cream, borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                        <div style={{ width: `${hydrationPct}%`, height: '100%', backgroundColor: C.info, borderRadius: '6px', transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        {[250, 500, 750].map(ml => (
                          <button key={ml} onClick={() => addWater(ml)} style={{
                            padding: '10px', backgroundColor: C.info, color: C.paper,
                            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                          }}>+{ml}ml</button>
                        ))}
                      </div>
                      {/* Save day button */}
                      <button
                        onClick={saveDayHydration}
                        disabled={hydrationCurrent <= 0}
                        style={{
                          width: '100%', padding: '10px', marginBottom: '8px',
                          backgroundColor: savedToday ? C.success : hydrationCurrent > 0 ? C.accent : C.tan,
                          color: C.paper, border: 'none', borderRadius: '8px', cursor: hydrationCurrent > 0 ? 'pointer' : 'not-allowed',
                          fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
                        }}
                      >
                        {savedToday ? '✅ ¡Día guardado!' : '💾 Guardar día'}
                      </button>
                      <button onClick={resetSession} style={{
                        width: '100%', padding: '8px', backgroundColor: C.cream,
                        border: `1px solid ${C.tan}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: C.warm,
                      }}>Reiniciar sesión</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly heatmap */}
              {hydrationView === 'monthly' && renderHeatmap(
                hydrationLog,
                hydrationMonth,
                () => setHydrationMonth(new Date(hydrationMonth.getFullYear(), hydrationMonth.getMonth() - 1, 1)),
                () => setHydrationMonth(new Date(hydrationMonth.getFullYear(), hydrationMonth.getMonth() + 1, 1)),
                '💧 Mapa de Calor',
                hydrationColor,
                hydrationGoal,
                v => v >= 1000 ? `${(v/1000).toFixed(1)}L` : `${v}ml`,
                75,
                C.info,
              )}

              {/* Annual chart */}
              {hydrationView === 'annual' && renderAnnualChart(
                annualHydroData,
                hydrationYear,
                () => setHydrationYear(y => y - 1),
                () => setHydrationYear(y => y + 1),
                '📊 Resumen Anual',
                hydrationColor,
                hydrationGoal,
                maxHydroAvg,
                'ml',
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>💧 Hoy</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.info, margin: '0' }}>{hydrationCurrent}ml</p>
                {hydrationSavedToday > 0 && (
                  <p style={{ fontSize: '0.75rem', color: C.warm, margin: '4px 0 0 0' }}>Guardado: {hydrationSavedToday}ml</p>
                )}
              </div>

              {/* Editable goal */}
              <div style={{ backgroundColor: C.accentGlow, border: `2px solid ${C.accent}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>🎯 Meta</p>
                {editingGoal ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="number" value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveHydroGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                      autoFocus
                      style={{ width: '80px', padding: '6px', border: `1px solid ${C.accent}`, borderRadius: '6px', textAlign: 'center', fontSize: '1rem', fontWeight: '600', color: C.dark, backgroundColor: C.paper }}
                    />
                    <span style={{ fontSize: '0.85rem', color: C.dark }}>ml</span>
                    <button onClick={saveHydroGoal} style={{ padding: '6px 10px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✓</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: C.accent, margin: '0 0 0.5rem 0' }}>{hydrationGoal}ml</p>
                    <button onClick={() => { setGoalInput(String(hydrationGoal)); setEditingGoal(true); }} style={{
                      padding: '4px 14px', border: `1px solid ${C.accent}`, borderRadius: '6px',
                      backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: C.accent, fontWeight: '600',
                    }}>✏️ Editar</button>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: C.successLight, border: `2px solid ${C.success}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>✅ Completado</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.success, margin: '0' }}>{hydrationPct}%</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ MEDICATION ═══════════════════════ */}
        {activeTab === 'medication' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {([['daily','💊 Diario'],['monthly','📆 Mensual'],['annual','📊 Anual']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setMedView(id)} style={subTabBtn(medView === id, C.accent)}>{label}</button>
                ))}
              </div>

              {/* Daily */}
              {medView === 'daily' && (
                <>
                  <div style={card()}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                      💊 Mis Medicamentos
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {medications.map(med => (
                        <div key={med.id} style={{
                          backgroundColor: C.paper, border: `1px solid ${med.taken ? C.success : C.tan}`,
                          borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                        }}>
                          <input type="checkbox" checked={med.taken} onChange={() => toggleMedicationTaken(med.id)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: C.accent }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '1rem', fontWeight: '600', color: C.dark, margin: 0 }}>{med.name}</p>
                            <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0.2rem 0 0 0' }}>{med.dosage} · {med.frequency} · {med.time}</p>
                          </div>
                          <span style={{ padding: '0.3rem 0.75rem', backgroundColor: med.taken ? C.successLight : C.warningLight, borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                            {med.taken ? '✅ Tomado' : '⏳ Pendiente'}
                          </span>
                          <button onClick={() => removeMedication(med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.danger, fontSize: '1.1rem', padding: '0 4px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={saveMedDay} style={{
                      marginTop: '1rem', width: '100%', padding: '10px',
                      backgroundColor: C.accent, color: C.paper, border: 'none',
                      borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                    }}>
                      💾 Guardar adherencia de hoy
                    </button>
                  </div>

                  <div style={card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` })}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>➕ Agregar Medicamento</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Nombre</label>
                        <input value={newMedName} onChange={e => setNewMedName(e.target.value)} placeholder="Vitamina D..." style={{ ...inputStyle, padding: '8px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Dosis</label>
                        <input value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} placeholder="2000 IU" style={{ ...inputStyle, padding: '8px' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Hora</label>
                        <input type="time" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} style={{ ...inputStyle, padding: '8px' }} />
                      </div>
                      <button onClick={addMedication} style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                        Agregar
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Monthly heatmap */}
              {medView === 'monthly' && renderHeatmap(
                medLog,
                medMonth,
                () => setMedMonth(new Date(medMonth.getFullYear(), medMonth.getMonth() - 1, 1)),
                () => setMedMonth(new Date(medMonth.getFullYear(), medMonth.getMonth() + 1, 1)),
                '💊 Adherencia Mensual',
                medColor,
                100,
                v => `${v}%`,
                70,
                C.accent,
              )}

              {/* Annual chart */}
              {medView === 'annual' && renderAnnualChart(
                annualMedData,
                medYear,
                () => setMedYear(y => y - 1),
                () => setMedYear(y => y + 1),
                '📊 Adherencia Anual',
                medColor,
                100,
                maxMedAvg,
                '%',
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: '✅ Tomados',    value: `${medTaken}/${medications.length}`, color: C.success, bg: C.successLight },
                { label: '📊 Adherencia', value: `${medAdherence}%`,                  color: C.info,    bg: C.infoLight    },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, border: `2px solid ${s.color}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>{s.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
                </div>
              ))}
              <div style={{ backgroundColor: C.lightCream, border: `2px solid ${C.tan}`, borderRadius: '12px', padding: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: C.warm, margin: 0, lineHeight: '1.6' }}>
                  💡 Registra tus medicamentos diarios y marca cada uno como tomado para mantener un historial de adherencia.
                </p>
              </div>
              {/* Today's adherence from log */}
              {medLog[today] !== undefined && (
                <div style={{ backgroundColor: C.accentGlow, border: `2px solid ${C.accent}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>📅 Guardado hoy</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: C.accent, margin: '0' }}>{medLog[today]}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ MENSTRUAL CYCLE ═══════════════════════ */}
        {activeTab === 'period' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Último Período',    value: '15 Mar 2026', color: C.danger,  bg: C.dangerLight  },
                { label: 'Próximo Estimado',  value: '12 Abr 2026', color: C.info,    bg: C.infoLight    },
                { label: 'Ciclo Promedio',    value: '28 días',     color: C.warning, bg: C.warningLight },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, border: `2px solid ${s.color}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: s.color, fontWeight: '600', marginBottom: '0.5rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: C.dark, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>📅 Calendario de Ciclo — Abril 2026</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: C.warm, padding: '4px' }}>{d}</div>
                ))}
                {([...Array.from({ length: 2 }, () => null as number | null), ...Array.from({ length: 30 }, (_, i) => i + 1)] as (number | null)[]).map((day, idx) => {
                  const isPeriod = day !== null && day >= 12 && day <= 16;
                  const isFertile = day !== null && day >= 22 && day <= 26;
                  const isOvulation = day === 24;
                  return (
                    <div key={idx} style={{
                      textAlign: 'center', padding: '8px 4px', borderRadius: '6px', fontSize: '0.85rem',
                      backgroundColor: isOvulation ? C.accentGlow : isPeriod ? C.dangerLight : isFertile ? C.infoLight : day ? C.paper : 'transparent',
                      color: isPeriod ? C.danger : isOvulation ? C.accent : C.dark,
                      border: day === 5 ? `2px solid ${C.accent}` : '1px solid transparent',
                    }}>{day || ''}</div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: C.warm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.dangerLight }} /> Período</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.infoLight   }} /> Ventana fértil</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.accentGlow  }} /> Ovulación</div>
              </div>
            </div>
            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>Síntomas del Ciclo</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['Cólicos','Hinchazón','Dolor de cabeza','Fatiga','Cambios de humor','Acné','Antojos','Sensibilidad'].map(s => (
                  <button key={s} style={{ padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '8px', backgroundColor: C.paper, cursor: 'pointer', fontSize: '0.8rem', color: C.dark, textAlign: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.dangerLight)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.paper)}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>Historial de Ciclos</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                  {['Inicio','Duración','Ciclo','Síntomas'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: C.warm }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { start: '15 Mar', dur: '5 días', cycle: '28 días', symptoms: 'Cólicos, Fatiga'    },
                    { start: '15 Feb', dur: '4 días', cycle: '29 días', symptoms: 'Leve'               },
                    { start: '17 Ene', dur: '5 días', cycle: '28 días', symptoms: 'Cólicos, Hinchazón' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{row.start}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.dur}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.cycle}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.symptoms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════ HEALTH LOG ═══════════════════════ */}
        {activeTab === 'healthlog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` })}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>🩺 Registrar Síntoma</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Síntoma</label>
                  <select style={{ width: '100%', padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '6px', fontSize: '0.85rem', backgroundColor: C.paper }}>
                    {['Dolor de cabeza','Dolor de espalda','Fatiga','Náuseas','Mareo','Dolor muscular','Congestión','Tos','Insomnio','Ansiedad'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Intensidad (1-10)</label>
                  <input type="number" min="1" max="10" defaultValue="5" style={{ width: '100%', padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '6px', fontSize: '0.85rem', backgroundColor: C.paper }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: C.warm, display: 'block', marginBottom: '4px' }}>Duración</label>
                  <select style={{ width: '100%', padding: '8px', border: `1px solid ${C.tan}`, borderRadius: '6px', fontSize: '0.85rem', backgroundColor: C.paper }}>
                    {['< 1 hora','1-3 horas','3-6 horas','Todo el día','Varios días'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Registrar</button>
              </div>
            </div>
            <div style={card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` })}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>Historial de Síntomas</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                  {['Fecha','Síntoma','Intensidad','Duración','Notas'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { date: '5 Abr', symptom: 'Dolor de cabeza', intensity: 6, dur: '3-6 horas', notes: 'Después de trabajo intenso' },
                    { date: '4 Abr', symptom: 'Fatiga',           intensity: 4, dur: 'Todo el día', notes: 'Dormí mal' },
                    { date: '3 Abr', symptom: 'Dolor muscular',   intensity: 7, dur: '1-3 horas', notes: 'Post-entrenamiento' },
                    { date: '1 Abr', symptom: 'Congestión',       intensity: 3, dur: 'Todo el día', notes: 'Cambio de clima' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{row.date}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '500', color: C.dark }}>{row.symptom}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                          backgroundColor: row.intensity >= 7 ? C.dangerLight : row.intensity >= 4 ? C.warningLight : C.successLight,
                          color: row.intensity >= 7 ? C.danger : row.intensity >= 4 ? C.warning : C.success,
                        }}>{row.intensity}/10</span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.dur}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ ...card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` }), marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: C.dark, margin: 0, fontFamily: 'Georgia, serif' }}>🏥 Citas Médicas</h2>
                <button style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>+ Nueva Cita</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                {[
                  { doctor: 'Dr. García',   specialty: 'Medicina General', date: '10 Abr 2026', time: '10:00', location: 'Clínica Central', notes: 'Chequeo anual'       },
                  { doctor: 'Dra. López',   specialty: 'Dermatología',     date: '18 Abr 2026', time: '15:30', location: 'Hospital Sur',    notes: 'Revisión lunar'     },
                  { doctor: 'Dr. Martínez', specialty: 'Odontología',      date: '25 Abr 2026', time: '09:00', location: 'Clínica Dental',  notes: 'Limpieza semestral' },
                ].map((apt, i) => (
                  <div key={i} style={{ backgroundColor: C.paper, border: `1px solid ${C.cream}`, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: C.dark }}>{apt.doctor}</div>
                        <div style={{ fontSize: '0.8rem', color: C.warm }}>{apt.specialty}</div>
                      </div>
                      <span style={{ backgroundColor: C.infoLight, color: C.info, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', height: 'fit-content' }}>Pendiente</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: C.dark, marginBottom: '4px' }}>📅 {apt.date} a las {apt.time}</div>
                    <div style={{ fontSize: '0.85rem', color: C.warm, marginBottom: '4px' }}>📍 {apt.location}</div>
                    <div style={{ fontSize: '0.85rem', color: C.warm }}>📝 {apt.notes}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: C.dark, margin: '0 0 0.75rem 0' }}>Historial de Citas</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                  {['Fecha','Doctor','Especialidad','Resultado'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { date: '15 Mar 2026', doctor: 'Dr. García', specialty: 'General',       result: 'Todo en orden, análisis normal' },
                    { date: '20 Feb 2026', doctor: 'Dra. Ruiz',  specialty: 'Oftalmología',  result: 'Vista estable, nueva receta'    },
                    { date: '10 Ene 2026', doctor: 'Dr. Torres', specialty: 'Traumatología', result: 'Recuperación completa rodilla'  },
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
