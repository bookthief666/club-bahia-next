import Link from 'next/link';
import { ConceptShell } from '@/components/concepts/ConceptShell';
import { PlaceholderAsset } from '@/components/concepts/PlaceholderAsset';

const concepts = [
  {
    href: '/concepts/neon-sign',
    title: 'Neon Sign',
    thesis: 'A viewport-dominant red neon venue identity: the homepage as the feeling of standing outside Club Bahia on Sunset after dark.',
    label: 'future Club Bahia SVG logo',
  },
  {
    href: '/concepts/latin-flyer',
    title: '1974 Latin Nightlife Flyer',
    thesis: 'A vintage-modern poster grid using ticket stubs, halftone texture, hard borders, offset labels, and event flyer composition.',
    label: 'future event flyer artwork',
  },
  {
    href: '/concepts/tropical-noir',
    title: 'Tropical Noir',
    thesis: 'A cinematic hospitality direction led by venue media, palm shadows, amber/red light leaks, and a practical reservation panel.',
    label: 'future hero venue photo or AI-generated background',
  },
] as const;

export default function ConceptsPage() {
  return (
    <ConceptShell className="bg-[#060405] text-warmIvory">
      <section className="mx-auto max-w-6xl px-4 py-24 sm:py-28">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-amberGlow">Club Bahia design lab</p>
        <h1 className="mt-4 max-w-4xl font-serif text-[clamp(3rem,10vw,7rem)] italic leading-none">Three radically different homepage art directions.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-mutedSand">These prototypes do not replace the production homepage. They isolate layout, tone, and asset strategy so the strongest Club Bahia direction can be chosen before deeper product work.</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {concepts.map((concept, index) => (
            <Link key={concept.href} href={concept.href} className="group block border border-white/12 bg-white/[.035] p-4 transition hover:-translate-y-1 hover:border-sunsetGold/60">
              <PlaceholderAsset label={concept.label} ratio={index === 2 ? '16:9' : '4:5'} className="mb-5" />
              <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-bahiaRed">Concept 0{index + 1}</p>
              <h2 className="mt-2 font-display text-4xl tracking-wide text-warmIvory">{concept.title}</h2>
              <p className="mt-3 text-sm leading-7 text-mutedSand">{concept.thesis}</p>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amberGlow">Open prototype →</p>
            </Link>
          ))}
        </div>
      </section>
    </ConceptShell>
  );
}
