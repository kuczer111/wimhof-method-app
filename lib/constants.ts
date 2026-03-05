// Design tokens for the Wim Hof Method app

export const colors = {
  // Primary brand — sky blue (cold/breath theme)
  primary: {
    DEFAULT: "#0ea5e9", // sky-500
    light: "#38bdf8",   // sky-400
    dark: "#0284c7",    // sky-600
  },
  // Accent — used for warmth/recovery phases
  accent: {
    DEFAULT: "#f97316", // orange-500
    light: "#fb923c",   // orange-400
    dark: "#ea580c",    // orange-600
  },
  // Success — streaks, completed states
  success: {
    DEFAULT: "#22c55e", // green-500
    light: "#4ade80",   // green-400
  },
  // Warning / caution — safety screens
  warning: {
    DEFAULT: "#eab308", // yellow-500
  },
  // Danger — stop, alerts
  danger: {
    DEFAULT: "#ef4444", // red-500
  },
  // Surface palette (dark-first)
  surface: {
    base: "#030712",    // gray-950
    raised: "#111827",  // gray-900
    overlay: "#1f2937", // gray-800
  },
  // Text
  text: {
    primary: "#f9fafb",   // gray-50
    secondary: "#9ca3af", // gray-400
    muted: "#6b7280",     // gray-500
  },
  // Border
  border: {
    DEFAULT: "#1f2937",  // gray-800
    light: "#374151",    // gray-700
  },
} as const;

export const spacing = {
  pagePadding: "px-4",
  sectionGap: "space-y-6",
  cardPadding: "p-4",
} as const;

export const radii = {
  card: "rounded-2xl",
  button: "rounded-xl",
  modal: "rounded-2xl",
} as const;

export const animation = {
  breathePace: {
    slow: 2500,
    medium: 2000,
    fast: 1500,
  },
  recoveryHold: 15_000,
} as const;
