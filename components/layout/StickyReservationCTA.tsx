import { Button } from '@/components/ui/Button';

export function StickyReservationCTA() {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-warmIvory/10 bg-bahiaBlack/90 p-3 backdrop-blur md:hidden"><Button href="#reservations" className="w-full">Make a Reservation</Button></div>;
}
