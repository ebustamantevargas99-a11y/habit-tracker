"use client";

import React, { useState } from "react";
import {
  Calendar,
  Heart,
  BookOpen,
  Film,
  Trash2,
  Plus,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
} from "lucide-react";
import { colors } from "@/lib/colors";

interface CleaningRoom {
  id: string;
  nombre: string;
  tareas: CleaningTask[];
  puntuacion: number;
}

interface CleaningTask {
  id: string;
  nombre: string;
  frecuencia: "Diario" | "Semanal" | "Mensual";
  completado: boolean;
  ultimoCompletado: string | null;
}

interface ContactPerson {
  id: string;
  nombre: string;
  categoria: "Familia" | "Amigos" | "Trabajo";
  ultimoContacto: string;
  proximoContacto: string;
  notas: string;
}

interface Book {
  id: string;
  titulo: string;
  autor: string;
  paginasLeidas: number;
  paginasTotal: number;
  clasificacion: number;
  estado: "Leyendo" | "Terminado" | "Pendiente";
}

interface Movie {
  id: string;
  titulo: string;
  genero: string;
  clasificacion: number;
  estado: "Visto" | "Viendo" | "Pendiente";
  notas: string;
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<
    "limpieza" | "relaciones" | "lectura" | "peliculas"
  >("limpieza");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.warmWhite,
        padding: "24px",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontFamily: "Georgia, serif",
            color: colors.dark,
            marginBottom: "8px",
            fontWeight: "bold",
          }}
        >
          Organización
        </h1>
        <p style={{ color: colors.brown, fontSize: "14px" }}>
          Gestiona tu hogar, relaciones, lectura y entretenimiento
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "28px",
          borderBottom: `2px solid ${colors.lightTan}`,
          overflowX: "auto",
          paddingBottom: "0",
        }}
      >
        {[
          { id: "limpieza", label: "Limpieza", icon: CheckCircle2 },
          { id: "relaciones", label: "Relaciones", icon: Heart },
          { id: "lectura", label: "Diario de Lectura", icon: BookOpen },
          { id: "peliculas", label: "Películas y Series", icon: Film },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.id as "limpieza" | "relaciones" | "lectura" | "peliculas"
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              border: "none",
              backgroundColor: "transparent",
              borderBottom:
                activeTab === tab.id
                  ? `3px solid ${colors.accent}`
                  : "transparent",
              color: activeTab === tab.id ? colors.dark : colors.brown,
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? "600" : "500",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLElement).style.color = colors.dark;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLElement).style.color = colors.brown;
              }
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "limpieza" && <LimpiezaTab />}
        {activeTab === "relaciones" && <RelacionesTab />}
        {activeTab === "lectura" && <LecturaTab />}
        {activeTab === "peliculas" && <PeliculasTab />}
      </div>
    </div>
  );
}

