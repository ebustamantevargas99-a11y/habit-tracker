'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Target, BarChart3, Trophy, Zap, Heart } from 'lucide-react';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C", success: "#7A9E3E", successLight: "#D4E6B5",
  warning: "#D4943A", warningLight: "#F5E0C0", danger: "#C0544F",
  dangerLight: "#F5D0CE", info: "#5A8FA8", infoLight: "#C8E0EC",
};

interface Props {
  onComplete: () => void;
}

interface Step {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  bg: string;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const goals = [
    { id: 'habits', label: 'Construir hábitos positivos', emoji: '🔁' },
    { id: 'fitness', label: 'Mejorar mi condición física', emoji: '💪' },
    { id: 'finance', label: 'Controlar mis finanzas', emoji: '💰' },
    { id: 'productivity', label: 'Ser más productivo', emoji: '⚡' },
    { id: 'wellness', label: 'Cuidar mi bienestar mental', emoji: '🧘' },
    { id: 'nutrition', label: 'Comer más saludable', emoji: '🥗' },
    { id: 'organization', label: 'Organizar mi vida', emoji: '📋' },
    { id: 'vision', label: 'Definir mi visión de vida', emoji: '🌟' },
  ];

  const areas = [
    { id: 'vision', label: 'Visión', emoji: '🌟', desc: 'Define tu vida soñada' },
    { id: 'plan', label: 'Planificación', emoji: '📅', desc: 'Organiza tu tiempo' },
    { id: 'productivity', label: 'Productividad', emoji: '⚡', desc: 'Pomodoro, Kanban, Tareas' },
    { id: 'organization', label: 'Organización', emoji: '🏠', desc: 'Hogar, relaciones, lectura' },
    { id: 'finance', label: 'Finanzas', emoji: '💰', desc: 'Presupuesto y ahorro' },
    { id: 'fitness', label: 'Fitness', emoji: '💪', desc: 'Entrenamiento y métricas' },
    { id: 'nutrition', label: 'Nutrición', emoji: '🥗', desc: 'Comidas y recetas' },
    { id: 'wellness', label: 'Bienestar', emoji: '🧘', desc: 'Ánimo, sueño, hidratación' },
  ];

