import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto)", "system-ui", "sans-serif"],
        display: ["var(--font-kanit)", "var(--font-noto)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          page: "rgb(var(--surface-page) / <alpha-value>)",
          card: "rgb(var(--surface-card) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b0764",
          950: "#1e0a3c",
        },
        accent: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      boxShadow: {
        brand: "0 10px 40px -10px rgba(109, 40, 217, 0.35)",
        soft: "0 4px 24px rgba(109, 40, 217, 0.08)",
      },
      borderRadius: {
        pill: "9999px",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