// ============== LIMPIEZA TAB ==============
function LimpiezaTab() {
  const [rooms, setRooms] = useState<CleaningRoom[]>([
    {
      id: "cocina",
      nombre: "Cocina",
      puntuacion: 95,
      tareas: [
        {
          id: "1",
          nombre: "Limpiar encimeras",
          frecuencia: "Diario",
          completado: true,
          ultimoCompletado: "Hoy",
        },
        {
          id: "2",
          nombre: "Lavar platos",
          frecuencia: "Diario",
          completado: true,
          ultimoCompletado: "Hoy",
        },
        {
          id: "3",
          nombre: "Limpiar piso",
          frecuencia: "Semanal",
          completado: false,
          ultimoCompletado: "Hace 3 días",
        },
        {
          id: "4",
          nombre: "Limpiar refrigerador",
          frecuencia: "Mensual",
          completado: false,
          ultimoCompletado: "Hace 2 semanas",
        },
      ],
    },
    {
      id: "bano",
      nombre: "Baño",
      puntuacion: 85,
      tareas: [
        {
          id: "5",
          nombre: "Limpiar inodoro",
          frecuencia: "Diario",
          completado: true,
          ultimoCompletado: "Ayer",
        },
        {
          id: "6",
          nombre: "Limpiar espejo",
          frecuencia: "Semanal",
          completado: true,
          ultimoCompletado: "Ayer",
        },
        {
          id: "7",
          nombre: "Limpiar ducha",
          frecuencia: "Semanal",
          completado: false,
          ultimoCompletado: "Hace 4 días",
        },
      ],
    },
    {
      id: "dormitorio",
      nombre: "Dormitorio",
      puntuacion: 78,
      tareas: [
        {
          id: "8",
          nombre: "Hacer cama",
          frecuencia: "Diario",
          completado: true,
          ultimoCompletado: "Hoy",
        },
        {
          id: "9",
          nombre: "Pasar aspiradora",
          frecuencia: "Semanal",
          completado: false,
          ultimoCompletado: "Hace 6 días",
        },
        {
          id: "10",
          nombre: "Cambiar sábanas",
          frecuencia: "Semanal",
          completado: false,
          ultimoCompletado: "Hace 1 semana",
        },
      ],
    },
    {
      id: "sala",
      nombre: "Sala",
      puntuacion: 82,
      tareas: [
        {
          id: "11",
          nombre: "Recoger desorden",
          frecuencia: "Diario",
          completado: true,
          ultimoCompletado: "Hoy",
        },
        {
          id: "12",
          nombre: "Pasar plumero",
          frecuencia: "Semanal",
          completado: true,
          ultimoCompletado: "Ayer",
        },
        {
          id: "13",
          nombre: "Aspirar sofá",
          frecuencia: "Mensual",
          completado: false,
          ultimoCompletado: "Hace 3 semanas",
        },
      ],
    },
    {
      id: "oficina",
      nombre: "Oficina",
      puntuacion: 72,
      tareas: [
        {
          id: "14",
          nombre: "Organizar escritorio",
          frecuencia: "Diario",
          completado: false,
          ultimoCompletado: "Hace 1 día",
        },
        {
          id: "15",
          nombre: "Polvo en estantes",
          frecuencia: "Semanal",
          completado: false,
          ultimoCompletado: "Hace 1 semana",
        },
        {
          id: "16",
          nombre: "Limpiar teclado",
          frecuencia: "Mensual",
          completado: false,
          ultimoCompletado: "Hace 1 mes",
        },
      ],
    },
  ]);

  const overallScore = Math.round(
    rooms.reduce((sum, room) => sum + room.puntuacion, 0) / rooms.length
  );

  const toggleTask = (roomId: string, taskId: string) => {
    setRooms(
      rooms.map((room) => {
        if (room.id === roomId) {
          return {
            ...room,
            tareas: room.tareas.map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  completado: !task.completado,
                  ultimoCompletado: !task.completado ? "Hoy" : task.ultimoCompletado,
                };
              }
              return task;
            }),
          };
        }
        return room;
      })
    );
  };

  return (
    <div>
      {/* Overall Score */}
      <div
        style={{
          padding: "20px",
          backgroundColor: colors.cream,
          borderRadius: "12px",
          marginBottom: "24px",
          border: `2px solid ${colors.tan}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ color: colors.brown, fontSize: "14px", margin: "0" }}>
              Puntuación general de limpieza
            </p>
            <h2
              style={{
                fontSize: "32px",
                fontFamily: "Georgia, serif",
                color: colors.dark,
                margin: "8px 0 0 0",
              }}
            >
              {overallScore}%
            </h2>
          </div>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: colors.lightTan,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: colors.accent,
            }}
          >
            {overallScore}%
          </div>
        </div>
      </div>

      {/* Room Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
        }}
      >
        {rooms.map((room) => (
          <div
            key={room.id}
            style={{
              backgroundColor: colors.paper,
              border: `2px solid ${colors.tan}`,
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontFamily: "Georgia, serif",
                  color: colors.dark,
                  margin: "0",
                  fontWeight: "bold",
                }}
              >
                {room.nombre}
              </h3>
              <div
                style={{
                  backgroundColor: colors.lightTan,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.dark,
                }}
              >
                {room.puntuacion}%
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: colors.lightTan,
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${room.puntuacion}%`,
                  backgroundColor: colors.success,
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Tasks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {room.tareas.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    backgroundColor: colors.warmWhite,
                    borderRadius: "8px",
                    border: `1px solid ${colors.lightTan}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completado}
                    onChange={() => toggleTask(room.id, task.id)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: colors.accent,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: colors.dark,
                        textDecoration: task.completado
                          ? "line-through"
                          : "none",
                        opacity: task.completado ? 0.6 : 1,
                      }}
                    >
                      {task.nombre}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "12px",
                        color: colors.brown,
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: colors.accentLight,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: colors.dark,
                          fontWeight: "600",
                        }}
                      >
                        {task.frecuencia}
                      </span>
                      <span>{task.ultimoCompletado}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== RELACIONES TAB ==============
function RelacionesTab() {
  const [contacts, setContacts] = useState<ContactPerson[]>([
    {
      id: "1",
      nombre: "María García",
      categoria: "Familia",
      ultimoContacto: "2026-04-02",
      proximoContacto: "2026-04-10",
      notas: "Mamá - Llamar los domingos",
    },
    {
      id: "2",
      nombre: "Juan López",
      categoria: "Trabajo",
      ultimoContacto: "2026-04-04",
      proximoContacto: "2026-04-08",
      notas: "Jefe - Reuniones de seguimiento",
    },
    {
      id: "3",
      nombre: "Sofia Martínez",
      categoria: "Amigos",
      ultimoContacto: "2026-03-28",
      proximoContacto: "2026-04-15",
      notas: "Mejor amiga - Café cada 2 semanas",
    },
    {
      id: "4",
      nombre: "Carlos Rodríguez",
      categoria: "Familia",
      ultimoContacto: "2026-03-20",
      proximoContacto: "2026-04-20",
      notas: "Tío - Visita ocasional",
    },
    {
      id: "5",
      nombre: "Ana Gómez",
      categoria: "Trabajo",
      ultimoContacto: "2026-04-03",
      proximoContacto: "2026-04-10",
      notas: "Compañera de proyecto",
    },
  ]);

  const getDaysSinceContact = (lastContact: string): number => {
    const last = new Date(lastContact);
    const today = new Date("2026-04-05");
    return Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getContactStatus = (lastContact: string): string => {
    const days = getDaysSinceContact(lastContact);
    if (days <= 7) return "Reciente";
    if (days <= 14) return "Vencido";
    return "Muy vencido";
  };

  const getStatusColor = (lastContact: string): string => {
    const days = getDaysSinceContact(lastContact);
    if (days <= 7) return colors.success;
    if (days <= 14) return colors.warning;
    return colors.danger;
  };

  const categoryColors: Record<string, string> = {
    Familia: colors.infoLight,
    Amigos: colors.accentLight,
    Trabajo: colors.successLight,
  };

  const categoryTextColors: Record<string, string> = {
    Familia: colors.info,
    Amigos: colors.accent,
    Trabajo: colors.success,
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          backgroundColor: colors.accent,
          color: colors.paper,
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "24px",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.dark;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.accent;
        }}
      >
        <Plus size={18} />
        Agregar contacto
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {contacts.map((contact) => {
          const daysSince = getDaysSinceContact(contact.ultimoContacto);
          const statusColor = getStatusColor(contact.ultimoContacto);

          return (
            <div
              key={contact.id}
              style={{
                backgroundColor: colors.paper,
                border: `2px solid ${colors.tan}`,
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontFamily: "Georgia, serif",
                      color: colors.dark,
                      margin: "0 0 8px 0",
                      fontWeight: "bold",
                    }}
                  >
                    {contact.nombre}
                  </h3>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: categoryColors[contact.categoria],
                      color: categoryTextColors[contact.categoria],
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {contact.categoria}
                  </span>
                </div>
                <button
                  onClick={() => deleteContact(contact.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.danger,
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Status */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: colors.warmWhite,
                  borderRadius: "8px",
                  marginBottom: "16px",
                  border: `2px solid ${statusColor}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <Clock size={16} style={{ color: statusColor }} />
                  <span style={{ color: statusColor, fontWeight: "600", fontSize: "13px" }}>
                    {daysSince === 0
                      ? "Hoy"
                      : daysSince === 1
                        ? "Ayer"
                        : `Hace ${daysSince} días`}
                  </span>
                </div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "12px",
                    color: colors.brown,
                  }}
                >
                  Último contacto: {contact.ultimoContacto}
                </p>
              </div>

              {/* Next Contact */}
              <div style={{ marginBottom: "16px" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: colors.brown,
                    margin: "0 0 4px 0",
                  }}
                >
                  Próximo contacto planeado
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: colors.dark,
                    margin: "0",
                  }}
                >
                  {contact.proximoContacto}
                </p>
              </div>

              {/* Notes */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: colors.lightCream,
                  borderRadius: "8px",
                  borderLeft: `4px solid ${colors.accent}`,
                }}
              >
                <p
                  style={{
                    margin: "0",
                    fontSize: "13px",
                    color: colors.dark,
                    fontStyle: "italic",
                  }}
                >
                  {contact.notas}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============== LECTURA TAB ==============
