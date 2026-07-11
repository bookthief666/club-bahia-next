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
      className="space-y-4 rounded-3xl border border-white/10 bg-black/35 p-5"
    >
      <p className="text-xs uppercase tracking-[.28em] text-amber-200/70">
        Development-only fixture persistence
      </p>
      {error ? (
        <p role="alert" className="rounded-2xl bg-red-500/15 p-3 text-red-100">
          {error}
        </p>
      ) : null}
      <label className="block text-sm">
        Title
        <input
          required
          className="mt-1 w-full rounded-xl bg-white/10 p-3"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
      </label>
      <label className="block text-sm">
        Concept
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
              setForm({ ...form, date: event.target.value as typeof form.date })
            }
          />
        </label>
        <label className="block text-sm">
          Status
          <select
            className="mt-1 w-full rounded-xl bg-white/10 p-3"
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as EventStatus })
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
          Room
          <input
            className="mt-1 w-full rounded-xl bg-white/10 p-3"
            value={form.room}
            onChange={(event) => setForm({ ...form, room: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          Owner
          <input
            className="mt-1 w-full rounded-xl bg-white/10 p-3"
            value={form.owner}
            onChange={(event) =>
              setForm({ ...form, owner: event.target.value })
            }
          />
        </label>
      </div>
      <button
        disabled={pending}
        className="min-h-11 rounded-full bg-red-600 px-5 font-bold"
      >
        {pending ? "Saving…" : "Save event"}
      </button>
    </form>
  );
}
