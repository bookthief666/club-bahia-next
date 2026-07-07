'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { overlayVariants } from '@/lib/experience/experience-motion';
import { TextureLayer } from './TextureLayer';

export function OverlayFrame({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={overlayVariants}
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-[#050304] px-4 py-5 text-amber-50 sm:px-8"
    >
      <TextureLayer />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={title}
        className="fixed right-3 top-3 z-20 rounded-full border border-amber-100/25 bg-black/45 px-3 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-amber-100 backdrop-blur transition hover:border-red-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 sm:right-4 sm:top-4 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.24em]"
      >
        Close
      </button>
      <div className="relative z-10 mx-auto min-h-[calc(100svh-2.5rem)] w-full max-w-7xl overflow-x-hidden py-20 sm:py-24">{children}</div>
    </motion.div>
  );
}
