import { PlaceholderAsset } from '@/components/concepts/PlaceholderAsset';
import { venue } from '@/lib/constants/venue';

export function TropicalNoirConcept() {
  return (
    <div className="bg-[#050304] text-warmIvory">
      <section className="relative min-h-screen overflow-hidden px-4 py-20">
        {/* Future asset: replace with future hero venue photo or AI-generated background / future short video loop. */}
        <PlaceholderAsset label="future venue/photo/video asset" ratio="16:9" className="absolute inset-0 h-full w-full border-0 opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,3,4,.92),rgba(5,3,4,.35)_48%,rgba(5,3,4,.86)),radial-gradient(circle_at_80%_20%,rgba(246,183,60,.38),transparent_28%),radial-gradient(circle_at_20%_75%,rgba(225,18,27,.36),transparent_32%)]" />
        <div className="absolute inset-0 palm-shadow opacity-70 mix-blend-screen" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-end gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="pb-6">
            <p className="text-xs font-black uppercase tracking-[0.38em] text-amberGlow">{venue.alternateName} · Est. {venue.established}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[clamp(3.6rem,12vw,9rem)] italic leading-[.9]">Sunset Boulevard after dark.</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-mutedSand">An atmospheric Latin nightclub landing page built around cinematic venue media, warm marquee light, palm shadows, and practical reservation actions.</p>
          </div>
          <aside className="mb-4 border border-white/15 bg-black/45 p-4 shadow-[0_25px_80px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amberGlow">Reservations first</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <a href="#reserve" className="bg-bahiaRed px-5 py-4 text-center text-xs font-black uppercase tracking-[0.2em]">Reserve</a>
              <a href={venue.phoneHref} className="border border-white/20 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.2em]">Call</a>
              <a href={venue.mapsHref} className="border border-sunsetGold/40 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.2em]">Maps</a>
            </div>
            <p className="mt-5 text-sm leading-7 text-mutedSand">Friday and Saturday reservations · 21+ · dress code enforced.</p>
          </aside>
        </div>
      </section>
      <section id="reserve" className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-[.8fr_1.2fr]">
        <div className="border border-white/10 bg-white/[.04] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amberGlow">Door policy</p>
          <h2 className="mt-3 font-serif text-4xl italic">Nightlife standards, clearly stated.</h2>
          <p className="mt-4 text-sm leading-7 text-mutedSand">21+ with valid ID. Dress code enforced. Premium, direct, and mobile-first.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="aspect-[16/10] border border-sunsetGold/25 bg-[linear-gradient(135deg,rgba(246,183,60,.18),rgba(255,255,255,.04))] p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amberGlow">Hours</p>
            <p className="mt-8 font-display text-5xl">Fri / Sat</p>
            <p className="mt-2 text-sm text-mutedSand">Reservation-led weekend experience.</p>
          </div>
          <div className="aspect-[4/5] border border-bahiaRed/30 bg-[radial-gradient(circle_at_70%_20%,rgba(225,18,27,.24),transparent_35%),rgba(255,255,255,.04)] p-5">
            {/* Future asset: future palm/sunset texture. */}
            <PlaceholderAsset label="future palm/sunset texture" ratio="1:1" className="mb-4" />
            <p className="text-sm leading-7 text-mutedSand">Palm shadow and amber/red light-leak texture should make this feel cinematic, not corporate.</p>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl px-4 pb-14">
        <div className="border-t border-white/10 pt-6 text-sm text-mutedSand">
          <p className="font-serif text-3xl italic text-warmIvory">{venue.name}</p>
          <p className="mt-2">{venue.address} · <a href={venue.phoneHref}>{venue.phone}</a></p>
        </div>
      </footer>
    </div>
  );
}
