"use client";

import { useAppStore } from "@/stores/app-store";
import * as LucideIcons from "lucide-react";
import React from "react";

const PlaceholderPage: React.FC = () => {
  const { activePage } = useAppStore();

  const pageConfig: Record<string, { title: string; icon: string; sections: string[] }> = {
    analytics: {
      title: "Análisis",
      icon: "BarChart3",
      sections: ["Tendencias de Hábitos", "Estadísticas Mensuales", "Gráficos Comparativos", "Reportes Detallados"],
    },
    goals: {
      title: "Objetivos",
      icon: "Target",
      sections: ["Objetivos a Corto Plazo", "Objetivos a Largo Plazo", "Seguimiento de Progreso", "Hitos y Logros"],
    },
    settings: {
      title: "Configuración",
      icon: "Settings",
      sections: ["Perfil de Usuario", "Preferencias de Notificaciones", "Tema y Apariencia", "Privacidad y Seguridad"],
    },
    reports: {
      title: "Reportes",
      icon: "FileText",
      sections: ["Reportes Personalizados", "Exportar Datos", "Historial Completo", "Análisis Avanzado"],
    },
    community: {
      title: "Comunidad",
      icon: "Users",
      sections: ["Grupos de Hábitos", "Desafíos Comunitarios", "Compartir Logros", "Mensajes y Soporte"],
    },
  };

  const config = pageConfig[activePage] ?? {
    title: "Página",
    icon: "Package",
    sections: ["Sección 1", "Sección 2", "Sección 3", "Sección 4"],
  };

  const getIcon = (name: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
    return Icon ? <Icon size={32} /> : <LucideIcons.Package size={32} />;
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-accent">{getIcon(config.icon)}</span>
          <h1 className="text-3xl font-serif text-brand-dark m-0">{config.title}</h1>
        </div>
        <p className="text-brand-warm">
          Esta sección está siendo desarrollada. Pronto estará disponible.
        </p>
      </div>

      {/* Sections grid */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {config.sections.map((section, i) => (
          <div
            key={i}
            className="bg-brand-light-cream rounded-lg p-6 border border-brand-light-tan cursor-pointer
                       transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <LucideIcons.Clock size={18} className="text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                Próximamente
              </span>
            </div>
            <h3 className="text-lg font-serif text-brand-dark mt-2">{section}</h3>
            <p className="text-sm text-brand-warm mt-2">
              Estamos trabajando para traerte la mejor experiencia posible.
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 p-8 bg-brand-cream rounded-lg border border-brand-light-tan text-center">
        <h3 className="text-xl font-serif text-brand-dark mb-2">Mantente Atento</h3>
        <p className="text-sm text-brand-warm">
          Nuevas características y mejoras llegan pronto. Regresa en breve para
          descubrir lo que hemos preparado para ti.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
