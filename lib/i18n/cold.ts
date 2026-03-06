export const coldStrings = {
  cold: {
    heading: 'Cold Shower',
    targetDuration: 'Target Duration',
    startTimer: 'Start Timer',
    stop: 'Stop',
    targetReached: 'Target reached!',
    targetLabel: (label: string) => `Target: ${label}`,
    sessionComplete: 'Session Complete',
    type: 'Type',
    waterTemperature: 'Water Temperature (optional)',
    temperaturePlaceholder: 'e.g. 10',
    temperatureUnit: '°C',
    howDidItFeel: 'How did it feel?',
  },
} as const;
