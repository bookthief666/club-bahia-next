'use client';

import { motion } from 'framer-motion';
import { experienceCopy } from '@/lib/experience/experience-copy';

const words = ['DINE.', 'DANCE.', 'BAHIA.'];

export function MantraScene() {
  return (
    <section id="experience-mantra" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-[clamp(1rem,5vw,2rem)] py-24 sm:min-h-screen sm:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-4 sm:gap-8">
        {words.map((word, index) => (
          <motion.h2
            key={word}
            initial={{ opacity: 0.35, x: index % 2 === 0 ? -14 : 14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.55 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`max-w-full overflow-visible font-serif text-[clamp(3.75rem,18vw,15rem)] leading-[0.78] tracking-[-0.075em] sm:leading-[0.72] ${index === 1 ? 'self-end text-right text-red-100 drop-shadow-[0_0_28px_rgba(225,18,27,0.48)]' : 'text-left text-amber-50'}`}
          >
            {word}
          </motion.h2>
        ))}
      </div>
      <aside className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-10 max-w-[14rem] border-l border-red-500/60 bg-black/35 px-3 py-2 text-[0.56rem] uppercase tracking-[0.16em] text-amber-100/75 backdrop-blur sm:bottom-5 sm:left-8 sm:max-w-[18rem] sm:px-4 sm:py-3 sm:text-[0.66rem] sm:tracking-[0.22em]">
        <p>{experienceCopy.venue.instagram}</p>
        <p>Reservations Fri &amp; Sat</p>
        <p>{experienceCopy.venue.phone}</p>
      </aside>
    </section>
  );
}
