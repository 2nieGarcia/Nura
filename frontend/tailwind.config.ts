import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nura: {
          bg: "#f8faf7",
          surface: "#ffffff",
          primary: "#1b6b3a",
          "primary-hover": "#155c30",
          accent: "#1e6f87",
          "accent-hover": "#175a6e",
          emergency: "#9f1239",
          "emergency-bg": "#fef2f2",
          "emergency-border": "#fecaca",
          warning: "#b45309",
          "warning-bg": "#fffbeb",
          muted: "#64748b",
          text: "#1f2937",
          "text-light": "#475569",
          border: "#e2e8f0",
          "border-light": "#f1f5f9",
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        "card-hover": "0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
        soft: "0 1px 2px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
      },
    },
  },
  plugins: [],
};

export default config;
