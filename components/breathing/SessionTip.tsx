'use client';

import { useMemo } from 'react';
import { getBreathingSessions, getColdSessions } from '@/lib/storage';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getTip(): string {
  const timeOfDay = getTimeOfDay();
  const breathingSessions = getBreathingSessions();
  const coldSessions = getColdSessions();

  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;

  const recentCold = coldSessions.some(
    (s) => new Date(s.date).getTime() > twoHoursAgo,
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const sessionToday = breathingSessions.some(
    (s) => s.date.slice(0, 10) === todayStr,
  );

  const totalSessions = breathingSessions.length;

  // Post-cold tip takes priority
  if (recentCold) {
    return 'Great cold session! Breathing now can deepen recovery and calm your nervous system.';
  }

  // Already practiced today
  if (sessionToday) {
    return 'Second session of the day — focus on depth over intensity. Let your body guide the pace.';
  }

  // New user encouragement
  if (totalSessions === 0) {
    return "Welcome! Start with slow, relaxed breaths. There's no rush — just breathe and let go.";
  }

  // Time-of-day tips
  if (timeOfDay === 'morning') {
    return 'Morning sessions boost focus and energy. Breathe fully and set your intention for the day.';
  }
  if (timeOfDay === 'evening') {
    return "Evening practice helps release the day's tension. Use a slower pace for deeper relaxation.";
  }

  // Afternoon / default
  return 'Find a comfortable position, relax your shoulders, and let each breath be full and effortless.';
}

export default function SessionTip() {
  const tip = useMemo(() => getTip(), []);

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 dark:border-warning-dark/30 dark:bg-warning-dark/20">
      <p className="text-sm leading-relaxed text-warning-dark dark:text-warning-light">
        {tip}
      </p>
    </div>
  );
}
