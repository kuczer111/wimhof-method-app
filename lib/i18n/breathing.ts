export const breathingStrings = {
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
    perRoundCustomize: "Per round",
    roundLabel: (n: number) => `R${n}`,
    pace: "Pace",
    paceOptions: {
      slow: "Slow",
      medium: "Medium",
      fast: "Fast",
    },
    startSession: "Start Session",
    retentionMode: "Retention Mode",
    retentionModeOptions: {
      free: "Free",
      target: "Target",
    },
    retentionModeDescriptions: {
      free: "Open-ended hold, tap when done",
      target: "Visual indicator when approaching PB",
    },
    mindsetPrompts: "Mindset Prompts",
    mindsetPromptPlaceholder: (n: number) => `Round ${n} prompt (optional)`,
    autoCold: "Auto Cold",
    autoColdDescription: "Start cold timer after last round",
    saveAsPreset: "Save as Preset",
    presetNamePlaceholder: "Preset name",
    presetSaved: "Preset saved!",
    presetLimitReached: "Maximum 5 presets. Delete one first.",
    customPresetLabel: "Custom",
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
      approachingPb: "Approaching PB",
      newPb: "New PB!",
      pbTarget: (time: string) => `PB: ${time}`,
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

  guidedMode: {
    preBreathing: {
      title: "Let's Begin",
      body: "You're about to do a series of deep, rhythmic breaths followed by a breath hold. Breathe in fully through the mouth, then let the air out naturally. Don't force the exhale. You may feel tingling or lightheadedness — that's completely normal.",
      start: "I'm Ready",
    },
    midSessionPause: {
      title: "How Did That Feel?",
      body: "You just completed your first round! The tingling, lightheadedness, or emotional release you may have felt is your body responding to the change in blood chemistry. Each round typically gets easier as your body adapts.",
      continue: "Continue to Round 2",
    },
    enhancedDebrief: {
      title: "Understanding Your Results",
      retentionExplanation: "Your retention time is how long you held your breath after exhaling. It's normal for this to increase with each round as your body becomes more saturated with oxygen.",
      firstRoundNote: (time: string) => `Your first hold was ${time} — a great starting point! Most people see significant improvement within their first few sessions.`,
      improvementTip: "Tip: Consistency matters more than duration. Even 5-10 seconds of improvement over time shows your body is adapting.",
    },
  },
} as const;
