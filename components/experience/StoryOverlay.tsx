import Image from 'next/image';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';

export function StoryOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Our Story overlay" onClose={onClose}>
      <div className="grid min-h-full items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <figure className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-red-500/25 bg-red-950/10 shadow-[0_0_60px_rgba(225,18,27,0.16)] sm:min-h-[24rem] lg:min-h-[34rem]">
          <Image src={bahiaAssets.barNeonPalms.src} alt={bahiaAssets.barNeonPalms.alt} fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover object-center opacity-86 saturate-125" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/16 to-transparent" aria-hidden="true" />
          <figcaption className="absolute bottom-0 left-0 right-0 px-5 py-4 text-[0.62rem] uppercase tracking-[0.2em] text-amber-100/75 sm:px-6">
            Neon palms, red glow, Sunset Boulevard history
          </figcaption>
        </figure>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-red-100/80">Sunset Blvd after dark</p>
          <h2 className="font-serif text-[clamp(3.3rem,14vw,10rem)] leading-[0.78] tracking-[-0.08em]">{experienceCopy.story.heading}</h2>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-amber-50/78">{experienceCopy.story.body}</p>
          <ul className="mt-8 grid gap-3 text-sm uppercase tracking-[0.18em] text-amber-100/75 sm:grid-cols-2">
            {experienceCopy.story.bullets.map((bullet) => <li key={bullet} className="border-t border-amber-100/15 pt-3">{bullet}</li>)}
          </ul>
        </div>
      </div>
    </OverlayFrame>
  );
}
