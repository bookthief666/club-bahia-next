import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';

export function DressCodeOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Door Policy overlay" onClose={onClose}>
      <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center">
        <h2 className="font-serif text-[clamp(3.6rem,13vw,9rem)] leading-[0.78] tracking-[-0.08em]">{experienceCopy.dressCode.heading}</h2>
        <div className="mt-8 text-xl text-amber-50/82">{experienceCopy.dressCode.intro.map((line) => <p key={line}>{line}</p>)}</div>
        <h3 className="mt-10 text-xs uppercase tracking-[0.35em] text-red-100/80">Not permitted</h3>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {experienceCopy.dressCode.notPermitted.map((item) => <li key={item} className="border border-amber-100/12 bg-black/25 px-4 py-4 text-sm uppercase tracking-[0.18em] text-amber-100/75">{item}</li>)}
        </ul>
      </div>
    </OverlayFrame>
  );
}
