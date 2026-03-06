export const onboardingStrings = {
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

  profile: {
    title: "Your Practice Profile",
    subtitle: "Help us personalize your experience.",
    primaryGoal: "Primary Goal",
    goals: {
      stress: "Stress Reduction",
      athletic: "Athletic Performance",
      immune: "Immune Health",
      curiosity: "Curiosity",
      cold: "Cold Focus",
    },
    availableTime: "Available Time Per Day",
    timeOptions: {
      "10": "10 min",
      "20": "20 min",
      "30+": "30+ min",
    },
    experienceLevel: "Experience Level",
    levels: {
      beginner: "Complete Beginner",
      some: "Some Experience",
      regular: "Regular Practitioner",
    },
    preferredTime: "Preferred Session Time",
    times: {
      morning: "Morning",
      midday: "Midday",
      evening: "Evening",
    },
    save: "Save Profile",
    skipForNow: "Skip for Now",
  },
} as const;
