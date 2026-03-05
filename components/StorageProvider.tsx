"use client";

import { useEffect, useState } from "react";
import { initStorage } from "@/lib/storage";

export default function StorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
