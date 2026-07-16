'use client';

import { upload } from '@vercel/blob/client';
import { useEffect, useMemo, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { renderMediaDerivative } from '@/lib/admin/assets/client-derivatives';
import {
  derivativeReadinessCount,
  findMediaDerivative,
  getMediaDerivativePreset,
  mediaDerivativePresetsForKind,
  type MediaDerivative,
  type MediaDerivativePreset,
  type MediaDerivativePresetId,
} from '@/lib/admin/assets/derivatives';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  mediaDerivativeRecordId,
  mediaOverlayIsComplete,
  mediaOverlayVariantKey,
  overlayForPreset,
  type MediaOverlayRecipe,
} from '@/lib/admin/assets/overlays';
import { MediaOverlayEditor } from './MediaOverlayEditor';
import { MediaOverlayPreview } from './MediaOverlayPreview';

const LIBRARY_API = '/api/admin/assets/library';
const SOURCE_API = '/api/admin/assets/library/source';
const DERIVATIVE_UPLOAD_API = '/api/admin/assets/library/derivatives/upload';

function headers(accessCode: string): Record<string, string> {
  return accessCode ? { 'x-admin-asset-key': accessCode } : {};
}

function derivativePath(
  assetId: string,
  presetId: MediaDerivativePresetId,
  variantKey: string,
): string {
  return `club-bahia/media-library/assets/${assetId}/derivatives/${presetId}/${variantKey}.jpg`;
}

