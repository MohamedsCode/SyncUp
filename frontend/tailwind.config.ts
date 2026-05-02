import type { Config } from "tailwindcss";

const withAlpha = (variable: string) => `rgb(from ${variable} r g b / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: withAlpha("var(--background)"),
        foreground: withAlpha("var(--foreground)"),
        card: withAlpha("var(--card)"),
        "card-foreground": withAlpha("var(--card-foreground)"),
        popover: withAlpha("var(--popover)"),
        "popover-foreground": withAlpha("var(--popover-foreground)"),
        primary: withAlpha("var(--primary)"),
        "primary-foreground": withAlpha("var(--primary-foreground)"),
        secondary: withAlpha("var(--secondary)"),
        "secondary-foreground": withAlpha("var(--secondary-foreground)"),
        accent: withAlpha("var(--accent)"),
        "accent-foreground": withAlpha("var(--accent-foreground)"),
        muted: withAlpha("var(--muted)"),
        "muted-foreground": withAlpha("var(--muted-foreground)"),
        destructive: withAlpha("var(--destructive)"),
        "destructive-foreground": withAlpha("var(--destructive-foreground)"),
        border: withAlpha("var(--border)"),
        input: withAlpha("var(--input)"),
        ring: withAlpha("var(--ring)"),
        sidebar: withAlpha("var(--sidebar)"),
        "sidebar-foreground": withAlpha("var(--sidebar-foreground)"),
        "sidebar-border": withAlpha("var(--sidebar-border)"),
        "sidebar-primary": withAlpha("var(--sidebar-primary)"),
        "sidebar-primary-foreground": withAlpha("var(--sidebar-primary-foreground)"),
        "sidebar-accent": withAlpha("var(--sidebar-accent)"),
        "sidebar-accent-foreground": withAlpha("var(--sidebar-accent-foreground)"),
        frost: withAlpha("var(--foreground)"),
        electric: withAlpha("var(--accent)"),
        violet: withAlpha("var(--primary)"),
        cyan: withAlpha("var(--chart-2)"),
        success: withAlpha("var(--chart-3)"),
        warning: withAlpha("var(--chart-4)"),
        danger: withAlpha("var(--destructive)"),
        abyss: withAlpha("var(--background)"),
        midnight: withAlpha("var(--sidebar)"),
        panel: withAlpha("var(--card)")
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        serif: ["var(--font-serif)", "serif"]
      },
      borderRadius: {
        sm: "calc(var(--radius) * 2)",
        DEFAULT: "calc(var(--radius) * 3)",
        md: "calc(var(--radius) * 4)",
        lg: "calc(var(--radius) * 5)",
        xl: "calc(var(--radius) * 6)",
        "2xl": "calc(var(--radius) * 7)",
        "3xl": "calc(var(--radius) * 8)"
      },
      boxShadow: {
        soft:
          "var(--shadow-offset-x) var(--shadow-offset-y) var(--shadow-blur) var(--shadow-spread) color-mix(in srgb, var(--shadow-color) calc(var(--shadow-opacity) * 100%), transparent)",
        glow: "0 0 0 1px color-mix(in srgb, var(--primary) 22%, var(--border))",
        violet: "0 0 0 1px color-mix(in srgb, var(--primary) 22%, var(--border))"
      },
      transitionTimingFunction: {
        glass: "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  plugins: []
} satisfies Config;
