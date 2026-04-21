"use client";

import confetti from "canvas-confetti";

const BRAND_COLORS = ["#B8860B", "#D4A843", "#F0D78C", "#7A9E3E", "#6B4226"];

export function fireConfettiDefault() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
  });
}

export function fireConfettiCelebration() {
  if (typeof window === "undefined") return;
  const duration = 2500;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: BRAND_COLORS,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: BRAND_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function fireConfettiPR() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 150,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.7 },
    colors: BRAND_COLORS,
  });
}

export function fireConfettiStreak(days: number) {
  if (typeof window === "undefined") return;
  const particleCount = Math.min(200, 60 + days * 2);
  confetti({
    particleCount,
    spread: 80,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    shapes: days >= 100 ? ["star"] : ["square", "circle"],
  });
}
