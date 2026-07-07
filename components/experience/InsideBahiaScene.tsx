import Image from 'next/image';
import { bahiaAssets, type BahiaImageAsset } from '@/lib/assets/bahia-assets';

type CinematicScene = {
  id: string;
  eyebrow: string;
  kicker: string;
  title: string;
  body: string;
  asset?: BahiaImageAsset;
  alt?: string;
  imageClassName?: string;
  tone: string;
  align: 'start' | 'end' | 'center';
  cta?: { label: string; href: string };
};

const scenes: CinematicScene[] = [
  {
    id: 'arrival',
    eyebrow: 'Scene 01',
    kicker: 'Sunset Blvd arrival',
    title: 'The night starts under the Bahia sign.',
    body: 'Step off Sunset into a room built for red light, live rhythm, and weekend momentum.',
    asset: bahiaAssets.exteriorNightFacade,
    alt: bahiaAssets.exteriorNightFacade.alt,
    imageClassName: 'object-[52%_50%] min-[360px]:object-center',
    tone: 'from-black/92 via-[#160506]/62 to-black/30',
    align: 'start',
  },
  {
    id: 'lounge',
    eyebrow: 'Scene 02',
    kicker: 'Red booths / private party atmosphere',
    title: 'Sink into the red lounge before the floor fills.',
    body: 'Booths, bottle-service energy, and that low private-party glow make the room feel close before it gets loud.',
    asset: bahiaAssets.redLoungeVipBooths,
    alt: bahiaAssets.redLoungeVipBooths.alt,
    imageClassName: 'object-[48%_50%] min-[360px]:object-center',
    tone: 'from-[#050304]/95 via-[#2b0509]/66 to-black/28',
    align: 'end',
  },
  {
    id: 'bar',
    eyebrow: 'Scene 03',
    kicker: 'Neon palms / drinks / interior glow',
    title: 'Green palms, red shadows, glasses catching light.',
    body: 'The bar reads like a film still: tropical neon above the pour, warm bokeh around every conversation.',
    asset: bahiaAssets.barNeonPalms,
    alt: bahiaAssets.barNeonPalms.alt,
    imageClassName: 'object-[58%_50%] min-[360px]:object-center',
    tone: 'from-black/90 via-emerald-950/54 to-[#2a0508]/30',
    align: 'start',
  },
  {
    id: 'dance-floor',
    eyebrow: 'Scene 04',
    kicker: 'Real crowd energy',
    title: 'Then the dance floor proves it is real.',
    body: 'Packed, moving, and lit in green neon — the weekend crowd is the headline, not a stock-photo promise.',
    asset: bahiaAssets.liveDanceCrowdStage,
    alt: bahiaAssets.liveDanceCrowdStage.alt,
    imageClassName: 'object-[50%_48%]',
    tone: 'from-black/94 via-[#07180f]/58 to-[#3a0408]/35',
    align: 'end',
  },
  {
    id: 'reserve',
    eyebrow: 'Scene 05',
    kicker: 'Friday + Saturday reservations',
    title: 'Bring your people. Bahia sets the scene.',
    body: 'Plan the birthday, the date night, the group table, or the late arrival — start the reservation and let the room do the rest.',
    asset: bahiaAssets.discoBallEmptyDanceFloor,
    alt: '',
    imageClassName: 'object-[50%_42%]',
    tone: 'from-[#050304]/94 via-[#230509]/68 to-black/42',
    align: 'center',
    cta: { label: 'Start Reservation', href: '/reservations' },
  },
];

export function InsideBahiaScene() {
  return (
    <section className="relative isolate overflow-hidden bg-[#050304]" aria-labelledby="inside-bahia-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(225,18,27,0.24),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(25,160,93,0.16),transparent_24%)]" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20">
        <p className="text-[0.64rem] uppercase tracking-[0.34em] text-red-100/75 sm:text-xs">Real venue atmosphere</p>
        <h2 id="inside-bahia-title" className="mt-3 max-w-[11ch] text-balance font-serif text-[clamp(3.4rem,18vw,10rem)] leading-[0.78] tracking-[-0.085em] text-amber-50">
          Inside Bahia
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-amber-50/72 sm:text-lg sm:leading-8">
          Scroll through the actual venue like a nightclub film poster — Sunset Boulevard outside, red booths inside, neon palms at the bar, and a dance floor with real proof.
        </p>
      </div>

      <div className="relative z-10 mt-8 grid gap-4 px-3 pb-10 sm:px-6 sm:pb-16 md:gap-6">
        {scenes.map((scene, index) => (
          <article key={scene.id} className="relative mx-auto min-h-[86svh] w-full max-w-7xl overflow-hidden rounded-[1.55rem] border border-amber-100/12 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.5)] sm:min-h-[88vh] sm:rounded-[2.25rem]" aria-label={`${scene.eyebrow}: ${scene.kicker}`}>
            {scene.asset && (
              <Image
                src={scene.asset.src}
                alt={scene.alt ?? scene.asset.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className={`${scene.imageClassName ?? 'object-center'} object-cover opacity-88 saturate-[1.12] contrast-[1.04]`}
              />
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${scene.tone}`} aria-hidden="true" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68),rgba(0,0,0,0.12)_48%,rgba(0,0,0,0.58)),radial-gradient(circle_at_50%_18%,rgba(255,231,184,0.16),transparent_22%)]" aria-hidden="true" />
            <div className={`relative z-10 flex min-h-[86svh] p-5 sm:min-h-[88vh] sm:p-8 md:p-12 ${scene.align === 'end' ? 'items-end justify-end text-right' : scene.align === 'center' ? 'items-end justify-center text-center' : 'items-end justify-start'}`}>
              <div className="w-full max-w-[42rem] pb-5 sm:pb-6">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.3em] text-amber-100/72 sm:text-xs">{scene.eyebrow} · {scene.kicker}</p>
                <h3 className="mt-3 text-balance font-serif text-[clamp(3.2rem,17vw,8.5rem)] leading-[0.76] tracking-[-0.085em] text-amber-50 drop-shadow-[0_8px_34px_rgba(0,0,0,0.62)] sm:mt-4">
                  {scene.title}
                </h3>
                <p className={`mt-5 text-pretty text-base leading-7 text-amber-50/82 sm:text-xl sm:leading-8 ${scene.align === 'end' ? 'ml-auto' : scene.align === 'center' ? 'mx-auto' : ''} max-w-xl`}>
                  {scene.body}
                </p>
                {scene.cta && (
                  <a href={scene.cta.href} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/30 bg-red-700/30 px-6 text-xs font-black uppercase tracking-[0.2em] text-amber-50 shadow-[0_0_36px_rgba(225,18,27,0.38)] backdrop-blur transition hover:border-amber-100/60 hover:bg-red-600/45 focus:outline-none focus:ring-2 focus:ring-red-500 sm:px-8">
                    {scene.cta.label}
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
