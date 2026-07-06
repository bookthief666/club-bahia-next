import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { hours } from '@/lib/constants/hours';
export function HoursSection() { return <Section id="hours" eyebrow="Hours" title="Hours"><Card>{hours.map((item) => <div key={item.day} className="flex justify-between border-b border-warmIvory/10 py-3 last:border-0"><span className="text-warmIvory">{item.day}</span><span className="text-mutedSand">{item.time}</span></div>)}</Card></Section>; }
