'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { bahiaAssets, type BahiaImageAsset } from '@/lib/assets/bahia-assets';

type CinematicScene = {
  id: string;
  asset?: BahiaImageAsset;
  alt?: string;
  imageClassName?: string;
  tone: string;
  cta?: { label: string; href: string };
};

const scenes: CinematicScene[] = [
  {
    id: 'arrival',
    asset: bahiaAssets.exteriorNightFacade,
    alt: bahiaAssets.exteriorNightFacade.alt,
    imageClassName: 'object-[52%_50%] min-[360px]:object-center',
    tone: 'from-black/22 via-[#160506]/10 to-black/8',
  },
  {
    id: 'lounge',
    asset: bahiaAssets.redLoungeVipBooths,
    alt: bahiaAssets.redLoungeVipBooths.alt,
    imageClassName: 'object-[48%_50%] min-[360px]:object-center',
    tone: 'from-[#050304]/20 via-[#2b0509]/10 to-black/8',
  },
  {
    id: 'bar',
    asset: bahiaAssets.barNeonPalms,
    alt: bahiaAssets.barNeonPalms.alt,
    imageClassName: 'object-[58%_50%] min-[360px]:object-center',
    tone: 'from-black/20 via-emerald-950/10 to-[#2a0508]/8',
  },
  {
    id: 'dance-floor',
    asset: bahiaAssets.liveDanceCrowdStage,
    alt: bahiaAssets.liveDanceCrowdStage.alt,
    imageClassName: 'object-[50%_48%]',
    tone: 'from-black/22 via-[#07180f]/10 to-[#3a0408]/10',
  },
  {
    id: 'reserve',
    asset: bahiaAssets.discoBallEmptyDanceFloor,
    alt: bahiaAssets.discoBallEmptyDanceFloor.alt,
    imageClassName: 'object-[50%_42%]',
    tone: 'from-[#050304]/28 via-[#230509]/14 to-black/14',
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
            aria-label={scene.alt ?? scene.asset?.alt ?? 'Club Bahia venue photo'}
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
                  className={`bahia-kenburns-panel ${scene.imageClassName ?? 'object-center'} object-cover opacity-95 saturate-[1.12] contrast-[1.04]`}
                />
              </motion.div>
            ) : null}
            <div className={`absolute inset-0 bg-gradient-to-t ${scene.tone}`} aria-hidden="true" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.28),rgba(0,0,0,0.02)_48%,rgba(0,0,0,0.22)),radial-gradient(circle_at_50%_18%,rgba(255,231,184,0.15),transparent_22%)]" aria-hidden="true" />
            <div className="bahia-light-sweep absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-amber-100/10 to-transparent" aria-hidden="true" />
            {scene.cta ? (
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-black/72 via-black/18 to-transparent px-5 pb-8 pt-28">
                <Link href={scene.cta.href} className="bahia-reserve-shimmer inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-amber-100/30 bg-red-700/35 px-6 text-xs font-black uppercase tracking-[0.2em] text-amber-50 shadow-[0_0_36px_rgba(225,18,27,0.38)] backdrop-blur transition hover:border-amber-100/60 hover:bg-red-600/45 focus:outline-none focus:ring-2 focus:ring-red-500 sm:px-8">
                  {scene.cta.label}
                </Link>
              </div>
            ) : null}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
