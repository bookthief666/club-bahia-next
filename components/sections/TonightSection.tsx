import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';

const badges = ['21+', 'Dress Code', 'Sunset Blvd'];

export function TonightSection() {
  return (
    <Section id="tonight" eyebrow="Tonight" title="Live Latin Entertainment" className="pt-10">
      <Card className="relative overflow-hidden border-sunsetGold/20 bg-[linear-gradient(145deg,rgba(61,12,16,.82),rgba(23,21,26,.82)_46%,rgba(8,4,5,.9))]">
        <div className="absolute right-0 top-0 h-full w-24 bg-[linear-gradient(90deg,transparent,rgba(246,183,60,.12))]" />
        <div className="relative grid gap-5 md:grid-cols-[1.1fr_.9fr] md:items-end">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.34em] text-amberGlow">Tonight</p>
            <h3 className="mt-3 font-display text-[clamp(2.45rem,12vw,4.4rem)] leading-none text-warmIvory">Live Latin Entertainment</h3>
            <p className="mt-4 max-w-xl text-base leading-7 text-mutedSand">Dance floor energy, salsa rhythms, tropical noir lighting.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {badges.map((badge) => <span key={badge} className="rounded-full border border-sunsetGold/30 bg-sunsetGold/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-amberGlow">{badge}</span>)}
          </div>
        </div>
      </Card>
    </Section>
  );
}
