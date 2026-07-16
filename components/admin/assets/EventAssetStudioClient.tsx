'use client';

import { upload } from '@vercel/blob/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildEventAssetReadiness,
  EVENT_ASSET_ALLOWED_CONTENT_TYPES,
  EVENT_ASSET_MAX_SIZE_BYTES,
  EVENT_ASSET_PLATFORM_LABELS,
  EVENT_ASSET_PLATFORMS,
  EVENT_ASSET_ROLE_LABELS,
  EVENT_ASSET_ROLES,
  inferEventAssetKind,
  type EventAsset,
  type EventAssetKind,
  type EventAssetPlatform,
  type EventAssetRole,
} from '@/lib/admin/assets/domain';

const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';
const ASSET_API = '/api/admin/assets';
const ASSET_UPLOAD_API = '/api/admin/assets/upload';

type AssetFilter = 'all' | EventAssetKind;

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeFilename(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 180) || 'event-asset'
  );
}

function inferContentType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    pdf: 'application/pdf',
  };
  return extension ? map[extension] ?? '' : '';
}

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

function defaultRoleFor(contentType: string): EventAssetRole {
  if (contentType.startsWith('video/')) return 'raw-video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType === 'application/pdf') return 'print-flyer';
  return 'primary-flyer';
}

function defaultPlatformsFor(role: EventAssetRole): EventAssetPlatform[] {
  const map: Partial<Record<EventAssetRole, EventAssetPlatform[]>> = {
    'primary-flyer': ['website', 'instagram-feed', 'facebook'],
    'feed-creative': ['instagram-feed', 'facebook'],
    'story-creative': ['instagram-story'],
    'reel-video': ['reel', 'instagram-story'],
    'raw-video': ['reel'],
    'performer-photo': ['website', 'instagram-feed', 'facebook'],
    'venue-photo': ['website', 'instagram-feed', 'facebook'],
    logo: ['website', 'instagram-feed', 'facebook', 'print'],
    audio: ['reel'],
    'print-flyer': ['print'],
  };
  return map[role] ?? [];
}

function AssetPreview({ asset }: { asset: EventAsset }) {
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-52 w-full rounded-xl bg-black/30 object-contain"
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
        className="h-52 w-full rounded-xl bg-black object-contain"
      />
    );
  }

  if (asset.kind === 'audio') {
    return (
      <div className="flex h-32 items-center rounded-xl border border-white/10 bg-black/25 p-4">
        <audio src={asset.url} controls preload="metadata" className="w-full" />
      </div>
    );
  }

  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noreferrer"
      className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 text-sm font-semibold text-amber-100"
    >
      Open PDF
    </a>
  );
}

