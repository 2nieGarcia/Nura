import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        service: {
          bg: "#f8faf7",
          card: "#ffffff",
          primary: "#1b6b3a",
          accent: "#1e6f87",
          warning: "#9f1239",
          text: "#1f2937"
        }
      },
      boxShadow: {
        panel: "0 8px 24px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
