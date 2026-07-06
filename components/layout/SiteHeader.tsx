export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <nav aria-label="Main navigation" className="mx-auto flex h-12 max-w-6xl items-center justify-between rounded-full border border-warmIvory/10 bg-bahiaBlack/70 px-4 shadow-[0_10px_40px_rgba(0,0,0,.4),0_0_30px_rgba(225,18,27,.12)] backdrop-blur-xl sm:h-14 sm:px-5">
        <a href="#top" className="font-display text-2xl tracking-wide text-warmIvory focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow sm:text-3xl">
          Club <span className="neon-text-red">Bahia</span>
        </a>
        <div className="hidden items-center gap-5 md:flex">
          <a href="#tonight" className="text-xs font-bold uppercase tracking-[0.18em] text-mutedSand transition hover:text-warmIvory focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow">Tonight</a>
          <a href="#history" className="text-xs font-bold uppercase tracking-[0.18em] text-mutedSand transition hover:text-warmIvory focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow">History</a>
          <a href="#contact" className="text-xs font-bold uppercase tracking-[0.18em] text-mutedSand transition hover:text-warmIvory focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow">Contact</a>
        </div>
        <a href="#reservations" className="rounded-full border border-sunsetGold/45 bg-sunsetGold/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-warmIvory shadow-[0_0_22px_rgba(246,183,60,.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow">Reserve</a>
      </nav>
    </header>
  );
}
