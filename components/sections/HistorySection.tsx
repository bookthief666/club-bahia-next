import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';

const stats = ['50+ years', 'Sunset Blvd', 'Latin nightlife'];

export function HistorySection() {
  return (
    <Section id="history" eyebrow="Est. 1974" title="Entertaining Los Angeles since 1974">
      <Card className="border-sunsetGold/20 bg-[linear-gradient(135deg,rgba(246,183,60,.12),rgba(23,21,26,.76)_38%,rgba(225,18,27,.1))]">
        <div className="grid gap-5 md:grid-cols-[12rem_1fr] md:items-center">
          <div className="rounded-[1.5rem] border border-sunsetGold/35 bg-bahiaBlack/38 p-5 text-center shadow-gold">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-amberGlow">Est.</p>
            <p className="mt-2 font-display text-6xl leading-none text-warmIvory">1974</p>
          </div>
          <div>
            <p className="text-base leading-7 text-mutedSand sm:text-lg">
              Club Bahia brings historic Latin nightlife to Sunset Blvd with a warm, dramatic room built for live music, dancing, and late-night Los Angeles memories.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((stat) => <div key={stat} className="rounded-2xl border border-warmIvory/10 bg-warmIvory/5 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-warmIvory">{stat}</div>)}
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
