'use client';

import type { MediaDerivativePreset } from '@/lib/admin/assets/derivatives';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  getMediaOverlayStyle,
  type MediaOverlayRecipe,
} from '@/lib/admin/assets/overlays';

export function MediaOverlayPreview({
  overlay,
  preset,
  logoAsset,
}: {
  overlay?: MediaOverlayRecipe;
  preset: MediaDerivativePreset;
  logoAsset?: MediaLibraryAsset;
}) {
  if (!overlay) return null;
  const style = getMediaOverlayStyle(overlay.styleId);
  const isWide = preset.width / preset.height > 1.25;
  const placementClass =
    overlay.placement === 'top-left'
      ? 'justify-start'
      : overlay.placement === 'center'
        ? 'justify-center'
        : 'justify-end';
  const alignmentClass = overlay.alignment === 'center' ? 'items-center text-center' : 'items-start text-left';
  const titleSize = isWide ? 'text-[clamp(1.1rem,4vw,2.4rem)]' : 'text-[clamp(1.15rem,6vw,2.8rem)]';

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[2] flex flex-col ${placementClass} ${alignmentClass}`}
      style={{
        paddingTop: `${preset.safeArea?.topPercent ?? 6}%`,
        paddingRight: `${preset.safeArea?.rightPercent ?? 6}%`,
        paddingBottom: `${preset.safeArea?.bottomPercent ?? 6}%`,
        paddingLeft: `${preset.safeArea?.leftPercent ?? 6}%`,
        color: overlay.textColor,
        transform: `scale(${overlay.textScale})`,
        transformOrigin:
          overlay.alignment === 'center'
            ? 'center center'
            : overlay.placement === 'top-left'
              ? 'left top'
              : 'left bottom',
      }}
    >
      <div
        className={`absolute inset-0 -z-10 ${
          overlay.placement === 'top-left'
            ? 'bg-[linear-gradient(180deg,rgba(0,0,0,.78),rgba(0,0,0,.18)_58%,transparent)]'
            : 'bg-[linear-gradient(180deg,transparent_22%,rgba(0,0,0,.2)_55%,rgba(0,0,0,.82))]'
        }`}
        style={{ opacity: Math.max(0.25, overlay.shadeOpacity / 0.85) }}
      />
      <div className={isWide ? 'w-[58%]' : 'w-full'}>
        {logoAsset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoAsset.url}
            alt=""
            className="mb-[2%] max-h-[3.5rem] max-w-[38%] object-contain"
          />
        ) : null}
        <p
          className="text-[clamp(.55rem,1.8vw,1rem)] font-bold uppercase tracking-[.24em]"
          style={{ color: overlay.accentColor, fontFamily: style.bodyFont }}
        >
          {overlay.wordmark}
        </p>
        <div
          className="my-[2.2%] h-[3px] w-[24%]"
          style={{ backgroundColor: overlay.accentColor }}
        />
        <h5
          className={`${titleSize} font-bold leading-[.98] tracking-[-.035em]`}
          style={{ fontFamily: style.titleFont }}
        >
          {overlay.title}
        </h5>
        <p
          className="mt-[3%] text-[clamp(.65rem,2.3vw,1.25rem)] font-semibold"
          style={{ fontFamily: style.bodyFont }}
        >
          {overlay.dateLabel} · {overlay.timeLabel}
        </p>
        <span
          className="mt-[3%] inline-flex rounded-full px-[5%] py-[2.3%] text-[clamp(.58rem,1.8vw,1rem)] font-bold text-black"
          style={{ backgroundColor: overlay.accentColor, fontFamily: style.bodyFont }}
        >
          {overlay.cta}
        </span>
      </div>
    </div>
  );
}
