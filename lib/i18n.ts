export const strings = {
  app: {
    title: "Wim Hof Method",
    description: "Guided Wim Hof Method breathing and cold exposure tracker",
    shortTitle: "WHM",
    version: "Wim Hof Method App v0.1.0",
  },

  nav: {
    breathe: "Breathe",
    cold: "Cold",
    progress: "Progress",
    settings: "Settings",
  },

  offline: {
    heading: "You are offline",
    description: "Check your connection and try again.",
    retry: "Retry",
  },

  safety: {
    reminder: {
      title: "Before You Begin",
      points: [
        "Sit or lie down in a safe place",
        "Never practice in or near water",
        "Never practice while driving",
        "Stop if you feel unwell",
      ],
      acknowledge: "I Understand",
    },
    onboarding: {
      title: "Important Safety Information",
      subtitle: "Please read before continuing",
      rules: [
        "Never practice breathing exercises in or near water",
        "Never practice while driving or operating machinery",
        "Always sit or lie down — fainting is possible",
        "Do not force the exhale hold beyond comfort",
        "Contraindicated for epilepsy, cardiac conditions, high blood pressure, and pregnancy",
        "Stop immediately if you feel unwell",
      ],
      acknowledge: "I Understand and Accept",
    },
  },

  breathe: {
    heading: "Breathing Session",
    presets: {
      beginner: { name: "Beginner", description: "3 rounds · 30 breaths · slow" },
      standard: { name: "Standard", description: "3 rounds · 30 breaths · medium" },
      deepPractice: { name: "Deep Practice", description: "4 rounds · 40 breaths · medium" },
      morningActivation: { name: "Morning Activation", description: "3 rounds · 30 breaths · fast" },
    },
    rounds: "Rounds",
    breathsPerRound: "Breaths per Round",
    pace: "Pace",
    paceOptions: {
      slow: "Slow",
      medium: "Medium",
      fast: "Fast",
    },
    startSession: "Start Session",
  },

  breathing: {
    roundProgress: (current: number, total: number) =>
      `Round ${current} of ${total}`,
    powerBreaths: {
      label: "Power Breaths",
      breathCounter: (count: number) => `of ${count}`,
      instruction: "Breathe in deeply, let go",
    },
    retention: {
      label: "Retention Hold",
      instruction: "Exhale and hold your breath",
      tapButton: "I breathed",
    },
    recovery: {
      label: "Recovery Breath",
      instruction: "Take a deep breath in and hold",
    },
    sessionComplete: {
      status: "Session Complete",
      message: "Well done!",
      totalTime: "Total Time",
      roundLabel: (count: number) => `Round${count > 1 ? "s" : ""}`,
      retentionTimes: "Retention Times",
      roundNumber: (n: number) => `Round ${n}`,
      personalBest: "PB",
      howDoYouFeel: "How do you feel?",
      notePlaceholder: "Add a note (optional)...",
    },
  },

  cold: {
    heading: "Cold Shower",
    targetDuration: "Target Duration",
    startTimer: "Start Timer",
    stop: "Stop",
    targetReached: "Target reached!",
    targetLabel: (label: string) => `Target: ${label}`,
    sessionComplete: "Session Complete",
    type: "Type",
    waterTemperature: "Water Temperature (optional)",
    temperaturePlaceholder: "e.g. 10",
    temperatureUnit: "°C",
    howDidItFeel: "How did it feel?",
  },

  settings: {
    heading: "Settings",
    audioMode: "Audio Mode",
    audioOptions: {
      tones: "Tones",
      silent: "Silent",
    },
    defaultBreathingConfig: "Default Breathing Config",
    rounds: "Rounds",
    breathsPerRound: "Breaths per round",
    pace: "Pace",
    defaultColdTarget: "Default Cold Target",
    coldTargetOptions: {
      "30": "30s",
      "60": "1 min",
      "90": "1.5 min",
      "120": "2 min",
      "180": "3 min",
    } as Record<string, string>,
    screenWakeLock: "Screen Wake Lock",
    wakeLockDescription: "Keep screen on during sessions",
    data: "Data",
    allDataCleared: "All data cleared.",
    clearAllData: "Clear All Data",
    clearConfirm: {
      title: "Clear All Data?",
      description:
        "This will permanently delete all your breathing sessions, cold sessions, and preferences. This action cannot be undone.",
      cancel: "Cancel",
      confirm: "Clear Data",
    },
  },

  progress: {
    heading: "Progress",
    subtitle: "Your session history",
    tabs: {
      breathing: "breathing",
      cold: "cold",
    },
    chart: {
      title: "Avg. Retention Per Session",
      avgLegend: "avg",
      prLegend: "PR",
      tooltipLabel: "Avg retention",
      overallAvg: (value: number) => `Overall avg: ${value}s`,
      pr: (value: number) => `PR: ${value}s`,
    },
    breathingEmpty: "No breathing sessions yet. Start one from the Breathe tab.",
    roundLabel: (count: number) => `${count} round${count !== 1 ? "s" : ""}`,
    totalLabel: (time: string) => `Total: ${time}`,
    coldStats: {
      title: "Cold Exposure Stats",
      totalMinutes: "Total minutes",
      dayStreak: "Day streak",
      last12Weeks: "Last 12 weeks",
    },
    coldEmpty: "No cold sessions yet. Start one from the Cold tab.",
    coldTarget: (time: string) => `Target: ${time}`,
    coldRating: (value: number) => `Rating: ${value}/5`,
  },

  onboarding: {
    hero: {
      title: "Wim Hof Method",
      subtitle: "Unlock your body's natural potential through breathing, cold exposure, and commitment.",
    },
    pillars: {
      title: "Three Pillars",
      breathing: "Breathing",
      breathingDesc: "Controlled hyperventilation to oxygenate your body and shift your chemistry.",
      cold: "Cold Exposure",
      coldDesc: "Gradual cold training to strengthen your cardiovascular system and willpower.",
      mindset: "Mindset",
      mindsetDesc: "Focus and commitment to push past perceived limits.",
    },
    expectations: {
      title: "What to Expect",
      subtitle: "These sensations are normal during breathing exercises:",
      items: [
        "Tingling in hands and feet",
        "Lightheadedness or dizziness",
        "Emotional release",
        "Warmth spreading through your body",
      ],
      reassurance: "These are normal physiological responses. They will pass.",
    },
    safety: {
      title: "Safety First",
      subtitle: "This practice is powerful. Please acknowledge these rules:",
      acknowledge: "I Understand and Accept",
    },
    startingPoint: {
      title: "Your Starting Point",
      subtitle: "This helps us tailor your experience.",
      newbie: "I'm completely new",
      newbieDesc: "Start with guided sessions and lower intensity.",
      experienced: "I know the method",
      experiencedDesc: "Jump in with standard settings.",
    },
    skip: "Skip",
    next: "Next",
    getStarted: "Get Started",
  },

  common: {
    feelingLabels: ["Rough", "Meh", "OK", "Good", "Great"],
    saveSession: "Save Session",
    done: "Done",
    skipAndFinish: "Skip & Finish",
  },
} as const;
