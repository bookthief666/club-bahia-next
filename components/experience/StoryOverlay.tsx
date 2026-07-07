import { experienceCopy } from '@/lib/experience/experience-copy';
import { BahiaOrnament } from './BahiaOrnament';
import { OverlayFrame } from './OverlayFrame';

export function StoryOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Our Story overlay" onClose={onClose}>
      <div className="grid min-h-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-red-100/80">Sunset Blvd after dark</p>
          <h2 className="font-serif text-[clamp(3.3rem,14vw,10rem)] leading-[0.78] tracking-[-0.08em]">{experienceCopy.story.heading}</h2>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-amber-50/78">{experienceCopy.story.body}</p>
          <ul className="mt-8 grid gap-3 text-sm uppercase tracking-[0.18em] text-amber-100/75 sm:grid-cols-2">
            {experienceCopy.story.bullets.map((bullet) => <li key={bullet} className="border-t border-amber-100/15 pt-3">{bullet}</li>)}
          </ul>
        </div>
        <div className="rounded-[2rem] border border-red-500/25 bg-red-950/10 p-6 text-center shadow-[0_0_60px_rgba(225,18,27,0.16)]">
          <BahiaOrnament />
          {/* Future Club Bahia exterior illustration asset slot. */}
        </div>
      </div>
    </OverlayFrame>
  );
}
