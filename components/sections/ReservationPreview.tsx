import { Button } from '@/components/ui/Button';

export function ReservationPreview() {
  return (
    <section id="reservations" className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-md md:max-w-5xl">
        <div className="marquee-panel rounded-[1.75rem] border border-sunsetGold/40 p-1.5">
          <div className="glass-panel rounded-[1.45rem] p-6 sm:p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amberGlow">Reservations</p>
              <h2 className="mt-2 font-serif text-3xl italic text-warmIvory">Friday and Saturday nights</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-mutedSand">For groups of 5 or more, phone confirmation may be required.</p>
            </div>
            <Button href="/reservations" className="mt-6 md:mt-0">Start Reservation</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
