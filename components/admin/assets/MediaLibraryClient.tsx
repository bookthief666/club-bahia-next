'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  EVENT_ASSET_PLATFORM_LABELS,
  EVENT_ASSET_ROLE_LABELS,
  type EventAssetKind,
} from '@/lib/admin/assets/domain';
import {
  MEDIA_LIBRARY_COLLECTION_LABELS,
  MEDIA_LIBRARY_COLLECTIONS,
  MEDIA_ORIENTATION_LABELS,
  MEDIA_RIGHTS_LABELS,
  normalizeLibraryTags,
  type MediaLibraryAsset,
  type MediaLibraryCollectionId,
  type MediaOrientation,
  type MediaRightsBasis,
} from '@/lib/admin/assets/library-domain';

const LIBRARY_API = '/api/admin/assets/library';
const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';

type LibraryFilter = 'active' | 'archived' | 'all';
type KindFilter = 'all' | EventAssetKind;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unit = units[0];
  for (let index = 1; size >= 1024 && index < units.length; index += 1) {
    size /= 1024;
    unit = units[index];
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${unit}`;
}

function preview(asset: MediaLibraryAsset) {
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-48 w-full rounded-2xl bg-black/35 object-contain"
      />
    );
  }
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        controls
        preload="metadata"
        playsInline
        className="h-48 w-full rounded-2xl bg-black object-contain"
      />
    );
  }
  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noreferrer"
      className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/14 bg-black/25 text-sm font-semibold text-amber-100"
    >
      Open original
    </a>
  );
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function LibraryAssetCard({
  asset,
  accessCode,
  onSaved,
}: {
  asset: MediaLibraryAsset;
  accessCode: string;
  onSaved: (asset: MediaLibraryAsset) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState(asset);
  const [tagsText, setTagsText] = useState(asset.tags.join(', '));
  const [performersText, setPerformersText] = useState(asset.performers.join(', '));
  const [genresText, setGenresText] = useState(asset.genres.join(', '));

  useEffect(() => {
    setDraft(asset);
    setTagsText(asset.tags.join(', '));
    setPerformersText(asset.performers.join(', '));
    setGenresText(asset.genres.join(', '));
  }, [asset]);

  function toggleCollection(collection: MediaLibraryCollectionId) {
    setDraft((current) => ({
      ...current,
      collections: current.collections.includes(collection)
        ? current.collections.filter((item) => item !== collection)
        : [...current.collections, collection],
    }));
  }

  async function mutate(body: unknown): Promise<MediaLibraryAsset> {
    const response = await fetch(LIBRARY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessCode ? { 'x-admin-asset-key': accessCode } : {}),
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as {
      asset?: MediaLibraryAsset;
      error?: string;
    };
    if (!response.ok || !result.asset) {
      throw new Error(result.error || 'Could not update media library asset.');
    }
    return result.asset;
  }

  async function save() {
    setPending(true);
    setMessage('');
    try {
      const saved = await mutate({
        action: 'upsert',
        asset: {
          ...draft,
          tags: normalizeLibraryTags(splitList(tagsText)),
          performers: splitList(performersText),
          genres: splitList(genresText),
          altText: draft.altText.trim(),
          notes: draft.notes.trim(),
          rightsNote: draft.rightsNote.trim(),
          credit: draft.credit.trim(),
        },
      });
      onSaved(saved);
      setEditing(false);
      setMessage('Library details saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save asset.');
    } finally {
      setPending(false);
    }
  }

  async function toggleArchive() {
    setPending(true);
    setMessage('');
    try {
      const saved = await mutate({
        action: 'archive',
        libraryAssetId: asset.id,
      });
      onSaved(saved);
      setMessage(saved.status === 'archived' ? 'Asset archived.' : 'Asset restored.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update asset.');
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-[1.4rem] border border-white/9 bg-[linear-gradient(145deg,rgba(18,17,15,.9),rgba(10,13,12,.88))] p-3 shadow-[0_18px_45px_rgba(0,0,0,.2)] sm:p-4">
      {preview(asset)}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{asset.name}</h3>
          <p className="mt-1 text-xs text-white/42">
            {EVENT_ASSET_ROLE_LABELS[asset.role]} · {formatBytes(asset.size)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${
            asset.status === 'active'
              ? 'border-emerald-200/20 bg-emerald-200/[.08] text-emerald-100'
              : 'border-white/10 bg-white/[.04] text-white/42'
          }`}
        >
          {asset.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {asset.collections.slice(0, 4).map((collection) => (
          <span
            key={collection}
            className="rounded-full border border-amber-200/14 bg-amber-200/[.06] px-2 py-1 text-[10px] text-amber-100/72"
          >
            {MEDIA_LIBRARY_COLLECTION_LABELS[collection]}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/7 bg-black/18 p-2">
          <p className="text-[9px] uppercase tracking-[.12em] text-white/30">Quality</p>
          <p className="mt-1 text-sm font-semibold text-white/68">{asset.qualityRating}/5</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-black/18 p-2">
          <p className="text-[9px] uppercase tracking-[.12em] text-white/30">Used</p>
          <p className="mt-1 text-sm font-semibold text-white/68">{asset.usageCount}</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-black/18 p-2">
          <p className="text-[9px] uppercase tracking-[.12em] text-white/30">Format</p>
          <p className="mt-1 truncate text-xs font-semibold text-white/68">
            {MEDIA_ORIENTATION_LABELS[asset.orientation]}
          </p>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-white/9 bg-black/22 p-3">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[.14em] text-white/42">
              Collections
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {MEDIA_LIBRARY_COLLECTIONS.map((collection) => (
                <label
                  key={collection}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-white/8 px-3 text-xs text-white/58"
                >
                  <input
                    type="checkbox"
                    checked={draft.collections.includes(collection)}
                    onChange={() => toggleCollection(collection)}
                  />
                  {MEDIA_LIBRARY_COLLECTION_LABELS[collection]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-white/55">
              Quality
              <select
                value={draft.qualityRating}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    qualityRating: Number(event.target.value) as 1 | 2 | 3 | 4 | 5,
                  }))
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value}/5</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/55">
              Orientation
              <select
                value={draft.orientation}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    orientation: event.target.value as MediaOrientation,
                  }))
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              >
                {Object.entries(MEDIA_ORIENTATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/55">
              Rights basis
              <select
                value={draft.rightsBasis}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    rightsBasis: event.target.value as MediaRightsBasis,
                  }))
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              >
                {Object.entries(MEDIA_RIGHTS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {[
            ['Tags', tagsText, setTagsText, 'crowd, dancing, warm-light'],
            ['Performers', performersText, setPerformersText, 'Azucar LA, DJ name'],
            ['Genres', genresText, setGenresText, 'cumbia, salsa, darkwave'],
          ].map(([label, value, setter, placeholder]) => (
            <label key={label as string} className="block text-xs text-white/55">
              {label as string}
              <input
                value={value as string}
                onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                placeholder={placeholder as string}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              />
            </label>
          ))}

          <label className="block text-xs text-white/55">
            Alt text
            <textarea
              rows={3}
              value={draft.altText}
              onChange={(event) => setDraft((current) => ({ ...current, altText: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 p-3 text-white"
            />
          </label>
          <label className="block text-xs text-white/55">
            Rights note
            <textarea
              rows={2}
              value={draft.rightsNote}
              onChange={(event) => setDraft((current) => ({ ...current, rightsNote: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 p-3 text-white"
            />
          </label>
          <label className="block text-xs text-white/55">
            Credit
            <input
              value={draft.credit}
              onChange={(event) => setDraft((current) => ({ ...current, credit: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
            />
          </label>
          <label className="block text-xs text-white/55">
            Internal notes
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 p-3 text-white"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void save()}
              className="min-h-10 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
            >
              {pending ? 'Saving…' : 'Save library details'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/58"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="min-h-10 rounded-full border border-white/12 px-3 text-xs font-semibold text-white/62"
        >
          Edit details
        </button>
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-3 text-xs font-semibold text-white/62"
        >
          Open original
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => void toggleArchive()}
          className="min-h-10 rounded-full border border-white/12 px-3 text-xs font-semibold text-white/45 disabled:opacity-40"
        >
          {asset.status === 'active' ? 'Archive' : 'Restore'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {asset.platforms.map((platform) => (
          <span key={platform} className="text-[10px] text-white/34">
            {EVENT_ASSET_PLATFORM_LABELS[platform]}
          </span>
        ))}
      </div>
      {message ? <p role="status" className="mt-3 text-xs text-amber-100/72">{message}</p> : null}
    </article>
  );
}

export function MediaLibraryClient() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [pending, setPending] = useState(true);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<LibraryFilter>('active');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [collectionFilter, setCollectionFilter] = useState<'all' | MediaLibraryCollectionId>('all');
  const [query, setQuery] = useState('');

  async function load(code = '') {
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(LIBRARY_API, {
        cache: 'no-store',
        headers: code ? { 'x-admin-asset-key': code } : {},
      });
      const result = (await response.json()) as {
        assets?: MediaLibraryAsset[];
        error?: string;
      };
      if (!response.ok || !result.assets) {
        if (response.status === 401) setNeedsUnlock(true);
        throw new Error(result.error || 'Could not open media library.');
      }
      setAssets(result.assets);
      setNeedsUnlock(false);
      if (code) sessionStorage.setItem(ACCESS_SESSION_KEY, code);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not open media library.');
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(ACCESS_SESSION_KEY) ?? '';
    setAccessCode(saved);
    void load(saved);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
      if (kindFilter !== 'all' && asset.kind !== kindFilter) return false;
      if (collectionFilter !== 'all' && !asset.collections.includes(collectionFilter)) return false;
      if (!normalized) return true;
      return [
        asset.name,
        asset.altText,
        asset.notes,
        ...asset.tags,
        ...asset.performers,
        ...asset.genres,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [assets, collectionFilter, kindFilter, query, statusFilter]);

  const activeCount = assets.filter((asset) => asset.status === 'active').length;
  const videoCount = assets.filter((asset) => asset.status === 'active' && asset.kind === 'video').length;
  const unusedCount = assets.filter((asset) => asset.status === 'active' && asset.usageCount === 0).length;

  if (needsUnlock) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-[#13110f]/85 p-5">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-100/55">Protected media</p>
        <h1 className="mt-2 font-serif text-3xl text-white">Unlock the reusable library</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
          Preview deployments still use the temporary asset access code. Production uses the normal signed Growth OS session.
        </p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void load(accessCode.trim());
          }}
        >
          <input
            type="password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Asset access code"
            className="min-h-12 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-white"
          />
          <button
            disabled={pending || !accessCode.trim()}
            className="min-h-12 rounded-full bg-amber-300 px-6 text-sm font-bold text-black disabled:opacity-40"
          >
            {pending ? 'Opening…' : 'Open library'}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-amber-100/72">{message}</p> : null}
      </section>
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(9,43,33,.88),rgba(28,15,12,.94)_58%,rgba(38,25,10,.9))] p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/65">Reusable media</p>
            <h1 className="mt-2 font-serif text-4xl tracking-[-.04em] text-white sm:text-5xl">Club Bahia Media Library</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/52">
              Organize proven crowd footage, venue images, logos, performer media, flyers, and vertical video once—then reuse them without uploading the file again.
            </p>
          </div>
          <Link
            href="/admin/events"
            className="inline-flex min-h-11 items-center rounded-full border border-amber-200/22 bg-amber-200/[.08] px-4 text-xs font-bold text-amber-100"
          >
            Add media from an event →
          </Link>
        </div>
        <div className="mt-5 grid gap-2 min-[460px]:grid-cols-3">
          {[
            ['Active assets', activeCount],
            ['Reusable videos', videoCount],
            ['Never used', unusedCount],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl border border-white/8 bg-black/18 p-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-white/34">{label as string}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{value as number}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sticky top-[5.5rem] z-[5] rounded-[1.3rem] border border-white/10 bg-[#0c0b0a]/92 p-3 shadow-[0_18px_50px_rgba(0,0,0,.35)] backdrop-blur-xl">
        <div className="grid gap-2 lg:grid-cols-[1.4fr_.7fr_.8fr_.9fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search names, tags, performers, or genres"
            className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as LibraryFilter)}
            className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All statuses</option>
          </select>
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as KindFilter)}
            className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          >
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
          <select
            value={collectionFilter}
            onChange={(event) => setCollectionFilter(event.target.value as 'all' | MediaLibraryCollectionId)}
            className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          >
            <option value="all">All collections</option>
            {MEDIA_LIBRARY_COLLECTIONS.map((collection) => (
              <option key={collection} value={collection}>{MEDIA_LIBRARY_COLLECTION_LABELS[collection]}</option>
            ))}
          </select>
        </div>
      </section>

      {pending ? (
        <p className="rounded-2xl border border-white/10 p-5 text-sm text-white/48">Loading media library…</p>
      ) : filtered.length ? (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((asset) => (
            <LibraryAssetCard
              key={asset.id}
              asset={asset}
              accessCode={accessCode}
              onSaved={(saved) =>
                setAssets((current) => current.map((item) => (item.id === saved.id ? saved : item)))
              }
            />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-white/14 bg-black/15 px-5 py-12 text-center">
          <h2 className="font-serif text-3xl text-white">No matching library assets</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/45">
            Approve media inside an event, then use “Save approved media to library.” The file stays in place and only reusable metadata is added.
          </p>
          <Link
            href="/admin/events"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
          >
            Open events
          </Link>
        </section>
      )}

      {message ? <p role="status" className="text-sm text-amber-100/72">{message}</p> : null}
    </div>
  );
}
