import { describe, it, expect } from 'vitest';
import { navIdForPage, pageForNavId } from './navMapping';
import type { PageType } from '@/shared/components/Navigation';
import type { DesignNavId } from '@/shared/components/design-v2/Shell';

const PAGES: PageType[] = ['dashboard', 'inventory', 'settings', 'help'];
const NAV_IDS: DesignNavId[] = ['home', 'inv', 'settings', 'help'];

describe('navMapping', () => {
  it('pairs every classic page with a design v2 destination', () => {
    expect(PAGES.map(navIdForPage)).toEqual([
      'home',
      'inv',
      'settings',
      'help',
    ]);
  });

  it('pairs every design v2 destination back with a classic page', () => {
    expect(NAV_IDS.map(pageForNavId)).toEqual([
      'dashboard',
      'inventory',
      'settings',
      'help',
    ]);
  });

  it('round-trips both ways, so switching design keeps the user in place', () => {
    // Changing the theme swaps the whole shell. Without a shared idea of
    // "where am I", the new shell mounts on its own default and a user who
    // switched design from the settings page lands on the dashboard.
    for (const page of PAGES) {
      expect(pageForNavId(navIdForPage(page))).toBe(page);
    }
    for (const nav of NAV_IDS) {
      expect(navIdForPage(pageForNavId(nav))).toBe(nav);
    }
  });
});
