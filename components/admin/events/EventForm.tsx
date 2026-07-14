"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventStatus, OperationsEvent } from "@/lib/admin/domain";
import { eventLocalDate } from "@/lib/admin/date";
import {
  eventRepository,
  newEventDefaults,
} from "@/lib/admin/event-repository";
import { getValidNextStatuses, STATUS_TONES } from "@/lib/admin/event-status";

export function EventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const defaults = newEventDefaults();
  const [event, setEvent] = useState<OperationsEvent | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: defaults.title,
    concept: defaults.concept,
    date: defaults.date,
    room: defaults.room,
    owner: defaults.owner,
    status: defaults.status as EventStatus,
    cancellationReason: "",
  });

  useEffect(() => {
    if (!eventId) return;
    eventRepository.getEvent(eventId).then((loadedEvent) => {
      setEvent(loadedEvent);
      if (!loadedEvent) return;
      setForm({
        title: loadedEvent.title,
        concept: loadedEvent.concept,
        date: eventLocalDate(loadedEvent.startsAt),
        room: loadedEvent.room,
        owner: loadedEvent.owner,
        status: loadedEvent.status,
        cancellationReason: loadedEvent.cancellationReason ?? "",
      });
    });
  }, [eventId]);

  const statuses = event
    ? getValidNextStatuses(event.status)
    : (["idea", "evaluating", "approved"] as EventStatus[]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const saved = eventId
        ? await eventRepository.updateEvent(eventId, { ...form })
        : await eventRepository.createEvent(form);
      router.push(`/admin/events/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-white/10 bg-[#141210]/80 p-4 pb-24 md:pb-4"
    >
      <div className="rounded-2xl border border-emerald-200/12 bg-emerald-200/[.045] p-3">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-100/70">
          Shared event details
        </p>
        <p className="mt-1 text-sm leading-6 text-white/55">
          Save the verified event facts first. The promotion tools will use these details without changing them.
        </p>
      </div>
      {error ? (
        <p role="alert" className="rounded-2xl bg-red-500/15 p-3 text-red-100">
          {error}
        </p>
      ) : null}
      <details open className="rounded-2xl border border-white/10 p-3">
        <summary className="cursor-pointer font-serif text-xl">Basics</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            Event name
            <input
              required
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            What is happening?
            <textarea
              required
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.concept}
              onChange={(event) =>
                setForm({ ...form, concept: event.target.value })
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Date
              <input
                required
                type="date"
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    date: event.target.value as typeof form.date,
                  })
                }
              />
            </label>
            <label className="block text-sm">
              Planning stage
              <select
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as EventStatus,
                  })
                }
              >
                {statuses.map((status) => (
                  <option className="bg-black" key={status} value={status}>
                    {STATUS_TONES[status].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </details>
      <details open className="rounded-2xl border border-white/10 p-3">
        <summary className="cursor-pointer font-serif text-xl">
          Venue setup
        </summary>
        <div className="mt-3 space-y-3">
          {form.status === "cancelled" ? (
            <label className="block text-sm">
              Cancellation reason
              <input
                required
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.cancellationReason}
                onChange={(event) =>
                  setForm({ ...form, cancellationReason: event.target.value })
                }
              />
            </label>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Room or area
              <input
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.room}
                onChange={(event) =>
                  setForm({ ...form, room: event.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Person responsible
              <input
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.owner}
                onChange={(event) =>
                  setForm({ ...form, owner: event.target.value })
                }
              />
            </label>
          </div>
        </div>
      </details>
      <details className="rounded-2xl border border-white/10 p-3">
        <summary className="cursor-pointer font-serif text-xl">
          More actions
        </summary>
        <p className="mt-3 text-sm text-white/55">
          Duplicate, archive, restore, and cancellation actions remain available from the event overview.
        </p>
      </details>
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 rounded-2xl border border-white/10 bg-[#0d0b0a]/95 p-2 md:bottom-4 md:inline-block">
        <button
          disabled={pending}
          className="min-h-11 w-full rounded-xl bg-amber-300 px-5 font-bold text-black disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save event"}
        </button>
      </div>
    </form>
  );
}
