'use client';

import { useEffect, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type { EventGrowthWorkspace } from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';

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

  if (!event || !workspace || !isConversionObjective(workspace)) return null;
  if (workspace.brief.reservationUrl.trim()) return null;

  async function saveLink() {
    if (!event || !workspace) return;

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

    setPending(true);
    setMessage('');

    try {
      await growthWorkspaceRepository.updateBrief(event, {
        ...workspace.brief,
        reservationUrl: nextUrl,
      });
      setMessage('Conversion link saved. Refreshing package readiness…');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the conversion link.');
      setPending(false);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-red-200/20 bg-red-200/8 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-100/70">
            Global publishing blocker
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Add the final reservation or ticket link
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            This single missing campaign field is why every package currently says Needs setup. Saving it here preserves all approved copy and media assignments; it does not regenerate the campaign.
          </p>
        </div>
        <span className="rounded-full border border-red-200/20 bg-red-200/10 px-3 py-1 text-xs font-bold text-red-100">
          Blocks all packages
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(inputEvent) => setUrl(inputEvent.target.value)}
          placeholder="https://club-bahia.example/reservations"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45"
        />
        <button
          type="button"
          disabled={pending || !url.trim()}
          onClick={() => void saveLink()}
          className="min-h-12 rounded-full bg-amber-300 px-6 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save link without regenerating'}
        </button>
      </div>

      {message ? (
        <p role="status" className="mt-3 text-sm text-amber-50">
          {message}
        </p>
      ) : null}
    </section>
  );
}
