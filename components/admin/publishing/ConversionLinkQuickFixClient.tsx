'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type { EventGrowthWorkspace } from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import { trackedReservationHref } from '@/lib/attribution/domain';
import { slugifyPublicEvent } from '@/lib/public-events/domain';

function isConversionObjective(workspace: EventGrowthWorkspace): boolean {
  return ['reservations', 'ticket-sales'].includes(workspace.brief.objective);
}

export function ConversionLinkQuickFixClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace | undefined>();
  const [url, setUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    eventRepository.getEvent(eventId).then(async (nextEvent) => {
      if (!active) return;
      setEvent(nextEvent);
      if (!nextEvent) return;

      const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
      if (!active) return;
      setWorkspace(nextWorkspace);
      setUrl(nextWorkspace.brief.reservationUrl);
    });

    return () => {
      active = false;
    };
  }, [eventId]);

  const internalReservationPath = useMemo(() => {
    if (!event) return '';
    const slug = slugifyPublicEvent(event.title);
    return trackedReservationHref({
      eventSlug: slug,
      source: 'club-bahia-website',
      medium: 'owned',
      campaign: slug,
      content: 'campaign-package',
    });
  }, [event]);

  if (!event || !workspace || !isConversionObjective(workspace)) return null;
  if (workspace.brief.reservationUrl.trim()) return null;

  async function persistLink(nextUrl: string, successMessage: string) {
    if (!event || !workspace) return;

    setPending(true);
    setMessage('');

    try {
      await growthWorkspaceRepository.updateBrief(event, {
        ...workspace.brief,
        reservationUrl: nextUrl,
      });
      setMessage(successMessage);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the conversion link.');
      setPending(false);
    }
  }

  async function saveManualLink() {
    const nextUrl = url.trim();
    try {
      const parsed = new URL(nextUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Use a complete public http or https URL.');
      }
    } catch {
      setMessage('Enter a complete public URL beginning with https://');
      return;
    }

    await persistLink(
      nextUrl,
      'External destination saved. Refreshing package readiness…',
    );
  }

  const reservationCampaign = workspace.brief.objective === 'reservations';

  return (
    <section className="mb-5 rounded-2xl border border-amber-200/20 bg-amber-200/[.065] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/70">
            One-time campaign setup
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {reservationCampaign
              ? 'Connect this campaign to Club Bahia reservations'
              : 'Add the final ticket destination'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            {reservationCampaign
              ? 'Use the built-in event-specific RSVP form. Public social and QR links are generated separately in the Publish step, so your boss does not need to paste a domain here.'
              : 'Add the verified public ticket URL. Saving it preserves approved copy and media assignments and does not regenerate the campaign.'}
          </p>
        </div>
        <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-bold text-amber-100">
          Required once
        </span>
      </div>

      {reservationCampaign ? (
        <div className="mt-4 rounded-xl border border-emerald-200/16 bg-emerald-200/[.055] p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-100">
              Club Bahia event RSVP
            </p>
            <p className="mt-1 break-all font-mono text-[11px] leading-5 text-white/45">
              {internalReservationPath}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void persistLink(
                internalReservationPath,
                'Club Bahia RSVP connected. Refreshing package readiness…',
              )
            }
            className="mt-3 min-h-11 w-full shrink-0 rounded-full bg-emerald-200 px-5 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40 sm:mt-0 sm:w-auto"
          >
            {pending ? 'Connecting…' : 'Use Club Bahia RSVP'}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(inputEvent) => setUrl(inputEvent.target.value)}
            placeholder="https://tickets.example.com/event"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45"
          />
          <button
            type="button"
            disabled={pending || !url.trim()}
            onClick={() => void saveManualLink()}
            className="min-h-12 rounded-full bg-amber-300 px-6 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Saving…' : 'Save ticket link'}
          </button>
        </div>
      )}

      {message ? (
        <p role="status" className="mt-3 text-sm text-amber-50">
          {message}
        </p>
      ) : null}
    </section>
  );
}
