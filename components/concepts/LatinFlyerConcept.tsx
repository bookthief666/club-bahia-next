import { PlaceholderAsset } from '@/components/concepts/PlaceholderAsset';
import { venue } from '@/lib/constants/venue';

export function LatinFlyerConcept() {
  return (
    <div className="min-h-screen bg-[#120d0a] px-3 py-20 text-[#1a0f0b] sm:px-6">
      <section className="mx-auto max-w-6xl border-4 border-black bg-[#fff0d2] p-3 shadow-[12px_12px_0_#e1121b] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,.14)_1px,transparent_0)] [background-size:9px_9px]">
        <div className="grid gap-3 md:grid-cols-4 md:auto-rows-[minmax(120px,auto)]">
          <div className="border-4 border-black bg-bahiaRed p-4 text-warmIvory md:col-span-3 md:row-span-2">
            <p className="inline-block -rotate-2 bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-amberGlow">Sunset Blvd after dark</p>
            <h1 className="mt-4 font-display text-[clamp(5rem,18vw,14rem)] leading-[.75] tracking-tight text-warmIvory [text-shadow:5px_5px_0_#111]">Club Bahia</h1>
            <p className="mt-5 max-w-2xl border-y-4 border-black py-3 font-serif text-2xl italic text-warmIvory">Entertaining Los Angeles since {venue.established}</p>
          </div>
          <div className="border-4 border-black bg-sunsetGold p-4 md:row-span-2">
            <p className="text-xs font-black uppercase tracking-[0.2em]">Ticket No. 1974</p>
            <div className="my-4 border-y-4 border-dashed border-black py-5 text-center font-display text-7xl">21+</div>
            <p className="text-sm font-black uppercase leading-6">Dress code enforced. Friday and Saturday reservations.</p>
          </div>
          <div className="border-4 border-black bg-black p-3 text-warmIvory md:col-span-2">
            {/* Future asset: future event flyer artwork. */}
            <PlaceholderAsset label="future event flyer artwork" ratio="4:5" className="border-amberGlow/50" />
          </div>
          <div className="border-4 border-black bg-[#fff8e8] p-4 md:col-span-2">
            <p className="mb-2 bg-black px-2 py-1 text-xs font-black uppercase tracking-[0.2em] text-warmIvory">Event strip</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="border-2 border-black bg-bahiaRed p-3 text-warmIvory"><strong className="font-display text-4xl">FRI</strong><p className="text-xs uppercase tracking-widest">Live Latin Entertainment</p></div>
              <div className="border-2 border-black bg-sunsetGold p-3"><strong className="font-display text-4xl">SAT</strong><p className="text-xs uppercase tracking-widest">Dance floor energy</p></div>
            </div>
          </div>
          <div className="relative border-4 border-black bg-[#f7dfb1] p-4 md:col-span-3">
            <span className="absolute -left-2 top-6 h-5 w-5 rounded-full border-4 border-black bg-[#120d0a]" />
            <span className="absolute -right-2 top-6 h-5 w-5 rounded-full border-4 border-black bg-[#120d0a]" />
            <p className="text-xs font-black uppercase tracking-[0.24em]">Reservation Ticket</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="font-serif text-3xl italic">Bahia Sunset table inquiries for Friday and Saturday nights.</p>
              <a href={venue.phoneHref} className="border-4 border-black bg-black px-5 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-warmIvory">Call {venue.phone}</a>
            </div>
          </div>
          <div className="border-4 border-black bg-bahiaRed p-4 text-warmIvory md:row-span-2">
            {/* Future asset: future palm/sunset texture. */}
            <PlaceholderAsset label="future palm/sunset texture" ratio="1:1" className="mb-4 border-white/30" />
            <p className="text-[0.65rem] font-black uppercase leading-5 tracking-[0.18em]">Fine print: upscale nightlife attire recommended. Management reserves all door decisions.</p>
          </div>
          <footer className="border-4 border-black bg-black p-4 text-warmIvory md:col-span-3">
            <p className="font-display text-4xl">{venue.address}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em]"><a href={venue.mapsHref}>Maps</a> · <a href={venue.phoneHref}>{venue.phone}</a> · Est. {venue.established}</p>
          </footer>
        </div>
      </section>
    </div>
  );
}
