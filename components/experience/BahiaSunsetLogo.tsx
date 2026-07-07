'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BahiaCrest } from './BahiaCrest';
import { cn } from '@/lib/utils/cn';

type BahiaSunsetLogoProps = {
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
  showFallbackText?: boolean;
};

export function BahiaSunsetLogo({
  className,
  imageClassName,
  fallbackClassName,
  showFallbackText = false,
  priority = false,
}: BahiaSunsetLogoProps) {
  const [missing, setMissing] = useState(false);

  return (
    <div className={cn('bahia-sunset-logo relative inline-flex items-center justify-center', className)}>
      {!missing ? (
        <Image
          src="/assets/bahia/logo/bahia-sunset-logo.webp"
          alt="Bahia Sunset"
          fill
          sizes="(min-width: 768px) 13rem, 9rem"
          priority={priority}
          className={cn('object-contain drop-shadow-[0_0_18px_rgba(225,18,27,0.38)]', imageClassName)}
          onError={() => setMissing(true)}
        />
      ) : (
        <div className={cn('flex items-center gap-2', fallbackClassName)}>
          <BahiaCrest variant="mark" aria-hidden="true" />
          {showFallbackText ? <span className="font-serif text-lg tracking-[-0.03em] text-amber-50">Bahia Sunset</span> : null}
        </div>
      )}
    </div>
  );
}
