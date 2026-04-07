"use client";

import { useAppStore } from "@/stores/app-store";
import * as LucideIcons from "lucide-react";
import React from "react";

const PlaceholderPage: React.FC = () => {
  const { activePage } = useAppStore();

  // Define page titles and sections
  const pageConfig: {
    [key: string]: {
      title: string;
      icon: string;
      sections: string[];
    };
  } = {
    analytics: {
      title: "Análisis",
      icon: "BarChart3",
      sections: [
        "Tendencias de Hábitos",
        "Estadísticas Mensuales",
        "Gráficos Comparativos",
        "Reportes Detallados",
      ],
    },
    goals: {
      title: "Objetivos",
      icon: "Target",
      sections: [
        "Objetivos a Corto Plazo",
        "Objetivos a Largo Plazo",
        "Seguimiento de Progreso",
        "Hitos y Logros",
      ],
    },
    wellness: {
      title: "Bienestar",
      icon: "Heart",
      sections: [
        "Salud Mental",
        "Salud Física",
        "Balance Vida-Trabajo",
        "Recomendaciones Personalizadas",
      ],
    },
    settings: {
      title: "Configuración",
      icon: "Settings",
      sections: [
        "Perfil de Usuario",
        "Preferencias de Notificaciones",
        "Tema y Apariencia",
        "Privacidad y Seguridad",
      ],
    },
    reports: {
      title: "Reportes",
      icon: "FileText",
      sections: [
        "Reportes Personalizados",
        "Exportar Datos",
        "Historial Completo",
        "Análisis Avanzado",
      ],
    },
    community: {
      title: "Comunidad",
      icon: "Users",
      sections: [
        "Grupos de Hábitos",
        "Desafíos Comunitarios",
        "Compartir Logros",
        "Mensajes y Soporte",
      ],
    },
  };

  const config = pageConfig[activePage] || {
    title: "Página",
    icon: "Package",
    sections: ["Sección 1", "Sección 2", "Sección 3", "Sección 4"],
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[
      iconName
    ];
    return Icon ? <Icon size={32} /> : <LucideIcons.Package size={32} />;
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "3rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ color: "var(--color-accent)" }}>
            {getIcon(config.icon)}
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontFamily: "Georgia, serif",
              color: "var(--color-dark)",
              margin: 0,
            }}
          >
            {config.title}
          </h1>
        </div>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-warm)",
            margin: 0,
          }}
        >
          Esta sección está siendo desarrollada. Pronto estará disponible.
        </p>
      </div>

      {/* Sections Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {config.sections.map((section, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "var(--color-light-cream)",
              borderRadius: "8px",
              padding: "1.5rem",
              border: "1px solid var(--color-light-tan)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = "0 4px 12px rgba(61, 43, 31, 0.1)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = "none";
              el.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              <LucideIcons.Clock size={18} style={{ color: "var(--color-accent)" }} />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "var(--color-accent)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Próximamente
              </span>
            </div>
            <h3
              style={{
                fontSize: "1.125rem",
                fontFamily: "Georgia, serif",
                color: "var(--color-dark)",
                margin: "0.5rem 0 0 0",
              }}
            >
              {section}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-warm)",
                margin: "0.5rem 0 0 0",
              }}
            >
              Estamos trabajando para traerte la mejor experiencia posible.
            </p>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div
        style={{
          marginTop: "3rem",
          padding: "2rem",
          backgroundColor: "var(--color-cream)",
          borderRadius: "8px",
          textAlign: "center",
          border: "1px solid var(--color-light-tan)",
        }}
      >
        <h3
          style={{
            fontSize: "1.25rem",
            fontFamily: "Georgia, serif",
            color: "var(--color-dark)",
            margin: "0 0 0.5rem 0",
          }}
        >
          Mantente Atento
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-warm)",
            margin: 0,
          }}
        >
          Nuevas características y mejoras llegan pronto. Regresa en breve para
          descubrir lo que hemos preparado para ti.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
