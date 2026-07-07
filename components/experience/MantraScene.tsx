'use client';

import { motion } from 'framer-motion';
import { experienceCopy } from '@/lib/experience/experience-copy';

const words = ['DINE.', 'DANCE.', 'BAHIA.'];

export function MantraScene() {
  return (
    <section id="experience-mantra" className="relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-28 sm:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        {words.map((word, index) => (
          <motion.h2
            key={word}
            initial={{ opacity: 0.35, x: index % 2 === 0 ? -28 : 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.55 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`font-serif text-[clamp(4.4rem,18vw,15rem)] leading-[0.72] tracking-[-0.08em] ${index === 1 ? 'text-right text-red-100 drop-shadow-[0_0_28px_rgba(225,18,27,0.48)]' : 'text-amber-50'}`}
          >
            {word}
          </motion.h2>
        ))}
      </div>
      <aside className="absolute bottom-5 left-4 z-10 max-w-[18rem] border-l border-red-500/60 bg-black/25 px-4 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-amber-100/75 backdrop-blur sm:left-8">
        <p>{experienceCopy.venue.instagram}</p>
        <p>Reservations Fri &amp; Sat</p>
        <p>{experienceCopy.venue.phone}</p>
      </aside>
    </section>
  );
}
