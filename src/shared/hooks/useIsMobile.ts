import { useEffect, useState } from 'react';

// The v2 desktop shell reserves 232px for its sidebar; below that plus the
// Inventory page's ~950px minimum content width (category rail + filter
// strip + table), columns run off the right edge without any way to reach
// them. 1200px keeps a small margin above that ~1180px hard floor.
const MOBILE_BREAKPOINT = 1200;

/** Defensive read so we don't crash in SSR / jsdom where matchMedia is missing. */
function readMobile(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof globalThis.matchMedia !== 'function') return false;
  return globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(readMobile);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof globalThis.matchMedia !== 'function') return;
    const mq = globalThis.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}
