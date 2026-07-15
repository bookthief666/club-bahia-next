'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  EventAsset,
  EventAssetPlatform,
  EventAssetRole,
} from '@/lib/admin/assets/domain';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  buildMediaRecommendationLanes,
  type MediaRecommendationLane,
} from '@/lib/admin/assets/library-recommendations';
import type { CampaignChannel } from '@/lib/admin/growth/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

const LIBRARY_API = '/api/admin/assets/library';
const EVENT_ASSET_API = '/api/admin/assets';
const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';

const LANE_ASSIGNMENT: Record<
  MediaRecommendationLane['id'],
  {
    contentItemId: string;
    channel: CampaignChannel;
    platform: EventAssetPlatform;
    role: EventAssetRole;
  }
> = {
  'instagram-feed': {
    contentItemId: 'instagram-feed',
    channel: 'instagram-feed',
    platform: 'instagram-feed',
    role: 'feed-creative',
  },
  'instagram-story': {
    contentItemId: 'instagram-story',
    channel: 'instagram-story',
    platform: 'instagram-story',
    role: 'story-creative',
  },
  'vertical-video': {
    contentItemId: 'reel',
    channel: 'reel',
    platform: 'reel',
    role: 'reel-video',
  },
  website: {
    contentItemId: 'website',
    channel: 'website',
    platform: 'website',
    role: 'primary-flyer',
  },
};

function preview(asset: MediaLibraryAsset) {
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-40 w-full rounded-xl bg-black/30 object-contain"
      />
    );
  }
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        preload="metadata"
        muted
        playsInline
        className="h-40 w-full rounded-xl bg-black object-contain"
      />
    );
  }
  return (
    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/12 bg-black/20 text-xs text-white/42">
      {asset.kind}
    </div>
  );
}

function headers(accessCode: string): HeadersInit {
  return accessCode ? { 'x-admin-asset-key': accessCode } : {};
}

