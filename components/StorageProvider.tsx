'use client';

import { useEffect, useState } from 'react';
import { initStorage, getPreferences, applyTheme } from '@/lib/storage';
import { initReminders } from '@/lib/notifications';
import LoadingScreen from '@/components/LoadingScreen';

export default function StorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => {
      const theme = getPreferences().themeMode;
      applyTheme(theme);
      initReminders();
      setReady(true);
    });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      const mode = getPreferences().themeMode;
      if (mode === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  if (!ready) return <LoadingScreen />;

  return <>{children}</>;
}
