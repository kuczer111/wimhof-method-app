"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initStorage, getPreferences } from "@/lib/storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    initStorage().then(() => {
      const prefs = getPreferences();
      if (prefs.onboardingComplete) {
        router.replace("/breathe");
      } else {
        router.replace("/onboarding");
      }
    });
  }, [router]);

  return null;
}