function LecturaTab() {
  const [books, setBooks] = useState<Book[]>([
    {
      id: "1",
      titulo: "La Casa de los Espíritus",
      autor: "Isabel Allende",
      paginasLeidas: 245,
      paginasTotal: 400,
      clasificacion: 5,
      estado: "Leyendo",
    },
    {
      id: "2",
      titulo: "Cien Años de Soledad",
      autor: "Gabriel García Márquez",
      paginasLeidas: 432,
      paginasTotal: 432,
      clasificacion: 5,
      estado: "Terminado",
    },
    {
      id: "3",
      titulo: "El Alquimista",
      autor: "Paulo Coelho",
      paginasLeidas: 0,
      paginasTotal: 224,
      clasificacion: 0,
      estado: "Pendiente",
    },
    {
      id: "4",
      titulo: "Ficciones",
      autor: "Jorge Luis Borges",
      paginasLeidas: 156,
      paginasTotal: 300,
      clasificacion: 4,
      estado: "Leyendo",
    },
  ]);

  const currentBook = books.find((b) => b.estado === "Leyendo");
  const progressPercent = currentBook
    ? Math.round((currentBook.paginasLeidas / currentBook.paginasTotal) * 100)
    : 0;

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            style={{
              fill: star <= rating ? colors.accent : colors.lightTan,
              color: star <= rating ? colors.accent : colors.lightTan,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Currently Reading Card */}
      {currentBook && (
        <div
          style={{
            padding: "24px",
            backgroundColor: colors.accent,
            borderRadius: "12px",
            marginBottom: "28px",
            color: colors.paper,
          }}
        >
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", opacity: 0.9 }}>
            Actualmente leyendo
          </p>
          <h2
            style={{
              fontSize: "28px",
              fontFamily: "Georgia, serif",
              margin: "0 0 8px 0",
              fontWeight: "bold",
            }}
          >
            {currentBook.titulo}
          </h2>
          <p style={{ margin: "0 0 16px 0", opacity: 0.95 }}>
            por {currentBook.autor}
          </p>

          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: colors.dark,
              borderRadius: "6px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                backgroundColor: colors.accentLight,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <p style={{ margin: "0", fontSize: "14px" }}>
            {currentBook.paginasLeidas} de {currentBook.paginasTotal} páginas ({progressPercent}%)
          </p>
        </div>
      )}

      {/* Add Book Button */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          backgroundColor: colors.accent,
          color: colors.paper,
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "24px",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.dark;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.accent;
        }}
      >
        <Plus size={18} />
        Agregar libro
      </button>

      {/* Books Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {books.map((book) => {
          const progress = Math.round((book.paginasLeidas / book.paginasTotal) * 100);
          const statusBg =
            book.estado === "Leyendo"
              ? colors.infoLight
              : book.estado === "Terminado"
                ? colors.successLight
                : colors.warningLight;
          const statusColor =
            book.estado === "Leyendo"
              ? colors.info
              : book.estado === "Terminado"
                ? colors.success
                : colors.warning;

          return (
            <div
              key={book.id}
              style={{
                backgroundColor: colors.paper,
                border: `2px solid ${colors.tan}`,
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <h3
                style={{
                  fontSize: "16px",
                  fontFamily: "Georgia, serif",
                  color: colors.dark,
                  margin: "0 0 4px 0",
                  fontWeight: "bold",
                }}
              >
                {book.titulo}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: colors.brown,
                  margin: "0 0 12px 0",
                }}
              >
                {book.autor}
              </p>

              {/* Status Badge */}
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: statusBg,
                  color: statusColor,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  width: "fit-content",
                }}
              >
                {book.estado}
              </span>

              {/* Progress */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: colors.lightTan,
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      backgroundColor: colors.accent,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "12px",
                    color: colors.brown,
                  }}
                >
                  {book.paginasLeidas} / {book.paginasTotal} páginas
                </p>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: "12px" }}>
                {renderStars(book.clasificacion)}
              </div>

              {/* Edit Button */}
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  backgroundColor: colors.lightTan,
                  border: "none",
                  borderRadius: "6px",
                  color: colors.dark,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    colors.tan;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    colors.lightTan;
                }}
              >
                <Edit2 size={14} />
                Actualizar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============== PELÍCULAS Y SERIES TAB ==============
