'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatVenueDateTime } from '@/lib/admin/date';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type {
  CampaignQualityIssue,
  EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { buildCampaignQualityReport } from '@/lib/admin/growth/quality';
import {
  GROWTH_WORKSPACE_UPDATED_EVENT,
  growthWorkspaceRepository,
} from '@/lib/admin/growth/repository';

const SEVERITY_CLASS: Record<CampaignQualityIssue['severity'], string> = {
  error: 'border-red-300/20 bg-red-300/8 text-red-50',
  warning: 'border-amber-200/20 bg-amber-200/8 text-amber-50',
  info: 'border-sky-200/20 bg-sky-200/8 text-sky-50',
};

function ProviderPill({ workspace }: { workspace: EventGrowthWorkspace }) {
  const provider = workspace.generationProvider ?? 'fixture';
  const label = provider === 'openai' ? 'OpenAI' : 'Fixture AI';

  return (
    <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
      {label}{workspace.generationModel ? ` · ${workspace.generationModel}` : ''}
    </span>
  );
}

export function CampaignAuditPanelClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>(null);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const nextEvent = await eventRepository.getEvent(eventId);
      if (!active || !nextEvent) return;
      const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
      if (!active) return;
      setEvent(nextEvent);
      setWorkspace(nextWorkspace);
    }

    void load();

    function handleWorkspaceUpdate(domEvent: Event) {
      const detail = (domEvent as CustomEvent<{ eventId?: string }>).detail;
      if (!detail?.eventId || detail.eventId === eventId) void load();
    }

    window.addEventListener(GROWTH_WORKSPACE_UPDATED_EVENT, handleWorkspaceUpdate);
    return () => {
      active = false;
      window.removeEventListener(GROWTH_WORKSPACE_UPDATED_EVENT, handleWorkspaceUpdate);
    };
  }, [eventId]);

  const report = useMemo(() => {
    if (!event || !workspace || !workspace.content.length) return null;
    return buildCampaignQualityReport(event, workspace);
  }, [event, workspace]);

  if (!event || !workspace || !workspace.content.length || !report) return null;

  async function restoreRevision(revisionId: string) {
    if (!event) return;
    setPending(true);
    setMessage('');

    try {
      await growthWorkspaceRepository.restoreRevision(event, revisionId);
      setMessage('Previous campaign restored as a new draft. Reloading…');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore this revision.');
      setPending(false);
    }
  }

  return (
    <section className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-[#12100e]/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Campaign audit</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Quality and provenance</h2>
          <p className="mt-1 text-xs text-white/50">
            Generated {workspace.generatedAt ? formatVenueDateTime(workspace.generatedAt) : 'before provenance tracking'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProviderPill workspace={workspace} />
          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${report.score >= 90 ? 'border-emerald-200/20 bg-emerald-200/10 text-emerald-100' : report.score >= 70 ? 'border-amber-200/20 bg-amber-200/10 text-amber-100' : 'border-red-200/20 bg-red-200/10 text-red-100'}`}>
            Quality {report.score}%
          </span>
        </div>
      </div>

      {workspace.generationWarning ? (
        <p className="rounded-xl border border-violet-200/20 bg-violet-200/8 px-3 py-2 text-xs leading-5 text-violet-50">
          {workspace.generationWarning}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Event identity</p>
          <div className="mt-3 rounded-xl border border-white/10 px-3 py-3">
            <p className="text-xs text-white/45">Public event name</p>
            <p className="mt-1 text-lg font-semibold text-white">{event.title}</p>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 px-3 py-3">
            <p className="text-xs text-white/45">Internal campaign direction</p>
            <p className="mt-1 text-sm font-semibold text-white/75">{workspace.brief.theme}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">
            The event name is set when the event is created and is the only public title. The campaign direction guides the writing but is not a second name.
          </p>
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="mt-3 inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75"
          >
            Edit event name
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/45">Quality checks</p>
              <p className="mt-1 text-sm text-white/60">
                {report.issues.length ? `${report.issues.length} item${report.issues.length === 1 ? '' : 's'} to review` : 'No deterministic issues detected'}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {report.issues.length ? report.issues.slice(0, 6).map((item) => (
              <div key={item.id} className={`rounded-xl border px-3 py-2 ${SEVERITY_CLASS[item.severity]}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">{item.severity}</span>
                </div>
                <p className="mt-1 text-xs leading-5 opacity-70">{item.detail}</p>
              </div>
            )) : (
              <div className="rounded-xl border border-emerald-200/20 bg-emerald-200/8 px-3 py-3 text-sm text-emerald-50">
                The campaign passed the current naming, language, repetition, conversion-link, and SMS-length checks.
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-white/75">
          Publishing connections and revision history
        </summary>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Connection status</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                ['Club Bahia website', 'Not connected'],
                ['Instagram / Facebook', 'Manual publishing'],
                ['Email', 'Manual publishing'],
                ['SMS', 'Manual publishing'],
              ].map(([label, status]) => (
                <div key={label} className="rounded-xl border border-white/10 px-3 py-2">
                  <p className="text-xs text-white/45">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white/70">{status}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Previous generations</p>
            <div className="mt-2 space-y-2">
              {workspace.history.length ? workspace.history.map((revision) => (
                <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-white/75">{revision.brief.theme}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {formatVenueDateTime(revision.generatedAt)} · {revision.provider ?? 'unknown'}{revision.model ? ` · ${revision.model}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void restoreRevision(revision.id)}
                    className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/70 disabled:opacity-40"
                  >
                    Restore as draft
                  </button>
                </div>
              )) : (
                <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-white/45">
                  Regenerate the full campaign once to create the first saved revision.
                </p>
              )}
            </div>
          </div>
        </div>
      </details>

      {message ? <p role="status" className="text-xs text-amber-100">{message}</p> : null}
    </section>
  );
}
