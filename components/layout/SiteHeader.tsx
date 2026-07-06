import { navItems } from '@/lib/constants/nav';
import { Button } from '@/components/ui/Button';

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-sunsetGold/15 bg-bahiaBlack/68 shadow-[0_10px_40px_rgba(0,0,0,.26)] backdrop-blur-xl">
      <nav aria-label="Main navigation" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <a href="#top" className="font-display text-2xl tracking-wide text-warmIvory focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow sm:text-3xl">
          Club <span className="text-bahiaRed drop-shadow-[0_0_14px_rgba(225,18,27,.45)]">Bahia</span>
        </a>
        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => <a key={item.href} href={item.href} className="text-xs font-bold uppercase tracking-[0.18em] text-mutedSand transition hover:text-warmIvory focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow">{item.label}</a>)}
          <Button href="#reservations" className="min-h-10 px-4 py-2">Reserve</Button>
        </div>
        <a href="#reservations" className="rounded-full border border-sunsetGold/50 bg-warmIvory/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-warmIvory shadow-[inset_0_1px_0_rgba(255,255,255,.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow md:hidden">Reserve</a>
      </nav>
    </header>
  );
}
