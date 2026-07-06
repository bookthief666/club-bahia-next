'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { venue } from '@/lib/constants/venue';

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 18 };

  return (
    <section id="top" className="relative isolate min-h-[82svh] overflow-hidden bg-bahiaBlack pt-20 sm:min-h-[90svh] sm:pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_28%_16%,rgba(225,18,27,.34),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(246,183,60,.2),transparent_24%),linear-gradient(180deg,#0B0B12_0%,#070405_72%)]" />
      <div className="palm-shadow absolute inset-0 -z-10 opacity-80" />
      <div className="absolute inset-x-6 top-24 -z-10 h-px bg-gradient-to-r from-transparent via-sunsetGold/50 to-transparent sm:top-32" />
      <div className="absolute bottom-0 left-0 right-0 -z-10 h-32 bg-gradient-to-t from-bahiaBlack to-transparent" />

      <motion.div
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6, ease: 'easeOut' }}
        className="mx-auto flex max-w-6xl flex-col px-4 pb-12 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8"
      >
        <Badge className="w-fit border-sunsetGold/45 bg-bahiaBlack/35 shadow-gold">{venue.alternateName}</Badge>
        <div className="mt-5 w-fit">
          <h1 className="font-display text-[clamp(4.1rem,22vw,11rem)] leading-[0.78] tracking-wide text-warmIvory drop-shadow-[0_0_22px_rgba(255,246,232,.1)]">
            <span className="block">Club</span>
            <span className="block text-bahiaRed drop-shadow-[0_0_24px_rgba(225,18,27,.52)]">Bahia</span>
          </h1>
          <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-sunsetGold via-amberGlow to-transparent shadow-gold" />
        </div>
        <p className="mt-5 w-fit rounded-full border border-sunsetGold/35 bg-sunsetGold/10 px-4 py-2 font-serif text-sm italic tracking-[0.18em] text-amberGlow shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
          Est. {venue.established}
        </p>
        <p className="mt-4 max-w-2xl text-[clamp(1.2rem,5vw,1.75rem)] font-semibold leading-tight text-warmIvory">{venue.tagline}</p>
        <p className="mt-3 max-w-xl text-sm font-medium uppercase tracking-[0.18em] text-mutedSand sm:text-base">{venue.address}</p>
        <div className="mt-7 grid gap-3 min-[420px]:grid-cols-2 sm:flex sm:flex-row">
          <Button href="#reservations" className="px-5">Make a Reservation</Button>
          <Button href="#location" variant="secondary" className="px-5">View Location</Button>
        </div>
      </motion.div>
    </section>
  );
}
