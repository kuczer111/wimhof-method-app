"use client";

import { useState, useEffect } from "react";
import {
  getBreathingSessions,
  getColdSessions,
  BreathingSession,
  ColdSession,
} from "@/lib/storage";
import BreathingHistory from "@/components/progress/BreathingHistory";
import ColdHistory from "@/components/progress/ColdHistory";
import Overview from "@/components/progress/Overview";
import ShareButton from "@/components/ShareButton";
import { strings } from "@/lib/i18n";
import { renderProgressCard, getProgressCardData, shareOrDownload } from "@/lib/shareCard";

type Tab = "overview" | "breathing" | "cold";

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [breathingSessions, setBreathingSessions] = useState<BreathingSession[]>([]);
  const [coldSessions, setColdSessions] = useState<ColdSession[]>([]);

  useEffect(() => {
    setBreathingSessions(
      getBreathingSessions().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
    setColdSessions(
      getColdSessions().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  }, []);

  return (
    <div className="flex flex-col px-4 pb-24 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{strings.progress.heading}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{strings.progress.subtitle}</p>
        </div>
        <ShareButton
          label="Export"
          render={(canvas, ratio) => {
            const data = getProgressCardData();
            renderProgressCard(canvas, data, ratio);
          }}
          share={shareOrDownload}
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
        {(["overview", "breathing", "cold"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {strings.progress.tabs[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {tab === "overview" ? (
          <Overview breathingSessions={breathingSessions} coldSessions={coldSessions} />
        ) : tab === "breathing" ? (
          <BreathingHistory sessions={breathingSessions} />
        ) : (
          <ColdHistory sessions={coldSessions} />
        )}
      </div>
    </div>
  );
}
