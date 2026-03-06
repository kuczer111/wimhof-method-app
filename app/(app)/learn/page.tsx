"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { strings } from "@/lib/i18n";
import { CHAPTERS, GATE_DAYS_REQUIRED, type Chapter } from "@/lib/content";
import { getBreathingSessions, getColdSessions } from "@/lib/storage";

export default function LearnPage() {
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [practiceDays, setPracticeDays] = useState(0);

  useEffect(() => {
    // Count unique practice days from breathing + cold sessions
    const days = new Set<string>();
    for (const s of getBreathingSessions()) {
      days.add(s.date.slice(0, 10));
    }
    for (const s of getColdSessions()) {
      days.add(s.date.slice(0, 10));
    }
    setPracticeDays(days.size);
  }, []);

  const unlockedAll = practiceDays >= GATE_DAYS_REQUIRED;

  // Render chapter content with basic markdown-like formatting
  const renderedContent = useMemo(() => {
    if (!activeChapter) return null;
    return activeChapter.content.split("\n\n").map((block, i) => {
      // Bold headings
      if (block.startsWith("**") && block.endsWith("**")) {
        return (
          <h3 key={i} className="mt-6 mb-3 text-lg font-semibold text-on-surface-light dark:text-on-surface">
            {block.slice(2, -2)}
          </h3>
        );
      }
      // Paragraphs that may contain inline bold
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="mb-4 leading-relaxed text-on-surface-light-muted dark:text-on-surface-muted">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold text-on-surface-light dark:text-on-surface">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      );
    });
  }, [activeChapter]);

  // Reader view
  if (activeChapter) {
    return (
      <div className="min-h-screen bg-white pb-28 dark:bg-surface-base">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-on-surface-light/[0.12] bg-white/80 px-4 py-3 backdrop-blur-lg dark:border-surface-overlay dark:bg-surface-base/80">
          <button
            onClick={() => setActiveChapter(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-light-muted transition-colors hover:bg-on-surface-light/[0.06] dark:text-on-surface-muted dark:hover:bg-surface-overlay"
            aria-label={strings.learn.back}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-medium text-on-surface-light-muted dark:text-on-surface-muted">
            {strings.learn.chapterLabel} {activeChapter.id}
          </span>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-2xl px-5 py-6">
          <h1 className="mb-6 text-2xl font-bold text-on-surface-light dark:text-on-surface">
            {activeChapter.title}
          </h1>
          {renderedContent}
        </div>
      </div>
    );
  }

  // Chapter list view
  return (
    <div className="min-h-screen bg-white pb-28 dark:bg-surface-base">
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-on-surface-light dark:text-on-surface">
          {strings.learn.heading}
        </h1>
        <p className="mb-6 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
          {strings.learn.subtitle}
        </p>

        <div className="space-y-3">
          {CHAPTERS.map((chapter) => {
            const locked = chapter.gated && !unlockedAll;
            return (
              <Card
                key={chapter.id}
                className={`transition-colors ${locked ? "opacity-60" : "cursor-pointer hover:border-brand-light dark:hover:border-brand-dark"}`}
                onClick={locked ? undefined : () => setActiveChapter(chapter)}
                role={locked ? undefined : "button"}
                tabIndex={locked ? undefined : 0}
                onKeyDown={locked ? undefined : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveChapter(chapter);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand dark:bg-brand-dark/30 dark:text-brand-light">
                    {chapter.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-on-surface-light dark:text-on-surface">
                      {chapter.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
                      {chapter.summary}
                    </p>
                    {locked && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-warning-dark dark:text-warning-light">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {strings.learn.locked(GATE_DAYS_REQUIRED, practiceDays)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
