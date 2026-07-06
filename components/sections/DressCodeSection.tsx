import { Section } from '@/components/ui/Section';
import { dressCode } from '@/lib/constants/dress-code';

export function DressCodeSection() {
  return (
    <Section id="dress-code" eyebrow="Door Policy" title="Dress Code">
      <div className="rounded-[1.75rem] border border-warmIvory/10 bg-charcoal/56 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
        <p className="text-sm leading-6 text-mutedSand sm:text-base">{dressCode.summary}</p>
        <h3 className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-amberGlow">Not permitted</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {dressCode.notPermitted.map((item) => <li className="rounded-full border border-warmIvory/10 bg-warmIvory/5 px-3 py-1.5 text-sm text-softGray" key={item}>{item}</li>)}
        </ul>
      </div>
    </Section>
  );
}
