'use client';

import { useLayoutEffect } from 'react';

const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';
const STAFF_SESSION_MARKER = 'staff-session';

/**
 * Legacy preview builds expected a second media access code in sessionStorage.
 * The APIs now use the signed Growth OS staff session, so this bridge only keeps
 * older media components on their direct-load path while the legacy code is
 * retired incrementally.
 */
export function MediaSessionLockBridge() {
  useLayoutEffect(() => {
    window.sessionStorage.setItem(ACCESS_SESSION_KEY, STAFF_SESSION_MARKER);

    function hideLegacyLockButtons() {
      for (const button of document.querySelectorAll('button')) {
        if (button.textContent?.includes('Lock studio')) {
          button.hidden = true;
          button.setAttribute('aria-hidden', 'true');
          button.tabIndex = -1;
        }
      }
    }

    hideLegacyLockButtons();
    const observer = new MutationObserver(hideLegacyLockButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
