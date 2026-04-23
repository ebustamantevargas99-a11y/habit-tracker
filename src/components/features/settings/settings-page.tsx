'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Trophy, Zap, Shield, Download, Trash2, Bell, Palette, Globe, Lock, Check, LayoutGrid, Sun, ShieldCheck, RotateCcw } from 'lucide-react';
import { LEVELS, XP_REWARDS } from '@/lib/constants';
import { exportToJSON, exportToCSV } from '@/lib/utils';
import { useGamificationStore } from '@/stores/gamification-store';
import { useUserStore } from '@/stores/user-store';
import { useHabitStore } from '@/stores/habit-store';
import { api } from '@/lib/api-client';
import { cn } from '@/components/ui';
import ExportSection from './export-section';
import ModulesTab from './modules-tab';
import AppearanceTab from './appearance-tab';
import SecurityTab from './security-tab';
import ResetDataTab from './reset-data-tab';

// Used for recharts/icon color props only
const C = {
  dark: "#3D2B1F", brown: "#6B4226", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C",
};

const CARD   = "bg-brand-paper rounded-xl p-6 border border-brand-tan shadow-[0_2px_4px_rgba(0,0,0,0.05)]";
const INP    = "w-full px-4 py-3 rounded-lg border border-brand-tan text-[0.95rem] bg-brand-cream text-brand-dark font-sans";
const LABEL  = "block text-[0.85rem] font-semibold text-brand-dark mb-[6px]";
const ROW    = "flex justify-between items-center py-[14px] border-b border-brand-light-cream";
const SELECT = "px-[14px] py-2 rounded-md border border-brand-tan bg-brand-cream text-[0.9rem] text-brand-dark";

// ============== PROFILE TAB ==============
function ProfileTab() {
  const { user, saveProfile, isSaving, initialize } = useUserStore();
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('America/Mexico_City');

  // Estadísticas reales derivadas del habit-store + perfil
  const accountStats = React.useMemo(() => {
    const habitsCreated = habits.length;
    // Total completados: cada log con completed=true es una completación
    const completedLogs = logs.filter((l) => l.completed);
    const totalCompleted = completedLogs.length;
    // Días activos = fechas únicas con al menos 1 hábito completado
    const uniqueDates = new Set(completedLogs.map((l) => l.date));
    const daysActive = uniqueDates.size;
    // Mejor racha = max de streakBest entre todos los hábitos
    const bestStreak = habits.reduce(
      (max, h) => Math.max(max, h.streakBest ?? 0),
      0,
    );
    return { habitsCreated, totalCompleted, daysActive, bestStreak };
  }, [habits, logs]);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setBio(user.profile?.bio ?? '');
      setTimezone(user.profile?.timezone ?? 'America/Mexico_City');
    }
  }, [user]);

  const email = user?.email ?? '';

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar + Basic Info */}
      <div className={cn(CARD, "flex gap-6 items-start")}>
        <div className="w-[100px] h-[100px] rounded-full bg-[linear-gradient(135deg,#B8860B,#D4A843)] flex items-center justify-center text-[2.5rem] text-brand-paper font-serif font-bold shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <label className={LABEL}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} className={INP} />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input value={email} readOnly className={cn(INP, "opacity-70 cursor-default")} type="email" />
          </div>
          <div>
            <label className={LABEL}>Biografía</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className={cn(INP, "min-h-[60px] resize-y")} />
          </div>
          <div>
            <label className={LABEL}>Zona Horaria</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)} className={INP}>
              <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
              <option value="America/Bogota">Bogotá (UTC-5)</option>
              <option value="America/Lima">Lima (UTC-5)</option>
              <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
              <option value="Europe/Madrid">Madrid (UTC+1)</option>
              <option value="America/New_York">Nueva York (UTC-5)</option>
            </select>
          </div>
          <button
            onClick={() => saveProfile({ name, bio, timezone })}
            disabled={isSaving}
            className={cn(
              "self-start px-7 py-[10px] text-brand-paper border-none rounded-lg font-semibold text-[0.9rem]",
              isSaving ? "bg-brand-tan cursor-not-allowed" : "bg-accent cursor-pointer"
            )}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Account Stats — derivadas de datos reales del habit-store */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">📊 Estadísticas de Cuenta</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Días Activo',       value: String(accountStats.daysActive),                       emoji: '📅' },
            { label: 'Hábitos Creados',   value: String(accountStats.habitsCreated),                    emoji: '🔁' },
            { label: 'Total Completados', value: accountStats.totalCompleted.toLocaleString("es-MX"),   emoji: '✅' },
            { label: 'Mejor Racha',       value: `${accountStats.bestStreak} día${accountStats.bestStreak === 1 ? '' : 's'}`, emoji: '🔥' },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 bg-brand-light-cream rounded-[10px]">
              <div className="text-[1.5rem] mb-1">{s.emoji}</div>
              <div className="text-[1.3rem] font-bold text-accent">{s.value}</div>
              <div className="text-[0.75rem] text-brand-warm">{s.label}</div>
            </div>
          ))}
        </div>
        {accountStats.habitsCreated === 0 && (
          <p className="text-xs text-brand-warm m-0 mt-3 text-center">
            Aún no has creado hábitos. Las estadísticas aparecerán conforme uses la app.
          </p>
        )}
      </div>
    </div>
  );
}

