export const programStrings = {
  program: {
    heading: 'Program',
    subtitle: '30-Day Beginner Program',
    notStarted: 'Ready to build your Wim Hof practice from the ground up?',
    startProgram: 'Start Program',
    todaySession: "Today's Session",
    restDay: 'Rest Day',
    completed: 'Completed',
    upcoming: 'Upcoming',
    dayLabel: (n: number) => `Day ${n}`,
    breathingLabel: (rounds: number, breaths: number) =>
      `${rounds} rounds · ${breaths} breaths`,
    coldLabel: (seconds: number) =>
      `Cold: ${seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60 ? `${seconds % 60}s` : ''}`}`.replace(
        / $/,
        '',
      ),
    mindsetLabel: 'Mindset',
    startSession: "Start Today's Session",
    paused: 'Paused',
    pause: 'Pause Program',
    resume: 'Resume Program',
    programComplete: 'Program Complete!',
    programCompleteMessage:
      "Congratulations! You've completed the 30-day program.",
    resetProgram: 'Reset Program',
    resetConfirm: 'Reset progress? This cannot be undone.',
    week: (n: number) => `Week ${n}`,
  },

  learn: {
    heading: 'Method Guide',
    subtitle: 'Learn the science and practice behind the Wim Hof Method.',
    chapterLabel: 'Chapter',
    back: 'Back to chapters',
    locked: (required: number, current: number) =>
      `Unlocks after ${required} days of practice (${current}/${required})`,
  },
} as const;
