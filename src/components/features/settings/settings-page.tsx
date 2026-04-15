'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Trophy, Zap, Shield, Download, Trash2, Bell, Palette, Globe, Lock, Check } from 'lucide-react';
import { LEVELS, XP_REWARDS } from '@/lib/constants';
import { exportToJSON, exportToCSV } from '@/lib/utils';
import { useGamificationStore } from '@/stores/gamification-store';
import { useUserStore } from '@/stores/user-store';
import { useThemeStore, type ThemeId } from '@/stores/theme-store';
import { api } from '@/lib/api-client';
import ExportSection from './export-section';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

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

  const handleSave = async () => {
    await saveProfile({ name, bio, timezone });
  };

  const email = user?.email ?? '';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: `1px solid ${C.tan}`, fontSize: '0.95rem',
    backgroundColor: C.cream, color: C.dark, fontFamily: 'Inter, sans-serif',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.85rem', fontWeight: '600',
    color: C.dark, marginBottom: '6px',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '12px', padding: '24px',
    border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Avatar + Basic Info */}
      <div style={{ ...cardStyle, display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', color: C.paper, fontFamily: 'Georgia, serif',
          fontWeight: '700', flexShrink: 0,
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} readOnly style={{ ...inputStyle, opacity: 0.7, cursor: 'default' }} type="email" />
          </div>
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Zona Horaria</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)} style={inputStyle}>
              <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
              <option value="America/Bogota">Bogotá (UTC-5)</option>
              <option value="America/Lima">Lima (UTC-5)</option>
              <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
              <option value="Europe/Madrid">Madrid (UTC+1)</option>
              <option value="America/New_York">Nueva York (UTC-5)</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={isSaving} style={{
            alignSelf: 'flex-start', padding: '10px 28px',
            backgroundColor: isSaving ? C.tan : C.accent,
            color: C.paper, border: 'none', borderRadius: '8px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '0.9rem',
          }}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Account Stats */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0' }}>📊 Estadísticas de Cuenta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Días Activo', value: '127', emoji: '📅' },
            { label: 'Hábitos Creados', value: '24', emoji: '🔁' },
            { label: 'Total Completados', value: '2,847', emoji: '✅' },
            { label: 'Mejor Racha', value: '94 días', emoji: '🔥' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px', backgroundColor: C.lightCream, borderRadius: '10px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.emoji}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: C.accent }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: C.warm }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============== GAMIFICATION TAB ==============
