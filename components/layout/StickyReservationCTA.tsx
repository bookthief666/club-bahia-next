import { Button } from '@/components/ui/Button';

export function StickyReservationCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
      <div className="rounded-full border border-sunsetGold/20 bg-bahiaBlack/72 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.45)] backdrop-blur-xl">
        <Button href="#reservations" className="min-h-10 px-5 py-2.5 text-[0.72rem]">Reserve Tonight</Button>
      </div>
    </div>
  );
}
