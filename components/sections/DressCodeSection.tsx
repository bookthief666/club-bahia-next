import { Section } from '@/components/ui/Section';
import { dressCode } from '@/lib/constants/dress-code';
export function DressCodeSection() { return <Section id="dress-code" eyebrow="Door Policy" title="Dress Code"><p className="text-mutedSand">{dressCode.summary}</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{dressCode.notPermitted.map((item) => <li className="rounded-2xl border border-warmIvory/10 bg-warmIvory/5 px-4 py-3 text-softGray" key={item}>Not permitted: {item}</li>)}</ul></Section>; }
