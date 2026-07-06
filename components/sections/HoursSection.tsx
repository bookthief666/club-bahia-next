import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { hours } from '@/lib/constants/hours';

export function HoursSection() {
  return (
    <Section id="hours" eyebrow="Hours" title="Hours">
      <Card className="p-4 sm:p-5">
        <div className="divide-y divide-warmIvory/10">
          {hours.map((item) => (
            <div key={item.day} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <span className="text-sm font-bold text-warmIvory sm:text-base">{item.day}</span>
              <span className="text-right text-sm text-mutedSand sm:text-base">{item.time}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl border border-amberGlow/25 bg-sunsetGold/10 px-4 py-3 text-sm font-semibold text-amberGlow">Hours must be verified before production.</p>
      </Card>
    </Section>
  );
}
