"use client";

import { useEffect, useState } from "react";
import { initStorage } from "@/lib/storage";
import { initReminders } from "@/lib/notifications";
import LoadingScreen from "@/components/LoadingScreen";

export default function StorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => {
      initReminders();
      setReady(true);
    });
  }, []);

  if (!ready) return <LoadingScreen />;

  return <>{children}</>;
}
