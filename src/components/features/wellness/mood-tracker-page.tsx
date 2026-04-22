'use client';
import { todayLocal } from "@/lib/date/local";

import { useState, useEffect } from 'react';
import { cn, ErrorBanner } from '@/components/ui';
import { useWellnessStore } from '@/stores/wellness-store';
import { useAppStore, type WellnessTab } from '@/stores/app-store';
import { useWellnessExtendedStore } from '@/stores/wellness-extended-store';

// ── Color class helpers ────────────────────────────────────────────────────────
function hydrationClass(pct: number): string {
  if (pct <= 0)  return 'bg-brand-cream';
  if (pct < 25)  return 'bg-[#E8F4FD]';
  if (pct < 50)  return 'bg-[#BDDFF5]';
  if (pct < 75)  return 'bg-[#7DC3EA]';
  if (pct < 100) return 'bg-[#4AAAD6]';
  return 'bg-[#2E8BC0]';
}

function medClass(pct: number): string {
  if (pct <= 0)  return 'bg-brand-cream';
  if (pct < 40)  return 'bg-[#FDF6DC]';
  if (pct < 70)  return 'bg-accent-glow';
  if (pct < 100) return 'bg-[#F5D547]';
  return 'bg-[#D4A843]';
}

// ── Shared style constants ─────────────────────────────────────────────────────
const INP    = "w-full px-3 py-[0.75rem] border border-brand-tan rounded-[6px] bg-brand-paper text-brand-dark text-[0.95rem] box-border";
const INP_SM = "w-full px-2 py-2 border border-brand-tan rounded-[6px] bg-brand-paper text-brand-dark text-[0.85rem] box-border";
const CARD   = "bg-brand-light-cream border-2 border-brand-tan rounded-[12px] p-6 mb-6";
const CARD_W = "bg-brand-warm-white border-2 border-brand-light-tan rounded-[12px] p-6 mb-6";
const LABEL  = "block text-[0.9rem] font-semibold text-brand-dark mb-2";
const LABEL_SM = "block text-[0.75rem] text-brand-warm mb-1";

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const monthShort  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const getDaysInMonth     = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => { const d = new Date(y, m, 1).getDay(); return (d + 6) % 7; };