function AssetCard({
  asset,
  accessCode,
  pending,
  onSaved,
  onDeleted,
}: {
  asset: EventAsset;
  accessCode: string;
  pending: boolean;
  onSaved: (asset: EventAsset) => void;
  onDeleted: (assetId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(asset);
  const [message, setMessage] = useState('');

  useEffect(() => setDraft(asset), [asset]);

  async function persist(nextAsset: EventAsset) {
    setMessage('');
    const response = await fetch(ASSET_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-asset-key': accessCode,
      },
      body: JSON.stringify(nextAsset),
    });
    const result = (await response.json()) as { error?: string; asset?: EventAsset };
    if (!response.ok || !result.asset) {
      throw new Error(result.error || 'Could not save asset details.');
    }
    onSaved(result.asset);
    setDraft(result.asset);
  }

  async function changeStatus() {
    try {
      const nextAsset: EventAsset = {
        ...asset,
        status: asset.status === 'approved' ? 'draft' : 'approved',
        updatedAt: new Date().toISOString(),
      };
      await persist(nextAsset);
      setMessage(
        nextAsset.status === 'approved'
          ? 'Asset approved for campaign use.'
          : 'Asset returned to draft.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update asset.');
    }
  }

  async function saveDetails() {
    try {
      const nextAsset = {
        ...draft,
        altText: draft.altText.trim(),
        notes: draft.notes.trim(),
        updatedAt: new Date().toISOString(),
      };
      await persist(nextAsset);
      setEditing(false);
      setMessage('Asset details saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save asset.');
    }
  }

  async function removeAsset() {
    const confirmed = window.confirm(
      `Delete “${asset.name}” from event media storage? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(ASSET_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-asset-key': accessCode,
        },
        body: JSON.stringify({
          eventId: asset.eventId,
          assetId: asset.id,
          fileUrl: asset.url,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not delete asset.');
      onDeleted(asset.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete asset.');
    }
  }

  function togglePlatform(platform: EventAssetPlatform) {
    setDraft((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4">
      <AssetPreview asset={asset} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{asset.name}</p>
          <p className="mt-1 text-xs text-white/50">
            {EVENT_ASSET_ROLE_LABELS[asset.role]} · {formatBytes(asset.size)}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
            asset.status === 'approved'
              ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
              : 'border-white/10 bg-white/5 text-white/55'
          }`}
        >
          {asset.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {asset.platforms.length ? (
          asset.platforms.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-amber-200/15 bg-amber-200/8 px-2 py-1 text-[11px] text-amber-100/75"
            >
              {EVENT_ASSET_PLATFORM_LABELS[platform]}
            </span>
          ))
        ) : (
          <span className="text-xs text-amber-100/70">No platforms assigned</span>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <label className="block text-sm text-white/70">
            Asset role
            <select
              value={draft.role}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  role: event.target.value as EventAssetRole,
                }))
              }
              className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-white"
            >
              {EVENT_ASSET_ROLES.map((role) => (
                <option key={role} value={role}>
                  {EVENT_ASSET_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm text-white/70">Use on</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EVENT_ASSET_PLATFORMS.map((platform) => (
                <label
                  key={platform}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/65"
                >
                  <input
                    type="checkbox"
                    checked={draft.platforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                  />
                  {EVENT_ASSET_PLATFORM_LABELS[platform]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm text-white/70">
            Alt text
            <textarea
              value={draft.altText}
              onChange={(event) =>
                setDraft((current) => ({ ...current, altText: event.target.value }))
              }
              rows={3}
              placeholder="Describe the important visual information for accessibility."
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white"
            />
          </label>

          <label className="block text-sm text-white/70">
            Notes
            <textarea
              value={draft.notes}
              onChange={(event) =>
                setDraft((current) => ({ ...current, notes: event.target.value }))
              }
              rows={3}
              placeholder="Crop guidance, performer credit, version notes, or usage limits."
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void saveDetails()}
              className="min-h-10 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
            >
              Save details
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(asset);
                setEditing(false);
              }}
              className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/65"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-3 text-xs font-semibold text-white/70"
        >
          Open original
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing((current) => !current)}
          className="min-h-10 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/70 disabled:opacity-40"
        >
          Edit assignment
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void changeStatus()}
          className="min-h-10 rounded-full bg-amber-300 px-3 text-xs font-bold text-black disabled:opacity-40"
        >
          {asset.status === 'approved' ? 'Return to draft' : 'Approve asset'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void removeAsset()}
          className="min-h-10 rounded-full border border-red-300/20 px-3 text-xs font-semibold text-red-100 disabled:opacity-40"
        >
          Delete
        </button>
      </div>

      {message ? <p className="mt-3 text-xs text-amber-100">{message}</p> : null}
    </article>
  );
}

