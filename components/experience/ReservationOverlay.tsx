import { experienceCopy } from '@/lib/experience/experience-copy';
import { OverlayFrame } from './OverlayFrame';

export function ReservationOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayFrame title="Close Reservations overlay" onClose={onClose}>
      <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
        <h2 className="font-serif text-[clamp(3.8rem,14vw,9rem)] leading-[0.78] tracking-[-0.065em]">{experienceCopy.reservations.heading}</h2>
        <div className="mt-8 grid gap-4 text-lg text-amber-50/80 sm:grid-cols-2">
          {experienceCopy.reservations.lines.map((line) => <p key={line} className="border-t border-red-500/30 pt-4">{line}</p>)}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button disabled className="rounded-full border border-amber-100/25 px-6 py-3 text-sm uppercase tracking-[0.22em] text-amber-100/55">Start Reservation — Coming Soon</button>
          <a href={`tel:${experienceCopy.venue.phone.replace(/[^0-9]/g, '')}`} className="rounded-full bg-red-600 px-6 py-3 text-center text-sm uppercase tracking-[0.22em] text-white shadow-[0_0_30px_rgba(225,18,27,0.35)]">Call Club Bahia</a>
        </div>
      </div>
    </OverlayFrame>
  );
}
