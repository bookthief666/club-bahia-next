"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventStatus, OperationsEvent } from "@/lib/admin/domain";
import { eventLocalDate, eventLocalTime, getVenueToday } from "@/lib/admin/date";
import { buildInitialCampaignBrief } from "@/lib/admin/event-templates/campaign";
import {
  RECURRING_EVENT_TEMPLATES,
  getRecurringEventTemplate,
  nextTemplateDate,
  templateEventTitle,
  type EventPromotionTemplateSnapshot,
  type RecurringEventTemplateId,
} from "@/lib/admin/event-templates/domain";
import {
  eventRepository,
  newEventDefaults,
} from "@/lib/admin/event-repository";
import { getValidNextStatuses, STATUS_TONES } from "@/lib/admin/event-status";
import { growthWorkspaceRepository } from "@/lib/admin/growth/repository";

export function EventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const defaults = newEventDefaults();
  const [event, setEvent] = useState<OperationsEvent | null>(null);
  const [promotionTemplate, setPromotionTemplate] =
    useState<EventPromotionTemplateSnapshot>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: defaults.title,
    concept: defaults.concept,
    date: defaults.date,
    startTime: defaults.startTime ?? "21:00",
    performers: defaults.performers ?? "",
    genres: defaults.genres ?? "",
    admission: defaults.admission ?? "",
    ageRestriction: defaults.ageRestriction ?? "",
    reservationUrl: defaults.reservationUrl ?? "",
    flyerUrl: defaults.flyerUrl ?? "",
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
      setPromotionTemplate(loadedEvent.promotionTemplate);
      setForm({
        title: loadedEvent.title,
        concept: loadedEvent.concept,
        date: eventLocalDate(loadedEvent.startsAt),
        startTime: eventLocalTime(loadedEvent.startsAt),
        performers: loadedEvent.performers ?? "",
        genres: loadedEvent.genres ?? "",
        admission: loadedEvent.admission ?? "",
        ageRestriction: loadedEvent.ageRestriction ?? "",
        reservationUrl: loadedEvent.reservationUrl ?? "",
        flyerUrl: loadedEvent.flyerUrl ?? "",
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

  function applyTemplate(id: RecurringEventTemplateId) {
    const template = getRecurringEventTemplate(id);
    const date = nextTemplateDate(getVenueToday(), template);
    setPromotionTemplate(template);
    setForm((current) => ({
      ...current,
      title: templateEventTitle(template, date),
      concept: template.concept,
      date,
      startTime: template.startTime,
      performers: template.performers,
      genres: template.genres,
      admission: template.admission,
      ageRestriction: template.ageRestriction,
      room: template.room,
    }));
  }

  function clearTemplate() {
    setPromotionTemplate(undefined);
    setForm((current) => ({
      ...current,
      title: "",
      concept: "",
      performers: "",
      genres: "",
      admission: "",
      ageRestriction: "",
      startTime: "21:00",
      room: "Main room",
    }));
  }

  function updateDate(date: typeof form.date) {
    setForm((current) => ({
      ...current,
      date,
      title:
        promotionTemplate &&
        current.title.startsWith(`${promotionTemplate.eventTitleBase} —`)
          ? templateEventTitle(promotionTemplate, date)
          : current.title,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const input = { ...form, promotionTemplate };
      let saved: OperationsEvent;
      if (eventId) {
        saved = await eventRepository.updateEvent(eventId, input);
      } else {
        saved = await eventRepository.createEvent(input);
        const workspace = await growthWorkspaceRepository.getWorkspace(saved);
        await growthWorkspaceRepository.updateBrief(
          saved,
          buildInitialCampaignBrief(saved, workspace.brief),
        );
      }
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
      {!eventId ? (
        <section className="rounded-2xl border border-amber-200/16 bg-amber-200/[.045] p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-100/70">
                Recurring-night templates
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white">
                Start with the night Club Bahia already runs.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/52">
                A template fills the normal facts and saves its promotion defaults with this event. Confirm admission, age policy, performers, and links before publishing.
              </p>
            </div>
            {promotionTemplate ? (
              <button
                type="button"
                onClick={clearTemplate}
                className="min-h-11 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/55"
              >
                Start blank instead
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {RECURRING_EVENT_TEMPLATES.map((template) => {
              const selected = promotionTemplate?.id === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`min-h-32 rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-amber-200/45 bg-amber-200/[.12]"
                      : "border-white/10 bg-black/18 hover:border-white/20"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">
                    {template.cadence === "resident-weekend"
                      ? "Recurring resident night"
                      : "Experimental monthly night"}
                  </span>
                  <span className="mt-2 block font-serif text-xl text-white">
                    {template.name}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-white/48">
                    {template.summary}
                  </span>
                  <span className="mt-3 block text-xs font-semibold text-amber-100/70">
                    {selected ? "Selected" : "Use this template →"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : promotionTemplate ? (
        <section className="rounded-2xl border border-amber-200/16 bg-amber-200/[.045] p-3">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-100/65">
            Recurring template · {promotionTemplate.name}
          </p>
          <p className="mt-1 text-sm text-white/52">
            This event keeps its own version of the template, so later template changes will not rewrite an approved campaign.
          </p>
        </section>
      ) : null}

      <div className="rounded-2xl border border-emerald-200/12 bg-emerald-200/[.045] p-3">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-100/70">
          Event facts
        </p>
        <p className="mt-1 text-sm leading-6 text-white/55">
          Enter only confirmed details. The Promotion Autopilot will use them to generate captions, tracked links, media instructions, and a publishing schedule.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-red-500/15 p-3 text-red-100">
          {error}
        </p>
      ) : null}

      <details open className="rounded-2xl border border-white/10 p-3">
        <summary className="cursor-pointer font-serif text-xl">Essential details</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            Event name
            <input
              required
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
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
                  updateDate(event.target.value as typeof form.date)
                }
              />
            </label>
            <label className="block text-sm">
              Start time
              <input
                required
                type="time"
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.startTime}
                onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm">
            Public event description and special details
            <textarea
              required
              rows={4}
              placeholder="What is happening, why guests should care, and any confirmed special details."
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.concept}
              onChange={(event) => setForm({ ...form, concept: event.target.value })}
            />
          </label>

          <label className="block text-sm">
            Planning stage
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
      </details>

      <details open className="rounded-2xl border border-white/10 p-3">
        <summary className="cursor-pointer font-serif text-xl">Promotion facts</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            Performers, DJs, bands, or hosts
            <input
              placeholder="Use confirmed public names and handles only"
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.performers}
              onChange={(event) => setForm({ ...form, performers: event.target.value })}
            />
          </label>

          <label className="block text-sm">
            Music, genres, or event style
            <input
              placeholder="Example: cumbia, salsa, bachata, darkwave, post-punk"
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.genres}
              onChange={(event) => setForm({ ...form, genres: event.target.value })}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Admission or cover
              <input
                placeholder="Example: $15 before 10 PM"
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.admission}
                onChange={(event) => setForm({ ...form, admission: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              Age policy
              <input
                placeholder="Confirm for this event"
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.ageRestriction}
                onChange={(event) =>
                  setForm({ ...form, ageRestriction: event.target.value })
                }
              />
            </label>
          </div>

          <label className="block text-sm">
            Reservation or ticket link
            <input
              type="url"
              inputMode="url"
              placeholder="https://"
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.reservationUrl}
              onChange={(event) =>
                setForm({ ...form, reservationUrl: event.target.value })
              }
            />
          </label>

          <label className="block text-sm">
            Existing flyer or primary media URL
            <input
              type="url"
              inputMode="url"
              placeholder="Optional — media can also be uploaded in the next step"
              className="mt-1 w-full rounded-xl bg-white/10 p-3"
              value={form.flyerUrl}
              onChange={(event) => setForm({ ...form, flyerUrl: event.target.value })}
            />
          </label>
        </div>
      </details>

      <details open className="rounded-2xl border border-white/10 p-3">
        <summary className="cursor-pointer font-serif text-xl">Venue setup</summary>
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
                onChange={(event) => setForm({ ...form, room: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              Person responsible
              <input
                className="mt-1 w-full rounded-xl bg-white/10 p-3"
                value={form.owner}
                onChange={(event) => setForm({ ...form, owner: event.target.value })}
              />
            </label>
          </div>
        </div>
      </details>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 rounded-2xl border border-white/10 bg-[#0d0b0a]/95 p-2 md:bottom-4 md:inline-block">
        <button
          disabled={pending}
          className="min-h-11 w-full rounded-xl bg-amber-300 px-5 font-bold text-black disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save event and prepare promotion"}
        </button>
      </div>
    </form>
  );
}
