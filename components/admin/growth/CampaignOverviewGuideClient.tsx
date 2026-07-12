'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type { EventGrowthWorkspace } from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';

export function CampaignOverviewGuideClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();

  useEffect(() => {
    let active = true;
    eventRepository.getEvent(eventId).then(async (nextEvent) => {
      if (!active) return;
      setEvent(nextEvent);
      if (!nextEvent) return;
      const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
      if (active) setWorkspace(nextWorkspace);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  const state = useMemo(() => {
    if (!workspace) return null;
    const total = workspace.content.length;
    const approved = workspace.content.filter((item) =>
      ['approved', 'scheduled', 'published'].includes(item.status),
    ).length;
    const remaining = total - approved;

    if (!total) {
      return {
        eyebrow: 'Start here',
        title: 'Turn the event details into a complete campaign',
        detail:
          'Fill in the campaign details once, then generate the website, Instagram, Story, Reel, Facebook, email, and SMS copy together.',
        actionLabel: 'Open campaign setup',
        actionHref: '#campaign-workspace',
        total,
        approved,
        remaining,
      };
    }

    if (remaining > 0) {
      return {
        eyebrow: 'Review in progress',
        title: `${remaining} post${remaining === 1 ? '' : 's'} still need approval`,
        detail:
          'Open each draft, make any changes, and approve it. Approved copy will be carried into the media and publishing steps.',
        actionLabel: 'Continue reviewing copy',
        actionHref: '#campaign-workspace',
        total,
        approved,
        remaining,
      };
    }

    return {
      eyebrow: 'Campaign copy complete',
      title: 'All channel copy is approved',
      detail:
        'The next step is adding the final flyer and video, then matching them to each post.',
      actionLabel: 'Next: Add event media',
      actionHref: `/admin/events/${eventId}/assets`,
      total,
      approved,
      remaining,
    };
  }, [eventId, workspace]);

  if (event === undefined || !workspace || !state) {
    return (
      <div className="mb-5 rounded-2xl border border-white/10 p-5 text-white/55">
        Loading campaign overview…
      </div>
    );
  }

  if (event === null) return null;

  return (
    <section className="relative mb-5 overflow-hidden rounded-[1.65rem] border border-white/10 bg-[radial-gradient(circle_at_86%_10%,rgba(246,183,60,.22),transparent_22rem),radial-gradient(circle_at_8%_100%,rgba(18,120,106,.18),transparent_24rem),linear-gradient(135deg,rgba(17,17,14,.96),rgba(26,14,12,.94))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-7">
      <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.23em] text-emerald-200/68">
            {state.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white sm:text-4xl">
            {state.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
            {state.detail}
          </p>
          <Link
            href={state.actionHref}
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-amber-300 px-6 text-sm font-bold text-black shadow-[0_12px_32px_rgba(246,183,60,.16)]"
          >
            {state.actionLabel} →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:min-w-[22rem]">
          <div className="rounded-2xl border border-white/9 bg-black/22 p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-white/38">Created</p>
            <p className="mt-1 text-2xl font-semibold text-white">{state.total}/7</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/14 bg-emerald-200/[.06] p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-emerald-100/52">Approved</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-100">{state.approved}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[.06] p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-amber-100/52">Quality</p>
            <p className="mt-1 text-2xl font-semibold text-amber-100">{workspace.readinessScore}%</p>
          </div>
        </div>
      </div>
    </section>
  );
}
