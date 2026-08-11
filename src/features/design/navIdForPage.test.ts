import { describe, it, expect } from 'vitest';
import { navIdForPage, pageForNavId } from './navMapping';
import type { PageType } from '@/shared/components/Navigation';

const PAGES: PageType[] = ['dashboard', 'inventory', 'settings', 'help'];

describe('navIdForPage', () => {
  it('pairs every classic page with a design v2 destination', () => {
    expect(PAGES.map(navIdForPage)).toEqual([
      'home',
      'inv',
      'settings',
      'help',
    ]);
  });

  it('round-trips through pageForNavId, so switching design keeps the user in place', () => {
    // Changing the theme swaps the whole shell. Without a shared idea of
    // "where am I", the new shell mounts on its own default and a user who
    // switched design from the settings page lands on the dashboard.
    for (const page of PAGES) {
      expect(pageForNavId(navIdForPage(page))).toBe(page);
    }
  });
});
