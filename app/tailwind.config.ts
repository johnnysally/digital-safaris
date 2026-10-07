import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F5F6F8",
          100: "#E5E7EB",
          200: "#C5C9D2",
          300: "#9AA1B2",
          400: "#6B7590",
          500: "#4A5470",
          600: "#2F3855",
          700: "#1F2842",
          800: "#1A1F2E",
          900: "#0F1420",
        },
        secondary: {
          50: "#FBF8F3",
          100: "#F5EEDF",
          200: "#EBDCBB",
          300: "#DFC794",
          400: "#D2B273",
          500: "#C9A063",
          600: "#B8935A",
          700: "#96753F",
          800: "#71582F",
          900: "#4D3C1F",
        },
        background: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--surface-alt) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;