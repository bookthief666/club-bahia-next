import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { venue } from '@/lib/constants/venue';

export function LocationSection() {
  return (
    <Section id="location" eyebrow="Location & Contact" title="Find the red glow on Sunset Blvd" className="pb-20 sm:pb-24">
      <Card className="border-bahiaRed/20 bg-[radial-gradient(circle_at_85%_0%,rgba(225,18,27,.2),transparent_30%),linear-gradient(135deg,rgba(23,21,26,.82),rgba(5,3,4,.78))]">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xl font-semibold text-warmIvory">{venue.fullAddress}</p>
            <a className="mt-2 inline-flex text-mutedSand underline decoration-sunsetGold underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow" href={venue.phoneHref}>{venue.phone}</a>
            <p className="mt-4 max-w-xl text-sm leading-6 text-mutedSand">Arrive on Sunset and look for the red neon, warm marquee light, and after-dark tropical noir atmosphere.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:min-w-72">
            <Button href={venue.mapsHref} variant="secondary">Open Maps</Button>
            <Button href={venue.phoneHref}>Call</Button>
          </div>
        </div>
      </Card>
    </Section>
  );
}
