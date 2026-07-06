import { Button } from '@/components/ui/Button';
import { venue } from '@/lib/constants/venue';

export function HomeHeroV2() {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-10 pt-20 sm:px-6 md:pb-14 md:pt-24 lg:pb-20">
      <div className="palm-shadow pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[0.95fr_1.05fr]">
        <div className="mx-auto w-full max-w-md md:order-2 md:max-w-lg">
          <div className="marquee-panel relative overflow-hidden rounded-[2rem] border border-sunsetGold/50 p-3 shadow-[0_24px_80px_rgba(0,0,0,.6),0_0_60px_rgba(225,18,27,.25)]">
            <div className="marquee-dots absolute inset-2 rounded-[1.55rem]" aria-hidden="true" />
            <div className="relative rounded-[1.45rem] border border-warmIvory/10 bg-bahiaBlack/70 px-5 py-6 text-center backdrop-blur-sm sm:px-7 sm:py-8">
              <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-sunsetGold/50 bg-sunsetGold/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.22em] text-amberGlow">
                <span>Est. {venue.established}</span><span className="h-1 w-1 rounded-full bg-bahiaRed" /><span>21+</span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-mutedSand">Live Latin Entertainment</p>
              <h1 className="neon-text-red mt-3 font-display text-[clamp(3.5rem,16vw,7rem)] leading-none tracking-wide">Club Bahia</h1>
              <div className="gold-divider mx-auto my-5 w-32" />
              <div className="grid grid-cols-2 gap-2 text-left text-[0.7rem] font-black uppercase tracking-[0.16em] text-warmIvory">
                <span className="rounded-2xl border border-warmIvory/10 bg-white/[0.04] px-3 py-3">Fri &amp; Sat</span>
                <span className="rounded-2xl border border-warmIvory/10 bg-white/[0.04] px-3 py-3">Dress Code</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-mutedSand">{venue.address}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button href="#reservations" className="px-3">Reserve a Night</Button>
                <Button href={venue.mapsHref} variant="secondary" className="px-3">Open Maps</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-md md:order-1 md:mx-0">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-amberGlow">Sunset Boulevard after dark</p>
          <h2 className="mt-3 font-serif text-3xl italic leading-tight text-warmIvory sm:text-4xl">A historic Latin nightlife room with a red glow and a live rhythm.</h2>
          <p className="mt-4 text-sm leading-7 text-mutedSand">Step into tropical noir lighting, marquee warmth, and dance-floor energy at Club Bahia — entertaining Los Angeles since 1974.</p>
        </div>
      </div>
    </section>
  );
}
