"use client";

import Button from "@/components/ui/Button";
import { strings } from "@/lib/i18n";

interface GuidedOverlayProps {
  type: "preBreathing" | "midSessionPause";
  onContinue: () => void;
}

export default function GuidedOverlay({ type, onContinue }: GuidedOverlayProps) {
  const content = strings.guidedMode[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 px-6">
      <div className="w-full max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto rounded-2xl bg-white p-6 text-center dark:bg-surface-raised">
        <h2 className="mb-3 text-xl font-bold text-on-surface-light dark:text-on-surface">
          {content.title}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-on-surface-light-muted dark:text-on-surface-muted">
          {content.body}
        </p>
        <Button size="lg" className="w-full" onClick={onContinue}>
          {type === "preBreathing"
            ? strings.guidedMode.preBreathing.start
            : strings.guidedMode.midSessionPause.continue}
        </Button>
      </div>
    </div>
  );
}
