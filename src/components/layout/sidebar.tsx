"use client";

import { useState } from "react";
import { useAppStore, type WellnessTab, type ProductivityTab } from "@/stores/app-store";
import { useGamificationStore } from "@/stores/gamification-store";
import { useUserStore } from "@/stores/user-store";
import { NAV_ITEMS, LEVELS } from "@/lib/constants";

// Map sidebar section label → wellnessSubTab id
const WELLNESS_SECTION_MAP: Record<string, WellnessTab> = {
  "Sleep Tracker": "sleep",
  "Hydration": "hydration",
  "Medication": "medication",
  "Menstrual Cycle": "period",
  "Health Log": "healthlog",
};

// Map sidebar section label → productivitySubTab id
const PRODUCTIVITY_SECTION_MAP: Record<string, ProductivityTab> = {
  "Habit Tracker": "habits",
  "Project Management": "projects",
  "Task List": "tasks",
  "Work Time Log": "worktimelog",
  "Pomodoro": "pomodoro",
};
import * as LucideIcons from "lucide-react";
import React from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const { activePage, setActivePage, setWellnessSubTab, setProductivitySubTab } = useAppStore();
  const { totalXP, currentLevel, levelName, xpForNextLevel, xpProgress, badges } = useGamificationStore();
  const { user } = useUserStore();
  const displayName = user?.name ?? 'Usuario';
  const initials = displayName.charAt(0).toUpperCase();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[
      iconName
    ];
    return Icon ? <Icon size={20} /> : <LucideIcons.Package size={20} />;
  };

  return (
    <div
      style={{
        width: isOpen ? "260px" : "68px",
        minWidth: isOpen ? "260px" : "68px",
        flexShrink: 0,
        backgroundColor: "var(--color-dark)",
        color: "var(--color-cream)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease, min-width 0.3s ease",
        borderRight: "1px solid rgba(212, 190, 160, 0.2)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: "1.5rem 1rem",
          borderBottom: "1px solid rgba(212, 190, 160, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          justifyContent: isOpen ? "flex-start" : "center",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            minWidth: "30px",
          }}
        >
          🎯
        </div>
        {isOpen && (
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              margin: 0,
              color: "var(--color-accent-light)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Ultimate Habit
          </h2>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          const isExpanded = expandedSections.includes(item.key);

          return (
            <div key={item.key}>
              {/* Main Navigation Item */}
              <button
                onClick={() => {
                  setActivePage(item.key);
                  if (item.sections.length > 0) {
                    toggleSection(item.key);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: isActive
                    ? "rgba(212, 166, 67, 0.15)"
                    : "transparent",
                  color: isActive ? "var(--color-accent-light)" : "var(--color-cream)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "all 0.3s ease",
                  borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? "600" : "500",
                  justifyContent: isOpen ? "flex-start" : "center",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "rgba(212, 190, 160, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "transparent";
                  }
                }}
              >
                <span style={{ minWidth: "20px", display: "flex", alignItems: "center" }}>
                  {getIcon(item.icon)}
                </span>
                {isOpen && (
                  <>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    {item.sections.length > 0 && (
                      <span
                        style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <LucideIcons.ChevronDown size={16} />
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Sub Items */}
              {item.sections.length > 0 && isOpen && isExpanded && (
                <div style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                  {item.sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => {
                        setActivePage(item.key);
                        if (item.key === "wellness" && WELLNESS_SECTION_MAP[section]) {
                          setWellnessSubTab(WELLNESS_SECTION_MAP[section]);
                        }
                        if (item.key === "productivity" && PRODUCTIVITY_SECTION_MAP[section]) {
                          setProductivitySubTab(PRODUCTIVITY_SECTION_MAP[section]);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem 1rem 0.5rem 2.5rem",
                        backgroundColor:
                          activePage === item.key
                            ? "rgba(212, 166, 67, 0.25)"
                            : "transparent",
                        color:
                          activePage === item.key
                            ? "var(--color-accent-light)"
                            : "var(--color-light-tan)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        fontSize: "0.8125rem",
                        transition: "all 0.3s ease",
                        borderLeft:
                          activePage === item.key
                            ? "3px solid var(--color-accent)"
                            : "3px solid transparent",
                        fontWeight: activePage === item.key ? "500" : "400",
                      }}
                      onMouseEnter={(e) => {
                        if (activePage !== item.key) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            "rgba(212, 190, 160, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activePage !== item.key) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            "transparent";
                        }
                      }}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile + Gamification Section */}
      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid rgba(212, 190, 160, 0.2)",
        }}
      >
        {/* Avatar + Name + Level */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            justifyContent: isOpen ? "flex-start" : "center",
            marginBottom: isOpen ? "12px" : "0",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-dark)",
              fontWeight: "600",
              fontSize: "1rem",
              minWidth: "40px",
            }}
          >
            {initials}
          </div>
          {isOpen && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "var(--color-cream)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "#D4A843",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "12px" }}>⭐</span>
                Nivel {currentLevel} — {levelName}
              </div>
            </div>
          )}
        </div>

        {/* XP Progress Bar */}
        {isOpen && (
          <div style={{ marginTop: "4px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.625rem",
                color: "rgba(212, 190, 160, 0.7)",
                marginBottom: "4px",
              }}
            >
              <span>{totalXP.toLocaleString()} XP</span>
              <span>{xpForNextLevel.toLocaleString()} XP</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "6px",
                backgroundColor: "rgba(212, 190, 160, 0.2)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${xpProgress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #B8860B, #D4A843)",
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "0.625rem",
                color: "rgba(212, 190, 160, 0.5)",
                marginTop: "4px",
                textAlign: "center",
              }}
            >
              {(xpForNextLevel - totalXP).toLocaleString()} XP para Nivel {currentLevel + 1}
            </div>

            {/* Badges Row */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {badges.filter(b => b.isEarned).slice(0, 5).map((badge) => (
                <div
                  key={badge.id}
                  title={badge.name}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(184, 134, 11, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "default",
                  }}
                >
                  {badge.emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "8px",
            backgroundColor: "transparent",
            color: "rgba(212, 190, 160, 0.6)",
            border: "1px solid rgba(212, 190, 160, 0.2)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "flex-start" : "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-cream)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212, 190, 160, 0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(212, 190, 160, 0.6)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212, 190, 160, 0.2)";
          }}
        >
          <LucideIcons.LogOut size={14} />
          {isOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
