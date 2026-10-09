import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FBF8F3",
          100: "#F1E6D3",
          200: "#E4CFAC",
          300: "#C9AA7D",
          400: "#A98253",
          500: "#805B35",
          600: "#614328",
          700: "#442F1D",
          800: "#2A1C12",
          900: "#1B120C",
        },
        secondary: {
          50: "#FFF8EC",
          100: "#F9E8C9",
          200: "#F1D39A",
          300: "#E8B95F",
          400: "#D99A35",
          500: "#BD781F",
          600: "#A45F19",
          700: "#824715",
          800: "#653613",
          900: "#48260F",
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