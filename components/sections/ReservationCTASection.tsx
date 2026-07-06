import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ReservationCTASection() {
  return (
    <Section id="reservations" eyebrow="Reservations" title="Reservation Preview">
      <Card className="overflow-hidden border-bahiaRed/25 bg-[radial-gradient(circle_at_12%_0%,rgba(225,18,27,.22),transparent_34%),linear-gradient(135deg,rgba(23,21,26,.86),rgba(5,3,4,.78))]">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-lg font-semibold text-warmIvory">Reservations are available for Friday and Saturday nights.</p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-mutedSand sm:text-base">
              <p>For groups of 5 or more, phone confirmation may be required.</p>
              <p>Full reservation flow coming next.</p>
            </div>
          </div>
          <Button href="#reservations" className="w-full md:w-auto">Start Reservation</Button>
        </div>
      </Card>
    </Section>
  );
}