function PeliculasTab() {
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: "1",
      titulo: "Interestelar",
      genero: "Ciencia Ficción",
      clasificacion: 5,
      estado: "Visto",
      notas: "Épica y emocionante. Gran cinematografía.",
    },
    {
      id: "2",
      titulo: "La Casa de Papel",
      genero: "Drama/Thriller",
      clasificacion: 4,
      estado: "Viendo",
      notas: "Muy atrapante. Voy por la temporada 3.",
    },
    {
      id: "3",
      titulo: "El Ministerio del Tiempo",
      genero: "Ciencia Ficción",
      clasificacion: 0,
      estado: "Pendiente",
      notas: "Recomendado por Pablo",
    },
    {
      id: "4",
      titulo: "Todo sobre mi madre",
      genero: "Drama",
      clasificacion: 5,
      estado: "Visto",
      notas: "Obra maestra de Almodóvar",
    },
    {
      id: "5",
      titulo: "La boca de la verdad",
      genero: "Drama",
      clasificacion: 0,
      estado: "Pendiente",
      notas: "Película italiana clásica",
    },
    {
      id: "6",
      titulo: "El Juego del Calamar",
      genero: "Drama/Thriller",
      clasificacion: 4,
      estado: "Viendo",
      notas: "Oscura pero fascinante.",
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<"Todos" | "Visto" | "Viendo" | "Pendiente">(
    "Todos"
  );

  const filteredMovies =
    filterStatus === "Todos"
      ? movies
      : movies.filter((m) => m.estado === filterStatus);

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            style={{
              fill: star <= rating ? colors.accent : colors.lightTan,
              color: star <= rating ? colors.accent : colors.lightTan,
            }}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (estado: string): string => {
    if (estado === "Visto") return colors.successLight;
    if (estado === "Viendo") return colors.infoLight;
    return colors.warningLight;
  };

  const getStatusTextColor = (estado: string): string => {
    if (estado === "Visto") return colors.success;
    if (estado === "Viendo") return colors.info;
    return colors.warning;
  };

  return (
    <div>
      {/* Filter Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {["Todos", "Visto", "Viendo", "Pendiente"].map((status) => (
          <button
            key={status}
            onClick={() =>
              setFilterStatus(
                status as "Todos" | "Visto" | "Viendo" | "Pendiente"
              )
            }
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor:
                filterStatus === status ? colors.accent : colors.lightTan,
              color:
                filterStatus === status ? colors.paper : colors.dark,
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (filterStatus !== status) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  colors.tan;
              }
            }}
            onMouseLeave={(e) => {
              if (filterStatus !== status) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  colors.lightTan;
              }
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          backgroundColor: colors.accent,
          color: colors.paper,
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "24px",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.dark;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = colors.accent;
        }}
      >
        <Plus size={18} />
        Agregar película/serie
      </button>

      {/* Movies Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredMovies.map((movie) => (
          <div
            key={movie.id}
            style={{
              backgroundColor: colors.paper,
              border: `2px solid ${colors.tan}`,
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <h3
              style={{
                fontSize: "16px",
                fontFamily: "Georgia, serif",
                color: colors.dark,
                margin: "0 0 4px 0",
                fontWeight: "bold",
              }}
            >
              {movie.titulo}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: colors.brown,
                margin: "0 0 12px 0",
              }}
            >
              {movie.genero}
            </p>

            {/* Status Badge */}
            <span
              style={{
                display: "inline-block",
                backgroundColor: getStatusColor(movie.estado),
                color: getStatusTextColor(movie.estado),
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "12px",
                width: "fit-content",
              }}
            >
              {movie.estado}
            </span>

            {/* Rating */}
            <div style={{ marginBottom: "12px" }}>
              {renderStars(movie.clasificacion)}
            </div>

            {/* Notes */}
            <div
              style={{
                padding: "12px",
                backgroundColor: colors.lightCream,
                borderRadius: "8px",
                borderLeft: `4px solid ${colors.accent}`,
                marginBottom: "12px",
                flex: 1,
              }}
            >
              <p
                style={{
                  margin: "0",
                  fontSize: "13px",
                  color: colors.dark,
                  fontStyle: "italic",
                }}
              >
                {movie.notas}
              </p>
            </div>

            {/* Edit Button */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: colors.lightTan,
                border: "none",
                borderRadius: "6px",
                color: colors.dark,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  colors.tan;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  colors.lightTan;
              }}
            >
              <Edit2 size={14} />
              Editar
            </button>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: colors.lightCream,
            borderRadius: "12px",
            border: `2px dashed ${colors.tan}`,
          }}
        >
          <Film size={32} style={{ color: colors.brown, marginBottom: "12px" }} />
          <p
            style={{
              fontSize: "14px",
              color: colors.brown,
              margin: "0",
            }}
          >
            No hay películas o series en esta categoría.
          </p>
        </div>
      )}
    </div>
  );
}
