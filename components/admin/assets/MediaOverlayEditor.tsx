'use client';

import type { OperationsEvent } from '@/lib/admin/domain';
import type { MediaDerivativePresetId } from '@/lib/admin/assets/derivatives';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  buildDefaultMediaOverlay,
  getMediaOverlayStyle,
  MEDIA_OVERLAY_STYLES,
  type MediaOverlayAlignment,
  type MediaOverlayPlacement,
  type MediaOverlayRecipe,
  type MediaOverlayStyleId,
} from '@/lib/admin/assets/overlays';

export function MediaOverlayEditor({
  events,
  logoAssets,
  presetId,
  overlay,
  onChange,
}: {
  events: OperationsEvent[];
  logoAssets: MediaLibraryAsset[];
  presetId: MediaDerivativePresetId;
  overlay?: MediaOverlayRecipe;
  onChange: (overlay?: MediaOverlayRecipe) => void;
}) {
  const selectedEvent = overlay
    ? events.find((event) => event.id === overlay.eventId)
    : undefined;

  function enable() {
    const event = events[0];
    if (event) onChange(buildDefaultMediaOverlay(event, presetId));
  }

  function changeEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId);
    if (event) onChange(buildDefaultMediaOverlay(event, presetId));
  }

  function update(patch: Partial<MediaOverlayRecipe>) {
    if (overlay) onChange({ ...overlay, ...patch });
  }

  function changeStyle(styleId: MediaOverlayStyleId) {
    if (!overlay) return;
    const style = getMediaOverlayStyle(styleId);
    onChange({
      ...overlay,
      styleId,
      accentColor: style.accentColor,
      textColor: style.textColor,
      shadeOpacity: style.shadeOpacity,
    });
  }

  return (
    <section className="rounded-2xl border border-white/9 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-amber-100/58">
            Graphic treatment
          </p>
          <h4 className="mt-1 text-base font-semibold text-white">
            {overlay ? 'Branded event graphic' : 'Clean platform crop'}
          </h4>
          <p className="mt-1 max-w-xl text-xs leading-5 text-white/42">
            Branded graphics are saved as separate event versions, so they never overwrite the reusable clean crop or another event’s design.
          </p>
        </div>
        <button
          type="button"
          disabled={!overlay && !events.length}
          onClick={() => (overlay ? onChange(undefined) : enable())}
          className={`min-h-10 rounded-full px-4 text-xs font-bold disabled:opacity-35 ${
            overlay
              ? 'border border-white/12 text-white/58'
              : 'bg-amber-300 text-black'
          }`}
        >
          {overlay ? 'Use clean crop' : 'Add event branding'}
        </button>
      </div>

      {!events.length ? (
        <p className="mt-3 rounded-xl border border-amber-200/12 bg-amber-200/[.045] p-3 text-xs leading-5 text-amber-100/68">
          Create an event before adding event-specific title, date, time, and CTA overlays.
        </p>
      ) : null}

      {overlay ? (
        <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
          <label className="block text-xs text-white/55">
            Event
            <select
              value={overlay.eventId}
              onChange={(event) => changeEvent(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm text-white"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[.14em] text-white/42">
              Visual treatment
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {MEDIA_OVERLAY_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => changeStyle(style.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    overlay.styleId === style.id
                      ? 'border-amber-200/35 bg-amber-200/[.09]'
                      : 'border-white/9 bg-black/18'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-white/76">
                    <span
                      className="h-3 w-3 rounded-full border border-white/15"
                      style={{ backgroundColor: style.accentColor }}
                    />
                    {style.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-white/38">
                    {style.description}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/55 sm:col-span-2">
              Event title
              <textarea
                rows={2}
                value={overlay.title}
                onChange={(event) => update({ title: event.target.value })}
                maxLength={180}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 p-3 text-white"
              />
            </label>
            <label className="text-xs text-white/55">
              Date line
              <input
                value={overlay.dateLabel}
                onChange={(event) => update({ dateLabel: event.target.value })}
                maxLength={100}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              />
            </label>
            <label className="text-xs text-white/55">
              Time line
              <input
                value={overlay.timeLabel}
                onChange={(event) => update({ timeLabel: event.target.value })}
                maxLength={80}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              />
            </label>
            <label className="text-xs text-white/55 sm:col-span-2">
              CTA button
              <input
                value={overlay.cta}
                onChange={(event) => update({ cta: event.target.value })}
                maxLength={100}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
              />
            </label>
          </div>

          <details className="rounded-xl border border-white/8 bg-black/15 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-white/58">
              Advanced layout and branding
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-white/55">
                  Placement
                  <select
                    value={overlay.placement}
                    onChange={(event) =>
                      update({ placement: event.target.value as MediaOverlayPlacement })
                    }
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
                  >
                    <option value="bottom-left">Bottom</option>
                    <option value="top-left">Top</option>
                    <option value="center">Center</option>
                  </select>
                </label>
                <label className="text-xs text-white/55">
                  Alignment
                  <select
                    value={overlay.alignment}
                    onChange={(event) =>
                      update({ alignment: event.target.value as MediaOverlayAlignment })
                    }
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs text-white/55">
                Text size · {overlay.textScale.toFixed(2)}×
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.01"
                  value={overlay.textScale}
                  onChange={(event) => update({ textScale: Number(event.target.value) })}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-xs text-white/55">
                Background shade · {Math.round(overlay.shadeOpacity * 100)}%
                <input
                  type="range"
                  min="0"
                  max="0.85"
                  step="0.01"
                  value={overlay.shadeOpacity}
                  onChange={(event) => update({ shadeOpacity: Number(event.target.value) })}
                  className="mt-2 w-full"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-white/55">
                  Accent color
                  <input
                    type="color"
                    value={overlay.accentColor}
                    onChange={(event) => update({ accentColor: event.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/35 p-1"
                  />
                </label>
                <label className="text-xs text-white/55">
                  Text color
                  <input
                    type="color"
                    value={overlay.textColor}
                    onChange={(event) => update({ textColor: event.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/35 p-1"
                  />
                </label>
              </div>

              <label className="block text-xs text-white/55">
                Club Bahia identity
                <select
                  value={overlay.logoAssetId ?? ''}
                  onChange={(event) =>
                    update({ logoAssetId: event.target.value || undefined })
                  }
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
                >
                  <option value="">Typographic CLUB BAHIA wordmark</option>
                  {logoAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      Use {asset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-white/55">
                Wordmark text
                <input
                  value={overlay.wordmark}
                  onChange={(event) => update({ wordmark: event.target.value })}
                  maxLength={80}
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white"
                />
              </label>
            </div>
          </details>

          <p className="text-[11px] leading-5 text-white/36">
            {selectedEvent?.promotionTemplate
              ? `${selectedEvent.promotionTemplate.name} supplied the initial style and CTA. Event-specific edits remain authoritative.`
              : 'The event supplied the initial title, venue-local date, and time.'}
          </p>
        </div>
      ) : null}
    </section>
  );
}
