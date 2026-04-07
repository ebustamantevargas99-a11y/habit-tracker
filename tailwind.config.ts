import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#3D2B1F",
          brown: "#6B4226",
          medium: "#8B6542",
          warm: "#A0845C",
          tan: "#C4A882",
          "light-tan": "#D4BEA0",
          cream: "#EDE0D4",
          "light-cream": "#F5EDE3",
          "warm-white": "#FAF7F3",
          paper: "#FFFDF9",
        },
        accent: {
          DEFAULT: "#B8860B",
          light: "#D4A843",
          glow: "#F0D78C",
        },
        success: {
          DEFAULT: "#7A9E3E",
          light: "#D4E6B5",
        },
        warning: {
          DEFAULT: "#D4943A",
          light: "#F5E0C0",
        },
        danger: {
          DEFAULT: "#C0544F",
          light: "#F5D0CE",
        },
        info: {
          DEFAULT: "#5A8FA8",
          light: "#C8E0EC",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        button: "10px",
      },
      boxShadow: {
        card: "0 4px 12px rgba(61, 43, 31, 0.08)",
        "card-hover": "0 8px 24px rgba(61, 43, 31, 0.12)",
        glow: "0 0 20px rgba(184, 134, 11, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
