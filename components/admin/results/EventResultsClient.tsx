'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type {
  EventPromotionResults,
  EventPublishingResult,
} from '@/lib/admin/results/domain';

interface ResultsResponse {
  configured?: boolean;
  results?: EventPromotionResults;
  error?: string;
}

function statusTone(status: EventPublishingResult['status']): string {
  if (status === 'published') {
    return 'border-emerald-200/20 bg-emerald-200/[.08] text-emerald-100';
  }
  if (
    status === 'approved' ||
    status === 'scheduled' ||
    status === 'publishing' ||
    status === 'retrying'
  ) {
    return 'border-sky-200/20 bg-sky-200/[.08] text-sky-100';
  }
  if (status === 'failed' || status === 'paused') {
    return 'border-red-200/20 bg-red-200/[.08] text-red-100';
  }
  if (status === 'cancelled') {
    return 'border-white/10 bg-white/[.04] text-white/40';
  }
  return 'border-amber-200/20 bg-amber-200/[.08] text-amber-100';
}

function formatDateTime(value?: string): string {
  if (!value) return 'No publishing time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid publishing time';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function outcomeMessage(results: EventPromotionResults): {
  title: string;
  detail: string;
} {
  if (!results.publishing.total) {
    return {
      title: 'Promotion has not entered the publishing queue yet.',
      detail: 'Finish reviewing the campaign and prepare the schedule before evaluating results.',
    };
  }
  if (!results.publishing.published) {
    return {
      title: 'The campaign is prepared, but no post is recorded as published yet.',
      detail: 'Resolve approvals, provider connections, or paused proof requirements in the Publish step.',
    };
  }
  if (!results.reservations.totalRequests) {
    return {
      title: 'Promotion is live; tracked reservations have not arrived yet.',
      detail: 'Keep using the generated Club Bahia RSVP links so each request retains its campaign source.',
    };
  }
  return {
    title: `${results.reservations.totalRequests} tracked reservation request${
      results.reservations.totalRequests === 1 ? '' : 's'
    } came from this event campaign.`,
    detail: `${results.reservations.confirmedGuests} guest${
      results.reservations.confirmedGuests === 1 ? '' : 's'
    } confirmed so far from ${results.reservations.requestedGuests} requested guest places.`,
  };
}

export function EventResultsClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [results, setResults] = useState<EventPromotionResults>();
  const [configured, setConfigured] = useState(true);
  const [pending, setPending] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setPending(true);
    setMessage('');
    try {
      const nextEvent = await eventRepository.getEvent(eventId);
      setEvent(nextEvent);
      if (!nextEvent) return;

      const params = new URLSearchParams({
        eventId: nextEvent.id,
        eventTitle: nextEvent.title,
      });
      const response = await fetch(`/api/admin/events/results?${params.toString()}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as ResultsResponse;
      if (!response.ok || !body.results) {
        throw new Error(body.error || 'Could not load promotion results.');
      }
      setResults(body.results);
      setConfigured(body.configured !== false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not load promotion results.',
      );
    } finally {
      setPending(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const outcome = useMemo(
    () => (results ? outcomeMessage(results) : undefined),
    [results],
  );
  const maxSourceRequests = Math.max(
    1,
    ...(results?.sources.map((source) => source.requests) ?? []),
  );

  if (pending && !event) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white/55">
        Loading campaign results…
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="rounded-2xl border border-red-200/18 bg-red-200/[.06] p-6">
        <h1 className="font-serif text-3xl text-white">Event not found</h1>
        <Link
          href="/admin/events"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
        >
          Return to events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.6rem] border border-emerald-200/14 bg-[radial-gradient(circle_at_85%_0%,rgba(16,185,129,.18),transparent_24rem),linear-gradient(145deg,rgba(12,25,21,.95),rgba(19,13,11,.96))] p-5 shadow-[0_24px_75px_rgba(0,0,0,.32)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-200/68">
              Campaign outcome
            </p>
            <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              {event?.title}
            </h1>
            <p className="mt-3 text-lg font-semibold text-white/82">
              {outcome?.title ?? 'Results are not available yet.'}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              {outcome?.detail}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => void load()}
            className="min-h-11 rounded-full border border-white/12 bg-black/18 px-5 text-xs font-bold text-white/65 disabled:opacity-40"
          >
            {pending ? 'Refreshing…' : 'Refresh results'}
          </button>
        </div>
      </section>

      {message ? (
        <p role="alert" className="rounded-2xl border border-red-200/18 bg-red-200/[.06] p-4 text-sm text-red-50/78">
          {message}
        </p>
      ) : null}

      {!configured ? (
        <section className="rounded-2xl border border-amber-200/20 bg-amber-200/[.06] p-4 text-sm leading-6 text-amber-50/75">
          Encrypted reservation storage is not configured in this environment. Publishing status remains visible, but reservation outcomes will populate only after RSVP intake is enabled.
        </section>
      ) : null}

      {results ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['Requests', results.reservations.totalRequests],
              ['Guest places', results.reservations.requestedGuests],
              ['Confirmed guests', results.reservations.confirmedGuests],
              ['Confirmation rate', `${results.reservations.confirmationRate}%`],
              ['Posts published', results.publishing.published],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/9 bg-black/22 p-4"
              >
                <p className="text-[10px] uppercase tracking-[.15em] text-white/36">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[1.45rem] border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/58">
                    Reservation attribution
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-white">
                    Which links produced guests
                  </h2>
                </div>
                <Link
                  href="/admin/reservations"
                  className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/55"
                >
                  Open guest inbox
                </Link>
              </div>

              {results.sources.length ? (
                <div className="mt-5 space-y-4">
                  {results.sources.map((source) => (
                    <div key={source.label}>
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="min-w-0 break-words font-semibold text-white/72">
                          {source.label}
                        </span>
                        <span className="shrink-0 text-white/42">
                          {source.requests} · {source.requestedGuests} guests
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/7">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#f6b73c)]"
                          style={{
                            width: `${Math.max(
                              8,
                              (source.requests / maxSourceRequests) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-white/35">
                        {source.confirmedRequests} confirmed request
                        {source.confirmedRequests === 1 ? '' : 's'} ·{' '}
                        {source.confirmedGuests} confirmed guests
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-6 text-white/42">
                  No tracked RSVP requests are attached to this event yet.
                </p>
              )}
            </article>

            <article className="rounded-[1.45rem] border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-sky-100/58">
                    Publishing record
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-white">
                    What entered the campaign queue
                  </h2>
                </div>
                <Link
                  href={`/admin/events/${eventId}/publishing/execute`}
                  className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/55"
                >
                  Open Publish step
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Active', results.publishing.scheduledOrActive],
                  ['Needs review', results.publishing.needsApproval],
                  ['Problems', results.publishing.problems],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-white/8 bg-black/18 p-3"
                  >
                    <p className="text-[9px] uppercase tracking-[.12em] text-white/34">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {results.publishing.posts.length ? (
                <div className="mt-4 space-y-2">
                  {results.publishing.posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-xl border border-white/8 bg-black/18 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white/72">
                            {post.label}
                          </p>
                          <p className="mt-1 text-[11px] text-white/36">
                            {post.provider} · {post.channel} ·{' '}
                            {formatDateTime(post.scheduledFor)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.11em] ${statusTone(
                            post.status,
                          )}`}
                        >
                          {post.status.replace('-', ' ')}
                        </span>
                      </div>
                      {post.lastError ? (
                        <p className="mt-2 text-xs leading-5 text-red-100/65">
                          {post.lastError}
                        </p>
                      ) : null}
                      {post.externalUrl ? (
                        <a
                          href={post.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-emerald-100/72 underline decoration-emerald-200/25 underline-offset-4"
                        >
                          Open published post
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-6 text-white/42">
                  No campaign posts have entered the publishing queue yet.
                </p>
              )}
            </article>
          </section>

          <section className="rounded-[1.4rem] border border-white/10 bg-white/[.025] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/38">
              Social performance
            </p>
            <h2 className="mt-1 font-serif text-2xl text-white/82">
              Reach and engagement are intentionally not estimated
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/48">
              {results.providerAnalytics.message}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
