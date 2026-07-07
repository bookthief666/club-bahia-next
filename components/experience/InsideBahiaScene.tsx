'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { bahiaAssets, type BahiaImageAsset } from '@/lib/assets/bahia-assets';
import { BahiaSunsetLogo } from './BahiaSunsetLogo';

type CinematicScene = {
  id: string;
  eyebrow: string;
  kicker: string;
  title: string;
  line: string;
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
    eyebrow: 'Scene 01 / Sunset Blvd',
    kicker: 'Arrival on Sunset',
    title: 'Arrival on Sunset',
    line: 'Sunset arrival.',
    asset: bahiaAssets.exteriorNightFacade,
    alt: bahiaAssets.exteriorNightFacade.alt,
    imageClassName: 'object-[52%_50%] min-[360px]:object-center',
    tone: 'from-black/92 via-[#160506]/62 to-black/30',
    align: 'start',
  },
  {
    id: 'lounge',
    eyebrow: 'Scene 02 / Lounge',
    kicker: 'The Red Lounge',
    title: 'The Red Lounge',
    line: 'Red room glow.',
    asset: bahiaAssets.redLoungeVipBooths,
    alt: bahiaAssets.redLoungeVipBooths.alt,
    imageClassName: 'object-[48%_50%] min-[360px]:object-center',
    tone: 'from-[#050304]/95 via-[#2b0509]/66 to-black/28',
    align: 'end',
  },
  {
    id: 'bar',
    eyebrow: 'Scene 03 / Bar',
    kicker: 'Neon Palms',
    title: 'Neon Palms',
    line: 'Warm bar light.',
    asset: bahiaAssets.barNeonPalms,
    alt: bahiaAssets.barNeonPalms.alt,
    imageClassName: 'object-[58%_50%] min-[360px]:object-center',
    tone: 'from-black/90 via-emerald-950/54 to-[#2a0508]/30',
    align: 'start',
  },
  {
    id: 'dance-floor',
    eyebrow: 'Scene 04 / Dance',
    kicker: 'Dance Floor Energy',
    title: 'Dance Floor Energy',
    line: 'Floor in motion.',
    asset: bahiaAssets.liveDanceCrowdStage,
    alt: bahiaAssets.liveDanceCrowdStage.alt,
    imageClassName: 'object-[50%_48%]',
    tone: 'from-black/94 via-[#07180f]/58 to-[#3a0408]/35',
    align: 'end',
  },
  {
    id: 'reserve',
    eyebrow: 'Scene 05 / Tables',
    kicker: 'Reserve the Night',
    title: 'Reserve the Night',
    line: 'Friday or Saturday.',
    asset: bahiaAssets.discoBallEmptyDanceFloor,
    alt: bahiaAssets.discoBallEmptyDanceFloor.alt,
    imageClassName: 'object-[50%_42%]',
    tone: 'from-[#050304]/94 via-[#230509]/68 to-black/42',
    align: 'center',
    cta: { label: 'Start Reservation', href: '/reservations' },
  },
];

export function InsideBahiaScene() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#050304]" aria-labelledby="inside-bahia-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(225,18,27,0.22),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(25,160,93,0.14),transparent_24%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050304] to-transparent" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20">
        <p className="text-[0.64rem] uppercase tracking-[0.34em] text-red-100/75 sm:text-xs">Real venue atmosphere</p>
        <h2 id="inside-bahia-title" className="mt-3 max-w-[10ch] text-balance font-serif text-[clamp(3.35rem,17vw,9rem)] font-semibold leading-[0.78] tracking-[-0.085em] text-amber-50">
          Inside Bahia
        </h2>
      </div>

      <div className="relative z-10 mx-auto mt-8 grid max-w-7xl gap-4 px-3 pb-10 sm:px-6 sm:pb-16 md:grid-cols-12 md:gap-6">
        {scenes.map((scene, index) => (
          <motion.article
            key={scene.id}
            initial={reduceMotion ? false : { opacity: 0.84, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative mx-auto min-h-[72svh] w-full overflow-hidden rounded-[1.35rem] border border-amber-100/12 bg-[radial-gradient(circle_at_35%_20%,rgba(225,18,27,0.2),transparent_28%),linear-gradient(135deg,#160506,#020102_65%)] shadow-[0_28px_90px_rgba(0,0,0,0.5)] min-[390px]:min-h-[76svh] sm:min-h-[80svh] sm:rounded-[2.25rem] md:min-h-[72vh] ${index === 0 || index === 4 ? 'md:col-span-12' : index === 1 ? 'md:col-span-7' : index === 2 ? 'md:col-span-5' : 'md:col-span-6'}`}
            aria-label={`${scene.eyebrow}: ${scene.kicker}`}
          >
            {scene.asset ? (
              <motion.div
                className="absolute inset-0"
                initial={reduceMotion ? false : { scale: 1.055 }}
                whileInView={reduceMotion ? undefined : { scale: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={scene.asset.src}
                  alt={scene.alt ?? scene.asset.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className={`bahia-kenburns-panel ${scene.imageClassName ?? 'object-center'} object-cover opacity-90 saturate-[1.12] contrast-[1.04]`}
                />
              </motion.div>
            ) : null}
            <div className={`absolute inset-0 bg-gradient-to-t ${scene.tone}`} aria-hidden="true" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72),rgba(0,0,0,0.08)_48%,rgba(0,0,0,0.52)),radial-gradient(circle_at_50%_18%,rgba(255,231,184,0.15),transparent_22%)]" aria-hidden="true" />
            <div className="bahia-light-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-amber-100/10 to-transparent" aria-hidden="true" />
            <div className={`relative z-10 flex min-h-[72svh] p-5 min-[390px]:min-h-[76svh] sm:min-h-[80svh] sm:p-8 md:min-h-[72vh] md:p-12 ${scene.align === 'end' ? 'items-end justify-end text-right' : scene.align === 'center' ? 'items-end justify-center text-center' : 'items-end justify-start'}`}>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.55 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="w-full max-w-[38rem] pb-5 sm:pb-6"
              >
                <p className="text-[0.62rem] font-black uppercase tracking-[0.3em] text-amber-100/72 sm:text-xs">{scene.eyebrow}</p>
                <h3 className="mt-3 max-w-[11ch] text-wrap font-serif text-[clamp(2.35rem,11.6vw,7.5rem)] font-semibold leading-[0.86] tracking-[-0.065em] text-amber-50 drop-shadow-[0_8px_34px_rgba(0,0,0,0.62)] min-[390px]:text-[clamp(2.65rem,12vw,7.5rem)] sm:mt-4 sm:leading-[0.8]">
                  {scene.title}
                </h3>
                <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.2em] text-red-100/80 sm:text-sm sm:tracking-[0.28em]">{scene.line}</p>
                {scene.cta ? (
                  <BahiaSunsetLogo className="mx-auto mt-6 h-16 w-32" showFallbackText />
                ) : null}
                {scene.cta ? (
                  <Link href={scene.cta.href} className="bahia-reserve-shimmer mt-7 inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-amber-100/30 bg-red-700/30 px-6 text-xs font-black uppercase tracking-[0.2em] text-amber-50 shadow-[0_0_36px_rgba(225,18,27,0.38)] backdrop-blur transition hover:border-amber-100/60 hover:bg-red-600/45 focus:outline-none focus:ring-2 focus:ring-red-500 sm:px-8">
                    {scene.cta.label}
                  </Link>
                ) : null}
              </motion.div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
