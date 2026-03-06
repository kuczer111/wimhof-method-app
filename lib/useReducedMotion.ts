'use client';

import { useEffect, useState } from 'react';
import { getPreferences } from './storage';

/** Returns true when the user prefers reduced motion (OS setting OR app toggle). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      getPreferences().reducedMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => {
      setReduced(getPreferences().reducedMotion || mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync reduced-motion class on <html> and localStorage for the inline script
  useEffect(() => {
    const appPref = getPreferences().reducedMotion;
    document.documentElement.classList.toggle('reduced-motion', appPref);
    try {
      if (appPref) {
        localStorage.setItem('whm_reduced_motion', 'true');
      } else {
        localStorage.removeItem('whm_reduced_motion');
      }
    } catch {
      // ignore storage errors
    }
  });

  return reduced;
}
