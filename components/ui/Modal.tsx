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
      className="m-auto max-w-sm w-full rounded-2xl border border-gray-800 bg-gray-900 p-6 text-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      )}
      {children}
    </dialog>
  );
}
