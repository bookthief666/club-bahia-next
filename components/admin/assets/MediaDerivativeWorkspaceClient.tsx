'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  derivativeReadinessCount,
  mediaDerivativePresetsForKind,
} from '@/lib/admin/assets/derivatives';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { MediaDerivativeStudio } from './MediaDerivativeStudio';

const LIBRARY_API = '/api/admin/assets/library';
const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';

export function MediaDerivativeWorkspaceClient() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [events, setEvents] = useState<OperationsEvent[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [pending, setPending] = useState(true);
  const [message, setMessage] = useState('');

  async function load(code = '') {
    setPending(true);
    setMessage('');
    try {
      const [response, loadedEvents] = await Promise.all([
        fetch(LIBRARY_API, {
          cache: 'no-store',
          headers: code ? { 'x-admin-asset-key': code } : {},
        }),
        eventRepository.listEvents(),
      ]);
      const result = (await response.json()) as {
        assets?: MediaLibraryAsset[];
        error?: string;
      };
      if (!response.ok || !result.assets) {
        if (response.status === 401) setNeedsUnlock(true);
        throw new Error(result.error || 'Could not load media for format preparation.');
      }
      const eligible = result.assets.filter(
        (asset) =>
          asset.status === 'active' &&
          (asset.kind === 'image' || asset.kind === 'video'),
      );
      setAssets(eligible);
      setEvents(
        loadedEvents.filter(
          (event) => event.status !== 'archived' && event.status !== 'cancelled',
        ),
      );
      setSelectedId((current) =>
        eligible.some((asset) => asset.id === current)
          ? current
          : eligible[0]?.id ?? '',
      );
      setNeedsUnlock(false);
      if (code) sessionStorage.setItem(ACCESS_SESSION_KEY, code);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load platform media.');
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(ACCESS_SESSION_KEY) ?? '';
    setAccessCode(saved);
    void load(saved);
  }, []);

  const selected = assets.find((asset) => asset.id === selectedId);
  const logoAssets = useMemo(
    () =>
      assets.filter(
        (asset) => asset.kind === 'image' && asset.role === 'logo',
      ),
    [assets],
  );
  const readySets = useMemo(
    () =>
      assets.filter((asset) => {
        const required = mediaDerivativePresetsForKind(asset.kind).length;
        return required > 0 && derivativeReadinessCount(asset.derivatives) >= required;
      }).length,
    [assets],
  );
  const draftCount = assets.reduce(
    (total, asset) =>
      total +
      (asset.derivatives ?? []).filter((derivative) => derivative.status === 'draft')
        .length,
    0,
  );
  const brandedCount = assets.reduce(
    (total, asset) =>
      total +
      (asset.derivatives ?? []).filter(
        (derivative) => derivative.status === 'approved' && Boolean(derivative.overlay),
      ).length,
    0,
  );

  if (needsUnlock) {
    return (
      <section className="mb-5 rounded-[1.5rem] border border-amber-200/14 bg-amber-200/[.04] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-amber-100/60">
          Platform Version Builder
        </p>
        <h2 className="mt-1 font-serif text-3xl text-white">Unlock protected media</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">
          Preview deployments use the same temporary media access code. Production uses the signed Growth OS session.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
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
            className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 text-white"
          />
          <button
            disabled={pending || !accessCode.trim()}
            className="min-h-11 rounded-full bg-amber-300 px-5 text-xs font-bold text-black disabled:opacity-40"
          >
            Open builder
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mb-5 overflow-hidden rounded-[1.6rem] border border-emerald-200/12 bg-[linear-gradient(135deg,rgba(8,40,31,.9),rgba(20,15,12,.94)_58%,rgba(35,23,8,.88))] p-4 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-200/65">
            Platform Version Builder
          </p>
          <h2 className="mt-1 font-serif text-3xl text-white sm:text-4xl">
            Prepare crops and finished event graphics.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
            Create clean reusable formats or event-specific graphics with Club Bahia identity, title, date, time, CTA, focal point, zoom, and independent approval.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Clean sets', readySets],
            ['Branded', brandedCount],
            ['Drafts', draftCount],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl border border-white/9 bg-black/18 p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-white/32">{label as string}</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-100">{value as number}</p>
            </div>
          ))}
        </div>
      </div>

      {pending ? (
        <p className="mt-5 rounded-2xl border border-white/8 bg-black/18 p-4 text-sm text-white/42">
          Loading reusable media…
        </p>
      ) : assets.length ? (
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-[.14em] text-white/44">
            Choose original media
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm normal-case tracking-normal text-white"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} · {asset.kind} · {derivativeReadinessCount(asset.derivatives)}/{mediaDerivativePresetsForKind(asset.kind).length} clean formats approved
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <MediaDerivativeStudio
              asset={selected}
              events={events}
              logoAssets={logoAssets.filter((logo) => logo.id !== selected.id)}
              accessCode={accessCode}
              onSaved={(saved) =>
                setAssets((current) =>
                  current.map((asset) => (asset.id === saved.id ? saved : asset)),
                )
              }
            />
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center">
          <h3 className="font-serif text-2xl text-white">No reusable image or video yet</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/42">
            Save an approved event image or video to the Media Library first. Audio and PDFs do not need platform crops.
          </p>
        </div>
      )}
      {message ? <p role="status" className="mt-4 text-sm text-amber-100/72">{message}</p> : null}
    </section>
  );
}
