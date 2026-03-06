"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { strings } from "@/lib/i18n";

const SAFETY_POINTS = strings.safety.reminder.points;

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
    <Modal open={open} onClose={() => setOpen(false)} title={strings.safety.reminder.title}>
      <ul className="mb-6 space-y-2">
        {SAFETY_POINTS.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-on-surface-light-muted dark:text-on-surface-muted">
            <span className="shrink-0 text-warning">&#x2022;</span>
            {point}
          </li>
        ))}
      </ul>
      <Button size="lg" className="w-full" onClick={handleProceed}>
        {strings.safety.reminder.acknowledge}
      </Button>
    </Modal>
  );
}
