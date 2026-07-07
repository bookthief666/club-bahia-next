import Image from 'next/image';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';

export function ReservationOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Reservations overlay" onClose={onClose}>
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col justify-center overflow-hidden rounded-[2rem] border border-amber-100/10 bg-black/25 p-5 sm:p-8">
        <Image src={bahiaAssets.redLoungeVipBooths.src} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="pointer-events-none absolute inset-0 -z-10 object-cover object-center opacity-36 saturate-125" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,3,4,0.96),rgba(5,3,4,0.74)_52%,rgba(5,3,4,0.9)),radial-gradient(circle_at_78%_28%,rgba(225,18,27,0.26),transparent_34%)]" aria-hidden="true" />
        <h2 className="font-serif text-[clamp(3.8rem,14vw,9rem)] leading-[0.78] tracking-[-0.065em]">{experienceCopy.reservations.heading}</h2>
        <div className="mt-8 grid gap-4 text-lg text-amber-50/80 sm:grid-cols-2">
          {experienceCopy.reservations.lines.map((line) => <p key={line} className="border-t border-red-500/30 bg-black/20 pt-4 backdrop-blur-[1px]">{line}</p>)}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href="/reservations" className="rounded-full border border-amber-100/25 bg-black/25 px-6 py-3 text-center text-sm uppercase tracking-[0.18em] text-amber-100 transition hover:border-red-300/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 sm:tracking-[0.22em]">Start Reservation</a>
          <a href="tel:2132504313" className="rounded-full bg-red-600 px-6 py-3 text-center text-sm uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(225,18,27,0.35)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 sm:tracking-[0.22em]">Call Club Bahia</a>
        </div>
      </div>
    </OverlayFrame>
  );
}
