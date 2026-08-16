import type { PageType } from '@/shared/components/Navigation';
import type { DesignNavId } from '@/shared/components/design-v2/Shell';

/**
 * The classic shell and the design v2 shell name the same four destinations
 * differently. Selecting a v2 theme swaps one shell for the other mid-session,
 * so the two vocabularies have to translate — otherwise the incoming shell
 * starts on its own default and drops the user wherever that happens to be.
 */
const PAGE_TO_NAV: Record<PageType, DesignNavId> = {
  dashboard: 'home',
  inventory: 'inv',
  settings: 'settings',
  help: 'help',
};

const NAV_TO_PAGE: Record<DesignNavId, PageType> = {
  home: 'dashboard',
  inv: 'inventory',
  settings: 'settings',
  help: 'help',
};

export function navIdForPage(page: PageType): DesignNavId {
  return PAGE_TO_NAV[page];
}

export function pageForNavId(nav: DesignNavId): PageType {
  return NAV_TO_PAGE[nav];
}
