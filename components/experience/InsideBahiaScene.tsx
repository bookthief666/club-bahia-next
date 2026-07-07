import Image from 'next/image';
import { bahiaAssets } from '@/lib/assets/bahia-assets';

const cards = [
  { asset: bahiaAssets.barNeonPalms, caption: 'Neon palms at the bar', position: 'object-center' },
  { asset: bahiaAssets.redLoungeVipBooths, caption: 'Red booth energy', position: 'object-center' },
  { asset: bahiaAssets.packedDanceFloorGreenNeon, caption: 'Dance-floor proof', position: 'object-center' },
  { asset: bahiaAssets.exteriorNightFacade, caption: 'Sunset after dark', position: 'object-center' },
];

export function InsideBahiaScene() {
  return (
    <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24" aria-labelledby="inside-bahia-title">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(225,18,27,0.22),transparent_30%),linear-gradient(180deg,rgba(5,3,4,0),rgba(5,3,4,0.92)_14%,rgba(5,3,4,1))]" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-[0.64rem] uppercase tracking-[0.34em] text-red-100/75 sm:text-xs">Real venue atmosphere</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="inside-bahia-title" className="font-serif text-[clamp(3.25rem,12vw,8rem)] leading-[0.82] tracking-[-0.075em] text-amber-50">
            Inside Bahia
          </h2>
          <p className="max-w-md text-sm leading-7 text-amber-50/70 sm:text-base">
            A compact look at the real rooms, red light, and Sunset Boulevard arrival that shape the night.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ asset, caption, position }) => (
            <figure key={asset.src} className="group overflow-hidden rounded-[1.45rem] border border-amber-100/12 bg-amber-50/[0.03] shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
              <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]">
                <Image src={asset.src} alt={asset.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className={`${position} object-cover opacity-82 saturate-110 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-95`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" aria-hidden="true" />
              </div>
              <figcaption className="border-t border-amber-100/10 px-4 py-3 text-[0.64rem] uppercase tracking-[0.18em] text-amber-100/75">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