export function EventMediaRecommendationsClient({
  event,
}: {
  event: OperationsEvent;
}) {
  const [libraryAssets, setLibraryAssets] = useState<MediaLibraryAsset[]>([]);
  const [eventAssets, setEventAssets] = useState<EventAsset[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [pending, setPending] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [message, setMessage] = useState('');

  async function load(code = '') {
    setPending(true);
    setMessage('');
    try {
      const [libraryResponse, eventResponse] = await Promise.all([
        fetch(LIBRARY_API, { cache: 'no-store', headers: headers(code) }),
        fetch(`${EVENT_ASSET_API}?eventId=${encodeURIComponent(event.id)}`, {
          cache: 'no-store',
          headers: headers(code),
        }),
      ]);
      const libraryResult = (await libraryResponse.json()) as {
        assets?: MediaLibraryAsset[];
        error?: string;
      };
      const eventResult = (await eventResponse.json()) as {
        assets?: EventAsset[];
        error?: string;
      };
      if (!libraryResponse.ok || !libraryResult.assets) {
        if (libraryResponse.status === 401) setNeedsUnlock(true);
        throw new Error(libraryResult.error || 'Could not load reusable media.');
      }
      if (!eventResponse.ok || !eventResult.assets) {
        if (eventResponse.status === 401) setNeedsUnlock(true);
        throw new Error(eventResult.error || 'Could not load event media.');
      }
      setLibraryAssets(libraryResult.assets);
      setEventAssets(eventResult.assets);
      setNeedsUnlock(false);
      if (code) sessionStorage.setItem(ACCESS_SESSION_KEY, code);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load media recommendations.');
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(ACCESS_SESSION_KEY) ?? '';
    setAccessCode(saved);
    void load(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const librarySourceKeys = useMemo(
    () => new Set(libraryAssets.map((asset) => `${asset.sourceEventId}:${asset.sourceAssetId}`)),
    [libraryAssets],
  );
  const importable = eventAssets.filter(
    (asset) =>
      asset.status === 'approved' &&
      !asset.sourceLibraryAssetId &&
      !librarySourceKeys.has(`${asset.eventId}:${asset.id}`),
  );
  const lanes = useMemo(
    () => buildMediaRecommendationLanes({ event, assets: libraryAssets }),
    [event, libraryAssets],
  );

  async function importApproved() {
    if (!importable.length) return;
    setWorkingId('import');
    setMessage('');
    try {
      const imported: MediaLibraryAsset[] = [];
      for (const asset of importable) {
        const response = await fetch(LIBRARY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers(accessCode),
          },
          body: JSON.stringify({
            action: 'import-event-asset',
            eventTitle: event.title,
            asset,
          }),
        });
        const result = (await response.json()) as {
          asset?: MediaLibraryAsset;
          error?: string;
        };
        if (!response.ok || !result.asset) {
          throw new Error(result.error || `Could not save ${asset.name} to the library.`);
        }
        imported.push(result.asset);
      }
      setLibraryAssets((current) => {
        const map = new Map(current.map((asset) => [asset.id, asset]));
        imported.forEach((asset) => map.set(asset.id, asset));
        return [...map.values()];
      });
      setMessage(
        `${imported.length} approved asset${imported.length === 1 ? '' : 's'} saved to the reusable library without duplicating the files.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save approved media.');
    } finally {
      setWorkingId('');
    }
  }

  async function assignRecommendation(
    lane: MediaRecommendationLane,
    libraryAsset: MediaLibraryAsset,
  ) {
    const assignmentRule = LANE_ASSIGNMENT[lane.id];
    setWorkingId(`${lane.id}:${libraryAsset.id}`);
    setMessage('');
    try {
      let eventAsset = eventAssets.find(
        (asset) => asset.sourceLibraryAssetId === libraryAsset.id,
      );
      if (!eventAsset) {
        const response = await fetch(LIBRARY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers(accessCode),
          },
          body: JSON.stringify({
            action: 'assign-to-event',
            libraryAssetId: libraryAsset.id,
            eventId: event.id,
            eventTitle: event.title,
            platform: assignmentRule.platform,
            role: assignmentRule.role,
          }),
        });
        const result = (await response.json()) as {
          assignment?: EventAsset;
          usageWarning?: string;
          error?: string;
        };
        if (!response.ok || !result.assignment) {
          throw new Error(result.error || 'Could not reuse this media for the event.');
        }
        eventAsset = result.assignment;
        setEventAssets((current) => [result.assignment as EventAsset, ...current]);
        if (result.usageWarning) setMessage(result.usageWarning);
      }

      await postAssemblyRepository.assignPrimaryAsset(
        event.id,
        assignmentRule.contentItemId,
        assignmentRule.channel,
        eventAsset.id,
      );
      setMessage(
        `${libraryAsset.name} is now the primary ${lane.label.toLowerCase()} asset for ${event.title}.`,
      );
      await load(accessCode);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not assign recommended media.');
    } finally {
      setWorkingId('');
    }
  }

  if (needsUnlock) {
    return (
      <section className="mb-5 rounded-[1.35rem] border border-amber-200/14 bg-amber-200/[.045] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/58">
              Smart media recommendations
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Unlock media to see reusable matches</h2>
            <p className="mt-1 text-xs leading-5 text-white/44">
              Use the same preview media access code as the upload studio. Production uses the normal Growth OS session.
            </p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              void load(accessCode.trim());
            }}
          >
            <input
              type="password"
              value={accessCode}
              onChange={(inputEvent) => setAccessCode(inputEvent.target.value)}
              placeholder="Access code"
              className="min-h-10 w-36 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
            />
            <button
              disabled={pending || !accessCode.trim()}
              className="min-h-10 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
            >
              Open
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(10,45,34,.82),rgba(22,14,12,.92)_62%,rgba(42,28,10,.78))] p-4 shadow-[0_20px_65px_rgba(0,0,0,.25)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-200/65">
            Smart media matching
          </p>
          <h2 className="mt-1 font-serif text-3xl text-white">Recommended media</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
            Recommendations consider the recurring-night template, platform format, asset role, quality, tags, rights, and how recently the media was used.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {importable.length ? (
            <button
              type="button"
              disabled={Boolean(workingId)}
              onClick={() => void importApproved()}
              className="min-h-11 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
            >
              {workingId === 'import'
                ? 'Saving…'
                : `Save ${importable.length} approved to library`}
            </button>
          ) : null}
          <Link
            href="/admin/media"
            className="inline-flex min-h-11 items-center rounded-full border border-white/14 px-4 text-xs font-semibold text-white/62"
          >
            Browse full library
          </Link>
        </div>
      </div>

      {pending ? (
        <p className="mt-5 rounded-2xl border border-white/8 bg-black/18 p-4 text-sm text-white/42">
          Matching approved media…
        </p>
      ) : libraryAssets.length ? (
        <div className="mt-5 space-y-5">
          {lanes.map((lane) => (
            <section key={lane.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{lane.label}</h3>
                  <p className="mt-0.5 text-xs text-white/38">
                    Best approved matches, with recent reuse penalized.
                  </p>
                </div>
                <span className="rounded-full border border-white/9 px-2.5 py-1 text-[10px] font-semibold text-white/38">
                  {lane.recommendations.length} match{lane.recommendations.length === 1 ? '' : 'es'}
                </span>
              </div>
              {lane.recommendations.length ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {lane.recommendations.map((recommendation, index) => {
                    const actionId = `${lane.id}:${recommendation.asset.id}`;
                    return (
                      <article
                        key={recommendation.asset.id}
                        className={`rounded-2xl border p-3 ${
                          index === 0
                            ? 'border-amber-200/28 bg-amber-200/[.07]'
                            : 'border-white/8 bg-black/18'
                        }`}
                      >
                        {preview(recommendation.asset)}
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {recommendation.asset.name}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/34">
                              Score {recommendation.score}
                            </p>
                          </div>
                          {index === 0 ? (
                            <span className="rounded-full bg-amber-300 px-2 py-1 text-[9px] font-black uppercase text-black">
                              Best
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 space-y-1">
                          {recommendation.reasons.slice(0, 2).map((reason) => (
                            <p key={reason} className="text-[11px] leading-4 text-emerald-100/62">✓ {reason}</p>
                          ))}
                          {recommendation.warnings.slice(0, 1).map((warning) => (
                            <p key={warning} className="text-[11px] leading-4 text-amber-100/60">△ {warning}</p>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={Boolean(workingId)}
                          onClick={() => void assignRecommendation(lane, recommendation.asset)}
                          className="mt-3 min-h-10 w-full rounded-full bg-emerald-200 px-3 text-xs font-bold text-black disabled:opacity-40"
                        >
                          {workingId === actionId ? 'Assigning…' : 'Use for this post'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-xs text-white/36">
                  No approved reusable asset fits this placement yet.
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center">
          <h3 className="font-serif text-2xl text-white">Build the first reusable collection</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/42">
            Upload and approve event media below, then save it to the library. The same file can support future Azucar, Bahía Nocturna, and general Club Bahia campaigns.
          </p>
        </div>
      )}

      {message ? <p role="status" className="mt-4 text-sm text-amber-100/72">{message}</p> : null}
    </section>
  );
}
