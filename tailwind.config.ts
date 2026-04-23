import type { Config } from "tailwindcss";

/**
 * Colors are mapped to CSS variables so every class reacts to the active theme
 * (warm/ocean/forest/rose defined in globals.css).
 * Tailwind opacity modifiers (bg-brand-dark/50) won't work with var()-based colors —
 * that's acceptable because themes override the variable itself.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand palette (responds to theme via CSS variables) ───────────────
        brand: {
          dark:         "var(--color-dark)",
          brown:        "var(--color-brown)",
          medium:       "var(--color-medium)",
          warm:         "var(--color-warm)",
          tan:          "var(--color-tan)",
          "light-tan":  "var(--color-light-tan)",
          cream:        "var(--color-cream)",
          "light-cream":"var(--color-light-cream)",
          "warm-white": "var(--color-warm-white)",
          paper:        "var(--color-paper)",
        },
        // ── Accent (theme-responsive) ─────────────────────────────────────────
        accent: {
          DEFAULT: "var(--color-accent)",
          light:   "var(--color-accent-light)",
          glow:    "#F0D78C", // static — no variable for this one
        },
        // ── Semantic status colors (static — not theme-dependent) ─────────────
        success: {
          DEFAULT: "#7A9E3E",
          light:   "#D4E6B5",
        },
        warning: {
          DEFAULT: "#D4943A",
          light:   "#F5E0C0",
        },
        danger: {
          DEFAULT: "#C0544F",
          light:   "#F5D0CE",
        },
        info: {
          DEFAULT: "#5A8FA8",
          light:   "#C8E0EC",
        },
      },
      fontFamily: {
        // Apuntan a CSS vars themeables — cada tema en globals.css decide
        // qué fuente real usar (serif, sans, mono o serif japonés).
        serif:   ["var(--font-heading)"],
        display: ["var(--font-heading)"],
        sans:    ["var(--font-body)"],
        mono:    ["var(--font-mono)"],
      },
      borderRadius: {
        card:   "16px",
        button: "10px",
        xl:     "12px",
        "2xl":  "16px",
      },
      boxShadow: {
        card:       "0 4px 12px rgba(61, 43, 31, 0.08)",
        "card-hover":"0 8px 24px rgba(61, 43, 31, 0.12)",
        glow:       "0 0 20px rgba(184, 134, 11, 0.15)",
        warm:       "0 2px 8px rgba(61, 43, 31, 0.10)",
        "warm-lg":  "0 10px 25px rgba(61, 43, 31, 0.15)",
      },
      spacing: {
        // Nothing extra — standard Tailwind spacing (4=1rem, etc.) is fine
      },
    },
  },
  plugins: [],
};

export default config;
