"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import {
  getBreathingSessions,
  getColdSessions,
  BreathingSession,
  ColdSession,
} from "@/lib/storage";

type Tab = "breathing" | "cold";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function BreathingList({ sessions }: { sessions: BreathingSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="mt-8 text-center text-gray-500">
        No breathing sessions yet. Start one from the Breathe tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">{formatDate(s.date)}</p>
              <p className="mt-1 font-semibold">
                {s.rounds} round{s.rounds !== 1 ? "s" : ""}
              </p>
            </div>
            {s.feelingRating && (
              <span className="text-lg">
                {"*".repeat(s.feelingRating)}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {s.retentionTimes.map((t, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300"
              >
                R{i + 1}: {formatDuration(t)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Total: {formatDuration(s.totalDuration)}
          </p>
        </Card>
      ))}
    </div>
  );
}

function ColdList({ sessions }: { sessions: ColdSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="mt-8 text-center text-gray-500">
        No cold sessions yet. Start one from the Cold tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400">{formatDate(s.date)}</p>
              <p className="mt-1 font-semibold">{formatDuration(s.duration)}</p>
            </div>
            <span className="rounded-full bg-cyan-900/50 px-2 py-0.5 text-xs capitalize text-cyan-300">
              {s.type}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>Target: {formatDuration(s.targetDuration)}</span>
            {s.temperature != null && <span>{s.temperature}°C</span>}
            {s.rating && <span>Rating: {s.rating}/5</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>("breathing");
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
      <h1 className="text-2xl font-bold">Progress</h1>
      <p className="mt-1 text-sm text-gray-400">Your session history</p>

      {/* Tabs */}
      <div className="mt-6 flex rounded-xl bg-gray-900 p-1">
        {(["breathing", "cold"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {tab === "breathing" ? (
          <BreathingList sessions={breathingSessions} />
        ) : (
          <ColdList sessions={coldSessions} />
        )}
      </div>
    </div>
  );
}
