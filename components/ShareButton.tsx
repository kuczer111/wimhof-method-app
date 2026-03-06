"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";

type AspectRatio = "9:16" | "1:1";

interface ShareButtonProps {
  label?: string;
  render: (canvas: HTMLCanvasElement, ratio: AspectRatio) => void;
  share: (canvas: HTMLCanvasElement) => Promise<void>;
  className?: string;
}

export default function ShareButton({
  label = "Share",
  render,
  share,
  className,
}: ShareButtonProps) {
  const [ratio, setRatio] = useState<AspectRatio>("9:16");
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function openPreview() {
    setShowPreview(true);
    requestAnimationFrame(() => {
      if (canvasRef.current) render(canvasRef.current, ratio);
    });
  }

  function changeRatio(r: AspectRatio) {
    setRatio(r);
    requestAnimationFrame(() => {
      if (canvasRef.current) render(canvasRef.current, r);
    });
  }

  async function handleShare() {
    if (!canvasRef.current) return;
    try {
      await share(canvasRef.current);
    } catch {
      // User cancelled share dialog
    }
    setShowPreview(false);
  }

  if (!showPreview) {
    return (
      <Button variant="secondary" size="sm" onClick={openPreview} className={className}>
        {label}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-surface-raised p-5">
        {/* Ratio toggle */}
        <div className="flex gap-2">
          {(["9:16", "1:1"] as const).map((r) => (
            <button
              key={r}
              onClick={() => changeRatio(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                ratio === r
                  ? "bg-brand text-white"
                  : "bg-surface-overlay text-on-surface-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Preview */}
        <canvas
          ref={canvasRef}
          className="max-h-[60vh] w-full rounded-lg object-contain"
        />

        {/* Actions */}
        <div className="flex w-full gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => setShowPreview(false)}
          >
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={handleShare}>
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
