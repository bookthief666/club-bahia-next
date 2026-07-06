import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';

export function HistorySection() {
  return (
    <Section id="history" eyebrow="Since 1974" title="A Sunset Boulevard Latin nightlife landmark">
      <Card className="border-sunsetGold/15 bg-[linear-gradient(135deg,rgba(246,183,60,.1),rgba(23,21,26,.66)_34%,rgba(225,18,27,.09))]">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-sunsetGold/35 bg-sunsetGold/10 font-serif text-2xl italic text-amberGlow shadow-gold">1974</div>
          <p className="max-w-3xl text-base leading-7 text-mutedSand sm:text-lg sm:leading-8">
            Club Bahia brings historic Latin nightlife to Sunset Blvd with a warm, dramatic room built for live music, dancing, and late-night Los Angeles memories.
          </p>
        </div>
      </Card>
    </Section>
  );
}
