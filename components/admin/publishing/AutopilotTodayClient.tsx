'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type {
  PublishingQueueJob,
  PublishingQueueTodaySummary,
} from '@/lib/admin/autopilot/queue-domain';

interface QueueResponse {
  today?: PublishingQueueTodaySummary;
  error?: string;
}

function venueTime(value?: string): string {
  if (!value) return 'No time selected';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Invalid time';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function JobRow({ job, problem = false }: { job: PublishingQueueJob; problem?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/18 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white/80">{job.eventTitle}</p>
          <p className="mt-1 text-xs text-white/46">
            {job.label} · {venueTime(job.nextAttemptAt ?? job.scheduledFor)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] ${problem ? 'border-red-200/18 bg-red-200/[.07] text-red-100' : 'border-cyan-200/18 bg-cyan-200/[.07] text-cyan-100'}`}>
          {job.status.replace('-', ' ')}
        </span>
      </div>
      {job.lastError ? (
        <p className="mt-2 text-xs leading-5 text-red-50/65">{job.lastError}</p>
      ) : null}
      <Link
        href={`/admin/events/${job.eventId}/publishing/execute`}
        className="mt-3 inline-flex min-h-9 items-center rounded-full border border-white/12 px-3 text-xs font-semibold text-white/60"
      >
        Review post
      </Link>
    </div>
  );
}

export function AutopilotTodayClient() {
  const [summary, setSummary] = useState<PublishingQueueTodaySummary>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/autopilot/queue', {
      cache: 'no-store',
    });
    const payload = (await response.json()) as QueueResponse;
    if (!response.ok || !payload.today) {
      throw new Error(payload.error || 'Publishing queue could not be loaded.');
    }
    setSummary(payload.today);
  }, []);

  useEffect(() => {
    void load().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : 'Publishing queue could not be loaded.',
      ),
    );
  }, [load]);

  async function runDuePosts() {
    const confirmed = window.confirm(
      'Run all approved posts whose scheduled time has arrived? Exactly-once receipts and retry limits remain active.',
    );
    if (!confirmed) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/autopilot/scheduler/run', {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        processed?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'Due posts could not run.');
      await load();
      setMessage(
        payload.processed
          ? `${payload.processed} due publishing job${payload.processed === 1 ? '' : 's'} processed.`
          : 'No approved posts are due yet.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Due posts could not run.');
    } finally {
      setPending(false);
    }
  }

  if (!summary) {
    return (
      <section className="rounded-[1.45rem] border border-cyan-200/12 bg-cyan-200/[.035] p-4 text-sm text-white/50">
        {message || 'Loading today’s promotion queue…'}
      </section>
    );
  }

  const actionCount =
    summary.publishingToday.length +
    summary.needsApproval.length +
    summary.problems.length;

  return (
    <section className="rounded-[1.55rem] border border-cyan-200/14 bg-[radial-gradient(circle_at_92%_0%,rgba(34,211,238,.13),transparent_24rem),linear-gradient(145deg,rgba(11,25,27,.93),rgba(18,13,13,.95))] p-4 shadow-[0_22px_70px_rgba(0,0,0,.28)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100/65">
            Today’s promotion
          </p>
          <h2 className="mt-1 font-serif text-3xl text-white">
            {actionCount ? 'Posts moving through Autopilot' : 'No publishing actions due'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/48">
            Approved posts, approval requests, and publishing problems across Instagram and TikTok.
          </p>
        </div>
        <button
          type="button"
          disabled={pending || !summary.publishingToday.length}
          onClick={() => void runDuePosts()}
          className="min-h-11 rounded-full bg-cyan-100 px-5 text-sm font-bold text-black disabled:opacity-35"
        >
          {pending ? 'Running…' : 'Run due posts now'}
        </button>
      </div>

      {message ? (
        <p role="status" className="mt-4 rounded-xl border border-amber-200/14 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/75">
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-100/55">
            Publishing today · {summary.publishingToday.length}
          </p>
          <div className="space-y-2">
            {summary.publishingToday.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
            {!summary.publishingToday.length ? (
              <p className="rounded-xl border border-white/7 bg-black/14 p-3 text-xs text-white/35">
                Nothing approved is due today.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-amber-100/55">
            Needs approval · {summary.needsApproval.length}
          </p>
          <div className="space-y-2">
            {summary.needsApproval.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
            {!summary.needsApproval.length ? (
              <p className="rounded-xl border border-white/7 bg-black/14 p-3 text-xs text-white/35">
                No queued posts are waiting for approval.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-red-100/55">
            Problems · {summary.problems.length}
          </p>
          <div className="space-y-2">
            {summary.problems.map((job) => (
              <JobRow key={job.id} job={job} problem />
            ))}
            {!summary.problems.length ? (
              <p className="rounded-xl border border-white/7 bg-black/14 p-3 text-xs text-white/35">
                No provider or media problems need attention.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