function GamificationTab() {
  const { totalXP, currentLevel, levelName, xpForNextLevel, xpProgress, badges: storeBadges } = useGamificationStore();
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '12px', padding: '24px',
    border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Level Card */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 100%)`,
        color: C.paper, border: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Level Badge */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentGlow})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', flexShrink: 0,
          }}>
            <Zap size={24} color={C.dark} />
            <span style={{ fontSize: '1.8rem', fontWeight: '700', color: C.dark, fontFamily: 'Georgia, serif' }}>{currentLevel}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', margin: '0 0 4px 0', fontSize: '1.4rem', color: C.accentGlow }}>
              {LEVELS[currentLevel - 1]?.name || 'Imparable'}
            </h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: C.lightTan }}>
              {currentXP} / {xpForNextLevel} XP · {xpForNextLevel - currentXP} XP para Nivel {currentLevel + 1}
            </p>
            <div style={{ width: '100%', height: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: '6px',
                background: `linear-gradient(90deg, ${C.accent}, ${C.accentGlow})`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* XP Earning Rules */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0' }}>⚡ Cómo Ganar XP</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {([
            { action: 'Completar un hábito', xp: XP_REWARDS.completeHabit },
            { action: 'Completar todos los del día', xp: XP_REWARDS.completeAllDaily },
            { action: 'Racha de 7 días', xp: XP_REWARDS.streak7 },
            { action: 'Racha de 30 días', xp: XP_REWARDS.streak30 },
            { action: 'Registrar entrenamiento', xp: XP_REWARDS.logWorkout },
            { action: 'Mes con score ≥ 90', xp: XP_REWARDS.monthAt90 },
            { action: 'Life Score sube 10+', xp: XP_REWARDS.lifeScoreUp10 },
          ]).map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', backgroundColor: C.lightCream, borderRadius: '8px',
            }}>
              <span style={{ fontSize: '0.85rem', color: C.dark }}>{r.action}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: C.accent }}>+{r.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* XP This Week Chart */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0' }}>📈 XP Esta Semana</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={xpHistory}>
            <XAxis dataKey="day" tick={{ fill: C.warm, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.warm, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${C.tan}` }} />
            <Line type="monotone" dataKey="xp" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent, r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: C.warm }}>
          Total esta semana: <strong style={{ color: C.accent }}>385 XP</strong>
        </div>
      </div>

      {/* All Levels */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0' }}>🏆 Niveles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {LEVELS.map((lvl, i) => {
            const isUnlocked = (i + 1) <= currentLevel;
            const isCurrent = (i + 1) === currentLevel;
            return (
              <div key={i} style={{
                textAlign: 'center', padding: '14px 8px', borderRadius: '10px',
                backgroundColor: isCurrent ? C.accentGlow : isUnlocked ? C.successLight : C.lightCream,
                border: isCurrent ? `2px solid ${C.accent}` : `1px solid ${isUnlocked ? C.success : C.tan}`,
                opacity: isUnlocked ? 1 : 0.5,
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{isUnlocked ? '⭐' : '🔒'}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: C.dark }}>Nivel {i + 1}</div>
                <div style={{ fontSize: '0.65rem', color: C.warm }}>{lvl.name}</div>
                <div style={{ fontSize: '0.6rem', color: C.medium, marginTop: '2px' }}>{lvl.xpRequired} XP</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0' }}>
          🎖️ Insignias ({badges.filter(b => b.earned).length}/{badges.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '16px 8px', borderRadius: '12px',
              backgroundColor: b.earned ? C.accentGlow : C.lightCream,
              border: b.earned ? `2px solid ${C.accent}` : `1px solid ${C.tan}`,
              opacity: b.earned ? 1 : 0.4, transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{b.emoji}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: C.dark }}>{b.name}</div>
              <div style={{ fontSize: '0.6rem', color: C.warm, marginTop: '4px' }}>{b.desc}</div>
              {b.earned && b.date && (
                <div style={{ fontSize: '0.55rem', color: C.success, marginTop: '4px', fontWeight: '600' }}>
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

const SUCCESS = "#7A9E3E";

// ============== PREFERENCES TAB ==============
function PreferencesTab() {
  const { user, saveProfile } = useUserStore();
  const { streakInsuranceDays } = useGamificationStore();
  const { theme, setTheme } = useThemeStore();

  const [notifications, setNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [notifStatus, setNotifStatus] = useState('');

  const [weekStartsOn, setWeekStartsOn] = useState(1); // 1=Lunes, 0=Domingo
  const [language, setLanguage] = useState('es');
  const [insurance, setInsurance] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from store + localStorage on mount
  useEffect(() => {
    if (user?.profile) {
      setWeekStartsOn(user.profile.weekStartsOn ?? 1);
      setLanguage(user.profile.language ?? 'es');
    }
    setInsurance(streakInsuranceDays ?? 1);

    // Notifications
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '12px', padding: '24px',
    border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: `1px solid ${C.lightCream}`,
  };
  const selectStyle: React.CSSProperties = {
    padding: '8px 14px', borderRadius: '6px', border: `1px solid ${C.tan}`,
    backgroundColor: C.cream, fontSize: '0.9rem', color: C.dark,
  };

  const THEMES: { id: ThemeId; name: string; colors: string[]; preview: string }[] = [
    { id: 'warm',   name: 'Cálido',       preview: 'Beige & Dorado',   colors: ['#3D2B1F','#6B4226','#B8860B','#EDE0D4'] },
    { id: 'ocean',  name: 'Océano',       preview: 'Azul Marino',      colors: ['#0D2137','#1A3A5C','#0A7ABA','#C8E0EC'] },
    { id: 'forest', name: 'Bosque',       preview: 'Verde Natural',    colors: ['#1A2C1A','#2D4A2D','#27AE60','#C8E8C8'] },
    { id: 'rose',   name: 'Rosa Pastel',  preview: 'Rosa & Suave',     colors: ['#4A2035','#7A3055','#C45585','#F5D8E8'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Notifications */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={20} color={C.accent} /> Notificaciones
        </h3>
        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark }}>Recordatorios de Hábitos</div>
            <div style={{ fontSize: '0.75rem', color: C.warm }}>
              Notificación del sistema en la hora seleccionada
              {notifPermission === 'denied' && <span style={{ color: C.danger }}> — Permiso denegado en el navegador</span>}
            </div>
          </div>
          <button onClick={handleToggleNotifications} style={{
            width: '50px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
            backgroundColor: notifications ? SUCCESS : C.tan, position: 'relative', transition: 'all 0.3s',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', backgroundColor: C.paper,
              position: 'absolute', top: '3px', left: notifications ? '25px' : '3px',
              transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark }}>Hora de Recordatorio</div>
            <div style={{ fontSize: '0.75rem', color: C.warm }}>Recibirás una notificación del sistema a esta hora</div>
          </div>
          <input type="time" value={reminderTime} onChange={e => handleTimeChange(e.target.value)} style={selectStyle} />
        </div>
        {notifStatus && (
          <div style={{ fontSize: '0.8rem', color: notifications ? SUCCESS : C.danger, marginTop: '8px', fontWeight: '500' }}>
            {notifStatus}
          </div>
        )}
      </div>

      {/* General */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={20} color={C.accent} /> General
        </h3>
        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark }}>Inicio de Semana</div>
            <div style={{ fontSize: '0.75rem', color: C.warm }}>Afecta el calendario mensual del Planificador</div>
          </div>
          <select value={weekStartsOn} onChange={e => setWeekStartsOn(Number(e.target.value))} style={selectStyle}>
            <option value={1}>Lunes</option>
            <option value={0}>Domingo</option>
          </select>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: C.dark }}>Idioma</div>
          </div>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={selectStyle}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Streak Insurance */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color={C.accent} /> Streak Insurance
        </h3>
        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 16px 0' }}>
          Días consecutivos que puedes fallar un hábito programado sin romper tu racha
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[0, 1, 2, 3].map(n => (
            <button key={n} onClick={() => setInsurance(n)} style={{
              padding: '12px 20px', borderRadius: '8px', cursor: 'pointer',
              backgroundColor: insurance === n ? C.accent : C.lightCream,
              color: insurance === n ? C.paper : C.dark,
              border: insurance === n ? `2px solid ${C.accent}` : `1px solid ${C.tan}`,
              fontWeight: '600', fontSize: '0.9rem',
            }}>
              {n === 0 ? 'Ninguno' : `${n} día${n > 1 ? 's' : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Theme */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={20} color={C.accent} /> Tema Visual
        </h3>
        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 16px 0' }}>
          Cambia la paleta de colores de toda la aplicación al instante
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{
              padding: '16px 12px', borderRadius: '10px', cursor: 'pointer',
              backgroundColor: theme === t.id ? C.accentGlow : C.lightCream,
              border: theme === t.id ? `2px solid ${C.accent}` : `1px solid ${C.tan}`,
              textAlign: 'center', transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                {t.colors.map((c, i) => (
                  <div key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: C.dark }}>{t.name}</div>
              <div style={{ fontSize: '0.65rem', color: C.warm, marginTop: '2px' }}>{t.preview}</div>
              {theme === t.id && (
                <div style={{ fontSize: '0.65rem', color: SUCCESS, marginTop: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  <Check size={10} /> Activo
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button onClick={handleSave} disabled={isSaving} style={{
          padding: '12px 32px', backgroundColor: saved ? SUCCESS : C.accent,
          color: C.paper, border: 'none', borderRadius: '8px',
          fontWeight: '600', fontSize: '0.95rem',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.3s',
        }}>
          {saved ? <><Check size={16} /> Guardado</> : isSaving ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </div>
  );
}

// ============== DATA TAB ==============
function DataTab() {
  const cardStyle: React.CSSProperties = {
    backgroundColor: C.paper, borderRadius: '12px', padding: '24px',
    border: `1px solid ${C.tan}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* AI Export Section */}
      <ExportSection />

      {/* Export */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} color={C.accent} /> Exportar Datos (Backup)
        </h3>
        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 20px 0' }}>
          Descarga una copia de todos tus datos
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleExportAll} style={{
            padding: '12px 24px', backgroundColor: C.accent, color: C.paper,
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Download size={16} /> Exportar Todo (JSON)
          </button>
          <button onClick={handleExportHabits} style={{
            padding: '12px 24px', backgroundColor: C.info, color: C.paper,
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Download size={16} /> Exportar Hábitos (CSV)
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.dark, margin: '0 0 16px 0' }}>💾 Uso de Almacenamiento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Hábitos & Rastreadores', size: '2.4 MB', pct: 30 },
            { label: 'Fitness & Métricas', size: '1.8 MB', pct: 22 },
            { label: 'Finanzas', size: '1.2 MB', pct: 15 },
            { label: 'Diarios & Notas', size: '0.9 MB', pct: 11 },
            { label: 'Configuración', size: '0.1 MB', pct: 1 },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: C.dark }}>{item.label}</span>
                <span style={{ color: C.warm }}>{item.size}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: C.lightCream, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: C.accent, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: C.warm }}>
          Total usado: <strong style={{ color: C.dark }}>6.4 MB</strong> de 50 MB
        </div>
      </div>

      {/* Subscription */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${C.dark}, ${C.brown})`,
        border: 'none', color: C.paper,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'Georgia, serif', margin: '0 0 4px 0', color: C.accentGlow }}>
              ⭐ Plan Pro
            </h3>
            <p style={{ fontSize: '0.85rem', color: C.lightTan, margin: 0 }}>
              Desbloquea todas las funciones premium
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: C.accentGlow }}>$4.99<span style={{ fontSize: '0.8rem', fontWeight: '400' }}>/mes</span></div>
            <div style={{ fontSize: '0.75rem', color: C.lightTan }}>o $49.99 de por vida</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          {['Datos ilimitados', 'Export PDF', 'Temas premium', 'Sin anuncios', 'Soporte prioritario'].map(f => (
            <span key={f} style={{ padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '0.75rem', color: C.accentGlow }}>
              ✓ {f}
            </span>
          ))}
        </div>
        <button style={{
          marginTop: '16px', padding: '12px 32px',
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer',
          fontWeight: '700', fontSize: '1rem',
        }}>
          Actualizar a Pro
        </button>
      </div>

      {/* Danger Zone */}
      <div style={{ ...cardStyle, borderColor: C.danger }}>
        <h3 style={{ fontFamily: 'Georgia, serif', color: C.danger, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={20} color={C.danger} /> Zona de Peligro
        </h3>
        <p style={{ fontSize: '0.85rem', color: C.warm, margin: '0 0 16px 0' }}>
          Estas acciones son irreversibles. Procede con cuidado.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '10px 20px', backgroundColor: 'transparent', color: C.danger,
            border: `1px solid ${C.danger}`, borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.85rem',
          }}>
            Reiniciar Progreso
          </button>
          <button style={{
            padding: '10px 20px', backgroundColor: C.danger, color: C.paper,
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.85rem',
          }}>
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
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'gamification', label: 'Gamificación', icon: Trophy },
    { id: 'preferences', label: 'Preferencias', icon: Palette },
    { id: 'data', label: 'Datos', icon: Download },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: C.warmWhite, minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', color: C.dark, margin: '0 0 8px 0' }}>
          Configuración
        </h1>
        <p style={{ fontSize: '1rem', color: C.warm, margin: 0 }}>
          Personaliza tu experiencia
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: `2px solid ${C.lightTan}` }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', border: 'none', cursor: 'pointer',
                backgroundColor: activeTab === tab.id ? C.accent : 'transparent',
                color: activeTab === tab.id ? C.paper : C.warm,
                borderRadius: '8px 8px 0 0', fontSize: '0.95rem',
                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'gamification' && <GamificationTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
        {activeTab === 'data' && <DataTab />}
      </div>
    </div>
  );
}
