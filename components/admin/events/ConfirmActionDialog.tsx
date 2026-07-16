"use client";
import { useEffect, useRef } from "react";
export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const prior = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    prior.current = document.activeElement as HTMLElement;
    setTimeout(() => ref.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prior.current?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    >
      <div className="max-w-md rounded-3xl border border-white/15 bg-[#12080b] p-5 shadow-2xl">
        <h2 id="confirm-title" className="font-serif text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-white/70">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            ref={ref}
            disabled={pending}
            onClick={onConfirm}
            className={`min-h-11 rounded-full px-4 text-sm font-bold ${destructive ? "bg-red-600 text-white" : "bg-amber-300 text-black"} disabled:opacity-60`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
          <button
            disabled={pending}
            onClick={onClose}
            className="min-h-11 rounded-full border border-white/15 px-4 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
