'use client';

import { useEffect } from 'react';
import { lockAssetSession } from '@/lib/admin/assets/client-session';

export function MediaSessionLockBridge() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button');
      if (!button || !button.textContent?.includes('Lock studio')) return;
      void lockAssetSession();
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  return null;
}
