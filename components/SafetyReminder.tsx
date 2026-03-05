"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const SAFETY_POINTS = [
  "Sit or lie down in a safe place",
  "Never practice in or near water",
  "Never practice while driving",
  "Stop if you feel unwell",
];

interface SafetyReminderProps {
  onProceed: () => void;
}

export default function SafetyReminder({ onProceed }: SafetyReminderProps) {
  const [open, setOpen] = useState(true);

  function handleProceed() {
    setOpen(false);
    onProceed();
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Before You Begin">
      <ul className="mb-6 space-y-2">
        {SAFETY_POINTS.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-gray-300">
            <span className="shrink-0 text-yellow-500">&#x2022;</span>
            {point}
          </li>
        ))}
      </ul>
      <Button size="lg" className="w-full" onClick={handleProceed}>
        I Understand
      </Button>
    </Modal>
  );
}
