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

interface SleepEntry {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  duration: number;
  notes: string;
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
}

const MoodTrackerPage = () => {
  const { wellnessSubTab, setWellnessSubTab } = useAppStore();
  const [activeTab, setActiveTab] = useState<WellnessTab>(wellnessSubTab);
  const { saveSleepToday, savingSleep } = useWellnessStore();

  // Sync with sidebar deep-link
  useEffect(() => { setActiveTab(wellnessSubTab); }, [wellnessSubTab]);

  const switchTab = (tab: WellnessTab) => {
    setActiveTab(tab);
    setWellnessSubTab(tab);
  };

  // SLEEP STATE
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([
    { date: '2026-04-04', bedtime: '23:30', wakeTime: '07:15', quality: 4, duration: 7.75, notes: '' },
    { date: '2026-04-03', bedtime: '00:15', wakeTime: '07:45', quality: 3, duration: 7.5, notes: '' },
    { date: '2026-04-02', bedtime: '23:00', wakeTime: '06:45', quality: 5, duration: 7.75, notes: '' },
    { date: '2026-04-01', bedtime: '23:45', wakeTime: '07:30', quality: 4, duration: 7.75, notes: '' },
    { date: '2026-03-31', bedtime: '00:30', wakeTime: '08:00', quality: 2, duration: 7.5, notes: '' },
    { date: '2026-03-30', bedtime: '23:15', wakeTime: '07:00', quality: 5, duration: 7.75, notes: '' },
  ]);
  const [sleepBedtime, setSleepBedtime] = useState('23:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('07:15');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [sleepNotes, setSleepNotes] = useState('');

  const handleSaveSleep = async () => {
    const [bH, bM] = sleepBedtime.split(':').map(Number);
    const [wH, wM] = sleepWakeTime.split(':').map(Number);
    let dur = (wH + wM / 60) - (bH + bM / 60);
    if (dur < 0) dur += 24;
    await saveSleepToday(sleepBedtime, sleepWakeTime, sleepQuality, parseFloat(dur.toFixed(2)), sleepNotes);
    alert('¡Sueño registrado!');
  };

  const averageSleepDuration = sleepEntries.length > 0
    ? (sleepEntries.reduce((s, e) => s + e.duration, 0) / sleepEntries.length).toFixed(1) : '0';
  const averageSleepQuality = sleepEntries.length > 0
    ? (sleepEntries.reduce((s, e) => s + e.quality, 0) / sleepEntries.length).toFixed(1) : '0';

  // HYDRATION STATE
  const [hydrationGoal] = useState(2500);
  const [hydrationToday, setHydrationToday] = useState(1750);
  const hydrationPct = Math.min(Math.round((hydrationToday / hydrationGoal) * 100), 100);

  // MEDICATION STATE
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: '1', name: 'Vitamina D', dosage: '2000 IU', frequency: 'Diario', time: '08:00', taken: true },
    { id: '2', name: 'Complejo B', dosage: '1 tableta', frequency: 'Diario', time: '08:30', taken: true },
    { id: '3', name: 'Omega-3', dosage: '1000 mg', frequency: 'Diario', time: '12:00', taken: false },
    { id: '4', name: 'Magnesio', dosage: '400 mg', frequency: 'Diario', time: '21:00', taken: false },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');

  const toggleMedicationTaken = (id: string) =>
    setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));

  const addMedication = () => {
    if (!newMedName.trim()) return;
    setMedications(prev => [...prev, { id: Date.now().toString(), name: newMedName, dosage: newMedDosage, frequency: 'Diario', time: newMedTime, taken: false }]);
    setNewMedName(''); setNewMedDosage(''); setNewMedTime('08:00');
  };

  const removeMedication = (id: string) => setMedications(prev => prev.filter(m => m.id !== id));

  const medTaken = medications.filter(m => m.taken).length;
  const medAdherence = medications.length > 0 ? Math.round((medTaken / medications.length) * 100) : 0;

  const getQualityEmoji = (q: number) => q <= 2 ? '😴' : q <= 3 ? '😑' : q <= 4 ? '😊' : '😴✨';

  // TAB CONFIG
  const tabConfig: { id: WellnessTab; label: string }[] = [
    { id: 'sleep',    label: '😴 Sleep Tracker' },
    { id: 'hydration',label: '💧 Hydration' },
    { id: 'medication',label: '💊 Medication' },
    { id: 'period',   label: '🩸 Menstrual Cycle' },
    { id: 'healthlog',label: '🏥 Health Log' },
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
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? C.accent : C.lightCream,
              color: activeTab === tab.id ? C.paper : C.dark,
              border: `2px solid ${activeTab === tab.id ? C.accent : C.tan}`,
              borderRadius: '8px', padding: '0.75rem 1.25rem',
              fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {/* === SLEEP TRACKER === */}
        {activeTab === 'sleep' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              <div style={card()}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  😴 Registrar Sueño de Hoy
                </h2>
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
                        backgroundColor: sleepQuality === q ? C.accent : C.cream,
                        color: sleepQuality === q ? C.paper : C.dark,
                        border: `2px solid ${sleepQuality === q ? C.accent : C.tan}`,
                        borderRadius: '8px', fontSize: '1.5rem', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
                      }}>★</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: C.dark, marginBottom: '0.5rem' }}>📝 Notas (opcional)</label>
                  <textarea value={sleepNotes} onChange={e => setSleepNotes(e.target.value)} placeholder="¿Algo a notar sobre tu sueño de esta noche?"
                    style={{ ...inputStyle, minHeight: '70px', resize: 'none', fontFamily: 'inherit' }} />
                </div>
                <button onClick={handleSaveSleep} disabled={savingSleep} style={{
                  backgroundColor: savingSleep ? C.tan : C.accent, color: C.paper,
                  border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem',
                  fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%',
                }}>
                  {savingSleep ? 'Guardando...' : '💾 Guardar Sueño'}
                </button>
              </div>

              <div style={card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` })}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>📋 Historial</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: `2px solid ${C.lightTan}` }}>
                    {['Fecha', 'Dormida', 'Despertar', 'Duración', 'Calidad'].map(h => (
                      <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: C.warm }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {sleepEntries.map((e, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                        <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{e.date}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{e.bedtime}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', color: C.warm }}>{e.wakeTime}</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '600', color: C.dark }}>{e.duration}h</td>
                        <td style={{ padding: '8px', fontSize: '0.85rem', color: C.accent }}>{'★'.repeat(e.quality)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: '⏱ Promedio de Sueño', value: `${averageSleepDuration}h`, color: C.info, bg: C.infoLight },
                { label: '⭐ Calidad Promedio', value: `${averageSleepQuality}/5`, color: C.accent, bg: C.accentGlow },
                { label: '📅 Noches Registradas', value: `${sleepEntries.length}`, color: C.success, bg: C.successLight },
                { label: '🎯 Meta de Sueño', value: '8h', color: C.warning, bg: C.warningLight },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, border: `2px solid ${s.color}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>{s.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === HYDRATION === */}
        {activeTab === 'hydration' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div>
              <div style={card()}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: C.dark, margin: '0 0 1.5rem 0', fontFamily: 'Georgia, serif' }}>
                  💧 Hydration Diaria
                </h2>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
                  {/* Water bottle visual */}
                  <div style={{
                    width: '120px', height: '240px', backgroundColor: C.cream, border: `2px solid ${C.info}`,
                    borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'flex-end',
                    position: 'relative', overflow: 'hidden', flexShrink: 0,
                  }}>
                    <div style={{ width: '100%', height: `${hydrationPct}%`, backgroundColor: C.info, transition: 'height 0.4s ease' }} />
                    <div style={{ position: 'absolute', fontSize: '1rem', fontWeight: '700', color: C.dark, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }}>
                      {hydrationPct}%
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>
                      {hydrationToday} ml / {hydrationGoal} ml
                    </p>
                    <div style={{ width: '100%', height: '12px', backgroundColor: C.cream, borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                      <div style={{ width: `${hydrationPct}%`, height: '100%', backgroundColor: C.info, borderRadius: '6px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[250, 500, 750].map(ml => (
                        <button key={ml} onClick={() => setHydrationToday(prev => Math.min(prev + ml, hydrationGoal))} style={{
                          padding: '10px', backgroundColor: C.info, color: C.paper,
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
                        }}>
                          +{ml}ml
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setHydrationToday(0)} style={{
                      marginTop: '8px', width: '100%', padding: '8px', backgroundColor: C.cream,
                      border: `1px solid ${C.tan}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: C.warm,
                    }}>
                      Reiniciar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: '💧 Hoy', value: `${hydrationToday}ml`, color: C.info, bg: C.infoLight },
                { label: '🎯 Meta', value: `${hydrationGoal}ml`, color: C.accent, bg: C.accentGlow },
                { label: '✅ Completado', value: `${hydrationPct}%`, color: C.success, bg: C.successLight },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: s.bg, border: `2px solid ${s.color}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark, margin: '0 0 0.5rem 0' }}>{s.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: s.color, margin: '0' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === MEDICATION === */}
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
                { label: '✅ Tomados', value: `${medTaken}/${medications.length}`, color: C.success, bg: C.successLight },
                { label: '📊 Adherencia', value: `${medAdherence}%`, color: C.info, bg: C.infoLight },
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

        {/* === MENSTRUAL CYCLE === */}
        {activeTab === 'period' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Último Período', value: '15 Mar 2026', color: C.danger, bg: C.dangerLight },
                { label: 'Próximo Estimado', value: '12 Abr 2026', color: C.info, bg: C.infoLight },
                { label: 'Ciclo Promedio', value: '28 días', color: C.warning, bg: C.warningLight },
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.infoLight }} /> Ventana fértil</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.accentGlow }} /> Ovulación</div>
              </div>
            </div>

            <div style={{ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}`, borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: C.dark, margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>
                Síntomas del Ciclo
              </h2>
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
                    { start: '15 Mar', dur: '5 días', cycle: '28 días', symptoms: 'Cólicos, Fatiga' },
                    { start: '15 Feb', dur: '4 días', cycle: '29 días', symptoms: 'Leve' },
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

        {/* === HEALTH LOG (Symptoms + Appointments) === */}
        {activeTab === 'healthlog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Symptom Tracker */}
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
                    { date: '4 Abr', symptom: 'Fatiga', intensity: 4, dur: 'Todo el día', notes: 'Dormí mal' },
                    { date: '3 Abr', symptom: 'Dolor muscular', intensity: 7, dur: '1-3 horas', notes: 'Post-entrenamiento' },
                    { date: '1 Abr', symptom: 'Congestión', intensity: 3, dur: 'Todo el día', notes: 'Cambio de clima' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                      <td style={{ padding: '8px', fontSize: '0.85rem', color: C.dark }}>{row.date}</td>
                      <td style={{ padding: '8px', fontSize: '0.85rem', fontWeight: '500', color: C.dark }}>{row.symptom}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                          backgroundColor: row.intensity >= 7 ? C.dangerLight : row.intensity >= 4 ? C.warningLight : C.successLight,
                          color: row.intensity >= 7 ? C.danger : row.intensity >= 4 ? C.warning : C.success }}>
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

            {/* Medical Appointments */}
            <div style={{ ...card({ backgroundColor: C.warmWhite, border: `2px solid ${C.lightTan}` }), marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: C.dark, margin: 0, fontFamily: 'Georgia, serif' }}>🏥 Citas Médicas</h2>
                <button style={{ padding: '8px 16px', backgroundColor: C.accent, color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                  + Nueva Cita
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                {[
                  { doctor: 'Dr. García', specialty: 'Medicina General', date: '10 Abr 2026', time: '10:00', location: 'Clínica Central', notes: 'Chequeo anual' },
                  { doctor: 'Dra. López', specialty: 'Dermatología', date: '18 Abr 2026', time: '15:30', location: 'Hospital Sur', notes: 'Revisión lunar' },
                  { doctor: 'Dr. Martínez', specialty: 'Odontología', date: '25 Abr 2026', time: '09:00', location: 'Clínica Dental', notes: 'Limpieza semestral' },
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
                    { date: '15 Mar 2026', doctor: 'Dr. García', specialty: 'General', result: 'Todo en orden, análisis normal' },
                    { date: '20 Feb 2026', doctor: 'Dra. Ruiz', specialty: 'Oftalmología', result: 'Vista estable, nueva receta' },
                    { date: '10 Ene 2026', doctor: 'Dr. Torres', specialty: 'Traumatología', result: 'Recuperación completa rodilla' },
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
