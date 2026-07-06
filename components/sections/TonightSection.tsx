import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function TonightSection() {
  return (
    <Section id="tonight" eyebrow="Tonight" title="Live Latin Entertainment" className="pt-10 sm:pt-14">
      <Card className="grid gap-5 overflow-hidden border-sunsetGold/15 bg-[linear-gradient(135deg,rgba(225,18,27,.13),rgba(23,21,26,.68)_42%,rgba(246,183,60,.08))] md:grid-cols-[1.15fr_.85fr]">
        <div>
          <Badge>Dance floor energy</Badge>
          <p className="mt-5 max-w-2xl text-base leading-7 text-mutedSand sm:text-lg sm:leading-8">
            Step into a cinematic Sunset Blvd room shaped by salsa rhythms, red neon, warm marquee light, and a crowd that comes ready to dance.
          </p>
        </div>
        <div className="rounded-3xl border border-bahiaRed/25 bg-bahiaBlack/42 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-amberGlow">After dark</p>
          <h3 className="mt-3 font-display text-[clamp(2.3rem,12vw,3.5rem)] leading-none text-warmIvory">21+ Nightlife</h3>
          <p className="mt-3 text-sm leading-6 text-softGray sm:text-base">Government ID required. Dress code enforced at the door.</p>
        </div>
      </Card>
    </Section>
  );
}
