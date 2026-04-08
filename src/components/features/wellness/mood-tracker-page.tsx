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

// Pastel-blue intensity based on % of goal
function hydrationColor(pct: number): string {
  if (pct <= 0) return '#F5EDE3';
  if (pct < 25) return '#E8F4FD';
  if (pct < 50) return '#BDDFF5';
  if (pct < 75) return '#7DC3EA';
  if (pct < 100) return '#4AAAD6';
  return '#2E8BC0';
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
}

type HydrationLog = Record<string, number>;

const HYDRATION_LOG_KEY = 'hydration_log';
const HYDRATION_GOAL_KEY = 'hydration_goal';
const DEFAULT_GOAL = 2500;

function loadHydrationLog(): HydrationLog {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(HYDRATION_LOG_KEY) ?? '{}'); }
  catch { return {}; }
}
function saveHydrationLog(log: HydrationLog) {
  localStorage.setItem(HYDRATION_LOG_KEY, JSON.stringify(log));
}
function loadHydrationGoal(): number {
  if (typeof window === 'undefined') return DEFAULT_GOAL;
  return parseInt(localStorage.getItem(HYDRATION_GOAL_KEY) ?? String(DEFAULT_GOAL));
}
function saveHydrationGoal(goal: number) {
  localStorage.setItem(HYDRATION_GOAL_KEY, String(goal));
}

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthShort  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const MoodTrackerPage = () => {
  const { wellnessSubTab, setWellnessSubTab } = useAppStore();
  const [activeTab, setActiveTab] = useState<WellnessTab>(wellnessSubTab);
  const { saveSleepToday, savingSleep, sleepLogs, initialize } = useWellnessStore();

  useEffect(() => { setActiveTab(wellnessSubTab); }, [wellnessSubTab]);
  useEffect(() => { initialize(); }, [initialize]);

  const switchTab = (tab: WellnessTab) => { setActiveTab(tab); setWellnessSubTab(tab); };

  // ── SLEEP STATE ──────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [sleepDate, setSleepDate]         = useState(today);
  const [sleepBedtime, setSleepBedtime]   = useState('23:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality]   = useState(3);
  const [sleepNotes, setSleepNotes]       = useState('');
  const [sleepSuccess, setSleepSuccess]   = useState(false);
  const [sleepError, setSleepError]       = useState('');

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

  const avgSleepDur  = sleepLogs.length > 0 ? (sleepLogs.reduce((s, e) => s + e.durationHours, 0) / sleepLogs.length).toFixed(1) : null;
  const avgSleepQual = sleepLogs.length > 0 ? (sleepLogs.reduce((s, e) => s + e.quality, 0) / sleepLogs.length).toFixed(1) : null;

  const getQualityEmoji = (q: number) => q <= 1 ? '😫' : q <= 2 ? '😞' : q <= 3 ? '😑' : q <= 4 ? '😊' : '😄';

  // ── HYDRATION STATE ──────────────────────────────────────────────────────────
  const [hydrationLog, setHydrationLog]   = useState<HydrationLog>({});
  const [hydrationGoal, setHydrationGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal]     = useState(false);
  const [goalInput, setGoalInput]         = useState('');
  const [hydrationView, setHydrationView] = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [hydrationMonth, setHydrationMonth] = useState(() => new Date());
  const [hydrationYear, setHydrationYear]   = useState(() => new Date().getFullYear());

  useEffect(() => {
    setHydrationLog(loadHydrationLog());
    setHydrationGoal(loadHydrationGoal());
  }, []);

  const hydrationToday = hydrationLog[today] ?? 0;
  const hydrationPct   = Math.min(Math.round((hydrationToday / hydrationGoal) * 100), 100);

  const addWater = (ml: number) => setHydrationLog(prev => {
    const updated = { ...prev, [today]: Math.min((prev[today] ?? 0) + ml, 9999) };
    saveHydrationLog(updated);
    return updated;
  });

  const resetWater = () => setHydrationLog(prev => {
    const updated = { ...prev, [today]: 0 };
    saveHydrationLog(updated);
    return updated;
  });

  const saveGoal = () => {
    const g = parseInt(goalInput);
    if (!isNaN(g) && g > 0) { setHydrationGoal(g); saveHydrationGoal(g); }
    setEditingGoal(false);
  };

  const getDaysInMonth    = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => { const d = new Date(y, m, 1).getDay(); return (d + 6) % 7; }; // Mon=0

  const annualData = Array.from({ length: 12 }, (_, m) => {
    const days = getDaysInMonth(hydrationYear, m);
    let total = 0, count = 0;
    for (let d = 1; d <= days; d++) {
      const key = `${hydrationYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if ((hydrationLog[key] ?? 0) > 0) { total += hydrationLog[key]; count++; }
    }
    return { month: m, avg: count > 0 ? Math.round(total / count) : 0, count };
  });
  const maxAnnualAvg = Math.max(...annualData.map(d => d.avg), hydrationGoal);

  // ── MEDICATION STATE ─────────────────────────────────────────────────────────
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: '1', name: 'Vitamina D',  dosage: '2000 IU',  frequency: 'Diario', time: '08:00', taken: true  },
    { id: '2', name: 'Complejo B',  dosage: '1 tableta', frequency: 'Diario', time: '08:30', taken: true  },
    { id: '3', name: 'Omega-3',     dosage: '1000 mg',  frequency: 'Diario', time: '12:00', taken: false },
    { id: '4', name: 'Magnesio',    dosage: '400 mg',   frequency: 'Diario', time: '21:00', taken: false },
  ]);
  const [newMedName,   setNewMedName]   = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime,   setNewMedTime]   = useState('08:00');

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

  // ── SHARED STYLES ────────────────────────────────────────────────────────────
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
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {/* ═══════════════════ SLEEP TRACKER ═══════════════════ */}
        {activeTab === 'sleep' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              <div style={card()}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  😴 Registrar Sueño
                </h2>

                {/* Date picker */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>
                    📅 Fecha{sleepDate !== today && <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: C.warning, fontWeight: '400' }}>Registrando para fecha pasada</span>}
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
                    {[1, 2, 3, 4, 5].map(q => (
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
                        {['Fecha', 'Dormida', 'Despertar', 'Duración', 'Calidad'].map(h => (
                          <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sleepLogs.map((e, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{e.date}</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{e.bedtime}</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{e.wakeTime}</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '600', color: C.dark }}>{e.durationHours}h</td>
                          <td style={{ padding: '8px', fontSize: '0.85rem', color: C.accent }}>{'★'.repeat(e.quality)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: '⏱ Promedio de Sueño',  value: avgSleepDur  ? `${avgSleepDur}h`     : '—', color: C.info,    bg: C.infoLight    },
                { label: '⭐ Calidad Promedio',   value: avgSleepQual ? `${avgSleepQual}/5`   : '—', color: C.accent,  bg: C.accentGlow   },
                { label: '📅 Noches Registradas', value: `${sleepLogs.length}`,                      color: C.success, bg: C.successLight },
                { label: '🎯 Meta de Sueño',      value: '8h',                                       color: C.warning, bg: C.warningLight },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, border: `2px solid ${s.color}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>{s.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════ HYDRATION ═══════════════════ */}
        {activeTab === 'hydration' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              {/* Sub-view tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {([['daily','📅 Diario'],['monthly','📆 Mensual'],['annual','📊 Anual']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setHydrationView(id)} style={{
                    padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                    backgroundColor: hydrationView === id ? C.info : C.lightCream,
                    color: hydrationView === id ? C.paper : C.dark,
                    border: `2px solid ${hydrationView === id ? C.info : C.tan}`,
                    transition: 'all 0.2s',
                  }}>{label}</button>
                ))}
              </div>

              {/* ── DAILY ── */}
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
                      <p style={{ fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>{hydrationToday} ml / {hydrationGoal} ml</p>
                      <div style={{ width: '100%', height: '12px', backgroundColor: C.cream, borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                        <div style={{ width: `${hydrationPct}%`, height: '100%', backgroundColor: C.info, borderRadius: '6px', transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[250, 500, 750].map(ml => (
                          <button key={ml} onClick={() => addWater(ml)} style={{
                            padding: '10px', backgroundColor: C.info, color: C.paper,
                            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                          }}>+{ml}ml</button>
                        ))}
                      </div>
                      <button onClick={resetWater} style={{
                        marginTop: '8px', width: '100%', padding: '8px', backgroundColor: C.cream,
                        border: `1px solid ${C.tan}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: C.warm,
                      }}>Reiniciar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MONTHLY HEATMAP ── */}
              {hydrationView === 'monthly' && (() => {
                const yr = hydrationMonth.getFullYear();
                const mo = hydrationMonth.getMonth();
                const daysInMo = getDaysInMonth(yr, mo);
                const firstDay = getFirstDayOfMonth(yr, mo);
                const cells: (number | null)[] = [
                  ...Array(firstDay).fill(null),
                  ...Array.from({ length: daysInMo }, (_, i) => i + 1),
                ];
                return (
                  <div style={card()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: 0, fontFamily: 'Georgia, serif' }}>
                        💧 Mapa de Calor — {monthNames[mo]} {yr}
                      </h2>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setHydrationMonth(new Date(yr, mo - 1, 1))} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>‹</button>
                        <button onClick={() => setHydrationMonth(new Date(yr, mo + 1, 1))} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>›</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                      {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '600', color: C.warm, paddingBottom: '6px' }}>{d}</div>
                      ))}
                      {cells.map((day, idx) => {
                        if (day === null) return <div key={`e-${idx}`} />;
                        const key = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const ml  = hydrationLog[key] ?? 0;
                        const pct = hydrationGoal > 0 ? (ml / hydrationGoal) * 100 : 0;
                        const bg  = hydrationColor(pct);
                        const isToday = key === today;
                        const textDark = pct >= 75;
                        return (
                          <div key={key} title={ml > 0 ? `${ml} ml (${Math.round(pct)}%)` : 'Sin registro'} style={{
                            aspectRatio: '1', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: bg, borderRadius: '6px',
                            border: isToday ? `2px solid ${C.info}` : '2px solid transparent',
                          }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: isToday ? '700' : '500', color: textDark ? '#1a5276' : C.dark, lineHeight: 1.2 }}>{day}</span>
                            {ml > 0 && (
                              <span style={{ fontSize: '0.55rem', color: textDark ? '#1a5276' : C.warm, lineHeight: 1.1 }}>
                                {ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: C.warm, marginRight: '2px' }}>Menos</span>
                      {[0, 20, 45, 70, 90, 100].map(p => (
                        <div key={p} style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: hydrationColor(p), border: '1px solid #bde' }} title={`${p}%`} />
                      ))}
                      <span style={{ fontSize: '0.75rem', color: C.warm, marginLeft: '2px' }}>Meta</span>
                    </div>
                  </div>
                );
              })()}

              {/* ── ANNUAL CHART ── */}
              {hydrationView === 'annual' && (
                <div style={card()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: 0, fontFamily: 'Georgia, serif' }}>
                      📊 Resumen Anual — {hydrationYear}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setHydrationYear(y => y - 1)} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>‹</button>
                      <button onClick={() => setHydrationYear(y => y + 1)} style={{ padding: '6px 14px', border: `1px solid ${C.tan}`, borderRadius: '6px', backgroundColor: C.cream, cursor: 'pointer', color: C.dark, fontWeight: '700', fontSize: '1rem' }}>›</button>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '150px', paddingBottom: '4px', borderBottom: `2px solid ${C.lightTan}` }}>
                    {annualData.map(({ month: m, avg, count }) => {
                      const pct     = maxAnnualAvg > 0 ? (avg / maxAnnualAvg) * 100 : 0;
                      const bgColor = avg === 0 ? C.cream : avg >= hydrationGoal ? '#2E8BC0' : hydrationColor((avg / hydrationGoal) * 100);
                      const isCurMonth = m === new Date().getMonth() && hydrationYear === new Date().getFullYear();
                      return (
                        <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '3px' }}>
                          <div
                            title={avg > 0 ? `${avg} ml/día prom. (${count} días)` : 'Sin datos'}
                            style={{
                              width: '100%', height: `${Math.max(avg > 0 ? pct : 2, 2)}%`,
                              backgroundColor: bgColor,
                              borderRadius: '4px 4px 0 0',
                              border: isCurMonth ? `2px solid ${C.info}` : `1px solid ${avg > 0 ? '#7DC3EA' : C.tan}`,
                              transition: 'height 0.3s',
                              minHeight: '3px',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Month labels */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {annualData.map(({ month: m }) => (
                      <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: C.warm }}>{monthShort[m]}</div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.8rem', color: C.warm }}>
                    <div style={{ width: 20, height: 4, backgroundColor: '#2E8BC0', borderRadius: 2 }} />
                    <span>Meta diaria: {hydrationGoal} ml</span>
                  </div>

                  {/* Monthly stats mini-cards */}
                  {annualData.some(d => d.count > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '16px' }}>
                      {annualData.filter(d => d.count > 0).map(d => (
                        <div key={d.month} style={{ backgroundColor: C.warmWhite, border: `1px solid ${C.lightTan}`, borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: C.warm }}>{monthNames[d.month]}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: C.info }}>{d.avg}ml</div>
                          <div style={{ fontSize: '0.65rem', color: C.warm }}>{d.count} días</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!annualData.some(d => d.count > 0) && (
                    <p style={{ color: C.warm, textAlign: 'center', padding: '1.5rem 0', margin: 0, fontSize: '0.9rem' }}>
                      Sin datos para {hydrationYear}. Empieza a registrar desde la vista Diaria.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: C.infoLight, border: `2px solid ${C.info}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>💧 Hoy</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: C.info, margin: '0' }}>{hydrationToday}ml</p>
              </div>

              {/* Editable goal */}
              <div style={{ backgroundColor: C.accentGlow, border: `2px solid ${C.accent}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>🎯 Meta</p>
                {editingGoal ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="number" value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                      autoFocus
                      style={{ width: '80px', padding: '6px', border: `1px solid ${C.accent}`, borderRadius: '6px', textAlign: 'center', fontSize: '1rem', fontWeight: '600', color: C.dark, backgroundColor: C.paper }}
                    />
                    <span style={{ fontSize: '0.85rem', color: C.dark }}>ml</span>
                    <button onClick={saveGoal} style={{ padding: '6px 10px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✓</button>
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

        {/* ═══════════════════ MEDICATION ═══════════════════ */}
        {activeTab === 'medication' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
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
            </div>

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
            </div>
          </div>
        )}

        {/* ═══════════════════ MENSTRUAL CYCLE ═══════════════════ */}
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
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                📅 Calendario de Ciclo — Abril 2026
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: C.warm, padding: '4px' }}>{d}</div>
                ))}
                {([...Array.from({ length: 2 }, () => null as number | null), ...Array.from({ length: 30 }, (_, i) => i + 1)] as (number | null)[]).map((day, idx) => {
                  const isPeriod    = day !== null && day >= 12 && day <= 16;
                  const isFertile   = day !== null && day >= 22 && day <= 26;
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
                {['Cólicos', 'Hinchazón', 'Dolor de cabeza', 'Fatiga', 'Cambios de humor', 'Acné', 'Antojos', 'Sensibilidad'].map(s => (
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
                  {['Inicio', 'Duración', 'Ciclo', 'Síntomas'].map(h => (
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

        {/* ═══════════════════ HEALTH LOG ═══════════════════ */}
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
                <button style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  Registrar
                </button>
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
                <button style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                  + Nueva Cita
                </button>
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
                    { date: '15 Mar 2026', doctor: 'Dr. García',  specialty: 'General',       result: 'Todo en orden, análisis normal'   },
                    { date: '20 Feb 2026', doctor: 'Dra. Ruiz',   specialty: 'Oftalmología',  result: 'Vista estable, nueva receta'      },
                    { date: '10 Ene 2026', doctor: 'Dr. Torres',  specialty: 'Traumatología', result: 'Recuperación completa rodilla'    },
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
