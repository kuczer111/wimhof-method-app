"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({ open, onClose, children, title }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] max-w-sm w-full overflow-y-auto rounded-2xl border border-on-surface-light/[0.12] bg-white p-6 text-on-surface-light backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:border-surface-overlay dark:bg-surface-raised dark:text-on-surface"
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      )}
      {children}
    </dialog>
  );
}
