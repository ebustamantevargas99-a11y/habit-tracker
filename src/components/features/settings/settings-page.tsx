'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Trophy, Zap, Shield, Download, Trash2, Bell, Palette, Globe, Lock, Check, LayoutGrid, Sun, ShieldCheck, RotateCcw } from 'lucide-react';
import { LEVELS, XP_REWARDS } from '@/lib/constants';
import { exportToJSON, exportToCSV } from '@/lib/utils';
import { useGamificationStore } from '@/stores/gamification-store';
import { useUserStore } from '@/stores/user-store';
import { useThemeStore, type ThemeId } from '@/stores/theme-store';
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
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('America/Mexico_City');

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
            <label className={LABEL}>Bio</label>
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

      {/* Account Stats */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">📊 Estadísticas de Cuenta</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Días Activo', value: '127', emoji: '📅' },
            { label: 'Hábitos Creados', value: '24', emoji: '🔁' },
            { label: 'Total Completados', value: '2,847', emoji: '✅' },
            { label: 'Mejor Racha', value: '94 días', emoji: '🔥' },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 bg-brand-light-cream rounded-[10px]">
              <div className="text-[1.5rem] mb-1">{s.emoji}</div>
              <div className="text-[1.3rem] font-bold text-accent">{s.value}</div>
              <div className="text-[0.75rem] text-brand-warm">{s.label}</div>
            </div>
          ))}
        </div>
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
            { action: 'Life Score sube 10+', xp: XP_REWARDS.lifeScoreUp10 },
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
  const { theme, setTheme } = useThemeStore();

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

  const THEMES: { id: ThemeId; name: string; colors: string[]; preview: string }[] = [
    { id: 'warm',   name: 'Cálido',       preview: 'Beige & Dorado',   colors: ['#3D2B1F','#6B4226','#B8860B','#EDE0D4'] },
    { id: 'ocean',  name: 'Océano',       preview: 'Azul Marino',      colors: ['#0D2137','#1A3A5C','#0A7ABA','#C8E0EC'] },
    { id: 'forest', name: 'Bosque',       preview: 'Verde Natural',    colors: ['#1A2C1A','#2D4A2D','#27AE60','#C8E8C8'] },
    { id: 'rose',   name: 'Rosa Pastel',  preview: 'Rosa & Suave',     colors: ['#4A2035','#7A3055','#C45585','#F5D8E8'] },
  ];

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
          <Shield size={20} color={C.accent} /> Streak Insurance
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

      {/* Visual Theme */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-1 flex items-center gap-2">
          <Palette size={20} color={C.accent} /> Tema Visual
        </h3>
        <p className="text-[0.85rem] text-brand-warm m-0 mb-4">
          Cambia la paleta de colores de toda la aplicación al instante
        </p>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "px-3 py-4 rounded-[10px] cursor-pointer text-center transition-all duration-200",
                theme === t.id
                  ? "bg-accent-glow border-2 border-accent"
                  : "bg-brand-light-cream border border-brand-tan"
              )}
            >
              <div className="flex justify-center gap-1 mb-2">
                {t.colors.map((c, i) => (
                  <div key={i} className="w-[18px] h-[18px] rounded-full" style={{ backgroundColor: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <div className="text-[0.85rem] font-semibold text-brand-dark">{t.name}</div>
              <div className="text-[0.65rem] text-brand-warm mt-[2px]">{t.preview}</div>
              {theme === t.id && (
                <div className="text-[0.65rem] text-success mt-1 font-bold flex items-center justify-center gap-[2px]">
                  <Check size={10} /> Activo
                </div>
              )}
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
  const handleExportAll = () => {
    const data = {
      exportDate: new Date().toISOString(),
      app: 'Ultimate Habit Tracker',
      version: '1.0.0',
      profile: { name: 'Eduardo', level: 5, xp: 1200 },
      stats: { daysActive: 127, habitsCreated: 24, totalCompleted: 2847, bestStreak: 94 },
    };
    exportToJSON(data, 'habit-tracker-backup');
  };

  const handleExportHabits = () => {
    const habits = [
      { nombre: 'Meditar', categoria: 'Bienestar', racha: 127, fuerza: '95%', creado: '2026-01-01' },
      { nombre: 'Ejercicio', categoria: 'Fitness', racha: 94, fuerza: '88%', creado: '2026-01-01' },
      { nombre: 'Lectura', categoria: 'Organización', racha: 82, fuerza: '82%', creado: '2026-01-05' },
      { nombre: 'Presupuesto', categoria: 'Finanzas', racha: 43, fuerza: '65%', creado: '2026-01-10' },
    ];
    exportToCSV(habits, 'mis-habitos');
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
          Descarga una copia de todos tus datos
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportAll}
            className="px-6 py-3 bg-accent text-brand-paper border-none rounded-lg cursor-pointer font-semibold flex items-center gap-2"
          >
            <Download size={16} /> Exportar Todo (JSON)
          </button>
          <button
            onClick={handleExportHabits}
            className="px-6 py-3 bg-info text-brand-paper border-none rounded-lg cursor-pointer font-semibold flex items-center gap-2"
          >
            <Download size={16} /> Exportar Hábitos (CSV)
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className={CARD}>
        <h3 className="font-serif text-brand-dark m-0 mb-4">💾 Uso de Almacenamiento</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Hábitos & Rastreadores', size: '2.4 MB', pct: 30 },
            { label: 'Fitness & Métricas', size: '1.8 MB', pct: 22 },
            { label: 'Finanzas', size: '1.2 MB', pct: 15 },
            { label: 'Diarios & Notas', size: '0.9 MB', pct: 11 },
            { label: 'Configuración', size: '0.1 MB', pct: 1 },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-[0.85rem] mb-1">
                <span className="text-brand-dark">{item.label}</span>
                <span className="text-brand-warm">{item.size}</span>
              </div>
              <div className="w-full h-2 bg-brand-light-cream rounded-[4px] overflow-hidden">
                <div className="h-full bg-accent rounded-[4px]" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[0.85rem] text-brand-warm">
          Total usado: <strong className="text-brand-dark">6.4 MB</strong> de 50 MB
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-[linear-gradient(135deg,#3D2B1F,#6B4226)] rounded-xl p-6 text-brand-paper border-none">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-serif m-0 mb-1 text-accent-glow">⭐ Plan Pro</h3>
            <p className="text-[0.85rem] text-brand-light-tan m-0">
              Desbloquea todas las funciones premium
            </p>
          </div>
          <div className="text-right">
            <div className="text-[1.5rem] font-bold text-accent-glow">$4.99<span className="text-[0.8rem] font-normal">/mes</span></div>
            <div className="text-[0.75rem] text-brand-light-tan">o $49.99 de por vida</div>
          </div>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          {['Datos ilimitados', 'Export PDF', 'Temas premium', 'Sin anuncios', 'Soporte prioritario'].map(f => (
            <span key={f} className="px-[14px] py-[6px] bg-white/10 rounded-[16px] text-[0.75rem] text-accent-glow">
              ✓ {f}
            </span>
          ))}
        </div>
        <button className="mt-4 px-8 py-3 bg-[linear-gradient(135deg,#B8860B,#D4A843)] text-brand-paper border-none rounded-lg cursor-pointer font-bold text-[1rem]">
          Actualizar a Pro
        </button>
      </div>

      {/* Danger Zone */}
      <div className={cn(CARD, "border-danger")}>
        <h3 className="font-serif text-danger m-0 mb-2 flex items-center gap-2">
          <Trash2 size={20} color="#C0544F" /> Zona de Peligro
        </h3>
        <p className="text-[0.85rem] text-brand-warm m-0 mb-4">
          Estas acciones son irreversibles. Procede con cuidado.
        </p>
        <div className="flex gap-3">
          <button className="px-5 py-[10px] bg-transparent text-danger border border-danger rounded-lg cursor-pointer font-semibold text-[0.85rem]">
            Reiniciar Progreso
          </button>
          <button className="px-5 py-[10px] bg-danger text-brand-paper border-none rounded-lg cursor-pointer font-semibold text-[0.85rem]">
            Eliminar Cuenta
          </button>
        </div>
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
