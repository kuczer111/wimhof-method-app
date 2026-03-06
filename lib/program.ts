import type { SessionConfig } from "./storage";

// --- Types ---

export interface Program {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  days: ProgramDay[];
}

export interface ProgramDay {
  dayNumber: number;
  label: string;
  breathingConfig?: SessionConfig;
  coldTarget?: number; // seconds
  mindsetTask?: string;
  isRestDay: boolean;
}

export interface ProgramProgress {
  programId: string;
  startDate: string; // ISO 8601
  completedDays: number[];
  paused: boolean;
  pausedDate?: string; // ISO 8601
}

// --- Helper to build breathing configs ---

function breathingConfig(
  rounds: number,
  breaths: number,
  opts?: { pace?: SessionConfig["pace"]; mindsetPrompts?: string[]; autoCold?: boolean }
): SessionConfig {
  return {
    rounds,
    breathsPerRound: Array.from({ length: rounds }, () => breaths),
    pace: opts?.pace ?? "slow",
    retentionMode: "free",
    autoCold: opts?.autoCold ?? false,
    mindsetPrompts: opts?.mindsetPrompts,
  };
}

// --- 30-Day Beginner Program ---

function buildBeginnerDays(): ProgramDay[] {
  const days: ProgramDay[] = [];

  // Week 1 (Days 1-7): 2 rounds, 30 breaths, no cold
  for (let d = 1; d <= 7; d++) {
    if (d === 4) {
      days.push({ dayNumber: d, label: "Rest & Reflect", isRestDay: true, mindsetTask: "Journal about how your body feels after 3 days of breathing practice." });
    } else if (d === 7) {
      days.push({ dayNumber: d, label: "Rest Day", isRestDay: true, mindsetTask: "Reflect on your first week. What sensations did you notice during breathing?" });
    } else {
      days.push({
        dayNumber: d,
        label: `Week 1 — Day ${d}`,
        breathingConfig: breathingConfig(2, 30),
        mindsetTask: d === 1 ? "Focus on letting go with each exhale." : d === 2 ? "Notice the tingling sensations without judging them." : d === 3 ? "Count your breaths to stay present." : d === 5 ? "Observe how your body feels different from day 1." : "Try to relax your shoulders and jaw during breathing.",
        isRestDay: false,
      });
    }
  }

  // Week 2 (Days 8-14): 3 rounds, 30 breaths, introduce cold (30s)
  for (let d = 8; d <= 14; d++) {
    if (d === 11) {
      days.push({ dayNumber: d, label: "Rest & Reflect", isRestDay: true, mindsetTask: "How did adding cold exposure feel? Write down three words that describe it." });
    } else if (d === 14) {
      days.push({ dayNumber: d, label: "Rest Day", isRestDay: true, mindsetTask: "Halfway through! Notice any changes in your energy or mood this week." });
    } else {
      days.push({
        dayNumber: d,
        label: `Week 2 — Day ${d}`,
        breathingConfig: breathingConfig(3, 30, { autoCold: true }),
        coldTarget: 30,
        mindsetTask: d === 8 ? "Welcome to cold exposure. Stay calm and focus on your exhale." : d === 9 ? "Before the cold, set an intention: 'I choose discomfort.'" : d === 10 ? "During retention, visualize warmth spreading through your body." : d === 12 ? "Smile during the cold shower — it changes your experience." : "Notice how the cold feels different after breathing.",
        isRestDay: false,
      });
    }
  }

  // Week 3 (Days 15-21): 3 rounds, 40 breaths, longer cold (60s)
  for (let d = 15; d <= 21; d++) {
    if (d === 18) {
      days.push({ dayNumber: d, label: "Rest & Reflect", isRestDay: true, mindsetTask: "Compare your retention times from week 1 to now. Progress isn't always linear." });
    } else if (d === 21) {
      days.push({ dayNumber: d, label: "Rest Day", isRestDay: true, mindsetTask: "Three weeks done. How has your relationship with discomfort changed?" });
    } else {
      days.push({
        dayNumber: d,
        label: `Week 3 — Day ${d}`,
        breathingConfig: breathingConfig(3, 40, { autoCold: true }),
        coldTarget: 60,
        mindsetTask: d === 15 ? "More breaths today — stay with the rhythm, don't rush." : d === 16 ? "Try to keep your body completely still during retention." : d === 17 ? "Focus on the pause between inhale and exhale." : d === 19 ? "During cold exposure, breathe slowly and steadily." : "Set a personal intention before you start today.",
        isRestDay: false,
      });
    }
  }

  // Week 4 (Days 22-30): 4 rounds, 40 breaths, cold 90s, silence/mindset focus
  for (let d = 22; d <= 30; d++) {
    if (d === 25) {
      days.push({ dayNumber: d, label: "Rest & Reflect", isRestDay: true, mindsetTask: "You're in the final stretch. What has this practice taught you about your mind?" });
    } else if (d === 28) {
      days.push({ dayNumber: d, label: "Rest Day", isRestDay: true, mindsetTask: "Tomorrow is your final push. Rest well and set an intention for finishing strong." });
    } else {
      const isFinalDay = d === 30;
      days.push({
        dayNumber: d,
        label: isFinalDay ? "Final Day — Full Practice" : `Week 4 — Day ${d}`,
        breathingConfig: breathingConfig(4, 40, {
          autoCold: true,
          mindsetPrompts: [
            "Silence. Just breathe.",
            "Let go of control.",
            "You are stronger than you think.",
            "Embrace the stillness.",
          ],
        }),
        coldTarget: 90,
        mindsetTask: d === 22 ? "4 rounds today. In the silence, just observe." : d === 23 ? "No counting needed — trust your body's rhythm." : d === 24 ? "During retention, let thoughts pass like clouds." : d === 26 ? "Combine all three pillars with full awareness today." : d === 27 ? "Challenge yourself: can you stay completely calm in the cold?" : d === 29 ? "Practice with gratitude for what your body can do." : "Congratulations. You've built a practice. Keep going.",
        isRestDay: false,
      });
    }
  }

  return days;
}

export const BEGINNER_PROGRAM: Program = {
  id: "beginner-30",
  title: "30-Day Beginner Program",
  description: "Build your Wim Hof Method practice from the ground up. Start with breathing basics, add cold exposure in week 2, and develop all three pillars over 30 days.",
  durationDays: 30,
  days: buildBeginnerDays(),
};

