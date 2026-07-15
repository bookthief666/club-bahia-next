'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PromotionComposerCard } from '@/components/admin/growth/PromotionComposerCard';
import { StatusPill } from '@/components/admin/events/StatusPill';
import { formatVenueDateTime } from '@/lib/admin/date';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import {
  campaignItemMatchesGroup,
  type CampaignChannelGroup,
} from '@/lib/admin/growth/composer';
import {
  CAMPAIGN_LANGUAGE_LABELS,
  CAMPAIGN_OBJECTIVE_LABELS,
  type CampaignBrief,
  type CampaignLanguage,
  type CampaignObjective,
  type EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { buildCampaignQualityReport } from '@/lib/admin/growth/quality';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';

const FILTERS: Array<{ id: CampaignChannelGroup; label: string }> = [
  { id: 'needs-review', label: 'Needs review' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'video', label: 'Reels + TikTok' },
  { id: 'direct', label: 'Website + direct' },
  { id: 'all', label: 'All' },
];

const TONE_PRESETS = [
  'Energetic and welcoming',
  'Elegant and premium',
  'Dark and alternative',
  'Traditional Latin nightlife',
  'Warm and community-focused',
  'Urgent but factual',
  'Minimal and direct',
] as const;

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
}) {
  const className = `mt-1 w-full rounded-xl border bg-black/24 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 ${
    error
      ? 'border-red-300/45 focus:border-red-300/75'
      : 'border-white/10 focus:border-amber-200/45'
  }`;

  return (
    <label className="block text-sm text-white/68">
      {label}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={`min-h-11 ${className}`}
        />
      )}
      {error ? (
        <span className="mt-1 block text-xs leading-5 text-red-200">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs leading-5 text-white/38">{hint}</span>
      ) : null}
    </label>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-white/38">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
            className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${
              value === choice.value
                ? 'border-amber-200/55 bg-amber-300 text-black'
                : 'border-white/12 bg-black/18 text-white/62 hover:border-white/24'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PromotionStudioClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [brief, setBrief] = useState<CampaignBrief>();
  const [directionOpen, setDirectionOpen] = useState(false);
  const [filter, setFilter] = useState<CampaignChannelGroup>('needs-review');
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
      setBrief(nextWorkspace.brief);
      setDirectionOpen(nextWorkspace.content.length === 0);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  if (event === undefined || !workspace || !brief) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-sm text-white/52">
        Opening Promotion Studio…
      </div>
    );
  }
  if (event === null) {
    return (
      <div className="rounded-2xl border border-amber-200/20 p-6">
        <h1 className="font-serif text-2xl">Event not found</h1>
        <p className="mt-2 text-sm text-white/52">
          Return to Events and reload the shared catalog.
        </p>
      </div>
    );
  }

  const currentEvent = event;
  const currentWorkspace = workspace;
  const currentBrief = brief;
  const report = currentWorkspace.content.length
    ? buildCampaignQualityReport(currentEvent, currentWorkspace)
    : null;
  const draftCount = currentWorkspace.content.filter(
    (item) => item.status === 'draft',
  ).length;
  const approvedCount = currentWorkspace.content.length - draftCount;
  const conversionUrlRequired = ['reservations', 'ticket-sales'].includes(
    currentBrief.objective,
  );
  const reservationUrlError =
    conversionUrlRequired && !currentBrief.reservationUrl.trim()
      ? 'Add the final public reservation or ticket link before generating this conversion campaign.'
      : undefined;
  const filtered = currentWorkspace.content.filter((item) =>
    campaignItemMatchesGroup(item, filter),
  );

  const filterCount = (group: CampaignChannelGroup): number =>
    currentWorkspace.content.filter((item) => campaignItemMatchesGroup(item, group))
      .length;

  async function generatePackage() {
    if (currentWorkspace.content.length) {
      const confirmed = window.confirm(
        'Improve the full promotion package? The current version will remain available in revision history.',
      );
      if (!confirmed) return;
    }
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.generateCampaign(
        currentEvent,
        currentBrief,
      );
      setWorkspace(next);
      setBrief(next.brief);
      setDirectionOpen(false);
      setFilter('needs-review');
      setMessage(
        'Promotion package created. Compare the useful choices and approve each channel.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Promotion generation failed.',
      );
    } finally {
      setPending(false);
    }
  }

  async function saveDirection() {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.updateBrief(
        currentEvent,
        currentBrief,
      );
      setWorkspace(next);
      setBrief(next.brief);
      setDirectionOpen(false);
      setMessage('Campaign direction saved. Existing copy was not regenerated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save direction.');
    } finally {
      setPending(false);
    }
  }

  async function saveContent(contentItemId: string, body: string): Promise<boolean> {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.updateContentItem(
        currentEvent,
        contentItemId,
        body,
      );
      setWorkspace(next);
      setMessage('Recommended copy updated and returned to review.');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save copy.');
      return false;
    } finally {
      setPending(false);
    }
  }

  async function regenerateContent(contentItemId: string) {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.regenerateContentItem(
        currentEvent,
        contentItemId,
      );
      setWorkspace(next);
      setMessage('This channel was rebuilt and returned to review.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not improve this channel.');
    } finally {
      setPending(false);
    }
  }

  async function approveContent(contentItemId: string) {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.updateContentStatus(
        currentEvent,
        contentItemId,
        'approved',
      );
      setWorkspace(next);
      setMessage('Channel approved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not approve this channel.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 pb-36 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(246,183,60,.2),transparent_24rem),radial-gradient(circle_at_0%_100%,rgba(22,128,112,.17),transparent_25rem),linear-gradient(145deg,rgba(18,16,14,.98),rgba(22,12,11,.96))] p-5 shadow-[0_30px_90px_rgba(0,0,0,.34)] sm:p-7">
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <Link
              href={`/admin/events/${currentEvent.id}`}
              className="text-xs font-semibold text-amber-100/68"
            >
              ← Event details
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={currentEvent.status} />
              {currentEvent.promotionTemplate ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/48">
                  {currentEvent.promotionTemplate.name}
                </span>
              ) : null}
              <span className="rounded-full border border-emerald-200/16 bg-emerald-200/[.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-emerald-100/62">
                Promotion Studio
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl text-white sm:text-5xl">
              {currentEvent.title}
            </h1>
            <p className="mt-2 text-sm text-white/52">
              {formatVenueDateTime(currentEvent.startsAt)} · {currentEvent.room}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
              Generate the complete package once, compare the useful platform versions, approve the copy, then move directly to media.
            </p>
          </div>

          <div className="grid min-w-[16rem] grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/9 bg-black/24 p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-white/32">Ready</p>
              <p className="mt-1 text-2xl font-semibold text-white">{approvedCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[.06] p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-amber-100/45">Review</p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">{draftCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/14 bg-emerald-200/[.06] p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-emerald-100/45">Quality</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-100">
                {report?.score ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[1.65rem] border border-white/10 bg-[#13110f]/88 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setDirectionOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
              Campaign direction
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {currentBrief.theme || currentEvent.title}
            </h2>
            <p className="mt-1 text-xs text-white/42">
              {CAMPAIGN_LANGUAGE_LABELS[currentBrief.language]} ·{' '}
              {CAMPAIGN_OBJECTIVE_LABELS[currentBrief.objective]} · {currentBrief.tone}
            </p>
          </div>
          <span className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/58">
            {directionOpen ? 'Close setup' : 'Edit setup'}
          </span>
        </button>

        {directionOpen ? (
          <form
            className="mt-5 space-y-5 border-t border-white/8 pt-5"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              void generatePackage();
            }}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <ChoiceRow
                label="Primary goal"
                value={currentBrief.objective}
                choices={Object.entries(CAMPAIGN_OBJECTIVE_LABELS).map(
                  ([value, label]) => ({
                    value: value as CampaignObjective,
                    label,
                  }),
                )}
                onChange={(objective) =>
                  setBrief({ ...currentBrief, objective })
                }
              />
              <ChoiceRow
                label="Language"
                value={currentBrief.language}
                choices={Object.entries(CAMPAIGN_LANGUAGE_LABELS).map(
                  ([value, label]) => ({
                    value: value as CampaignLanguage,
                    label,
                  }),
                )}
                onChange={(language) => setBrief({ ...currentBrief, language })}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-white/38">
                Voice
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TONE_PRESETS.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setBrief({ ...currentBrief, tone })}
                    className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
                      currentBrief.tone === tone
                        ? 'border-amber-200/50 bg-amber-300 text-black'
                        : 'border-white/12 text-white/58'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="What makes this event worth attending?"
                value={currentBrief.mainAttraction}
                onChange={(mainAttraction) =>
                  setBrief({ ...currentBrief, mainAttraction })
                }
                placeholder="The strongest specific reason to attend"
                multiline
              />
              <div className="grid gap-4">
                <Field
                  label="Call to action"
                  value={currentBrief.offer}
                  onChange={(offer) => setBrief({ ...currentBrief, offer })}
                  placeholder="Reserve your night"
                />
                <Field
                  label="Reservation or ticket link"
                  value={currentBrief.reservationUrl}
                  onChange={(reservationUrl) =>
                    setBrief({ ...currentBrief, reservationUrl })
                  }
                  placeholder="https://…"
                  error={reservationUrlError}
                  hint="Use the final public destination. Tracking is added later by Autopilot."
                />
              </div>
            </div>

            <details className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white/65">
                Advanced campaign details
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                  label="Internal creative direction"
                  value={currentBrief.theme}
                  onChange={(theme) => setBrief({ ...currentBrief, theme })}
                  hint={`The only public event name remains “${currentEvent.title}.”`}
                />
                <Field
                  label="Target audience — internal"
                  value={currentBrief.targetAudience}
                  onChange={(targetAudience) =>
                    setBrief({ ...currentBrief, targetAudience })
                  }
                />
                <Field
                  label="Performers / DJs"
                  value={currentBrief.performers}
                  onChange={(performers) =>
                    setBrief({ ...currentBrief, performers })
                  }
                />
                <Field
                  label="Music genres"
                  value={currentBrief.genres}
                  onChange={(genres) => setBrief({ ...currentBrief, genres })}
                />
                <Field
                  label="Doors / show time"
                  value={currentBrief.doorsTime}
                  onChange={(doorsTime) =>
                    setBrief({ ...currentBrief, doorsTime })
                  }
                  placeholder="Doors 8 PM · show 9 PM"
                />
                <Field
                  label="Admission"
                  value={currentBrief.admission}
                  onChange={(admission) =>
                    setBrief({ ...currentBrief, admission })
                  }
                />
                <Field
                  label="Age policy"
                  value={currentBrief.ageRestriction}
                  onChange={(ageRestriction) =>
                    setBrief({ ...currentBrief, ageRestriction })
                  }
                />
                <Field
                  label="Food / drink special"
                  value={currentBrief.foodDrinkSpecial}
                  onChange={(foodDrinkSpecial) =>
                    setBrief({ ...currentBrief, foodDrinkSpecial })
                  }
                  placeholder="Only include confirmed public offers"
                />
                <Field
                  label="Venue address"
                  value={currentBrief.address}
                  onChange={(address) => setBrief({ ...currentBrief, address })}
                />
                <label className="block text-sm text-white/68">
                  Promotion budget ($)
                  <input
                    type="number"
                    min="0"
                    value={currentBrief.budgetCents / 100}
                    onChange={(inputEvent) =>
                      setBrief({
                        ...currentBrief,
                        budgetCents: Math.max(
                          0,
                          Math.round(Number(inputEvent.target.value || 0) * 100),
                        ),
                      })
                    }
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-amber-200/45"
                  />
                </label>
              </div>
            </details>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending || Boolean(reservationUrlError)}
                className="min-h-12 flex-1 rounded-full bg-amber-300 px-5 text-sm font-bold text-black shadow-[0_12px_35px_rgba(246,183,60,.14)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {pending
                  ? 'Building package…'
                  : currentWorkspace.content.length
                    ? 'Improve complete package'
                    : 'Generate complete package'}
              </button>
              {currentWorkspace.content.length ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void saveDirection()}
                  className="min-h-12 rounded-full border border-white/14 px-5 text-sm font-semibold text-white/62 disabled:opacity-40"
                >
                  Save without regenerating
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      {message ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-200/14 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/76"
        >
          {message}
        </p>
      ) : null}

      {currentWorkspace.content.length ? (
        <>
          <div className="sticky top-2 z-20 rounded-2xl border border-white/10 bg-[#0d0b0a]/94 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((entry) => {
                const count = filterCount(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setFilter(entry.id)}
                    className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold ${
                      filter === entry.id
                        ? 'bg-amber-300 text-black'
                        : 'border border-white/10 text-white/56'
                    }`}
                  >
                    {entry.label} · {count}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <PromotionComposerCard
                  key={item.id}
                  item={item}
                  pending={pending}
                  issues={(report?.issues ?? []).filter(
                    (entry) => !entry.channel || entry.channel === item.channel,
                  )}
                  onSave={(body) => saveContent(item.id, body)}
                  onRegenerate={() => regenerateContent(item.id)}
                  onApprove={() => approveContent(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/14 p-8 text-center">
              <h2 className="text-xl font-semibold text-white">This queue is clear</h2>
              <p className="mt-2 text-sm text-white/45">
                Choose another channel group or continue to media.
              </p>
            </div>
          )}
        </>
      ) : (
        <section className="rounded-[1.65rem] border border-dashed border-white/14 bg-black/12 p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/55">
            One generation, complete package
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white">
            Captions, hashtags, Stories, video, email, and SMS
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/48">
            The package creates useful choices for every channel while keeping event facts, recurring-night identity, bilingual voice, and provider requirements aligned.
          </p>
          <button
            type="button"
            disabled={pending || Boolean(reservationUrlError)}
            onClick={() => void generatePackage()}
            className="mt-5 min-h-12 rounded-full bg-amber-300 px-7 text-sm font-bold text-black disabled:opacity-35"
          >
            {pending ? 'Building package…' : 'Generate complete package'}
          </button>
        </section>
      )}

      <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 rounded-2xl border border-white/12 bg-[#0d0b0a]/96 p-2 shadow-[0_22px_70px_rgba(0,0,0,.55)] backdrop-blur-xl md:static md:mx-0 md:flex md:items-center md:justify-between md:bg-[#12100e]/88 md:p-4">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-white/68">
            {currentWorkspace.content.length
              ? draftCount
                ? `${draftCount} channel${draftCount === 1 ? '' : 's'} still need approval`
                : 'Campaign copy is ready for media'
              : 'Campaign package has not been generated'}
          </p>
          <p className="mt-1 text-xs text-white/36">
            Nothing publishes from this screen. Approval carries the selected copy into media and scheduling.
          </p>
        </div>
        {currentWorkspace.content.length && draftCount === 0 ? (
          <Link
            href={`/admin/events/${currentEvent.id}/assets`}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-200 px-5 text-sm font-bold text-black md:w-auto md:rounded-full"
          >
            Next: Choose media →
          </Link>
        ) : currentWorkspace.content.length ? (
          <button
            type="button"
            onClick={() => setFilter('needs-review')}
            className="min-h-12 w-full rounded-xl bg-amber-300 px-5 text-sm font-bold text-black md:w-auto md:rounded-full"
          >
            Review {draftCount} remaining
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || Boolean(reservationUrlError)}
            onClick={() => {
              setDirectionOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="min-h-12 w-full rounded-xl bg-amber-300 px-5 text-sm font-bold text-black disabled:opacity-35 md:w-auto md:rounded-full"
          >
            Set campaign direction
          </button>
        )}
      </div>
    </div>
  );
}
