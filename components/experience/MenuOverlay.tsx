import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';
import { BahiaSunsetLogo } from './BahiaSunsetLogo';

export function MenuOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Menus and Events overlay" onClose={onClose}>
      <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
        <BahiaSunsetLogo className="mb-7 h-24 w-44" showFallbackText />
        <h2 className="font-serif text-[clamp(3.5rem,13vw,8.5rem)] leading-[0.8] tracking-[-0.065em]">{experienceCopy.menu.heading}</h2>
        <p className="mt-8 max-w-2xl text-xl leading-9 text-amber-50/80">{experienceCopy.menu.body}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href="tel:2132504313" className="rounded-full bg-red-600 px-6 py-3 text-center text-sm uppercase tracking-[0.22em] text-white">Call Club Bahia</a>
          <a href="#contact" className="rounded-full border border-amber-100/25 px-6 py-3 text-center text-sm uppercase tracking-[0.22em] text-amber-100">Talk To Us</a>
        </div>
      </div>
    </OverlayFrame>
  );
}
