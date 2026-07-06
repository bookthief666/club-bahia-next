import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { venue } from '@/lib/constants/venue';
export function LocationSection() { return <Section id="location" eyebrow="Sunset Blvd" title="Location"><Card><p className="text-xl text-warmIvory">{venue.fullAddress}</p><p className="mt-3 text-mutedSand">Arrive on Sunset and look for the red glow.</p><Button href={venue.mapsHref} variant="secondary" className="mt-6">Open Maps</Button></Card></Section>; }
