import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#020617",
        midnight: "#0f172a",
        panel: "#111827",
        frost: "#e5e7eb",
        muted: "#94a3b8",
        electric: "#3b82f6",
        violet: "#8b5cf6",
        cyan: "#22d3ee",
        success: "#38bdf8",
        warning: "#f59e0b",
        danger: "#f43f5e"
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Poppins'", "'Inter'", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 8px 32px rgba(0, 0, 0, 0.4)",
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 18px 48px rgba(59,130,246,0.18)",
        violet: "0 0 0 1px rgba(255,255,255,0.08), 0 20px 52px rgba(139,92,246,0.22)"
      },
      transitionTimingFunction: {
        glass: "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  plugins: []
} satisfies Config;