  const steps: Step[] = [
    {
      title: 'Bienvenido al Ultimate Habit Tracker',
      subtitle: 'Tu compañero para transformar tu vida, un hábito a la vez',
      icon: <Sparkles size={48} color={C.accentGlow} />,
      bg: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 50%, ${C.accent} 100%)`,
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✨</div>
          <p style={{ fontSize: '1.1rem', color: C.lightCream, lineHeight: '1.8', maxWidth: '500px', margin: '0 auto 30px auto' }}>
            Rastrea 8 áreas de tu vida, visualiza tu progreso con dashboards al estilo Power BI, y desbloquea tu potencial con gamificación.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {['🎯 50+ Secciones', '📊 Dashboards', '🏆 Gamificación', '🔥 Streaks'].map(f => (
              <div key={f} style={{ padding: '10px 18px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', color: C.accentGlow, fontSize: '0.9rem', fontWeight: '600' }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '¿Cómo te llamas?',
      subtitle: 'Personalicemos tu experiencia',
      icon: <Heart size={48} color={C.accentGlow} />,
      bg: `linear-gradient(135deg, ${C.brown} 0%, ${C.dark} 100%)`,
      content: (
        <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👋</div>
          <input
            type="text"
            placeholder="Tu nombre..."
            value={userName}
            onChange={e => setUserName(e.target.value)}
            style={{
              width: '100%', padding: '16px 20px', fontSize: '1.2rem', textAlign: 'center',
              borderRadius: '12px', border: `2px solid ${C.accent}`, backgroundColor: 'rgba(255,255,255,0.1)',
              color: C.paper, fontFamily: 'Georgia, serif', outline: 'none',
            }}
          />
          {userName && (
            <p style={{ fontSize: '1.3rem', color: C.accentGlow, marginTop: '20px', fontFamily: 'Georgia, serif' }}>
              ¡Encantado, {userName}! 🎉
            </p>
          )}
        </div>
      ),
    },
    {
      title: '¿Cuáles son tus objetivos?',
      subtitle: 'Selecciona todos los que apliquen',
      icon: <Target size={48} color={C.accentGlow} />,
      bg: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 100%)`,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
          {goals.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                borderRadius: '10px', border: selectedGoals.includes(g.id) ? `2px solid ${C.accent}` : '2px solid rgba(255,255,255,0.15)',
                backgroundColor: selectedGoals.includes(g.id) ? 'rgba(184,134,11,0.3)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{g.emoji}</span>
              <span style={{ color: C.paper, fontSize: '0.85rem', fontWeight: selectedGoals.includes(g.id) ? '600' : '400' }}>{g.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Tus 8 Áreas de Vida',
      subtitle: 'Explora todo lo que puedes rastrear',
      icon: <BarChart3 size={48} color={C.accentGlow} />,
      bg: `linear-gradient(135deg, ${C.brown} 0%, ${C.accent} 100%)`,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', maxWidth: '600px', margin: '0 auto' }}>
          {areas.map(a => (
            <button
              key={a.id}
              onClick={() => toggleArea(a.id)}
              style={{
                padding: '16px 10px', borderRadius: '12px', textAlign: 'center',
                border: selectedAreas.includes(a.id) ? `2px solid ${C.accentGlow}` : '2px solid rgba(255,255,255,0.15)',
                backgroundColor: selectedAreas.includes(a.id) ? 'rgba(184,134,11,0.3)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{a.emoji}</div>
              <div style={{ color: C.paper, fontSize: '0.8rem', fontWeight: '600' }}>{a.label}</div>
              <div style={{ color: C.lightTan, fontSize: '0.65rem', marginTop: '4px' }}>{a.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: '¡Todo Listo!',
      subtitle: `${userName ? userName + ', t' : 'T'}u viaje comienza ahora`,
      icon: <Trophy size={48} color={C.accentGlow} />,
      bg: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 40%, ${C.accent} 100%)`,
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🚀</div>
          <p style={{ fontSize: '1.1rem', color: C.lightCream, lineHeight: '1.8', maxWidth: '450px', margin: '0 auto 24px auto' }}>
            Tu Puntuación de Vida comienza en 0. Cada hábito completado, cada meta alcanzada, te acerca a tu versión ideal.
          </p>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            padding: '20px 40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '16px',
          }}>
            <Zap size={28} color={C.accentGlow} />
            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: C.accentGlow, fontFamily: 'Georgia, serif' }}>Nivel 1</span>
            <span style={{ color: C.lightTan, fontSize: '0.9rem' }}>Principiante — 0 XP</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: C.tan, marginTop: '20px' }}>
            Completa hábitos para ganar XP y subir de nivel
          </p>
        </div>
      ),
    },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '700px', borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          background: step.bg, padding: '40px 40px 30px 40px', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '16px' }}>{step.icon}</div>
          <h2 style={{
            fontFamily: 'Georgia, serif', color: C.paper, fontSize: '1.6rem', margin: '0 0 8px 0',
          }}>
            {step.title}
          </h2>
          <p style={{ color: C.lightTan, fontSize: '0.95rem', margin: 0 }}>{step.subtitle}</p>
        </div>

        {/* Content */}
        <div style={{
          background: `linear-gradient(180deg, ${C.dark} 0%, #2A1D15 100%)`,
          padding: '30px 40px 20px 40px', minHeight: '280px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {step.content}
        </div>

        {/* Footer */}
        <div style={{
          background: C.dark, padding: '20px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Progress Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === currentStep ? '24px' : '8px', height: '8px', borderRadius: '4px',
                backgroundColor: i <= currentStep ? C.accent : C.medium,
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isFirst && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                  backgroundColor: 'rgba(255,255,255,0.1)', color: C.paper, border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            )}
            {isFirst && (
              <button
                onClick={onComplete}
                style={{
                  padding: '10px 18px', backgroundColor: 'transparent', color: C.tan,
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                Saltar
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setCurrentStep(prev => prev + 1);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px',
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                color: C.paper, border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: '600',
              }}
            >
              {isLast ? '¡Comenzar!' : 'Siguiente'} {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
