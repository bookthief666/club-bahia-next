import { Button } from '@/components/ui/Button';
import { venue } from '@/lib/constants/venue';

export function LocationContact() {
  return (
    <section id="contact" className="px-4 py-12 pb-28 sm:px-6 md:py-16 md:pb-20">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-sunsetGold/35 bg-[linear-gradient(135deg,rgba(225,18,27,.2),rgba(246,183,60,.08)_45%,rgba(0,0,0,.45))] p-6 shadow-[0_24px_80px_rgba(0,0,0,.45)] sm:p-8 md:p-10">
          <div className="palm-shadow absolute inset-0 opacity-45" aria-hidden="true" />
          <div className="relative max-w-md">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amberGlow">Location</p>
            <h2 className="mt-2 font-serif text-4xl italic leading-tight text-warmIvory">Find the Red Glow on Sunset</h2>
            <p className="mt-4 text-mutedSand">{venue.address}</p>
            <p className="mt-1 text-mutedSand">{venue.phone}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={venue.mapsHref}>Open Maps</Button>
              <Button href={venue.phoneHref} variant="secondary">Call</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
