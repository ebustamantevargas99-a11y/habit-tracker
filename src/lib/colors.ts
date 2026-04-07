/**
 * Ultimate Habit Tracker — Design System Colors
 * Warm brown aesthetic inspired by premium leather planners
 *
 * See PROJECT-BIBLE.md Section 3.1 for full documentation
 */

export const colors = {
  // Base palette
  dark: "#3D2B1F",
  brown: "#6B4226",
  medium: "#8B6542",
  warm: "#A0845C",
  tan: "#C4A882",
  lightTan: "#D4BEA0",
  cream: "#EDE0D4",
  lightCream: "#F5EDE3",
  warmWhite: "#FAF7F3",
  paper: "#FFFDF9",

  // Functional colors
  accent: "#B8860B",
  accentLight: "#D4A843",
  accentGlow: "#F0D78C",
  success: "#7A9E3E",
  successLight: "#D4E6B5",
  warning: "#D4943A",
  warningLight: "#F5E0C0",
  danger: "#C0544F",
  dangerLight: "#F5D0CE",
  info: "#5A8FA8",
  infoLight: "#C8E0EC",
} as const;

export type ColorKey = keyof typeof colors;

// Area-specific colors for charts and cards
export const areaColors = {
  vision: "#D4A843",
  plan: "#A0845C",
  productivity: "#5A8FA8",
  organization: "#7A9E3E",
  finance: "#B8860B",
  fitness: "#C0544F",
  nutrition: "#7A9E3E",
  wellness: "#D4943A",
} as const;

export type AreaKey = keyof typeof areaColors;
