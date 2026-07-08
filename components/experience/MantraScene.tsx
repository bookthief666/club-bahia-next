'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { BahiaCrest } from './BahiaCrest';
import { bahiaAssets } from '@/lib/assets/bahia-assets';

const words = ['LIVE MUSIC.', 'HOT KITCHEN.', 'BIG DANCE FLOOR.'];

export function MantraScene() {
  return (
    <section id="experience-mantra" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-[clamp(1rem,5vw,2rem)] py-20 sm:min-h-screen sm:py-24 md:py-28">
      <Image src={bahiaAssets.discoBallEmptyDanceFloor.src} alt="" fill sizes="100vw" className="pointer-events-none absolute inset-0 z-0 object-cover object-center bahia-kenburns opacity-82 saturate-125 contrast-[1.03]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_42%,rgba(225,18,27,0.18),transparent_32%),linear-gradient(90deg,rgba(5,3,4,0.80),rgba(5,3,4,0.36)_48%,rgba(5,3,4,0.82)),linear-gradient(180deg,rgba(5,3,4,0.72),rgba(5,3,4,0.24)_42%,rgba(5,3,4,0.86))]" aria-hidden="true" />
      <BahiaCrest variant="watermark" className="absolute right-0 top-1/2 z-0 w-[min(34rem,62vw)] -translate-y-1/2 translate-x-[10%]" />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-3 pb-28 sm:gap-6 sm:pb-16 md:pb-12">
        {words.map((word, index) => (
          <motion.h2
            key={word}
            initial={{ opacity: 0.35, x: index % 2 === 0 ? -14 : 14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.55 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`max-w-full whitespace-nowrap font-serif text-[clamp(1.82rem,9.65vw,11.5rem)] font-semibold leading-[0.84] tracking-[-0.065em] min-[390px]:text-[clamp(2.35rem,10.8vw,11.5rem)] sm:leading-[0.76] ${index === 1 ? 'self-end text-right text-red-100 drop-shadow-[0_0_28px_rgba(225,18,27,0.48)]' : 'text-left text-amber-50'}`}
          >
            {word}
          </motion.h2>
        ))}
      </div>
      <aside className="absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-3 z-10 max-w-[11.5rem] min-[360px]:left-4 min-[360px]:max-w-[13rem] border-l border-red-500/60 bg-black/35 px-3 py-2 text-[0.56rem] uppercase tracking-[0.16em] text-amber-100/75 backdrop-blur sm:bottom-5 sm:left-8 sm:max-w-[18rem] sm:px-4 sm:py-3 sm:text-[0.66rem] sm:tracking-[0.22em]">
        <p>{experienceCopy.venue.instagram}</p>
        <p>Reservations Fri &amp; Sat</p>
        <p>{experienceCopy.venue.phone}</p>
      </aside>
    </section>
  );
}
