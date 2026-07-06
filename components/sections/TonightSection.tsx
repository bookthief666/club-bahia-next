import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function TonightSection() { return <Section id="tonight" eyebrow="Tonight" title="Live Latin Entertainment"><Card className="grid gap-6 md:grid-cols-[1.2fr_.8fr]"><div><Badge>Dance floor energy</Badge><p className="mt-5 text-lg leading-8 text-mutedSand">Step into a cinematic Sunset Blvd room shaped by salsa rhythms, tropical noir lighting, and a crowd that comes ready to dance.</p></div><div className="rounded-2xl border border-bahiaRed/25 bg-bahiaRed/10 p-5"><h3 className="font-display text-4xl text-warmIvory">21+ Nightlife</h3><p className="mt-2 text-softGray">Government ID required. Dress code enforced at the door.</p></div></Card></Section>; }