export function EventAssetStudioClient({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accessCode, setAccessCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [role, setRole] = useState<EventAssetRole>('primary-flyer');
  const [platforms, setPlatforms] = useState<EventAssetPlatform[]>(
    defaultPlatformsFor('primary-flyer'),
  );
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [filter, setFilter] = useState<AssetFilter>('all');
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [message, setMessage] = useState('');

  async function loadAssets(code: string): Promise<boolean> {
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(`${ASSET_API}?eventId=${encodeURIComponent(eventId)}`, {
        cache: 'no-store',
        headers: { 'x-admin-asset-key': code },
      });
      const result = (await response.json()) as {
        assets?: EventAsset[];
        error?: string;
      };
      if (!response.ok || !result.assets) {
        throw new Error(result.error || 'Could not open event media.');
      }
      setAssets(result.assets);
      setUnlocked(true);
      sessionStorage.setItem(ACCESS_SESSION_KEY, code);
      return true;
    } catch (error) {
      setUnlocked(false);
      setMessage(error instanceof Error ? error.message : 'Could not open event media.');
      return false;
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(ACCESS_SESSION_KEY);
    if (saved) {
      setAccessCode(saved);
      void loadAssets(saved);
    }
    // The event id is stable for this mounted route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const readiness = useMemo(() => buildEventAssetReadiness(assets), [assets]);
  const readinessCount = readiness.filter((item) => item.complete).length;
  const filteredAssets = assets.filter(
    (asset) => filter === 'all' || asset.kind === filter,
  );

  function chooseRole(nextRole: EventAssetRole) {
    setRole(nextRole);
    setPlatforms(defaultPlatformsFor(nextRole));
  }

  function togglePlatform(platform: EventAssetPlatform) {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  function validateFile(file: File): string | null {
    const contentType = inferContentType(file);
    if (!EVENT_ASSET_ALLOWED_CONTENT_TYPES.includes(contentType as never)) {
      return `${file.name}: unsupported file type.`;
    }
    if (file.size > EVENT_ASSET_MAX_SIZE_BYTES) {
      return `${file.name}: larger than the ${formatBytes(EVENT_ASSET_MAX_SIZE_BYTES)} limit.`;
    }
    return null;
  }

  async function registerAsset(asset: EventAsset): Promise<EventAsset> {
    const response = await fetch(ASSET_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-asset-key': accessCode,
      },
      body: JSON.stringify(asset),
    });
    const result = (await response.json()) as { asset?: EventAsset; error?: string };
    if (!response.ok || !result.asset) {
      throw new Error(result.error || 'The file uploaded, but its event assignment could not be saved.');
    }
    return result.asset;
  }

  async function uploadFiles() {
    if (!files.length) {
      setMessage('Choose at least one flyer, image, video, audio file, or PDF.');
      return;
    }
    if (!rightsConfirmed) {
      setMessage('Confirm that Club Bahia has permission to use these files.');
      return;
    }

    const validationError = files.map(validateFile).find(Boolean);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setPending(true);
    setMessage('');
    setProgress(0);
    const uploadedAssets: EventAsset[] = [];

    try {
      for (const file of files) {
        const assetId = makeId();
        const contentType = inferContentType(file);
        const pathname = `club-bahia/events/${eventId}/assets/${assetId}/${safeFilename(file.name)}`;
        setCurrentFile(file.name);

        const blob = await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: ASSET_UPLOAD_API,
          headers: { 'x-admin-asset-key': accessCode },
          clientPayload: JSON.stringify({ eventId, assetId }),
          contentType,
          multipart: file.size > 100 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });

        const timestamp = new Date().toISOString();
        const uploaded = await registerAsset({
          id: assetId,
          eventId,
          name: file.name,
          pathname: blob.pathname,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          contentType,
          size: file.size,
          kind: inferEventAssetKind(contentType),
          role: role === 'primary-flyer' && files.length === 1
            ? defaultRoleFor(contentType)
            : role,
          platforms,
          status: 'draft',
          altText: '',
          notes: '',
          rightsConfirmedAt: timestamp,
          uploadedAt: timestamp,
          updatedAt: timestamp,
        });
        uploadedAssets.push(uploaded);
      }

      setAssets((current) => [...uploadedAssets, ...current]);
      setFiles([]);
      setRightsConfirmed(false);
      setProgress(100);
      setCurrentFile('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage(
        `${uploadedAssets.length} asset${uploadedAssets.length === 1 ? '' : 's'} uploaded. Review platform assignments and approve each final asset.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Event media upload failed.');
    } finally {
      setPending(false);
    }
  }

  if (!unlocked) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#141210]/80 p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Protected media workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Unlock {eventTitle} assets</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
          Enter the preview asset access code. It is kept only in this browser tab session and is never stored in the event record.
        </p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void loadAssets(accessCode.trim());
          }}
        >
          <input
            type="password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Asset access code"
            autoComplete="off"
            className="min-h-12 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-white outline-none focus:border-amber-200/45"
          />
          <button
            type="submit"
            disabled={pending || !accessCode.trim()}
            className="min-h-12 rounded-full bg-amber-300 px-6 text-sm font-bold text-black disabled:opacity-40"
          >
            {pending ? 'Opening…' : 'Open media studio'}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-amber-100">{message}</p> : null}
      </section>
    );
  }

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <section className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Event Asset Studio</p>
            <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">{eventTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Upload flyers, finished Reels, raw footage, performer photos, audio, logos, and printable PDFs. Assign each file to the platforms where it will be used.
            </p>
          </div>
          <div className="min-w-32 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/60">Media readiness</p>
            <p className="mt-1 text-3xl font-semibold text-amber-100">
              {readinessCount}/{readiness.length}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {readiness.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 ${
              item.complete
                ? 'border-emerald-200/20 bg-emerald-200/8'
                : 'border-white/10 bg-[#141210]/70'
            }`}
          >
            <p className={`text-sm font-semibold ${item.complete ? 'text-emerald-100' : 'text-white'}`}>
              {item.complete ? '✓ ' : '○ '}{item.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/50">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Upload media</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Add campaign assets</h2>
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/50">
            Maximum {formatBytes(EVENT_ASSET_MAX_SIZE_BYTES)} each
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm text-white/70">
            Files
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav,application/pdf"
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                setFiles(nextFiles);
                if (nextFiles.length === 1) {
                  const nextRole = defaultRoleFor(inferContentType(nextFiles[0]));
                  setRole(nextRole);
                  setPlatforms(defaultPlatformsFor(nextRole));
                }
              }}
              className="mt-1 block min-h-12 w-full rounded-xl border border-dashed border-white/15 bg-black/25 p-3 text-sm text-white/65 file:mr-3 file:rounded-full file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-xs file:font-bold file:text-black"
            />
            <span className="mt-2 block text-xs leading-5 text-white/40">
              {files.length
                ? `${files.length} selected: ${files.map((file) => file.name).join(', ')}`
                : 'Choose from the Fold 6 gallery, camera files, Downloads, or cloud storage.'}
            </span>
          </label>

          <label className="block text-sm text-white/70">
            Asset role
            <select
              value={role}
              onChange={(event) => chooseRole(event.target.value as EventAssetRole)}
              className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white"
            >
              {EVENT_ASSET_ROLES.map((item) => (
                <option key={item} value={item}>
                  {EVENT_ASSET_ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm text-white/70">Use on these destinations</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EVENT_ASSET_PLATFORMS.map((platform) => (
              <label
                key={platform}
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs ${
                  platforms.includes(platform)
                    ? 'border-amber-200/25 bg-amber-200/10 text-amber-100'
                    : 'border-white/10 text-white/55'
                }`}
              >
                <input
                  type="checkbox"
                  checked={platforms.includes(platform)}
                  onChange={() => togglePlatform(platform)}
                />
                {EVENT_ASSET_PLATFORM_LABELS[platform]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
          <input
            type="checkbox"
            checked={rightsConfirmed}
            onChange={(event) => setRightsConfirmed(event.target.checked)}
            className="mt-1"
          />
          <span>
            Club Bahia has permission to use these files for event promotion, including any performer images, music, logos, or third-party material they contain.
          </span>
        </label>

        {pending && currentFile ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex justify-between gap-3 text-xs text-white/60">
              <span className="truncate">Uploading {currentFile}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-300 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !files.length || !rightsConfirmed}
            onClick={() => void uploadFiles()}
            className="min-h-12 flex-1 rounded-full bg-amber-300 px-5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Uploading…' : `Upload ${files.length || ''} asset${files.length === 1 ? '' : 's'}`}
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(ACCESS_SESSION_KEY);
              setUnlocked(false);
              setAccessCode('');
              setAssets([]);
            }}
            className="min-h-12 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/60"
          >
            Lock studio
          </button>
        </div>

        {message ? (
          <p role="status" className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/8 px-3 py-2 text-sm text-amber-50">
            {message}
          </p>
        ) : null}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Event media library</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {assets.length} asset{assets.length === 1 ? '' : 's'}
            </h2>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/20 p-1">
            {(['all', 'image', 'video', 'audio', 'document'] as AssetFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold capitalize ${
                  filter === item
                    ? 'bg-amber-300 text-black'
                    : 'text-white/55'
                }`}
              >
                {item === 'document' ? 'PDF' : item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {filteredAssets.length ? (
            filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                accessCode={accessCode}
                pending={pending}
                onSaved={(saved) =>
                  setAssets((current) =>
                    current.map((item) => (item.id === saved.id ? saved : item)),
                  )
                }
                onDeleted={(assetId) =>
                  setAssets((current) => current.filter((item) => item.id !== assetId))
                }
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center xl:col-span-2">
              <h3 className="text-xl font-semibold text-white">
                {assets.length ? 'No assets match this filter' : 'No event media uploaded yet'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/50">
                {assets.length
                  ? 'Choose a different media type.'
                  : 'Start with the main flyer and a finished vertical Reel. Then add Story creative, performer photos, and raw footage.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
