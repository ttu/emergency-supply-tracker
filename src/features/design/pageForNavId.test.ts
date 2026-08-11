import { describe, it, expect } from 'vitest';
import { navIdForPage, pageForNavId } from './navMapping';
import type { DesignNavId } from '@/shared/components/design-v2/Shell';

const NAV_IDS: DesignNavId[] = ['home', 'inv', 'settings', 'help'];

describe('pageForNavId', () => {
  it('pairs every design v2 destination back with a classic page', () => {
    expect(NAV_IDS.map(pageForNavId)).toEqual([
      'dashboard',
      'inventory',
      'settings',
      'help',
    ]);
  });

  it('round-trips through navIdForPage, so switching design keeps the user in place', () => {
    // Changing the theme swaps the whole shell. Without a shared idea of
    // "where am I", the new shell mounts on its own default and a user who
    // switched design from the settings page lands on the dashboard.
    for (const nav of NAV_IDS) {
      expect(navIdForPage(pageForNavId(nav))).toBe(nav);
    }
  });
});
