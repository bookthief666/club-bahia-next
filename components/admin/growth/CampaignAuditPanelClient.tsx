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

function providerLabel(workspace: EventGrowthWorkspace): string {
  const provider = workspace.generationProvider === 'openai' ? 'OpenAI' : 'Fallback generator';
  return `${provider}${workspace.generationModel ? ` · ${workspace.generationModel}` : ''}`;
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

  const errors = report.issues.filter((item) => item.severity === 'error').length;
  const warnings = report.issues.filter((item) => item.severity === 'warning').length;

  return (
    <details className="mb-5 rounded-[1.5rem] border border-white/9 bg-[#11100e]/72 p-4 sm:p-5">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/34">
              Quality & history
            </p>
            <p className="mt-1 text-sm font-semibold text-white/72">
              {report.issues.length
                ? `${report.issues.length} note${report.issues.length === 1 ? '' : 's'} · ${workspace.history.length} saved version${workspace.history.length === 1 ? '' : 's'}`
                : `No deterministic issues · ${workspace.history.length} saved version${workspace.history.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {errors ? (
              <span className="rounded-full border border-red-200/18 bg-red-200/[.07] px-3 py-1 text-[10px] font-semibold text-red-100/72">
                {errors} blocking
              </span>
            ) : null}
            {warnings ? (
              <span className="rounded-full border border-amber-200/18 bg-amber-200/[.07] px-3 py-1 text-[10px] font-semibold text-amber-100/72">
                {warnings} warning{warnings === 1 ? '' : 's'}
              </span>
            ) : null}
            <span className="rounded-full border border-emerald-200/18 bg-emerald-200/[.07] px-3 py-1 text-[10px] font-bold text-emerald-100/72">
              Quality {report.score}%
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold text-white/44">
              Open details
            </span>
          </div>
        </div>
      </summary>

      <div className="mt-5 space-y-4 border-t border-white/8 pt-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-black/16 p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-white/32">Generated by</p>
            <p className="mt-2 text-sm font-semibold text-white/68">
              {providerLabel(workspace)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/16 p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-white/32">Generated</p>
            <p className="mt-2 text-sm font-semibold text-white/68">
              {workspace.generatedAt
                ? formatVenueDateTime(workspace.generatedAt)
                : 'Before provenance tracking'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/16 p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-white/32">Public event name</p>
            <p className="mt-2 text-sm font-semibold text-white/68">{event.title}</p>
          </div>
        </div>

        {workspace.generationWarning ? (
          <p className="rounded-xl border border-violet-200/18 bg-violet-200/[.06] px-3 py-2 text-xs leading-5 text-violet-50/72">
            {workspace.generationWarning}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-white/8 bg-black/16 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[.14em] text-white/32">
                  Deterministic checks
                </p>
                <h3 className="mt-1 text-base font-semibold text-white/72">
                  {report.issues.length
                    ? `${report.issues.length} item${report.issues.length === 1 ? '' : 's'} to consider`
                    : 'Current package passed'}
                </h3>
              </div>
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-white/52"
              >
                Edit event facts
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {report.issues.length ? (
                report.issues.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-3 py-2 ${SEVERITY_CLASS[item.severity]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="text-[9px] font-bold uppercase tracking-[.12em] opacity-55">
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 opacity-68">{item.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-emerald-200/18 bg-emerald-200/[.06] px-3 py-3 text-sm text-emerald-50/72">
                  Naming, language, conversion link, channel variation, caption package, hashtags, accessibility, and message-length checks passed.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/8 bg-black/16 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[.14em] text-white/32">
                  Previous versions
                </p>
                <h3 className="mt-1 text-base font-semibold text-white/72">
                  Restore without losing today’s work
                </h3>
              </div>
              <Link
                href="/admin/settings"
                className="rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-white/52"
              >
                Connections
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {workspace.history.length ? (
                workspace.history.map((revision) => (
                  <div
                    key={revision.id}
                    className="rounded-xl border border-white/9 px-3 py-3"
                  >
                    <p className="text-sm font-semibold text-white/70">
                      {revision.brief.theme}
                    </p>
                    <p className="mt-1 text-xs text-white/38">
                      {formatVenueDateTime(revision.generatedAt)} ·{' '}
                      {revision.provider ?? 'unknown'}
                      {revision.model ? ` · ${revision.model}` : ''}
                    </p>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void restoreRevision(revision.id)}
                      className="mt-3 min-h-9 rounded-full border border-white/12 px-3 text-xs font-semibold text-white/58 disabled:opacity-35"
                    >
                      Restore as draft
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-white/12 px-3 py-5 text-center text-xs text-white/38">
                  Improving the full package once will create the first saved version.
                </p>
              )}
            </div>
          </section>
        </div>

        {message ? <p role="status" className="text-xs text-amber-100/72">{message}</p> : null}
      </div>
    </details>
  );
}
