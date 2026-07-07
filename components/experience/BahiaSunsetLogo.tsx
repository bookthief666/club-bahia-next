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
  tone?: 'hero' | 'mark' | 'subtle';
};

export function BahiaSunsetLogo({
  className,
  imageClassName,
  fallbackClassName,
  showFallbackText = false,
  priority = false,
  tone = 'hero',
}: BahiaSunsetLogoProps) {
  const [missing, setMissing] = useState(false);

  return (
    <div className={cn('bahia-sunset-logo relative inline-flex items-center justify-center', `bahia-sunset-logo--${tone}`, className)}>
      <span className="bahia-sunset-logo__aura" aria-hidden="true" />
      {!missing ? (
        <Image
          src="/assets/bahia/logo/bahia-sunset-logo.webp"
          alt="Bahia Sunset"
          fill
          sizes="(min-width: 768px) 13rem, 9rem"
          priority={priority}
          className={cn('bahia-sunset-logo__image object-contain', imageClassName)}
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
