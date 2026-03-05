"use client";

import { useEffect, useState } from "react";
import { initStorage } from "@/lib/storage";
import { initReminders } from "@/lib/notifications";

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

  if (!ready) return null;

  return <>{children}</>;
}
