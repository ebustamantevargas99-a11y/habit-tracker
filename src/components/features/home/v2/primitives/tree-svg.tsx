"use client";

import type { HabitState } from "../types";

interface Props {
  state: HabitState;
}

/**
 * Árbol SVG ilustrado estilo grabado botánico siglo XIX.
 * 6 estados, cada uno con geometría distinta. ViewBox 80×140, suelo en y=120.
 * Usa 3 tonos derivados del --color-accent + --color-tan para el suelo.
 */
export default function TreeSVG({ state }: Props) {
  const accent = "var(--color-accent)";
  const darker = "color-mix(in oklab, var(--color-accent) 70%, var(--color-brown))";
  const lighter = "var(--color-accent-light)";
  const soil = "var(--color-tan)";

  const ground = (
    <line
      x1="10"
      y1="120"
      x2="70"
      y2="120"
      stroke={soil}
      strokeWidth="1"
      strokeDasharray="2 2"
      opacity="0.6"
    />
  );

  if (state === "not_started") {
    return (
      <svg viewBox="0 0 80 140" width="100%" height="100%" aria-hidden>
        {ground}
        <ellipse cx="40" cy="124" rx="6" ry="2" fill={soil} opacity="0.5" />
        <ellipse cx="40" cy="122" rx="3" ry="4" fill={darker} opacity="0.7" />
      </svg>
    );
  }

  if (state === "starting") {
    return (
      <svg viewBox="0 0 80 140" width="100%" height="100%" aria-hidden>
        {ground}
        <path d="M40 120 Q40 108 40 96" stroke={darker} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M40 106 Q32 102 28 94 Q34 98 40 104 Z" fill={lighter} opacity="0.8" />
        <path d="M40 102 Q48 98 52 90 Q46 94 40 100 Z" fill={accent} opacity="0.85" />
        <path d="M40 110 Q40 112 41 114" stroke={darker} strokeWidth="0.8" fill="none" />
      </svg>
    );
  }

  if (state === "forming") {
    return (
      <svg viewBox="0 0 80 140" width="100%" height="100%" aria-hidden>
        {ground}
        <path d="M40 120 Q40 100 40 80" stroke={darker} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M40 96 Q30 92 26 84" stroke={darker} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M40 92 Q50 88 54 80" stroke={darker} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="74" r="14" fill={accent} opacity="0.28" />
        <ellipse cx="36" cy="70" rx="8" ry="5" fill={accent} opacity="0.65" transform="rotate(-20 36 70)" />
        <ellipse cx="44" cy="72" rx="7" ry="4" fill={lighter} opacity="0.75" transform="rotate(15 44 72)" />
        <ellipse cx="40" cy="66" rx="6" ry="4" fill={darker} opacity="0.55" />
      </svg>
    );
  }

  if (state === "strengthening") {
    return (
      <svg viewBox="0 0 80 140" width="100%" height="100%" aria-hidden>
        {ground}
        <path d="M40 120 L40 68" stroke={darker} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 92 Q28 86 22 76" stroke={darker} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M40 86 Q52 82 58 72" stroke={darker} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M40 76 Q34 70 30 60" stroke={darker} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M40 72 Q48 66 52 58" stroke={darker} strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="40" cy="60" rx="22" ry="18" fill={accent} opacity="0.22" />
        <circle cx="30" cy="62" r="9" fill={accent} opacity="0.6" />
        <circle cx="48" cy="56" r="10" fill={lighter} opacity="0.7" />
        <circle cx="40" cy="50" r="8" fill={darker} opacity="0.5" />
        <circle cx="52" cy="66" r="6" fill={accent} opacity="0.55" />
        <circle cx="28" cy="54" r="5" fill={lighter} opacity="0.6" />
      </svg>
    );
  }

  if (state === "near_rooted") {
    return (
      <svg viewBox="0 0 80 140" width="100%" height="100%" aria-hidden>
        {ground}
        <path d="M40 120 L40 60" stroke={darker} strokeWidth="3" strokeLinecap="round" />
        <path d="M40 90 Q26 82 18 68" stroke={darker} strokeWidth="1.4" fill="none" />
        <path d="M40 82 Q54 76 62 64" stroke={darker} strokeWidth="1.4" fill="none" />
        <path d="M40 72 Q32 64 26 52" stroke={darker} strokeWidth="1.1" fill="none" />
        <path d="M40 66 Q50 58 56 46" stroke={darker} strokeWidth="1.1" fill="none" />
        <ellipse cx="40" cy="54" rx="28" ry="24" fill={accent} opacity="0.2" />
        <circle cx="25" cy="60" r="11" fill={accent} opacity="0.55" />
        <circle cx="52" cy="52" r="12" fill={lighter} opacity="0.65" />
        <circle cx="40" cy="44" r="10" fill={darker} opacity="0.55" />
        <circle cx="58" cy="62" r="8" fill={accent} opacity="0.6" />
        <circle cx="22" cy="48" r="8" fill={lighter} opacity="0.55" />
        <circle cx="32" cy="40" r="7" fill={accent} opacity="0.5" />
        <circle cx="48" cy="66" r="6" fill={darker} opacity="0.45" />
      </svg>
    );
  }

  // rooted
  return (
    <svg viewBox="0 0 80 140" width="100%" height="100%" aria-hidden>
      {ground}
      <path d="M40 120 Q34 126 28 132" stroke={darker} strokeWidth="1.4" fill="none" opacity="0.85" strokeLinecap="round" />
      <path d="M40 120 Q46 126 52 132" stroke={darker} strokeWidth="1.4" fill="none" opacity="0.85" strokeLinecap="round" />
      <path d="M40 120 Q40 128 40 136" stroke={darker} strokeWidth="1.2" fill="none" opacity="0.75" strokeLinecap="round" />
      <path d="M40 120 Q30 124 20 128" stroke={darker} strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M40 120 Q50 124 60 128" stroke={darker} strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M38 120 Q39 80 40 54" stroke={darker} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M40 86 Q22 78 12 62" stroke={darker} strokeWidth="1.6" fill="none" />
      <path d="M40 78 Q56 70 68 58" stroke={darker} strokeWidth="1.6" fill="none" />
      <path d="M40 68 Q28 58 20 46" stroke={darker} strokeWidth="1.2" fill="none" />
      <path d="M40 60 Q52 52 60 40" stroke={darker} strokeWidth="1.2" fill="none" />
      <ellipse cx="40" cy="48" rx="34" ry="28" fill={accent} opacity="0.18" />
      <circle cx="22" cy="56" r="13" fill={accent} opacity="0.55" />
      <circle cx="56" cy="46" r="14" fill={lighter} opacity="0.65" />
      <circle cx="40" cy="36" r="12" fill={darker} opacity="0.55" />
      <circle cx="62" cy="58" r="9" fill={accent} opacity="0.6" />
      <circle cx="16" cy="42" r="9" fill={lighter} opacity="0.55" />
      <circle cx="32" cy="30" r="8" fill={accent} opacity="0.5" />
      <circle cx="52" cy="64" r="7" fill={darker} opacity="0.5" />
      <circle cx="48" cy="28" r="6" fill={lighter} opacity="0.55" />
      <circle cx="28" cy="58" r="6" fill={accent} opacity="0.5" />
      <circle cx="38" cy="24" r="2.5" fill="var(--color-danger)" opacity="0.7" />
    </svg>
  );
}

export const STATE_LABEL: Record<HabitState, string> = {
  not_started: "por plantar",
  starting: "germinando",
  forming: "formándose",
  strengthening: "fortaleciendo",
  near_rooted: "casi arraigado",
  rooted: "arraigado",
};