const SLEEP_GOAL_KEY     = 'sleep_goal';
const DEFAULT_SLEEP_GOAL = 8;

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function saveLS(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

interface SupplementFact { nutrient: string; amount: string; dv: string; }
interface MedicationItem {
  id: string; name: string; brand: string; dosage: string;
  frequency: string; time: string; taken: boolean; supplementFacts: SupplementFact[];
}

const MoodTrackerPage = () => {
  const { wellnessSubTab, setWellnessSubTab } = useAppStore();
  const [activeTab, setActiveTab] = useState<WellnessTab>(wellnessSubTab);
  const { saveSleepToday, savingSleep, sleepLogs, deleteSleepLog, initialize } = useWellnessStore();
  const {
    hydrationLogs, hydrationGoalMl,
    medications: storeMedications, todayMedicationLogs,
    symptomLogs: storeSymptomLogs,
    appointments: storeAppointments,
    initialize: initWellness,
    saveHydration: storeHydration,
    addMedication: storeAddMed,
    removeMedication: storeRemoveMed,
    toggleMedicationTaken: storeToggleMed,
    addSymptomLog: storeAddSymptom,
    addAppointment: storeAddAppt,
    removeAppointment: storeRemoveAppt,
    error: wellnessError,
    clearError: clearWellnessError,
  } = useWellnessExtendedStore();

  useEffect(() => { setActiveTab(wellnessSubTab); }, [wellnessSubTab]);
  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => { initWellness(); }, [initWellness]);

  const switchTab = (tab: WellnessTab) => { setActiveTab(tab); setWellnessSubTab(tab); };

  // ── SLEEP STATE ──────────────────────────────────────────────────────────
  const today = todayLocal();
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
  const hydrationLogMap: Record<string, number> = Object.fromEntries(
    hydrationLogs.map(h => [h.date, h.amountMl])
  );
  const hydrationGoal = hydrationGoalMl;
  const [editingGoal, setEditingGoal]           = useState(false);
  const [goalInput, setGoalInput]               = useState('');
  const [hydrationView, setHydrationView]       = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [hydrationMonth, setHydrationMonth]     = useState(() => new Date());
  const [hydrationYear, setHydrationYear]       = useState(() => new Date().getFullYear());
  const [hydrationSession, setHydrationSession] = useState(0);
  const [savedToday, setSavedToday]             = useState(false);

  const hydrationSavedToday = hydrationLogMap[today] ?? 0;
  const hydrationCurrent    = hydrationSavedToday + hydrationSession;
  const hydrationPct        = Math.min(Math.round((hydrationCurrent / hydrationGoal) * 100), 100);

  const addWater = (ml: number) => setHydrationSession(prev => prev + ml);
  const resetSession = () => { setHydrationSession(0); setSavedToday(false); };

  const saveDayHydration = () => {
    if (hydrationCurrent <= 0) return;
    storeHydration(hydrationCurrent, hydrationGoal).then(() => {
      setHydrationSession(0);
      setSavedToday(true);
      setTimeout(() => setSavedToday(false), 3000);
    });
  };

  const saveHydroGoal = () => {
    const g = parseInt(goalInput);
    if (!isNaN(g) && g > 0) { storeHydration(hydrationSavedToday, g); }
    setEditingGoal(false);
  };

  const annualHydroData = Array.from({ length: 12 }, (_, m) => {
    const days = getDaysInMonth(hydrationYear, m);
    let total = 0, count = 0;
    for (let d = 1; d <= days; d++) {
      const key = `${hydrationYear}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if ((hydrationLogMap[key] ?? 0) > 0) { total += hydrationLogMap[key]; count++; }
    }
    return { month: m, avg: count > 0 ? Math.round(total / count) : 0, count };
  });
  const maxHydroAvg = Math.max(...annualHydroData.map(d => d.avg), hydrationGoal);

  // ── MEDICATION STATE ─────────────────────────────────────────────────────
  const medications: MedicationItem[] = storeMedications.map(med => ({
    id: med.id, name: med.name, brand: med.brand ?? '', dosage: med.dosage ?? '',
    frequency: med.frequency, time: med.timeOfDay ?? '',
    taken: todayMedicationLogs.some(l => l.medicationId === med.id && l.taken),
    supplementFacts: med.supplementFacts.map(sf => ({ nutrient: sf.nutrient, amount: sf.amount, dv: sf.dailyValuePct ?? '' })),
  }));
  const [newMedName,   setNewMedName]   = useState('');
  const [newMedBrand,  setNewMedBrand]  = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime,   setNewMedTime]   = useState('08:00');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  const [newSuppFacts, setNewSuppFacts]   = useState<SupplementFact[]>([]);
  const [newSuppNutrient, setNewSuppNutrient] = useState('');
  const [newSuppAmount,   setNewSuppAmount]   = useState('');
  const [newSuppDv,       setNewSuppDv]       = useState('');
  const [medView,  setMedView]  = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [medMonth, setMedMonth] = useState(() => new Date());
  const [medYear,  setMedYear]  = useState(() => new Date().getFullYear());

  const toggleMedicationTaken = (id: string) => {
    const isTaken = medications.find(m => m.id === id)?.taken ?? false;
    storeToggleMed(id, !isTaken);
  };

  const addSuppFact = () => {
    const nutrient = newSuppNutrient.trim();
    const amount   = newSuppAmount.trim();
    if (!nutrient || !amount) return;
    setNewSuppFacts(prev => [...prev, { nutrient, amount, dv: newSuppDv.trim() }]);
    setNewSuppNutrient(''); setNewSuppAmount(''); setNewSuppDv('');
  };

  const removeSuppFact = (idx: number) => setNewSuppFacts(prev => prev.filter((_, i) => i !== idx));

  const addMedication = () => {
    if (!newMedName.trim()) return;
    storeAddMed({
      name: newMedName.trim(), brand: newMedBrand.trim() || undefined,
      dosage: newMedDosage.trim() || undefined, frequency: 'Diario', timeOfDay: newMedTime,
      supplementFacts: newSuppFacts.map(sf => ({ nutrient: sf.nutrient, amount: sf.amount, dailyValuePct: sf.dv || undefined })),
    });
    setNewMedName(''); setNewMedBrand(''); setNewMedDosage(''); setNewMedTime('08:00'); setNewSuppFacts([]);
  };

  const removeMedication = (id: string) => storeRemoveMed(id);
  const medTaken     = medications.filter(m => m.taken).length;
  const medAdherence = medications.length > 0 ? Math.round((medTaken / medications.length) * 100) : 0;
  const saveMedDay   = () => { /* auto-saved on toggle */ };
  const medLog: Record<string, number> = {};
  const annualMedData = Array.from({ length: 12 }, (_, m) => ({ month: m, avg: 0, count: 0 }));
  const maxMedAvg = 100;

  // ── HEALTH LOG STATE ─────────────────────────────────────────────────────
  const SYMPTOM_OPTIONS = ['Dolor de cabeza','Dolor de espalda','Fatiga','Náuseas','Mareo','Dolor muscular','Congestión','Tos','Insomnio','Ansiedad','Otros'];
  const [selectedSymptom,   setSelectedSymptom]   = useState(SYMPTOM_OPTIONS[0]);
  const [customSymptom,     setCustomSymptom]     = useState('');
  const [symptomIntensity,  setSymptomIntensity]  = useState(5);
  const [symptomDuration,   setSymptomDuration]   = useState('< 1 hora');
  const [symptomNotes,      setSymptomNotes]      = useState('');

  const symptomLogs = storeSymptomLogs.map(s => ({
    id: s.id,
    date: new Date(s.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    symptom: s.symptom, intensity: s.intensity, duration: s.duration ?? '', notes: s.notes ?? '',
  }));

  const addSymptomLog = () => {
    const symptomName = selectedSymptom === 'Otros' ? (customSymptom.trim() || 'Otros') : selectedSymptom;
    storeAddSymptom({ symptom: symptomName, intensity: symptomIntensity, duration: symptomDuration, notes: symptomNotes || undefined, date: today });
    setCustomSymptom(''); setSymptomNotes(''); setSymptomIntensity(5);
  };

  // ── APPOINTMENT STATE ────────────────────────────────────────────────────
  const appointments = storeAppointments.map(a => ({
    id: a.id, doctor: a.doctorName, specialty: a.specialty,
    date: a.dateTime ? new Date(a.dateTime).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    time: a.dateTime && a.dateTime.includes('T') ? a.dateTime.split('T')[1]?.substring(0, 5) ?? '' : '',
    location: a.location ?? '', notes: a.notes ?? '',
    status: a.status === 'pending' ? 'Pendiente' : a.status,
  }));
  const [showApptForm,     setShowApptForm]     = useState(false);
  const [newApptDoctor,    setNewApptDoctor]    = useState('');
  const [newApptSpecialty, setNewApptSpecialty] = useState('');
  const [newApptDate,      setNewApptDate]      = useState('');
  const [newApptTime,      setNewApptTime]      = useState('');
  const [newApptLocation,  setNewApptLocation]  = useState('');
  const [newApptNotes,     setNewApptNotes]     = useState('');

  const addAppointment = () => {
    const doctor = newApptDoctor.trim();
    if (!doctor) return;
    storeAddAppt({
      doctorName: doctor, specialty: newApptSpecialty.trim(),
      dateTime: newApptDate ? `${newApptDate}T${newApptTime || '00:00'}` : new Date().toISOString(),
      location: newApptLocation.trim() || undefined, notes: newApptNotes.trim() || undefined,
    });
    setNewApptDoctor(''); setNewApptSpecialty(''); setNewApptDate('');
    setNewApptTime(''); setNewApptLocation(''); setNewApptNotes('');
    setShowApptForm(false);
  };

  const removeAppointment = (id: string) => storeRemoveAppt(id);

  const tabConfig: { id: WellnessTab; label: string }[] = [
    { id: 'sleep',      label: '😴 Sleep Tracker' },
    { id: 'hydration',  label: '💧 Hydration'      },
    { id: 'medication', label: '💊 Medication'     },
    { id: 'healthlog',  label: '🏥 Health Log'     },
  ];

  const subTabBtnCls = (active: boolean, activeCls: string) => cn(
    "px-[1.1rem] py-2 rounded-[8px] text-[0.9rem] font-semibold cursor-pointer border-2 transition-all",
    active ? activeCls : "bg-brand-light-cream text-brand-dark border-brand-tan"
  );

  // ── HEATMAP RENDERER ─────────────────────────────────────────────────────
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
    todayCls: string,
  ) => {
    const yr = month.getFullYear();
    const mo = month.getMonth();
    const daysInMo = getDaysInMonth(yr, mo);
    const firstDay = getFirstDayOfMonth(yr, mo);
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];
    return (
      <div className={CARD_W}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[1.3rem] font-semibold text-brand-dark m-0 font-serif">
            {title} — {monthNames[mo]} {yr}
          </h2>
          <div className="flex gap-2">
            <button onClick={onPrev} className="px-[14px] py-[6px] border border-brand-tan rounded-[6px] bg-brand-cream cursor-pointer text-brand-dark font-bold text-[1rem]">‹</button>
            <button onClick={onNext} className="px-[14px] py-[6px] border border-brand-tan rounded-[6px] bg-brand-cream cursor-pointer text-brand-dark font-bold text-[1rem]">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-[5px]">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} className="text-center text-[0.7rem] font-semibold text-brand-warm pb-[6px]">{d}</div>
          ))}
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const key    = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const val    = log[key] ?? 0;
            const pct    = goal > 0 ? (val / goal) * 100 : 0;
            const isToday = key === today;
            const dark   = pct >= textDarkThreshold;
            return (
              <div
                key={key}
                title={val > 0 ? `${unitLabel(val)} (${Math.round(pct)}%)` : 'Sin registro'}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-[6px] border-2",
                  colorFn(pct),
                  isToday ? todayCls : "border-transparent"
                )}
              >
                <span className={cn(
                  "text-[0.75rem] leading-[1.2]",
                  isToday ? "font-bold" : "font-medium",
                  dark ? "text-[#2c2c00]" : "text-brand-dark"
                )}>{day}</span>
                {val > 0 && (
                  <span className={cn("text-[0.5rem] leading-[1.1]", dark ? "text-[#2c2c00]" : "text-brand-warm")}>
                    {unitLabel(val)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-[6px] mt-4 items-center">
          <span className="text-[0.75rem] text-brand-warm mr-[2px]">Menos</span>
          {[0, 20, 45, 70, 90, 100].map(p => (
            <div key={p} className={cn("w-[18px] h-[18px] rounded-[4px] border border-black/10", colorFn(p))} title={`${p}%`} />
          ))}
          <span className="text-[0.75rem] text-brand-warm ml-[2px]">Meta</span>
        </div>
      </div>
    );
  };

  // ── ANNUAL CHART RENDERER ────────────────────────────────────────────────
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
    <div className={CARD_W}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[1.3rem] font-semibold text-brand-dark m-0 font-serif">
          {title} — {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={onPrev} className="px-[14px] py-[6px] border border-brand-tan rounded-[6px] bg-brand-cream cursor-pointer text-brand-dark font-bold text-[1rem]">‹</button>
          <button onClick={onNext} className="px-[14px] py-[6px] border border-brand-tan rounded-[6px] bg-brand-cream cursor-pointer text-brand-dark font-bold text-[1rem]">›</button>
        </div>
      </div>
      <div className="flex items-end gap-[6px] h-[150px] pb-1 border-b-2 border-brand-light-tan">
        {data.map(({ month: m, avg, count }) => {
          const pct     = maxVal > 0 ? (avg / maxVal) * 100 : 0;
          const barBg   = avg === 0 ? 'bg-brand-cream' : colorFn((avg / goal) * 100);
          const isCurMo = m === new Date().getMonth() && year === new Date().getFullYear();
          return (
            <div key={m} className="flex-1 flex flex-col items-center h-full justify-end gap-[3px]">
              <div
                title={avg > 0 ? `${avg}${unitSuffix} prom. (${count} días)` : 'Sin datos'}
                className={cn(
                  "w-full rounded-[4px_4px_0_0] min-h-[3px] transition-[height] duration-300",
                  barBg,
                  isCurMo ? "border-2 border-accent" : avg > 0 ? "border border-[#ccc]" : "border border-brand-tan"
                )}
                style={{ height: `${Math.max(avg > 0 ? pct : 2, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-[6px] mt-1">
        {data.map(({ month: m }) => (
          <div key={m} className="flex-1 text-center text-[0.65rem] text-brand-warm">{monthShort[m]}</div>
        ))}
      </div>
      {data.some(d => d.count > 0) && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {data.filter(d => d.count > 0).map(d => (
            <div key={d.month} className="bg-brand-warm-white border border-brand-light-tan rounded-[8px] p-2 text-center">
              <div className="text-[0.7rem] text-brand-warm">{monthNames[d.month]}</div>
              <div className="text-[0.9rem] font-bold text-accent">{d.avg}{unitSuffix}</div>
              <div className="text-[0.65rem] text-brand-warm">{d.count} días</div>
            </div>
          ))}
        </div>
      )}
      {!data.some(d => d.count > 0) && (
        <p className="text-brand-warm text-center py-6 m-0 text-[0.9rem]">Sin datos para {year}.</p>
      )}
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-brand-paper">
      <ErrorBanner error={wellnessError} onDismiss={clearWellnessError} />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[2.5rem] font-bold text-brand-dark m-0 font-serif">Bienestar & Salud</h1>
        <p className="text-[1rem] text-brand-warm mt-2 mb-0">
          Registra tu sueño, hidratación, medicamentos y más
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              "rounded-[8px] px-5 py-3 text-[0.95rem] font-semibold cursor-pointer border-2 transition-all",
              activeTab === tab.id
                ? "bg-accent text-brand-paper border-accent"
                : "bg-brand-light-cream text-brand-dark border-brand-tan"
            )}
          >{tab.label}</button>
        ))}
      </div>

      <div>

        {/* ═══════════════════════ SLEEP ═══════════════════════ */}
        {activeTab === 'sleep' && (
          <div className="grid grid-cols-[2fr_1fr] gap-8">
            <div>
              <div className={CARD}>
                <h2 className="text-[1.3rem] font-semibold text-brand-dark mb-6 mt-0 font-serif">
                  😴 Registrar Sueño
                </h2>

                <div className="mb-4">
                  <label className={LABEL}>
                    📅 Fecha
                    {sleepDate !== today && (
                      <span className="ml-2 text-[0.8rem] text-warning font-normal">Registrando para fecha pasada</span>
                    )}
                  </label>
                  <input type="date" value={sleepDate} max={today} onChange={e => setSleepDate(e.target.value)} className={INP} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className={LABEL}>🌙 Hora de Dormir</label>
                    <input type="time" value={sleepBedtime} onChange={e => setSleepBedtime(e.target.value)} className={INP} />
                  </div>
                  <div>
                    <label className={LABEL}>☀️ Hora de Despertar</label>
                    <input type="time" value={sleepWakeTime} onChange={e => setSleepWakeTime(e.target.value)} className={INP} />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[0.9rem] font-semibold text-brand-dark mb-3">
                    ⭐ Calidad del Sueño: {sleepQuality}/5 {getQualityEmoji(sleepQuality)}
                  </label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(q => (
                      <button key={q} onClick={() => setSleepQuality(q)} className={cn(
                        "w-[50px] h-[50px] rounded-[8px] text-[1.5rem] cursor-pointer font-semibold border-2 transition-all",
                        sleepQuality >= q
                          ? "bg-accent text-brand-paper border-accent"
                          : "bg-brand-cream text-brand-dark border-brand-tan"
                      )}>★</button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className={LABEL}>📝 Notas (opcional)</label>
                  <textarea
                    value={sleepNotes}
                    onChange={e => setSleepNotes(e.target.value)}
                    placeholder="¿Algo a notar sobre tu sueño?"
                    className={cn(INP, "min-h-[70px] resize-none font-[inherit]")}
                  />
                </div>

                {sleepError && (
                  <div className="mb-4 px-3 py-3 bg-danger-light border border-danger rounded-[6px] text-danger text-[0.9rem]">
                    ⚠️ {sleepError}
                  </div>
                )}
                {sleepSuccess && (
                  <div className="mb-4 px-3 py-3 bg-success-light border border-success rounded-[6px] text-success text-[0.9rem]">
                    ✅ ¡Sueño registrado exitosamente!
                  </div>
                )}

                <button
                  onClick={handleSaveSleep}
                  disabled={savingSleep}
                  className={cn(
                    "w-full text-brand-paper border-none rounded-[8px] px-6 py-3 text-[1rem] font-semibold transition-all",
                    savingSleep ? "bg-brand-tan cursor-not-allowed" : "bg-accent cursor-pointer"
                  )}
                >
                  {savingSleep ? 'Guardando...' : '💾 Guardar Sueño'}
                </button>
              </div>

              {/* History */}
              <div className={CARD_W}>
                <h2 className="text-[1.1rem] font-semibold text-brand-dark mb-4 mt-0 font-serif">📋 Historial</h2>
                {sleepLogs.length === 0 ? (
                  <p className="text-brand-warm text-center py-8 m-0 text-[0.9rem]">
                    Sin registros aún. ¡Empieza registrando tu sueño de hoy!
                  </p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-brand-light-tan">
                        {['Fecha','Dormida','Despertar','Duración','Calidad',''].map(h => (
                          <th key={h} className="p-2 text-left text-[0.8rem] font-semibold text-brand-warm">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sleepLogs.map((e) => (
                        <tr key={e.id} className="border-b border-brand-cream">
                          <td className="p-2 text-[0.85rem] text-brand-dark">{e.date}</td>
                          <td className="p-2 text-[0.85rem] text-brand-warm">{e.bedtime}</td>
                          <td className="p-2 text-[0.85rem] text-brand-warm">{e.wakeTime}</td>
                          <td className="p-2 text-[0.85rem] font-semibold text-brand-dark">{e.durationHours}h</td>
                          <td className="p-2 text-[0.85rem] text-accent">{'★'.repeat(e.quality)}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDeleteSleep(e.id)}
                              disabled={deletingId === e.id}
                              title="Eliminar registro"
                              className={cn(
                                "bg-transparent border-none cursor-pointer text-[1rem] px-[6px] py-[2px] rounded-[4px]",
                                deletingId === e.id ? "text-brand-tan" : "text-danger"
                              )}
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
            <div className="flex flex-col gap-4">
              <div className="bg-info-light border-2 border-info rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">⏱ Promedio de Sueño</p>
                <p className="text-[2rem] font-bold text-info m-0">{avgSleepDur ? `${avgSleepDur}h` : '—'}</p>
              </div>
              <div className="bg-accent-glow border-2 border-accent rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">⭐ Calidad Promedio</p>
                <p className="text-[2rem] font-bold text-accent m-0">{avgSleepQual ? `${avgSleepQual}/5` : '—'}</p>
              </div>
              <div className="bg-success-light border-2 border-success rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">📅 Noches Registradas</p>
                <p className="text-[2rem] font-bold text-success m-0">{sleepLogs.length}</p>
              </div>
              <div className="bg-warning-light border-2 border-warning rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">🎯 Meta de Sueño</p>
                {editingSleepGoal ? (
                  <div className="flex gap-[6px] items-center justify-center">
                    <input
                      type="number" value={sleepGoalInput} step="0.5" min="1" max="16"
                      onChange={e => setSleepGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveSleepGoal(); if (e.key === 'Escape') setEditingSleepGoal(false); }}
                      autoFocus
                      className="w-[70px] px-2 py-[6px] border border-warning rounded-[6px] text-center text-[1rem] font-semibold text-brand-dark bg-brand-paper"
                    />
                    <span className="text-[0.85rem] text-brand-dark">h</span>
                    <button onClick={saveSleepGoal} className="px-[10px] py-[6px] bg-warning text-brand-paper border-none rounded-[6px] cursor-pointer font-semibold">✓</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[2rem] font-bold text-warning mt-0 mb-2">{sleepGoal}h</p>
                    <button
                      onClick={() => { setSleepGoalInput(String(sleepGoal)); setEditingSleepGoal(true); }}
                      className="px-[14px] py-1 border border-warning rounded-[6px] bg-transparent cursor-pointer text-[0.8rem] text-warning font-semibold"
                    >✏️ Editar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ HYDRATION ═══════════════════════ */}
        {activeTab === 'hydration' && (
          <div className="grid grid-cols-[2fr_1fr] gap-8">
            <div>
              <div className="flex gap-2 mb-6">
                {([['daily','📅 Diario'],['monthly','📆 Mensual'],['annual','📊 Anual']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setHydrationView(id)}
                    className={subTabBtnCls(hydrationView === id, "bg-info text-brand-paper border-info")}>
                    {label}
                  </button>
                ))}
              </div>

              {hydrationView === 'daily' && (
                <div className={CARD}>
                  <h2 className="text-[1.3rem] font-semibold text-brand-dark mb-6 mt-0 font-serif">
                    💧 Hidratación Diaria
                  </h2>
                  <div className="flex gap-8 items-center">
                    {/* Water bottle */}
                    <div className="w-[120px] h-[240px] bg-brand-cream border-2 border-info rounded-[12px] flex items-end relative overflow-hidden shrink-0">
                      <div className="w-full bg-info transition-[height] duration-[400ms]" style={{ height: `${hydrationPct}%` }} />
                      <div className={cn(
                        "absolute text-[1rem] font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1]",
                        hydrationPct > 50 ? "text-brand-paper" : "text-brand-dark"
                      )}>
                        {hydrationPct}%
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-brand-dark mt-0 mb-2">
                        {hydrationCurrent} ml / {hydrationGoal} ml
                        {hydrationSavedToday > 0 && hydrationSession > 0 && (
                          <span className="text-[0.8rem] text-brand-warm ml-2">(guardado: {hydrationSavedToday}ml + sesión: {hydrationSession}ml)</span>
                        )}
                      </p>
                      <div className="w-full h-3 bg-brand-cream rounded-[6px] overflow-hidden mb-6">
                        <div className="h-full bg-info rounded-[6px] transition-[width] duration-300" style={{ width: `${hydrationPct}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {[250, 500, 750].map(ml => (
                          <button key={ml} onClick={() => addWater(ml)}
                            className="py-[10px] bg-info text-brand-paper border-none rounded-[8px] cursor-pointer font-semibold text-[0.85rem]">
                            +{ml}ml
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={saveDayHydration}
                        disabled={hydrationCurrent <= 0}
                        className={cn(
                          "w-full py-[10px] mb-2 text-brand-paper border-none rounded-[8px] font-semibold text-[0.9rem] transition-all",
                          savedToday ? "bg-success cursor-pointer" : hydrationCurrent > 0 ? "bg-accent cursor-pointer" : "bg-brand-tan cursor-not-allowed"
                        )}
                      >
                        {savedToday ? '✅ ¡Día guardado!' : '💾 Guardar día'}
                      </button>
                      <button onClick={resetSession}
                        className="w-full py-2 bg-brand-cream border border-brand-tan rounded-[8px] cursor-pointer text-[0.8rem] text-brand-warm">
                        Reiniciar sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {hydrationView === 'monthly' && renderHeatmap(
                hydrationLogMap, hydrationMonth,
                () => setHydrationMonth(new Date(hydrationMonth.getFullYear(), hydrationMonth.getMonth() - 1, 1)),
                () => setHydrationMonth(new Date(hydrationMonth.getFullYear(), hydrationMonth.getMonth() + 1, 1)),
                '💧 Mapa de Calor', hydrationClass, hydrationGoal,
                v => v >= 1000 ? `${(v/1000).toFixed(1)}L` : `${v}ml`, 75, 'border-info',
              )}

              {hydrationView === 'annual' && renderAnnualChart(
                annualHydroData, hydrationYear,
                () => setHydrationYear(y => y - 1),
                () => setHydrationYear(y => y + 1),
                '📊 Resumen Anual', hydrationClass, hydrationGoal, maxHydroAvg, 'ml',
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <div className="bg-info-light border-2 border-info rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">💧 Hoy</p>
                <p className="text-[2rem] font-bold text-info m-0">{hydrationCurrent}ml</p>
                {hydrationSavedToday > 0 && (
                  <p className="text-[0.75rem] text-brand-warm mt-1 mb-0">Guardado: {hydrationSavedToday}ml</p>
                )}
              </div>
              <div className="bg-accent-glow border-2 border-accent rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">🎯 Meta</p>
                {editingGoal ? (
                  <div className="flex gap-[6px] items-center justify-center">
                    <input
                      type="number" value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveHydroGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                      autoFocus
                      className="w-[80px] px-2 py-[6px] border border-accent rounded-[6px] text-center text-[1rem] font-semibold text-brand-dark bg-brand-paper"
                    />
                    <span className="text-[0.85rem] text-brand-dark">ml</span>
                    <button onClick={saveHydroGoal} className="px-[10px] py-[6px] bg-accent text-brand-paper border-none rounded-[6px] cursor-pointer font-semibold">✓</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[2rem] font-bold text-accent mt-0 mb-2">{hydrationGoal}ml</p>
                    <button
                      onClick={() => { setGoalInput(String(hydrationGoal)); setEditingGoal(true); }}
                      className="px-[14px] py-1 border border-accent rounded-[6px] bg-transparent cursor-pointer text-[0.8rem] text-accent font-semibold"
                    >✏️ Editar</button>
                  </div>
                )}
              </div>
              <div className="bg-success-light border-2 border-success rounded-[12px] p-6 text-center">
                <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">✅ Completado</p>
                <p className="text-[2rem] font-bold text-success m-0">{hydrationPct}%</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ MEDICATION ═══════════════════════ */}
        {activeTab === 'medication' && (
          <div className="grid grid-cols-[2fr_1fr] gap-8">
            <div>
              <div className="flex gap-2 mb-6">
                {([['daily','💊 Diario'],['monthly','📆 Mensual'],['annual','📊 Anual']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setMedView(id)}
                    className={subTabBtnCls(medView === id, "bg-accent text-brand-paper border-accent")}>
                    {label}
                  </button>
                ))}
              </div>

              {medView === 'daily' && (
                <>
                  <div className={CARD}>
                    <h2 className="text-[1.3rem] font-semibold text-brand-dark mb-6 mt-0 font-serif">
                      💊 Mis Medicamentos
                    </h2>
                    <div className="flex flex-col gap-3">
                      {medications.map(med => (
                        <div key={med.id} className={cn(
                          "bg-brand-paper border rounded-[8px] overflow-hidden",
                          med.taken ? "border-success" : "border-brand-tan"
                        )}>
                          <div className="p-4 flex items-center gap-4">
                            <input type="checkbox" checked={med.taken} onChange={() => toggleMedicationTaken(med.id)}
                              className="w-5 h-5 cursor-pointer accent-accent" />
                            <div className="flex-1">
                              <p className="text-[1rem] font-semibold text-brand-dark m-0">{med.name}</p>
                              <p className="text-[0.8rem] text-brand-warm mt-[0.15rem] mb-0">
                                {med.brand && <span className="text-brand-medium italic">{med.brand} · </span>}
                                {med.dosage} · {med.frequency} · {med.time}
                              </p>
                            </div>
                            {med.supplementFacts.length > 0 && (
                              <button onClick={() => setExpandedMedId(expandedMedId === med.id ? null : med.id)}
                                className="bg-transparent border border-brand-tan rounded-[6px] cursor-pointer text-brand-warm text-[0.75rem] px-2 py-1">
                                {expandedMedId === med.id ? '▲ Facts' : '▼ Facts'}
                              </button>
                            )}
                            <span className={cn(
                              "px-3 py-[0.3rem] rounded-[6px] text-[0.8rem] font-semibold",
                              med.taken ? "bg-success-light text-success" : "bg-warning-light text-warning"
                            )}>
                              {med.taken ? '✅ Tomado' : '⏳ Pendiente'}
                            </span>
                            <button onClick={() => removeMedication(med.id)}
                              className="bg-transparent border-none cursor-pointer text-danger text-[1.1rem] px-1">✕</button>
                          </div>
                          {expandedMedId === med.id && med.supplementFacts.length > 0 && (
                            <div className="border-t border-brand-cream bg-brand-light-cream px-4 py-3">
                              <p className="text-[0.75rem] font-bold text-brand-dark mt-0 mb-2 uppercase tracking-[0.05em]">Supplement Facts</p>
                              <table className="w-full border-collapse text-[0.8rem]">
                                <thead>
                                  <tr className="border-b border-brand-tan">
                                    {['Nutriente','Cantidad','% VD'].map(h => (
                                      <th key={h} className="px-2 py-1 text-left text-brand-warm font-semibold">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {med.supplementFacts.map((sf, i) => (
                                    <tr key={i} className="border-b border-brand-cream">
                                      <td className="px-2 py-1 text-brand-dark">{sf.nutrient}</td>
                                      <td className="px-2 py-1 text-brand-warm">{sf.amount}</td>
                                      <td className="px-2 py-1 text-brand-warm">{sf.dv || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={saveMedDay}
                      className="mt-4 w-full py-[10px] bg-accent text-brand-paper border-none rounded-[8px] cursor-pointer font-semibold text-[0.9rem]">
                      💾 Guardar adherencia de hoy
                    </button>
                  </div>

                  <div className={CARD_W}>
                    <h2 className="text-[1.1rem] font-semibold text-brand-dark mb-4 mt-0 font-serif">➕ Agregar Medicamento</h2>
                    <div className="grid grid-cols-2 gap-[10px] mb-[10px]">
                      <div>
                        <label className={LABEL_SM}>Nombre</label>
                        <input value={newMedName} onChange={e => setNewMedName(e.target.value)} placeholder="Vitamina D..." className={INP_SM} />
                      </div>
                      <div>
                        <label className={LABEL_SM}>Marca</label>
                        <input value={newMedBrand} onChange={e => setNewMedBrand(e.target.value)} placeholder="Nature Made..." className={INP_SM} />
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-[10px] items-end mb-4">
                      <div>
                        <label className={LABEL_SM}>Dosis</label>
                        <input value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} placeholder="2000 IU" className={INP_SM} />
                      </div>
                      <div>
                        <label className={LABEL_SM}>Hora</label>
                        <input type="time" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} className={INP_SM} />
                      </div>
                      <button onClick={addMedication}
                        className="px-4 py-2 bg-accent text-brand-paper border-none rounded-[6px] cursor-pointer font-semibold">
                        Agregar
                      </button>
                    </div>
                    <div className="border-t border-brand-cream pt-3">
                      <p className="text-[0.8rem] font-semibold text-brand-dark mt-0 mb-2">Supplement Facts (opcional)</p>
                      {newSuppFacts.length > 0 && (
                        <div className="flex flex-col gap-1 mb-2">
                          {newSuppFacts.map((sf, i) => (
                            <div key={i} className="flex gap-2 items-center text-[0.8rem] bg-brand-paper px-2 py-1 rounded-[6px] border border-brand-cream">
                              <span className="flex-1 text-brand-dark">{sf.nutrient}</span>
                              <span className="text-brand-warm">{sf.amount}</span>
                              {sf.dv && <span className="text-brand-warm">{sf.dv} VD</span>}
                              <button type="button" onClick={() => removeSuppFact(i)}
                                className="bg-transparent border-none cursor-pointer text-danger text-[0.9rem] px-[2px]">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end">
                        <div>
                          <label className={LABEL_SM}>Nutriente</label>
                          <input value={newSuppNutrient} onChange={e => setNewSuppNutrient(e.target.value)} placeholder="Vitamina C..."
                            className="w-full px-2 py-[6px] border border-brand-tan rounded-[6px] bg-brand-paper text-brand-dark text-[0.8rem] box-border" />
                        </div>
                        <div>
                          <label className={LABEL_SM}>Cantidad</label>
                          <input value={newSuppAmount} onChange={e => setNewSuppAmount(e.target.value)} placeholder="500 mg"
                            className="w-full px-2 py-[6px] border border-brand-tan rounded-[6px] bg-brand-paper text-brand-dark text-[0.8rem] box-border" />
                        </div>
                        <div>
                          <label className={LABEL_SM}>% VD</label>
                          <input value={newSuppDv} onChange={e => setNewSuppDv(e.target.value)} placeholder="556%"
                            className="w-full px-2 py-[6px] border border-brand-tan rounded-[6px] bg-brand-paper text-brand-dark text-[0.8rem] box-border" />
                        </div>
                        <button
                          type="button" onClick={addSuppFact}
                          disabled={!newSuppNutrient.trim() || !newSuppAmount.trim()}
                          className={cn(
                            "px-3 py-[6px] border-none rounded-[6px] font-semibold text-[0.8rem]",
                            (!newSuppNutrient.trim() || !newSuppAmount.trim())
                              ? "bg-brand-light-tan text-brand-warm cursor-not-allowed"
                              : "bg-brand-medium text-brand-paper cursor-pointer"
                          )}
                        >+ Añadir</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {medView === 'monthly' && renderHeatmap(
                medLog, medMonth,
                () => setMedMonth(new Date(medMonth.getFullYear(), medMonth.getMonth() - 1, 1)),
                () => setMedMonth(new Date(medMonth.getFullYear(), medMonth.getMonth() + 1, 1)),
                '💊 Adherencia Mensual', medClass, 100, v => `${v}%`, 70, 'border-accent',
              )}

              {medView === 'annual' && renderAnnualChart(
                annualMedData, medYear,
                () => setMedYear(y => y - 1),
                () => setMedYear(y => y + 1),
                '📊 Adherencia Anual', medClass, 100, maxMedAvg, '%',
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {[
                { label: '✅ Tomados',    value: `${medTaken}/${medications.length}`, colorCls: 'text-success', bgCls: 'bg-success-light', borderCls: 'border-success' },
                { label: '📊 Adherencia', value: `${medAdherence}%`,                  colorCls: 'text-info',    bgCls: 'bg-info-light',    borderCls: 'border-info'    },
              ].map((s, i) => (
                <div key={i} className={cn("border-2 rounded-[12px] p-6 text-center", s.bgCls, s.borderCls)}>
                  <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">{s.label}</p>
                  <p className={cn("text-[2rem] font-bold m-0", s.colorCls)}>{s.value}</p>
                </div>
              ))}
              <div className="bg-brand-light-cream border-2 border-brand-tan rounded-[12px] p-4">
                <p className="text-[0.85rem] text-brand-warm m-0 leading-[1.6]">
                  💡 Registra tus medicamentos diarios y marca cada uno como tomado para mantener un historial de adherencia.
                </p>
              </div>
              {medications.length > 0 && (
                <div className="bg-accent-glow border-2 border-accent rounded-[12px] p-6 text-center">
                  <p className="text-[0.9rem] font-semibold text-brand-dark mt-0 mb-2">📅 Adherencia hoy</p>
                  <p className="text-[2rem] font-bold text-accent m-0">{medAdherence}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ HEALTH LOG ═══════════════════════ */}
        {activeTab === 'healthlog' && (
          <div className="flex flex-col gap-6">
            {/* ── Registrar Síntoma ── */}
            <div className={CARD_W}>
              <h2 className="text-[1.2rem] font-semibold text-brand-dark mb-4 mt-0 font-serif">🩺 Registrar Síntoma</h2>
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className={LABEL_SM}>Síntoma</label>
                  <select value={selectedSymptom} onChange={e => setSelectedSymptom(e.target.value)} className={INP_SM}>
                    {SYMPTOM_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {selectedSymptom === 'Otros' && (
                    <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)}
                      placeholder="Describe el síntoma..."
                      className={cn(INP_SM, "mt-[6px] border-accent")} />
                  )}
                </div>
                <div>
                  <label className={LABEL_SM}>Intensidad (1-10)</label>
                  <input type="number" min="1" max="10" value={symptomIntensity}
                    onChange={e => setSymptomIntensity(Number(e.target.value))} className={INP_SM} />
                </div>
                <div>
                  <label className={LABEL_SM}>Duración</label>
                  <select value={symptomDuration} onChange={e => setSymptomDuration(e.target.value)} className={INP_SM}>
                    {['< 1 hora','1-3 horas','3-6 horas','Todo el día','Varios días'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={addSymptomLog}
                  className="px-4 py-2 bg-accent text-brand-paper border-none rounded-[6px] cursor-pointer font-semibold">
                  Registrar
                </button>
              </div>
              <div className="mt-[10px]">
                <label className={LABEL_SM}>Notas (opcional)</label>
                <input value={symptomNotes} onChange={e => setSymptomNotes(e.target.value)}
                  placeholder="Contexto del síntoma..." className={INP_SM} />
              </div>
            </div>

            {/* ── Historial de Síntomas ── */}
            <div className={CARD_W}>
              <h2 className="text-[1.1rem] font-semibold text-brand-dark mb-4 mt-0 font-serif">Historial de Síntomas</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-brand-light-tan">
                    {['Fecha','Síntoma','Intensidad','Duración','Notas'].map(h => (
                      <th key={h} className="p-2 text-left text-[0.8rem] font-semibold text-brand-warm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {symptomLogs.map((row) => (
                    <tr key={row.id} className="border-b border-brand-cream">
                      <td className="p-2 text-[0.85rem] text-brand-dark">{row.date}</td>
                      <td className="p-2 text-[0.85rem] font-medium text-brand-dark">{row.symptom}</td>
                      <td className="p-2 text-center">
                        <span className={cn(
                          "inline-block px-[10px] py-[2px] rounded-[12px] text-[0.8rem] font-semibold",
                          row.intensity >= 7 ? "bg-danger-light text-danger"
                            : row.intensity >= 4 ? "bg-warning-light text-warning"
                            : "bg-success-light text-success"
                        )}>{row.intensity}/10</span>
                      </td>
                      <td className="p-2 text-[0.85rem] text-brand-warm">{row.duration}</td>
                      <td className="p-2 text-[0.85rem] text-brand-warm">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Citas Médicas ── */}
            <div className="bg-brand-warm-white border-2 border-brand-light-tan rounded-[12px] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[1.2rem] font-semibold text-brand-dark m-0 font-serif">🏥 Citas Médicas</h2>
                <button type="button" onClick={() => setShowApptForm(v => !v)}
                  className={cn(
                    "px-4 py-2 text-brand-paper border-none rounded-[8px] cursor-pointer font-semibold text-[0.9rem]",
                    showApptForm ? "bg-brand-medium" : "bg-accent"
                  )}>
                  {showApptForm ? '✕ Cancelar' : '+ Nueva Cita'}
                </button>
              </div>

              {showApptForm && (
                <div className="bg-brand-light-cream border border-brand-tan rounded-[10px] p-5 mb-5">
                  <h3 className="text-[0.95rem] font-semibold text-brand-dark mt-0 mb-4">Nueva Cita Médica</h3>
                  <div className="grid grid-cols-2 gap-[10px] mb-[10px]">
                    {[
                      { label: 'Doctor / Médico *', val: newApptDoctor,    set: setNewApptDoctor,    ph: 'Dr. García',        type: 'text' },
                      { label: 'Especialidad',       val: newApptSpecialty, set: setNewApptSpecialty, ph: 'Medicina General',  type: 'text' },
                      { label: 'Fecha *',            val: newApptDate,      set: setNewApptDate,      ph: '',                  type: 'date' },
                      { label: 'Hora',               val: newApptTime,      set: setNewApptTime,      ph: '',                  type: 'time' },
                      { label: 'Lugar / Clínica',    val: newApptLocation,  set: setNewApptLocation,  ph: 'Clínica Central',  type: 'text' },
                      { label: 'Notas',              val: newApptNotes,     set: setNewApptNotes,     ph: 'Chequeo anual...', type: 'text' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className={LABEL_SM}>{f.label}</label>
                        <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                          className={cn(INP_SM, "box-border")} />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button" onClick={addAppointment} disabled={!newApptDoctor.trim()}
                    className={cn(
                      "px-5 py-2 border-none rounded-[8px] font-semibold",
                      !newApptDoctor.trim()
                        ? "bg-brand-light-tan text-brand-warm cursor-not-allowed"
                        : "bg-accent text-brand-paper cursor-pointer"
                    )}
                  >Guardar Cita</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                {appointments.filter(a => a.status === 'Pendiente').map(apt => (
                  <div key={apt.id} className="bg-brand-paper border border-brand-cream rounded-[10px] p-4 relative">
                    <button onClick={() => removeAppointment(apt.id)}
                      className="absolute top-2 right-2 bg-transparent border-none cursor-pointer text-danger text-[0.9rem]">✕</button>
                    <div className="flex justify-between mb-2 pr-5">
                      <div>
                        <div className="text-[1rem] font-semibold text-brand-dark">{apt.doctor}</div>
                        <div className="text-[0.8rem] text-brand-warm">{apt.specialty}</div>
                      </div>
                      <span className="bg-info-light text-info px-[10px] py-1 rounded-[12px] text-[0.75rem] font-semibold h-fit">{apt.status}</span>
                    </div>
                    <div className="text-[0.85rem] text-brand-dark mb-1">📅 {apt.date}{apt.time && ` a las ${apt.time}`}</div>
                    {apt.location && <div className="text-[0.85rem] text-brand-warm mb-1">📍 {apt.location}</div>}
                    {apt.notes && <div className="text-[0.85rem] text-brand-warm">📝 {apt.notes}</div>}
                  </div>
                ))}
              </div>

              <h3 className="text-[1rem] font-semibold text-brand-dark mb-3 mt-0">Historial de Citas</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-brand-light-tan">
                    {['Fecha','Doctor','Especialidad','Resultado'].map(h => (
                      <th key={h} className="p-2 text-left text-[0.8rem] font-semibold text-brand-warm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '15 Mar 2026', doctor: 'Dr. García', specialty: 'General',       result: 'Todo en orden, análisis normal' },
                    { date: '20 Feb 2026', doctor: 'Dra. Ruiz',  specialty: 'Oftalmología',  result: 'Vista estable, nueva receta'    },
                    { date: '10 Ene 2026', doctor: 'Dr. Torres', specialty: 'Traumatología', result: 'Recuperación completa rodilla'  },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-brand-cream">
                      <td className="p-2 text-[0.85rem] text-brand-dark">{row.date}</td>
                      <td className="p-2 text-[0.85rem] font-medium text-brand-dark">{row.doctor}</td>
                      <td className="p-2 text-[0.85rem] text-brand-warm">{row.specialty}</td>
                      <td className="p-2 text-[0.85rem] text-brand-warm">{row.result}</td>
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
