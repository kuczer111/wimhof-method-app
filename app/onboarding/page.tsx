"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPreferences, savePreferences, profileToDefaults } from "@/lib/storage";
import StorageProvider from "@/components/StorageProvider";
import ProfileSetup from "@/components/ProfileSetup";
import Button from "@/components/ui/Button";
import { strings } from "@/lib/i18n";

const t = strings.onboarding;
const safetyRules = strings.safety.onboarding.rules;

function OnboardingFlow() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [safetyAcked, setSafetyAcked] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [experience, setExperience] = useState<"new" | "experienced">("new");
  const totalScreens = 6;
  const safetyScreenIndex = 3;

  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.onboardingComplete) {
      router.replace("/breathe");
    }
  }, [router]);

  const canSkip = current >= 2 && current !== safetyScreenIndex;

  const goNext = useCallback(() => {
    if (current === safetyScreenIndex && !safetyAcked) return;
    if (current < totalScreens - 1) {
      setCurrent((c) => c + 1);
    }
  }, [current, safetyAcked]);

  const goPrev = useCallback(() => {
    if (current > 0) setCurrent((c) => c - 1);
  }, [current]);

  function handleStartingPointSelect(exp: "new" | "experienced") {
    setExperience(exp);
    setCurrent(5);
  }

  function handleProfileSave(profile: Parameters<typeof profileToDefaults>[0]) {
    const defaults = profileToDefaults(profile);
    savePreferences({
      onboardingComplete: true,
      safetyAcknowledged: true,
      ...(experience === "new"
        ? { defaultPace: "slow" as const }
        : {}),
      ...defaults,
    });
    router.replace("/breathe");
  }

  function handleProfileSkip() {
    savePreferences({
      onboardingComplete: true,
      safetyAcknowledged: true,
      ...(experience === "new"
        ? { defaultRounds: 3, defaultBreathCount: 30, defaultPace: "slow" as const }
        : {}),
    });
    router.replace("/breathe");
  }

  function handleSkip() {
    if (current < safetyScreenIndex) {
      setCurrent(safetyScreenIndex);
    } else {
      setCurrent(totalScreens - 1);
    }
  }

  function handleSafetyAcknowledge() {
    setSafetyAcked(true);
    setTimeout(() => setCurrent((c) => c + 1), 300);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      if (current !== safetyScreenIndex || safetyAcked) goNext();
    } else if (diff < -threshold) {
      goPrev();
    }
  }

  const screens = [
    <HeroScreen key="hero" />,
    <PillarsScreen key="pillars" />,
    <ExpectationsScreen key="expectations" />,
    <SafetyScreen key="safety" acknowledged={safetyAcked} onAcknowledge={handleSafetyAcknowledge} />,
    <StartingPointScreen key="starting" onSelect={handleStartingPointSelect} />,
    <ProfileSetup key="profile" onSave={handleProfileSave} onSkip={handleProfileSkip} />,
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col bg-white dark:bg-gray-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-2 px-4 pt-[max(3rem,env(safe-area-inset-top))]">
        {Array.from({ length: totalScreens }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === current ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {screens.map((screen, i) => (
            <div key={i} className="flex h-full w-full shrink-0 flex-col items-center justify-center px-6">
              {screen}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {canSkip ? (
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 dark:text-gray-500"
          >
            {t.skip}
          </button>
        ) : (
          <div />
        )}

        {current < safetyScreenIndex && (
          <Button onClick={goNext}>{t.next}</Button>
        )}
        {current === safetyScreenIndex && !safetyAcked && <div />}
        {current === safetyScreenIndex && safetyAcked && (
          <Button onClick={goNext}>{t.next}</Button>
        )}
      </div>
    </div>
  );
}

function HeroScreen() {
  return (
    <div className="text-center">
      <div className="mb-6 text-6xl">&#10052;&#65039;</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {t.hero.title}
      </h1>
      <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
        {t.hero.subtitle}
      </p>
    </div>
  );
}

function PillarsScreen() {
  const pillars = [
    { icon: "\uD83C\uDF2C\uFE0F", title: t.pillars.breathing, desc: t.pillars.breathingDesc },
    { icon: "\u2744\uFE0F", title: t.pillars.cold, desc: t.pillars.coldDesc },
    { icon: "\uD83E\uDDD8", title: t.pillars.mindset, desc: t.pillars.mindsetDesc },
  ];

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {t.pillars.title}
      </h2>
      <div className="space-y-4">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="flex gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <span className="text-2xl">{p.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{p.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpectationsScreen() {
  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {t.expectations.title}
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t.expectations.subtitle}
      </p>
      <ul className="space-y-3">
        {t.expectations.items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <span className="text-sky-500">&#10003;</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
        {t.expectations.reassurance}
      </p>
    </div>
  );
}

function SafetyScreen({
  acknowledged,
  onAcknowledge,
}: {
  acknowledged: boolean;
  onAcknowledge: () => void;
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-4 text-center">
        <span className="text-4xl">&#9888;&#65039;</span>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {t.safety.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.safety.subtitle}
        </p>
      </div>
      <ul className="mb-6 space-y-3">
        {safetyRules.map((rule) => (
          <li key={rule} className="flex gap-3 text-sm text-gray-700 dark:text-gray-200">
            <span className="mt-0.5 shrink-0 text-yellow-500">&#x2022;</span>
            {rule}
          </li>
        ))}
      </ul>
      {!acknowledged && (
        <Button size="lg" className="w-full" onClick={onAcknowledge}>
          {t.safety.acknowledge}
        </Button>
      )}
      {acknowledged && (
        <div className="flex items-center justify-center gap-2 text-green-500">
          <span>&#10003;</span>
          <span className="text-sm font-medium">Acknowledged</span>
        </div>
      )}
    </div>
  );
}

function StartingPointScreen({ onSelect }: { onSelect: (exp: "new" | "experienced") => void }) {
  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {t.startingPoint.title}
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t.startingPoint.subtitle}
      </p>
      <div className="space-y-3">
        <button
          onClick={() => onSelect("new")}
          className="w-full rounded-xl border-2 border-sky-500 bg-sky-50 p-4 text-left transition-colors active:bg-sky-100 dark:bg-sky-950 dark:active:bg-sky-900"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">{t.startingPoint.newbie}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.startingPoint.newbieDesc}</p>
        </button>
        <button
          onClick={() => onSelect("experienced")}
          className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-left transition-colors active:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:active:bg-gray-800"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">{t.startingPoint.experienced}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.startingPoint.experiencedDesc}</p>
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <StorageProvider>
      <OnboardingFlow />
    </StorageProvider>
  );
}
