import Image from 'next/image';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';

export function DressCodeOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Door Policy overlay" onClose={onClose}>
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col justify-center overflow-hidden rounded-[2rem] border border-amber-100/10 bg-black/30 p-5 sm:p-8">
        <Image src={bahiaAssets.sunsetLineExteriorDay.src} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="pointer-events-none absolute inset-0 -z-10 object-cover object-center opacity-28 saturate-110" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,3,4,0.97),rgba(5,3,4,0.78)_54%,rgba(5,3,4,0.94)),linear-gradient(180deg,rgba(5,3,4,0.74),rgba(5,3,4,0.92))]" aria-hidden="true" />
        <h2 className="font-serif text-[clamp(3.6rem,13vw,9rem)] leading-[0.78] tracking-[-0.065em]">{experienceCopy.dressCode.heading}</h2>
        <div className="mt-8 text-xl text-amber-50/82">{experienceCopy.dressCode.intro.map((line) => <p key={line}>{line}</p>)}</div>
        <h3 className="mt-10 text-xs uppercase tracking-[0.35em] text-red-100/80">Not permitted</h3>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {experienceCopy.dressCode.notPermitted.map((item) => <li key={item} className="border border-amber-100/12 bg-black/25 px-4 py-4 text-sm uppercase tracking-[0.18em] text-amber-100/75">{item}</li>)}
        </ul>
      </div>
    </OverlayFrame>
  );
}
