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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#050304] px-4 py-5 text-amber-50 sm:px-8"
    >
      <TextureLayer />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={title}
        className="fixed right-4 top-4 z-20 rounded-full border border-amber-100/25 bg-black/45 px-4 py-3 text-xs uppercase tracking-[0.24em] text-amber-100 backdrop-blur transition hover:border-red-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Close
      </button>
      <div className="relative z-10 mx-auto min-h-[calc(100vh-2.5rem)] max-w-7xl py-20 sm:py-24">{children}</div>
    </motion.div>
  );
}
