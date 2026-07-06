import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { venue } from '@/lib/constants/venue';
export function ContactSection() { return <Section id="contact" eyebrow="Contact" title="Call Club Bahia"><p className="text-mutedSand">Questions about tonight, dress code, or reservations?</p><Button href={venue.phoneHref} className="mt-6">{venue.phone}</Button></Section>; }
