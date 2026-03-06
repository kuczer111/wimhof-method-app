import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0ea5e9",
          light: "#38bdf8",
          dark: "#0284c7",
        },
        accent: {
          DEFAULT: "#f97316",
          light: "#fb923c",
          dark: "#ea580c",
        },
        cold: {
          DEFAULT: "#06b6d4",
          light: "#22d3ee",
          dark: "#0891b2",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#34d399",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          dark: "#d97706",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#f87171",
          dark: "#dc2626",
        },
        surface: {
          base: "#030712",
          raised: "#111827",
          overlay: "#1f2937",
        },
        "on-surface": {
          DEFAULT: "#ffffff",
          muted: "#9ca3af",
          faint: "#4b5563",
        },
        "on-surface-light": {
          DEFAULT: "#111827",
          muted: "#6b7280",
        },
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },
      animation: {
        "page-enter": "page-enter 250ms ease-out",
        "slide-up": "slide-up 400ms ease-out",
      },
      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
