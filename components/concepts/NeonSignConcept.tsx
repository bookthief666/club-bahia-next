import { PlaceholderAsset } from '@/components/concepts/PlaceholderAsset';
import { venue } from '@/lib/constants/venue';

const actions = [
  ['Reserve', '#reservations'],
  ['Call', venue.phoneHref],
  ['Maps', venue.mapsHref],
] as const;

export function NeonSignConcept() {
  return (
    <div className="bg-[#030203] text-warmIvory">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(225,18,27,.25),transparent_34%),radial-gradient(ellipse_at_50%_75%,rgba(246,183,60,.13),transparent_30%),linear-gradient(180deg,#050304,#030203)]" />
        <div className="absolute inset-0 palm-shadow opacity-50" />
        {/* Future asset: future palm/sunset texture can replace this CSS shadow layer. */}
        <div className="relative w-full max-w-4xl">
          <div className="mx-auto mb-5 max-w-xs">
            {/* Future asset: future Club Bahia SVG logo. */}
            <PlaceholderAsset label="future Club Bahia SVG logo" ratio="21:9" className="rounded-full opacity-70" />
          </div>
          <div className="relative mx-auto max-w-3xl px-3 py-5 sm:px-7 sm:py-8">
            <div className="absolute inset-0 rounded-[2rem] border border-sunsetGold/60 bg-black/45 shadow-[0_0_0_1px_rgba(255,207,112,.18),0_0_38px_rgba(225,18,27,.48),inset_0_0_42px_rgba(225,18,27,.16)] backdrop-blur-xl" />
            <div className="absolute -inset-3 rounded-[2.4rem] border border-bahiaRed/40 shadow-[0_0_55px_rgba(225,18,27,.42)]" />
            <div className="relative text-center drop-shadow-[0_0_24px_rgba(225,18,27,.75)]">
              <p className="text-xs font-black uppercase tracking-[0.45em] text-amberGlow">{venue.alternateName}</p>
              <h1 className="neon-text-red mt-3 font-display text-[clamp(4.2rem,24vw,13rem)] leading-[.82] tracking-wide">Club<br />Bahia</h1>
              <div className="gold-divider my-5" />
              <p className="font-serif text-2xl italic text-warmIvory sm:text-4xl">Est. {venue.established}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.35em] text-mutedSand">Live Latin Entertainment</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {actions.map(([label, href]) => <a key={label} href={href} className="rounded-full border border-sunsetGold/50 bg-sunsetGold/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(246,183,60,.2)]">{label}</a>)}
              </div>
              <div className="mx-auto mt-6 flex max-w-sm justify-center gap-2">
                {Array.from({ length: 18 }).map((_, index) => <span key={index} className="h-2 w-2 rounded-full bg-amberGlow shadow-[0_0_12px_rgba(255,207,112,.95)] animate-pulse" style={{ animationDelay: `${index * 80}ms` }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="reservations" className="mx-auto max-w-4xl px-4 pb-20">
        <div className="glass-panel grid gap-5 rounded-[1.5rem] p-5 sm:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amberGlow">Friday + Saturday reservations</p>
            <h2 className="mt-2 font-serif text-3xl italic">A compact event panel beneath the sign glow.</h2>
            <p className="mt-3 text-sm leading-7 text-mutedSand">21+ · Dress code enforced · {venue.address}</p>
          </div>
          {/* Future asset: future short video loop slot for dance floor energy. */}
          <PlaceholderAsset label="future short video loop" ratio="16:9" className="rounded-2xl" />
        </div>
      </section>
    </div>
  );
}
