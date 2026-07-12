'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { trackedReservationHref } from '@/lib/attribution/domain';
import { slugifyPublicEvent } from '@/lib/public-events/domain';

interface LinkPreset {
  id: string;
  label: string;
  source: string;
  medium: string;
  content: string;
  description: string;
}

const PRESETS: LinkPreset[] = [
  {
    id: 'instagram-bio',
    label: 'Instagram bio',
    source: 'instagram',
    medium: 'social',
    content: 'bio-link',
    description: 'Use in the account bio or Link in Bio page.',
  },
  {
    id: 'instagram-story',
    label: 'Instagram Story',
    source: 'instagram',
    medium: 'social',
    content: 'story-link-sticker',
    description: 'Use with the Story link sticker.',
  },
  {
    id: 'instagram-post',
    label: 'Instagram post',
    source: 'instagram',
    medium: 'social',
    content: 'feed-caption',
    description: 'Use when directing guests from a feed post.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    source: 'facebook',
    medium: 'social',
    content: 'event-post',
    description: 'Use in the Facebook event or promotional post.',
  },
  {
    id: 'flyer-qr',
    label: 'Flyer / QR code',
    source: 'printed-flyer',
    medium: 'qr',
    content: 'flyer-qr-code',
    description: 'Use as the destination when generating a printed QR code.',
  },
  {
    id: 'google-business',
    label: 'Google Business',
    source: 'google-business',
    medium: 'organic',
    content: 'event-update',
    description: 'Use in a Google Business Profile event or update.',
  },
];

function absoluteUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

export function CampaignTrackingLinksClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let active = true;
    eventRepository.getEvent(eventId).then((nextEvent) => {
      if (active) setEvent(nextEvent);
    });
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    setOrigin(configured || window.location.origin);
    return () => {
      active = false;
    };
  }, [eventId]);

  const links = useMemo(() => {
    if (!event || !origin) return [];
    const slug = slugifyPublicEvent(event.title);
    return PRESETS.map((preset) => ({
      ...preset,
      url: absoluteUrl(
        origin,
        trackedReservationHref({
          eventSlug: slug,
          source: preset.source,
          medium: preset.medium,
          campaign: slug,
          content: preset.content,
        }),
      ),
    }));
  }, [event, origin]);

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  }

  if (!event) return null;

  const previewDomain = /vercel\.app|localhost|127\.0\.0\.1/i.test(origin);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-sky-200/14 bg-[radial-gradient(circle_at_88%_0%,rgba(56,189,248,.15),transparent_22rem),linear-gradient(145deg,rgba(11,20,25,.94),rgba(18,14,12,.96))] shadow-[0_20px_70px_rgba(0,0,0,.28)]">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-sky-200/70">
              Campaign attribution
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Use a different trackable link for each promotion
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Every link opens the same event-specific reservation form, but the source is recorded so Club Bahia can see which promotion produced each request.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              previewDomain
                ? 'border-amber-200/25 bg-amber-200/10 text-amber-100'
                : 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
            }`}
          >
            {previewDomain ? 'Preview links only' : 'Public domain ready'}
          </span>
        </div>

        {previewDomain ? (
          <div className="mt-4 rounded-xl border border-amber-200/18 bg-amber-200/[.06] p-3 text-sm leading-6 text-amber-50/72">
            These links currently use a Vercel Preview or local domain. Test them here, but do not place them on public flyers or social media. Set <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-100">NEXT_PUBLIC_SITE_URL</code> to the final Club Bahia website before launch.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <article
              key={link.id}
              className="rounded-2xl border border-white/9 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{link.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/42">
                    {link.description}
                  </p>
                </div>
                <span className="rounded-full border border-sky-200/15 bg-sky-200/[.06] px-2 py-1 text-[10px] uppercase tracking-[.12em] text-sky-100/70">
                  {link.medium}
                </span>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/8 bg-black/30 p-3">
                <p className="break-all font-mono text-[11px] leading-5 text-white/48">
                  {link.url}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copy(link.id, link.url)}
                className="mt-3 min-h-10 w-full rounded-full border border-sky-200/20 bg-sky-200/[.07] px-4 text-xs font-semibold text-sky-100"
              >
                {copied === link.id ? 'Copied ✓' : 'Copy tracked link'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
