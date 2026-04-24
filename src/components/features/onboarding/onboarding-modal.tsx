'use client';

import React, { useState } from 'react';
import { cn } from '@/components/ui';
import { ChevronRight, ChevronLeft, Sparkles, Target, BarChart3, Trophy, Zap, Heart } from 'lucide-react';

const C = {
  dark: "#3D2B1F", brown: "#6B4226", medium: "#8B6542", warm: "#A0845C",
  tan: "#C4A882", lightTan: "#D4BEA0", cream: "#EDE0D4", lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3", paper: "#FFFDF9", accent: "#B8860B", accentLight: "#D4A843",
  accentGlow: "#F0D78C",
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
    { id: 'nutrition', label: 'Comer más saludable', emoji: '🥗' },
    { id: 'vision', label: 'Definir mi visión de vida', emoji: '🌟' },
  ];

  const areas = [
    { id: 'vision', label: 'Visión', emoji: '🌟', desc: 'Define tu vida soñada' },
    { id: 'plan', label: 'Planificación', emoji: '📅', desc: 'Organiza tu tiempo' },
    { id: 'productivity', label: 'Productividad', emoji: '⚡', desc: 'Pomodoro, Kanban, Lectura' },
    { id: 'finance', label: 'Finanzas', emoji: '💰', desc: 'Presupuesto y ahorro' },
    { id: 'fitness', label: 'Fitness', emoji: '💪', desc: 'Entrenamiento y métricas' },
    { id: 'nutrition', label: 'Nutrición', emoji: '🥗', desc: 'Comidas y recetas' },
  ];

  const steps: Step[] = [
    {
      title: 'Bienvenido a Ultimate TRACKER',
      subtitle: 'Tu compañero para transformar tu vida, un hábito a la vez',
      icon: <Sparkles size={48} color={C.accentGlow} />,
      bg: `linear-gradient(135deg, ${C.dark} 0%, ${C.brown} 50%, ${C.accent} 100%)`,
      content: (
        <div className="text-center">
          <div className="text-[4rem] mb-5">✨</div>
          <p className="text-[1.1rem] text-brand-light-cream leading-[1.8] max-w-[500px] mx-auto mb-[30px] m-0">
            Rastrea 8 áreas de tu vida, visualiza tu progreso con dashboards al estilo Power BI, y desbloquea tu potencial con gamificación.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            {['🎯 50+ Secciones', '📊 Paneles', '🏆 Gamificación', '🔥 Rachas'].map(f => (
              <div key={f} className="py-2.5 px-[18px] bg-white/10 rounded-[20px] text-accent-glow text-[0.9rem] font-semibold">
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
        <div className="text-center max-w-[400px] mx-auto">
          <div className="text-[4rem] mb-5">👋</div>
          <input
            type="text"
            placeholder="Tu nombre..."
            value={userName}
            onChange={e => setUserName(e.target.value)}
            className="w-full px-5 py-4 text-[1.2rem] text-center rounded-xl border-2 border-accent bg-white/10 text-brand-paper font-serif outline-none"
          />
          {userName && (
            <p className="text-[1.3rem] text-accent-glow mt-5 font-serif">
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
        <div className="grid grid-cols-2 gap-3 max-w-[500px] mx-auto">
          {goals.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3.5 rounded-[10px] border-2 cursor-pointer text-left transition-all duration-200",
                selectedGoals.includes(g.id) ? "border-accent bg-accent/30" : "border-white/15 bg-white/5"
              )}
            >
              <span className="text-[1.3rem]">{g.emoji}</span>
              <span className={cn("text-brand-paper text-[0.85rem]", selectedGoals.includes(g.id) ? "font-semibold" : "font-normal")}>{g.label}</span>
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
        <div className="grid grid-cols-4 gap-3.5 max-w-[600px] mx-auto">
          {areas.map(a => (
            <button
              key={a.id}
              onClick={() => toggleArea(a.id)}
              className={cn(
                "px-2.5 py-4 rounded-xl text-center border-2 cursor-pointer transition-all duration-200",
                selectedAreas.includes(a.id) ? "border-accent-glow bg-accent/30" : "border-white/15 bg-white/5"
              )}
            >
              <div className="text-[2rem] mb-1.5">{a.emoji}</div>
              <div className="text-brand-paper text-[0.8rem] font-semibold">{a.label}</div>
              <div className="text-brand-light-tan text-[0.65rem] mt-1">{a.desc}</div>
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
        <div className="text-center">
          <div className="text-[5rem] mb-5">🚀</div>
          <p className="text-[1.1rem] text-brand-light-cream leading-[1.8] max-w-[450px] mx-auto mb-6 m-0">
            Tu Puntuación de Vida comienza en 0. Cada hábito completado, cada meta alcanzada, te acerca a tu versión ideal.
          </p>
          <div className="inline-flex flex-col items-center gap-2 px-10 py-5 bg-white/10 rounded-2xl">
            <Zap size={28} color={C.accentGlow} />
            <span className="text-[2.5rem] font-bold text-accent-glow font-serif">Nivel 1</span>
            <span className="text-brand-light-tan text-[0.9rem]">Principiante — 0 XP</span>
          </div>
          <p className="text-[0.9rem] text-brand-tan mt-5">
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-5">
      <div className="w-full max-w-[700px] rounded-[20px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div
          className="px-10 pt-10 pb-[30px] text-center"
          style={{ background: step.bg }}
        >
          <div className="mb-4">{step.icon}</div>
          <h2 className="font-serif text-brand-paper text-[1.6rem] m-0 mb-2">
            {step.title}
          </h2>
          <p className="text-brand-light-tan text-[0.95rem] m-0">{step.subtitle}</p>
        </div>

        {/* Content */}
        <div className="px-10 py-[30px] pb-5 min-h-[280px] flex items-center justify-center bg-gradient-hero-v">
          {step.content}
        </div>

        {/* Footer */}
        <div className="bg-brand-dark px-10 py-5 flex justify-between items-center">
          {/* Progress Dots */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-[4px] transition-all duration-300",
                  i === currentStep ? "w-6" : "w-2",
                  i <= currentStep ? "bg-accent" : "bg-brand-medium"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {!isFirst && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-[18px] py-2.5 bg-white/10 text-brand-paper border-none rounded-lg cursor-pointer text-[0.9rem]"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            )}
            {isFirst && (
              <button
                onClick={onComplete}
                className="px-[18px] py-2.5 bg-transparent text-brand-tan border-none rounded-lg cursor-pointer text-[0.85rem]"
              >
                Saltar
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setCurrentStep(prev => prev + 1);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-br from-accent to-accent-light text-brand-paper border-none rounded-lg cursor-pointer text-[0.95rem] font-semibold"
            >
              {isLast ? '¡Comenzar!' : 'Siguiente'} {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
