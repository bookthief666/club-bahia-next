'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
  unlockAssetSession,
} from '@/lib/admin/assets/client-session';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type { EventGrowthWorkspace } from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import {
  emptyEventPostAssembly,
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { buildCampaignIntegrityReport } from '@/lib/admin/publishing/integrity';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';
import {
  PublicEventSnapshotSchema,
  slugifyPublicEvent,
  type PublicEventSnapshot,
  type PublicEventVisibility,
} from '@/lib/public-events/domain';

function summaryFromCopy(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= 420) return compact;
  return `${compact.slice(0, 417).trimEnd()}…`;
}

function WebsiteUnlock({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setPending(true);
    setMessage('');
    try {
      await unlockAssetSession(code);
      setCode('');
      await onUnlocked();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not unlock media.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <input
        type="password"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="Media access code"
        autoComplete="off"
        className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-200/50"
      />
      <button
        type="submit"
        disabled={pending || !code.trim()}
        className="min-h-11 rounded-full bg-violet-100 px-5 text-xs font-bold text-black disabled:opacity-40"
      >
        {pending ? 'Unlocking…' : 'Unlock website media'}
      </button>
      {message ? <p className="text-sm text-amber-100">{message}</p> : null}
    </form>
  );
}

export function WebsitePublishClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [pending, setPending] = useState<PublicEventVisibility>();
  const [message, setMessage] = useState('');
  const [lastSnapshot, setLastSnapshot] = useState<PublicEventSnapshot>();

  async function loadAssets() {
    try {
      const nextAssets = await fetchEventAssets(eventId);
      setAssets(nextAssets);
      setMediaLocked(false);
    } catch (error) {
      if (error instanceof AssetSessionError && error.status === 401) {
        setMediaLocked(true);
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Could not load event media.');
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const nextEvent = await eventRepository.getEvent(eventId);
      if (!active) return;
      setEvent(nextEvent);
      if (!nextEvent) return;
      const [nextWorkspace, nextAssembly] = await Promise.all([
        growthWorkspaceRepository.getWorkspace(nextEvent),
        postAssemblyRepository.get(eventId),
      ]);
      if (!active) return;
      setWorkspace(nextWorkspace);
      setAssembly(nextAssembly);
      await loadAssets();
    }
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const prepared = useMemo(() => {
    if (!event || !workspace) return null;
    const websiteItem = workspace.content.find((item) => item.channel === 'website');
    const websitePackage = assembly.packages.find(
      (item) => item.channel === 'website',
    );
    const image = assets.find((asset) => asset.id === websitePackage?.primaryAssetId);
    const integrity = buildCampaignIntegrityReport({
      event,
      workspace,
      assembly,
      assets,
    });
    const websiteApproved = Boolean(
      websiteItem &&
        ['approved', 'scheduled', 'published'].includes(websiteItem.status),
    );
    const hasTemporaryUrl = integrity.issues.some(
      (issue) => issue.id === 'preview-url',
    );

    return {
      websiteItem,
      image,
      integrity,
      websiteApproved,
      hasTemporaryUrl,
      readyForPreview: Boolean(websiteItem && image),
      readyForPublic: Boolean(
        websiteItem &&
          image &&
          websiteApproved &&
          integrity.canPublish &&
          !hasTemporaryUrl,
      ),
    };
  }, [assembly, assets, event, workspace]);

  async function publish(visibility: PublicEventVisibility) {
    if (!event || !workspace || !prepared?.websiteItem || !prepared.image) return;
    if (visibility === 'public') {
      const confirmed = window.confirm(
        'Publish this approved event and website copy to the public Club Bahia events page?',
      );
      if (!confirmed) return;
    }

    setPending(visibility);
    setMessage('');
    const now = new Date().toISOString();
    const slug = slugifyPublicEvent(event.title);
    const isTicketed = workspace.brief.objective === 'ticket-sales';
    const snapshot: PublicEventSnapshot = {
      version: 1,
      id: event.id,
      slug,
      title: event.title,
      eyebrow: visibility === 'public' ? 'Upcoming at Bahia' : 'Website preview',
      category: workspace.brief.genres || 'Live event',
      summary: summaryFromCopy(event.concept || prepared.websiteItem.body),
      websiteCopy: prepared.websiteItem.body,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      room: event.room,
      performers: workspace.brief.performers,
      genres: workspace.brief.genres,
      doorsTime: workspace.brief.doorsTime,
      admission: workspace.brief.admission,
      ageRestriction: workspace.brief.ageRestriction || '21+',
      foodDrinkSpecial: workspace.brief.foodDrinkSpecial,
      address:
        workspace.brief.address || '1130 Sunset Blvd, Los Angeles, CA 90012',
      // Reservation campaigns intentionally route through the event-specific Club Bahia
      // RSVP form. An external URL is used only when this is truly a ticketed event.
      reservationUrl: '',
      ticketUrl: isTicketed ? workspace.brief.reservationUrl : '',
      imageUrl: prepared.image.url,
      imageAlt:
        prepared.image.altText || `${event.title} at Club Bahia in Los Angeles`,
      statusLabel: isTicketed ? 'Tickets available' : 'Reservations available',
      visibility,
      isFeatured: true,
      publishedAt: visibility === 'public' ? now : undefined,
      updatedAt: now,
    };

    const validated = PublicEventSnapshotSchema.safeParse(snapshot);
    if (!validated.success) {
      setPending(undefined);
      setMessage(
        'The website listing is missing required information. Review the event, campaign brief, and website media.',
      );
      return;
    }

    try {
      const response = await fetch('/api/admin/public-events', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated.data),
      });
      const result = (await response.json()) as {
        event?: PublicEventSnapshot;
        error?: string;
      };
      if (!response.ok || !result.event) {
        throw new Error(result.error || 'Could not update the website event.');
      }
      setLastSnapshot(result.event);
      setMessage(
        visibility === 'public'
          ? 'The event is now published to the public website catalog and its reservation button opens the event-specific Club Bahia RSVP form.'
          : 'Website preview snapshot saved. It can be reviewed in a Preview deployment before going live.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not update the website event.',
      );
    } finally {
      setPending(undefined);
    }
  }

  if (!event || !workspace || !prepared) return null;

  const unresolved = prepared.integrity.blockers;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-emerald-200/16 bg-[radial-gradient(circle_at_88%_0%,rgba(16,185,129,.16),transparent_22rem),linear-gradient(145deg,rgba(12,28,23,.93),rgba(18,14,12,.96))] shadow-[0_20px_70px_rgba(0,0,0,.28)]">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-200/70">
              Website connection
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Send the approved campaign to Club Bahia’s public site
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/56">
              This creates the event listing guests see, carries over the approved website copy and image, and sends reservation campaigns into the correct event-specific RSVP form.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              prepared.readyForPublic
                ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/25 bg-amber-200/10 text-amber-100'
            }`}
          >
            {prepared.readyForPublic
              ? 'Ready for website'
              : `${unresolved + (prepared.hasTemporaryUrl ? 1 : 0)} item${
                  unresolved + (prepared.hasTemporaryUrl ? 1 : 0) === 1 ? '' : 's'
                } to review`}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/9 bg-black/20 p-3">
            <p className="text-xs font-semibold text-white">
              {prepared.websiteApproved
                ? '✓ Website copy approved'
                : '○ Website copy needs approval'}
            </p>
          </div>
          <div className="rounded-xl border border-white/9 bg-black/20 p-3">
            <p className="text-xs font-semibold text-white">
              {prepared.image ? '✓ Website image attached' : '○ Website image missing'}
            </p>
          </div>
          <div className="rounded-xl border border-white/9 bg-black/20 p-3">
            <p className="text-xs font-semibold text-white">
              {prepared.integrity.canPublish
                ? '✓ Campaign checks passed'
                : `○ Fix ${prepared.integrity.blockers} campaign issue${
                    prepared.integrity.blockers === 1 ? '' : 's'
                  }`}
            </p>
          </div>
          <div className="rounded-xl border border-white/9 bg-black/20 p-3">
            <p className="text-xs font-semibold text-white">
              {prepared.hasTemporaryUrl
                ? '○ Replace temporary Preview URL'
                : '✓ Public links are safe'}
            </p>
          </div>
        </div>

        {mediaLocked ? <WebsiteUnlock onUnlocked={loadAssets} /> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(pending) || mediaLocked || !prepared.readyForPreview}
            onClick={() => void publish('preview')}
            className="min-h-11 rounded-full border border-violet-200/22 bg-violet-200/[.08] px-5 text-sm font-semibold text-violet-100 disabled:opacity-35"
          >
            {pending === 'preview' ? 'Saving preview…' : 'Save website preview'}
          </button>
          <button
            type="button"
            disabled={Boolean(pending) || mediaLocked || !prepared.readyForPublic}
            onClick={() => void publish('public')}
            className="min-h-11 rounded-full bg-emerald-200 px-5 text-sm font-bold text-black disabled:opacity-35"
          >
            {pending === 'public' ? 'Publishing…' : 'Publish to public website'}
          </button>
          <Link
            href={`/admin/events/${eventId}/growth`}
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/68"
          >
            Review website copy
          </Link>
          {lastSnapshot ? (
            <Link
              href={`/events/${lastSnapshot.slug}`}
              target="_blank"
              className="inline-flex min-h-11 items-center rounded-full border border-amber-200/20 bg-amber-200/[.07] px-5 text-sm font-semibold text-amber-100"
            >
              Open event page ↗
            </Link>
          ) : null}
        </div>

        {message ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50"
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