// ============== GAMIFICATION TAB ==============
function GamificationTab() {
  const { totalXP, currentLevel, xpForNextLevel, xpProgress, badges: storeBadges } = useGamificationStore();
  const currentXP = totalXP;
  const pct = xpProgress;

  const xpHistory = [
    { day: 'Lun', xp: 45 }, { day: 'Mar', xp: 60 }, { day: 'Mié', xp: 35 },
    { day: 'Jue', xp: 80 }, { day: 'Vie', xp: 55 }, { day: 'Sáb', xp: 70 },
    { day: 'Dom', xp: 40 },
  ];

  const badges = storeBadges.map(b => ({
    name: b.name, emoji: b.emoji, desc: b.description,
    earned: b.isEarned, date: b.earnedDate || null,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Level Card */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F_0%,#6B4226_100%)] rounded-xl p-6 text-brand-paper border-none">
        <div className="flex items-center gap-6">
          <div className="w-[100px] h-[100px] rounded-full bg-[linear-gradient(135deg,#B8860B,#F0D78C)] flex items-center justify-center flex-col shrink-0">
            <Zap size={24} color={C.dark} />
            <span className="text-[1.8rem] font-bold text-brand-dark font-serif">{currentLevel}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-serif m-0 mb-1 text-[1.4rem] text-accent-glow">
              {LEVELS[currentLevel - 1]?.name || 'Imparable'}
            </h2>
            <p className="m-0 mb-3 text-[0.85rem] text-brand-light-tan">
              {currentXP} / {xpForNextLevel} XP · {xpForNextLevel - currentXP} XP para Nivel {currentLevel + 1}
            </p>
            <div className="w-full h-3 bg-white/15 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md bg-[linear-gradient(90deg,#B8860B,#F0D78C)] transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* XP Earning Rules */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">⚡ Cómo Ganar XP</h3>
        <div className="grid grid-cols-2 gap-[10px]">
          {([
            { action: 'Completar un hábito', xp: XP_REWARDS.completeHabit },
            { action: 'Completar todos los del día', xp: XP_REWARDS.completeAllDaily },
            { action: 'Racha de 7 días', xp: XP_REWARDS.streak7 },
            { action: 'Racha de 30 días', xp: XP_REWARDS.streak30 },
            { action: 'Registrar entrenamiento', xp: XP_REWARDS.logWorkout },
            { action: 'Mes con score ≥ 90', xp: XP_REWARDS.monthAt90 },
            { action: 'Puntuación de Vida sube 10+', xp: XP_REWARDS.lifeScoreUp10 },
          ]).map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 bg-brand-light-cream rounded-lg">
              <span className="text-[0.85rem] text-brand-dark">{r.action}</span>
              <span className="text-[0.9rem] font-bold text-accent">+{r.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* XP This Week Chart */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">📈 XP Esta Semana</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={xpHistory}>
            <XAxis dataKey="day" tick={{ fill: C.warm, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.warm, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${C.tan}` }} />
            <Line type="monotone" dataKey="xp" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent, r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-center mt-2 text-[0.85rem] text-brand-warm">
          Total esta semana: <strong className="text-accent">385 XP</strong>
        </div>
      </div>

      {/* All Levels */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">🏆 Niveles</h3>
        <div className="grid grid-cols-5 gap-[10px]">
          {LEVELS.map((lvl, i) => {
            const isUnlocked = (i + 1) <= currentLevel;
            const isCurrent = (i + 1) === currentLevel;
            return (
              <div
                key={i}
                className={cn(
                  "text-center px-2 py-[14px] rounded-[10px] border transition-all",
                  isCurrent  ? "bg-accent-glow border-2 border-accent"
                  : isUnlocked ? "bg-success-light border border-success"
                  : "bg-brand-light-cream border border-brand-tan opacity-50"
                )}
              >
                <div className="text-[1.5rem] mb-1">{isUnlocked ? '⭐' : '🔒'}</div>
                <div className="text-[0.75rem] font-bold text-brand-dark">Nivel {i + 1}</div>
                <div className="text-[0.65rem] text-brand-warm">{lvl.name}</div>
                <div className="text-[0.6rem] text-brand-medium mt-[2px]">{lvl.xpRequired} XP</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">
          🎖️ Insignias ({badges.filter(b => b.earned).length}/{badges.length})
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {badges.map((b, i) => (
            <div
              key={i}
              className={cn(
                "text-center px-2 py-4 rounded-xl border-2 transition-all duration-200",
                b.earned ? "bg-accent-glow border-accent" : "bg-brand-light-cream border-brand-tan opacity-40"
              )}
            >
              <div className="text-[2rem] mb-[6px]">{b.emoji}</div>
              <div className="text-[0.75rem] font-semibold text-brand-dark">{b.name}</div>
              <div className="text-[0.6rem] text-brand-warm mt-1">{b.desc}</div>
              {b.earned && b.date && (
                <div className="text-[0.55rem] text-success mt-1 font-semibold">
                  ✓ {b.date}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============== PREFERENCES TAB ==============
function PreferencesTab() {
  const { user, saveProfile } = useUserStore();
  const { streakInsuranceDays } = useGamificationStore();

  const [notifications, setNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [notifStatus, setNotifStatus] = useState('');

  const [weekStartsOn, setWeekStartsOn] = useState(1);
  const [language, setLanguage] = useState('es');
  const [insurance, setInsurance] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setWeekStartsOn(user.profile.weekStartsOn ?? 1);
      setLanguage(user.profile.language ?? 'es');
    }
    setInsurance(streakInsuranceDays ?? 1);
    const enabled = localStorage.getItem('habit-notifications') === 'true';
    const time = localStorage.getItem('habit-reminder-time') || '08:00';
    setNotifications(enabled);
    setReminderTime(time);
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, [user, streakInsuranceDays]);

  const handleToggleNotifications = async () => {
    if (!notifications) {
      if (typeof Notification === 'undefined') {
        setNotifStatus('Tu navegador no soporta notificaciones');
        return;
      }
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        setNotifications(true);
        localStorage.setItem('habit-notifications', 'true');
        new Notification('✅ Notificaciones activadas', {
          body: `Recibirás recordatorios diarios a las ${reminderTime}`,
          icon: '/favicon.ico',
        });
        setNotifStatus('Notificaciones activadas');
      } else {
        setNotifStatus('Permiso denegado. Habilítalas en la configuración del navegador.');
      }
    } else {
      setNotifications(false);
      localStorage.setItem('habit-notifications', 'false');
      setNotifStatus('Notificaciones desactivadas');
    }
  };

  const handleTimeChange = (time: string) => {
    setReminderTime(time);
    localStorage.setItem('habit-reminder-time', time);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile({ weekStartsOn, language });
      await api.patch('/user/gamification', { streakInsuranceDays: insurance });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Temas visuales ahora viven en la pestaña "Apariencia" (con su propia
  // UI rica que incluye preview de fuente, no solo colores).

  return (
    <div className="flex flex-col gap-6">
      {/* Notifications */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4 flex items-center gap-2">
          <Bell size={20} color={C.accent} /> Notificaciones
        </h3>
        <div className={ROW}>
          <div>
            <div className="text-[0.9rem] font-semibold text-brand-dark">Recordatorios de Hábitos</div>
            <div className="text-[0.75rem] text-brand-warm">
              Notificación del sistema en la hora seleccionada
              {notifPermission === 'denied' && <span className="text-danger"> — Permiso denegado en el navegador</span>}
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={cn(
              "w-[50px] h-[28px] rounded-[14px] border-none cursor-pointer relative transition-all duration-300",
              notifications ? "bg-success" : "bg-brand-tan"
            )}
          >
            <div className={cn(
              "w-[22px] h-[22px] rounded-full bg-brand-paper absolute top-[3px] transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.2)]",
              notifications ? "left-[25px]" : "left-[3px]"
            )} />
          </button>
        </div>
        <div className={cn(ROW, "border-b-0")}>
          <div>
            <div className="text-[0.9rem] font-semibold text-brand-dark">Hora de Recordatorio</div>
            <div className="text-[0.75rem] text-brand-warm">Recibirás una notificación del sistema a esta hora</div>
          </div>
          <input type="time" value={reminderTime} onChange={e => handleTimeChange(e.target.value)} className={SELECT} />
        </div>
        {notifStatus && (
          <div className={cn("text-[0.8rem] mt-2 font-medium", notifications ? "text-success" : "text-danger")}>
            {notifStatus}
          </div>
        )}
      </div>

      {/* General */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4 flex items-center gap-2">
          <Globe size={20} color={C.accent} /> General
        </h3>
        <div className={ROW}>
          <div>
            <div className="text-[0.9rem] font-semibold text-brand-dark">Inicio de Semana</div>
            <div className="text-[0.75rem] text-brand-warm">Afecta el calendario mensual del Planificador</div>
          </div>
          <select value={weekStartsOn} onChange={e => setWeekStartsOn(Number(e.target.value))} className={SELECT}>
            <option value={1}>Lunes</option>
            <option value={0}>Domingo</option>
          </select>
        </div>
        <div className={cn(ROW, "border-b-0")}>
          <div>
            <div className="text-[0.9rem] font-semibold text-brand-dark">Idioma</div>
          </div>
          <select value={language} onChange={e => setLanguage(e.target.value)} className={SELECT}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Streak Insurance */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-1 flex items-center gap-2">
          <Shield size={20} color={C.accent} /> Protección de rachas
        </h3>
        <p className="text-[0.85rem] text-brand-warm m-0 mb-4">
          Días consecutivos que puedes fallar un hábito programado sin romper tu racha
        </p>
        <div className="flex gap-[10px]">
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setInsurance(n)}
              className={cn(
                "px-5 py-3 rounded-lg cursor-pointer font-semibold text-[0.9rem]",
                insurance === n
                  ? "bg-accent text-brand-paper border-2 border-accent"
                  : "bg-brand-light-cream text-brand-dark border border-brand-tan"
              )}
            >
              {n === 0 ? 'Ninguno' : `${n} día${n > 1 ? 's' : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "px-8 py-3 text-brand-paper border-none rounded-lg font-semibold text-[0.95rem] flex items-center gap-2 transition-[background-color] duration-300",
            saved ? "bg-success cursor-pointer" : isSaving ? "bg-brand-tan cursor-not-allowed" : "bg-accent cursor-pointer"
          )}
        >
          {saved ? <><Check size={16} /> Guardado</> : isSaving ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </div>
  );
}

// ============== DATA TAB ==============
function DataTab() {
  const habits = useHabitStore((s) => s.habits);
  const [isExporting, setIsExporting] = useState(false);

  // Export GDPR completo: llama a /api/user/export-data que devuelve TODOS
  // los datos del user (perfil + hábitos + logs + finanzas + fitness +
  // nutrición + etc.). Sin mocks, data real de Prisma.
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const data = await api.get<Record<string, unknown>>("/user/export-data");
      exportToJSON(data, `ultimate-tracker-backup-${new Date().toISOString().slice(0, 10)}`);
    } catch {
      alert("Error exportando datos. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export CSV de hábitos: data real del habit-store.
  const handleExportHabits = () => {
    if (habits.length === 0) {
      alert("Aún no tienes hábitos para exportar.");
      return;
    }
    const rows = habits.map((h) => ({
      nombre: h.name,
      categoria: h.category,
      frecuencia: h.frequency,
      racha_actual: h.streakCurrent,
      mejor_racha: h.streakBest,
      fuerza: `${h.strength}%`,
      activo: h.isActive ? "sí" : "no",
      creado: h.createdAt.slice(0, 10),
    }));
    exportToCSV(rows, `habitos-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* AI Export Section */}
      <ExportSection />

      {/* Export */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-2 flex items-center gap-2">
          <Download size={20} color={C.accent} /> Exportar Datos (Backup)
        </h3>
        <p className="text-[0.85rem] text-brand-warm m-0 mb-5">
          Descarga una copia de todos tus datos — útil para backup o GDPR.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => void handleExportAll()}
            disabled={isExporting}
            className={cn(
              "px-6 py-3 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold flex items-center gap-2",
              isExporting && "opacity-50 cursor-not-allowed",
            )}
          >
            <Download size={16} />
            {isExporting ? "Preparando…" : "Exportar Todo (JSON)"}
          </button>
          <button
            onClick={handleExportHabits}
            disabled={habits.length === 0}
            className="px-6 py-3 bg-info text-brand-paper border-none rounded-lg cursor-pointer font-semibold flex items-center gap-2 disabled:opacity-40"
          >
            <Download size={16} /> Exportar Hábitos (CSV)
          </button>
        </div>
        <p className="text-[11px] text-brand-tan m-0 mt-3">
          Para reset de datos ve a la pestaña <strong>Resetear</strong>.
        </p>
      </div>
    </div>
  );
}

// ============== MAIN SETTINGS PAGE ==============
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile',       label: 'Perfil',        icon: User        },
    { id: 'security',      label: 'Seguridad',     icon: ShieldCheck },
    { id: 'modules',       label: 'Módulos',       icon: LayoutGrid  },
    { id: 'appearance',    label: 'Apariencia',    icon: Sun         },
    { id: 'gamification',  label: 'Gamificación',  icon: Trophy      },
    { id: 'preferences',   label: 'Preferencias',  icon: Palette     },
    { id: 'data',          label: 'Datos',         icon: Download    },
    { id: 'reset',         label: 'Resetear',      icon: RotateCcw   },
  ];

  return (
    <div className="p-6 bg-brand-warm-white min-h-screen">
      <div className="mb-8">
        <h1 className="font-serif text-[2.5rem] text-brand-dark m-0 mb-2">Configuración</h1>
        <p className="text-base text-brand-warm m-0">Personaliza tu experiencia</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b-2 border-brand-light-tan">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-3 border-none cursor-pointer rounded-[8px_8px_0_0] text-[0.95rem] font-semibold flex items-center gap-2 transition-all duration-200",
                activeTab === tab.id ? "bg-accent text-brand-paper" : "bg-transparent text-brand-warm"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'profile'      && <ProfileTab />}
        {activeTab === 'security'     && <SecurityTab />}
        {activeTab === 'modules'      && <ModulesTab />}
        {activeTab === 'appearance'   && <AppearanceTab />}
        {activeTab === 'gamification' && <GamificationTab />}
        {activeTab === 'preferences'  && <PreferencesTab />}
        {activeTab === 'data'         && <DataTab />}
        {activeTab === 'reset'        && <ResetDataTab />}
      </div>
    </div>
  );
}
