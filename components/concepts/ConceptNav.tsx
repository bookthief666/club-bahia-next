import Link from 'next/link';

const links = [
  ['Lab', '/concepts'],
  ['Neon Sign', '/concepts/neon-sign'],
  ['Latin Flyer', '/concepts/latin-flyer'],
  ['Tropical Noir', '/concepts/tropical-noir'],
] as const;

export function ConceptNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-3" aria-label="Concept navigation">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="shrink-0 border border-white/15 bg-black/55 px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.16em] text-warmIvory backdrop-blur-xl transition hover:border-sunsetGold/60">
          {label}
        </Link>
      ))}
    </nav>
  );
}
