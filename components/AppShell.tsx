"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPreferences } from "@/lib/storage";
import { useReducedMotion } from "@/lib/useReducedMotion";
import BottomNav from "./BottomNav";
import SafetyOnboarding from "./SafetyOnboarding";
import StorageProvider from "./StorageProvider";
import MilestoneToast from "./MilestoneToast";
import WeeklySummary from "./WeeklySummary";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useReducedMotion(); // sync reduced-motion class on <html>

  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 animate-page-enter">{children}</main>
      <BottomNav />
      <SafetyOnboarding />
      <MilestoneToast />
      <WeeklySummary />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StorageProvider>
      <AppShellInner>{children}</AppShellInner>
    </StorageProvider>
  );
}
