'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { venue } from '@/lib/constants/venue';

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 18 };
  return <section id="top" className="relative isolate min-h-[92svh] overflow-hidden bg-bahiaBlack pt-28"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(225,18,27,.32),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(246,183,60,.18),transparent_26%),linear-gradient(180deg,#0B0B12,#050304_70%)]" /><div className="palm-shadow absolute inset-0 -z-10 opacity-70" /><div className="absolute bottom-0 left-0 right-0 -z-10 h-40 bg-gradient-to-t from-bahiaBlack to-transparent" /><motion.div initial={initial} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: 'easeOut' }} className="mx-auto flex max-w-6xl flex-col px-4 pb-20 pt-16 sm:px-6 lg:px-8"><Badge>{venue.alternateName} · Est. {venue.established}</Badge><h1 className="mt-6 font-display text-[5.5rem] leading-[.82] tracking-wide text-warmIvory sm:text-[8rem] lg:text-[11rem]">Club <span className="text-bahiaRed drop-shadow-[0_0_24px_rgba(225,18,27,.45)]">Bahia</span></h1><p className="mt-5 max-w-2xl font-serif text-3xl italic text-amberGlow sm:text-4xl">Est. 1974</p><p className="mt-3 max-w-2xl text-xl font-semibold text-warmIvory sm:text-2xl">{venue.tagline}</p><p className="mt-3 text-mutedSand">{venue.address}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button href="#reservations">Make a Reservation</Button><Button href="#location" variant="secondary">View Location</Button></div></motion.div></section>;
}