function Preview({
  asset,
  preset,
  focalX,
  focalY,
  zoom,
  overlay,
  logoAsset,
}: {
  asset: MediaLibraryAsset;
  preset: MediaDerivativePreset;
  focalX: number;
  focalY: number;
  zoom: number;
  overlay?: MediaOverlayRecipe;
  logoAsset?: MediaLibraryAsset;
}) {
  const mediaClass = 'absolute inset-0 h-full w-full object-cover transition-transform duration-200';
  const mediaStyle = {
    objectPosition: `${focalX * 100}% ${focalY * 100}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${focalX * 100}% ${focalY * 100}%`,
  };
  return (
    <div
      className="relative mx-auto max-h-[34rem] w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_20px_60px_rgba(0,0,0,.35)]"
      style={{ aspectRatio: `${preset.width}/${preset.height}` }}
    >
      {asset.kind === 'video' ? (
        <video
          src={asset.url}
          muted
          playsInline
          preload="metadata"
          className={mediaClass}
          style={mediaStyle}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.altText || asset.name}
          className={mediaClass}
          style={mediaStyle}
        />
      )}
      <MediaOverlayPreview
        overlay={overlay}
        preset={preset}
        logoAsset={logoAsset}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),transparent_24%,transparent_74%,rgba(0,0,0,.12))]" />
      {preset.safeArea ? (
        <div
          className="pointer-events-none absolute z-[3] border border-dashed border-amber-100/75 shadow-[0_0_0_999px_rgba(0,0,0,.08)]"
          style={{
            top: `${preset.safeArea.topPercent}%`,
            right: `${preset.safeArea.rightPercent}%`,
            bottom: `${preset.safeArea.bottomPercent}%`,
            left: `${preset.safeArea.leftPercent}%`,
          }}
        >
          <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-amber-100">
            Safe area
          </span>
        </div>
      ) : null}
      {preset.gridCrop ? (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[3] border border-emerald-100/55"
          style={{
            aspectRatio: String(preset.gridCrop.aspectRatio),
            height: '75%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-emerald-100">
            {preset.gridCrop.label}
          </span>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-2 right-2 z-[4] rounded-full bg-black/70 px-2 py-1 text-[9px] font-semibold text-white/70">
        {preset.width} × {preset.height}
      </div>
    </div>
  );
}

export function MediaDerivativeStudio({
  asset,
  events,
  logoAssets,
  accessCode,
  onSaved,
}: {
  asset: MediaLibraryAsset;
  events: OperationsEvent[];
  logoAssets: MediaLibraryAsset[];
  accessCode: string;
  onSaved: (asset: MediaLibraryAsset) => void;
}) {
  const presets = useMemo(
    () => mediaDerivativePresetsForKind(asset.kind),
    [asset.kind],
  );
  const [open, setOpen] = useState(false);
  const [presetId, setPresetId] = useState<MediaDerivativePresetId>(
    presets[0]?.id ?? 'instagram-feed-portrait',
  );
  const [focalX, setFocalX] = useState(0.5);
  const [focalY, setFocalY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [frameTimeSeconds, setFrameTimeSeconds] = useState(0);
  const [overlay, setOverlay] = useState<MediaOverlayRecipe>();
  const [pending, setPending] = useState(false);
  const [batchPending, setBatchPending] = useState(false);
  const [message, setMessage] = useState('');
  const preset = getMediaDerivativePreset(presetId);
  const variantKey = mediaOverlayVariantKey(overlay);
  const existing = findMediaDerivative({
    derivatives: asset.derivatives,
    presetId,
    variantKey,
  });
  const readyCount = derivativeReadinessCount(asset.derivatives, variantKey);
  const logoAsset = overlay?.logoAssetId
    ? logoAssets.find((item) => item.id === overlay.logoAssetId)
    : undefined;

  useEffect(() => {
    if (!presets.some((item) => item.id === presetId) && presets[0]) {
      setPresetId(presets[0].id);
    }
  }, [presetId, presets]);

  useEffect(() => {
    const nextVariantKey = overlay?.eventId
      ? `event-${overlay.eventId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100)}`
      : 'base';
    const derivative = findMediaDerivative({
      derivatives: asset.derivatives,
      presetId,
      variantKey: nextVariantKey,
    });
    const base = findMediaDerivative({
      derivatives: asset.derivatives,
      presetId,
      variantKey: 'base',
    });
    setFocalX(derivative?.focalX ?? base?.focalX ?? 0.5);
    setFocalY(derivative?.focalY ?? base?.focalY ?? 0.5);
    setZoom(derivative?.zoom ?? base?.zoom ?? 1);
    setFrameTimeSeconds(
      derivative?.frameTimeSeconds ?? base?.frameTimeSeconds ?? 0,
    );
    if (overlay?.eventId) {
      const event = events.find((item) => item.id === overlay.eventId);
      if (event) {
        setOverlay((current) =>
          derivative?.overlay ?? overlayForPreset({ event, presetId, current }),
        );
      }
    }
  }, [asset.derivatives, events, overlay?.eventId, presetId]);

  async function sourceBlob(assetId = asset.id): Promise<Blob> {
    const response = await fetch(
      `${SOURCE_API}?assetId=${encodeURIComponent(assetId)}`,
      { cache: 'no-store', headers: headers(accessCode) },
    );
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(result.error || 'Could not load the source media.');
    }
    return response.blob();
  }

  async function saveDerivative(
    derivative: MediaDerivative,
  ): Promise<MediaLibraryAsset> {
    const response = await fetch(LIBRARY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers(accessCode),
      },
      body: JSON.stringify({
        action: 'save-derivative',
        libraryAssetId: asset.id,
        derivative,
      }),
    });
    const result = (await response.json()) as {
      asset?: MediaLibraryAsset;
      error?: string;
    };
    if (!response.ok || !result.asset) {
      throw new Error(result.error || 'Could not save the platform version.');
    }
    onSaved(result.asset);
    return result.asset;
  }

  async function generatePreset(
    targetPreset: MediaDerivativePreset,
    blob: Blob,
    currentAsset: MediaLibraryAsset,
    targetOverlay?: MediaOverlayRecipe,
  ): Promise<MediaLibraryAsset> {
    if (targetOverlay && !mediaOverlayIsComplete(targetOverlay)) {
      throw new Error('Complete the title, date, time, CTA, and Club Bahia identity before generating.');
    }
    const targetVariantKey = mediaOverlayVariantKey(targetOverlay);
    const logoBlob = targetOverlay?.logoAssetId
      ? await sourceBlob(targetOverlay.logoAssetId)
      : undefined;
    const rendered = await renderMediaDerivative({
      sourceBlob: blob,
      kind: asset.kind,
      preset: targetPreset,
      focalX,
      focalY,
      zoom,
      frameTimeSeconds: asset.kind === 'video' ? frameTimeSeconds : undefined,
      overlay: targetOverlay,
      logoBlob,
    });
    const uploaded = await upload(
      derivativePath(asset.id, targetPreset.id, targetVariantKey),
      rendered.blob,
      {
        access: 'public',
        handleUploadUrl: DERIVATIVE_UPLOAD_API,
        headers: headers(accessCode),
        clientPayload: JSON.stringify({
          libraryAssetId: asset.id,
          presetId: targetPreset.id,
          variantKey: targetVariantKey,
        }),
        contentType: 'image/jpeg',
      },
    );
    const prior = findMediaDerivative({
      derivatives: currentAsset.derivatives,
      presetId: targetPreset.id,
      variantKey: targetVariantKey,
    });
    const now = new Date().toISOString();
    return saveDerivative({
      id: mediaDerivativeRecordId({
        assetId: asset.id,
        presetId: targetPreset.id,
        overlay: targetOverlay,
      }),
      presetId: targetPreset.id,
      sourceAssetId: asset.id,
      variantKey: targetVariantKey,
      overlay: targetOverlay,
      pathname: uploaded.pathname,
      url: uploaded.url,
      downloadUrl: uploaded.downloadUrl,
      contentType: 'image/jpeg',
      size: rendered.blob.size,
      width: targetPreset.width,
      height: targetPreset.height,
      focalX,
      focalY,
      zoom,
      frameTimeSeconds: asset.kind === 'video' ? frameTimeSeconds : undefined,
      status: 'draft',
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async function generateCurrent() {
    setPending(true);
    setMessage('');
    try {
      const blob = await sourceBlob();
      await generatePreset(preset, blob, asset, overlay);
      setMessage(
        `${preset.label} generated as a ${overlay ? 'branded event graphic' : 'clean crop'} draft. Review and approve it below.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not generate the platform version.');
    } finally {
      setPending(false);
    }
  }

  async function generateAll() {
    setBatchPending(true);
    setMessage('');
    try {
      const blob = await sourceBlob();
      let latest = asset;
      const selectedEvent = overlay
        ? events.find((event) => event.id === overlay.eventId)
        : undefined;
      for (const targetPreset of presets) {
        const targetOverlay = selectedEvent
          ? overlayForPreset({
              event: selectedEvent,
              presetId: targetPreset.id,
              current: overlay,
            })
          : undefined;
        latest = await generatePreset(targetPreset, blob, latest, targetOverlay);
      }
      setMessage(
        `${presets.length} ${overlay ? 'branded event graphics' : 'clean platform versions'} generated as drafts. Review each before approval.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not generate the complete format set.');
    } finally {
      setBatchPending(false);
    }
  }

  async function toggleApproval() {
    if (!existing) return;
    setPending(true);
    setMessage('');
    try {
      await saveDerivative({
        ...existing,
        status: existing.status === 'approved' ? 'draft' : 'approved',
        updatedAt: new Date().toISOString(),
      });
      setMessage(
        existing.status === 'approved'
          ? 'Version returned to draft.'
          : overlay
            ? 'Branded graphic approved for this event.'
            : 'Clean crop approved for automatic event assignment.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update approval.');
    } finally {
      setPending(false);
    }
  }

  if (!presets.length) return null;

  return (
    <section className="mt-4 rounded-2xl border border-emerald-200/12 bg-emerald-200/[.035] p-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[.16em] text-emerald-100/62">
            Platform versions
          </span>
          <span className="mt-1 block text-sm text-white/58">
            {readyCount}/{presets.length} {overlay ? 'event graphics' : 'clean formats'} approved · original remains untouched
          </span>
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/52">
          {open ? 'Close' : 'Prepare formats'}
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {presets.map((item) => {
              const derivative = findMediaDerivative({
                derivatives: asset.derivatives,
                presetId: item.id,
                variantKey,
              });
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPresetId(item.id)}
                  className={`min-h-10 shrink-0 rounded-full border px-3 text-xs font-semibold ${
                    item.id === presetId
                      ? 'border-amber-200/35 bg-amber-200/12 text-amber-100'
                      : derivative?.status === 'approved'
                        ? 'border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100/75'
                        : 'border-white/10 text-white/48'
                  }`}
                >
                  {derivative?.status === 'approved' ? '✓ ' : ''}{item.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <Preview
              asset={asset}
              preset={preset}
              focalX={focalX}
              focalY={focalY}
              zoom={zoom}
              overlay={overlay}
              logoAsset={logoAsset}
            />
            <div className="space-y-4">
              <div>
                <h4 className="font-serif text-2xl text-white">{preset.label}</h4>
                <p className="mt-1 text-xs leading-5 text-white/45">{preset.description}</p>
                {preset.safeArea ? (
                  <p className="mt-2 text-xs leading-5 text-amber-100/62">
                    {preset.safeArea.label} This is a conservative editing guide, not a provider guarantee.
                  </p>
                ) : null}
              </div>

              <label className="block text-xs text-white/55">
                Horizontal focal point · {Math.round(focalX * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={focalX}
                  onChange={(event) => setFocalX(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-xs text-white/55">
                Vertical focal point · {Math.round(focalY * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={focalY}
                  onChange={(event) => setFocalY(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-xs text-white/55">
                Zoom · {zoom.toFixed(2)}×
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              {asset.kind === 'video' ? (
                <label className="block text-xs text-white/55">
                  Cover frame · {frameTimeSeconds.toFixed(1)} seconds
                  <input
                    type="range"
                    min="0"
                    max={Math.max(1, Math.min(asset.durationSeconds ?? 15, 300))}
                    step="0.1"
                    value={frameTimeSeconds}
                    onChange={(event) => setFrameTimeSeconds(Number(event.target.value))}
                    className="mt-2 w-full"
                  />
                </label>
              ) : null}

              <MediaOverlayEditor
                events={events}
                logoAssets={logoAssets}
                presetId={presetId}
                overlay={overlay}
                onChange={setOverlay}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending || batchPending}
                  onClick={() => void generateCurrent()}
                  className="min-h-11 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
                >
                  {pending ? 'Generating…' : existing ? 'Regenerate this version' : 'Generate this version'}
                </button>
                <button
                  type="button"
                  disabled={pending || batchPending}
                  onClick={() => void generateAll()}
                  className="min-h-11 rounded-full border border-white/14 px-4 text-xs font-semibold text-white/62 disabled:opacity-40"
                >
                  {batchPending ? 'Building set…' : `Build all ${presets.length} drafts`}
                </button>
              </div>

              {existing ? (
                <div className="rounded-2xl border border-white/9 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {existing.overlay ? 'Branded event graphic' : 'Clean generated version'}
                      </p>
                      <p className="mt-1 text-[11px] text-white/38">
                        {existing.width} × {existing.height} · {existing.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={pending || batchPending}
                      onClick={() => void toggleApproval()}
                      className={`min-h-10 rounded-full px-4 text-xs font-bold disabled:opacity-40 ${
                        existing.status === 'approved'
                          ? 'border border-white/12 text-white/58'
                          : 'bg-emerald-200 text-black'
                      }`}
                    >
                      {existing.status === 'approved' ? 'Return to draft' : 'Approve version'}
                    </button>
                  </div>
                  <a
                    href={existing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs font-semibold text-amber-100/70"
                  >
                    Open generated JPEG →
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          {message ? <p role="status" className="text-xs leading-5 text-amber-100/72">{message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
