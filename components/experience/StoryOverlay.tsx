import Image from 'next/image';
import Link from 'next/link';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';

export function StoryOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Our Story overlay" onClose={onClose}>
      <div className="grid min-h-full items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        <figure className="relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-amber-100/14 bg-red-950/10 shadow-[0_0_70px_rgba(225,18,27,0.18)] sm:min-h-[26rem] lg:min-h-[38rem]">
          <Image src={bahiaAssets.barNeonPalms.src} alt="" fill sizes="(min-width: 1024px) 44vw, 100vw" className="bahia-kenburns-panel object-cover object-center opacity-95 saturate-125 contrast-[1.04]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,207,112,0.16),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.34))]" aria-hidden="true" />
        </figure>
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_18%_8%,rgba(225,18,27,0.18),transparent_34%),linear-gradient(135deg,rgba(255,246,232,0.06),transparent_42%)]" aria-hidden="true" />
          <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-red-100/80">Sunset Blvd after dark</p>
          <h2 className="max-w-[11ch] text-balance font-serif text-[clamp(3rem,12vw,8rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-amber-50">{experienceCopy.story.heading}</h2>
          <div className="mt-7 max-w-2xl space-y-5 text-base leading-8 text-amber-50/80 sm:text-lg">
            {experienceCopy.story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <ul className="mt-8 grid gap-2 text-[0.62rem] font-black uppercase tracking-[0.18em] text-amber-100/82 sm:grid-cols-2 sm:text-xs sm:tracking-[0.22em]">
            {experienceCopy.story.facts.map((fact) => <li key={fact} className="rounded-full border border-amber-100/16 bg-black/28 px-4 py-3 backdrop-blur-sm">{fact}</li>)}
          </ul>
          <Link href="/reservations" className="bahia-reserve-shimmer mt-9 inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-amber-100/30 bg-red-700/35 px-6 text-xs font-black uppercase tracking-[0.22em] text-amber-50 shadow-[0_0_34px_rgba(225,18,27,0.32)] transition hover:border-amber-100/60 hover:bg-red-600/45 focus:outline-none focus:ring-2 focus:ring-red-500">
            Reserve the Night
          </Link>
        </div>
      </div>
    </OverlayFrame>
  );
}
