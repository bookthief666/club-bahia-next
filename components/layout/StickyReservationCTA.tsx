import { Button } from '@/components/ui/Button';

export function StickyReservationCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pointer-events-none md:hidden">
      <Button href="/reservations" className="pointer-events-auto min-h-11 gap-2 px-5 py-2.5 shadow-[0_16px_50px_rgba(0,0,0,.44),0_0_32px_rgba(225,18,27,.32)]">
        <span>Reserve</span>
        <span className="text-[0.62rem] font-bold tracking-[0.12em] text-warmIvory/75">Fri &amp; Sat</span>
      </Button>
    </div>
  );
}
