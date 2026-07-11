"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OperationsEvent } from "@/lib/admin/domain";
import { addDays, eventLocalDate } from "@/lib/admin/date";
import { eventRepository } from "@/lib/admin/event-repository";

export function DuplicateEventDialog({
  event,
  open,
  onClose,
}: {
  event: OperationsEvent;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(`${event.title} copy`);
  const [date, setDate] = useState(addDays(eventLocalDate(event.startsAt), 7));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!open) return null;

  async function duplicate() {
    setPending(true);
    setError("");
    try {
      const duplicated = await eventRepository.duplicateEvent(event.id, {
        title,
        date,
      });
      router.push(`/admin/events/${duplicated.id}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not duplicate.");
      setPending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#12080b] p-5">
        <h2 className="font-serif text-2xl">Duplicate event</h2>
        <p className="mt-2 text-sm text-white/65">
          Choose a new date. The duplicate starts as Idea and clears cancelled,
          archived, live, and completed metadata.
        </p>
        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-red-500/15 p-3">
            {error}
          </p>
        ) : null}
        <label className="mt-4 block text-sm">
          Title
          <input
            className="mt-1 w-full rounded-xl bg-white/10 p-3"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
          New date
          <input
            required
            type="date"
            className="mt-1 w-full rounded-xl bg-white/10 p-3"
            value={date}
            onChange={(event) => setDate(event.target.value as typeof date)}
          />
        </label>
        <div className="mt-5 flex gap-3">
          <button
            onClick={duplicate}
            disabled={pending}
            className="min-h-11 rounded-full bg-amber-300 px-4 font-bold text-black"
          >
            {pending ? "Duplicating…" : "Create duplicate"}
          </button>
          <button
            disabled={pending}
            onClick={onClose}
            className="min-h-11 rounded-full border border-white/15 px-4"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
