/**
 * Built-in Recommendation Kits
 *
 * This module exports pre-defined recommendation kits that ship with the app.
 * Users can select from these kits or upload their own custom kits.
 * Kit names/descriptions come from the kit file (localized); English is used when the requested language is missing.
 */

import type {
  RecommendedItemsFile,
  BuiltInKitId,
  KitInfo,
} from '@/shared/types';
import { getLocalizedKitMetaString } from '@/shared/utils/kitMeta';

// Import built-in kit JSON files
import standard72h from './72tuntia-standard.json' with { type: 'json' };
import minimal from './minimal-essentials.json' with { type: 'json' };
import none from './none.json' with { type: 'json' };

/** Map of built-in kit IDs to their data */
export const BUILT_IN_KITS: Record<BuiltInKitId, RecommendedItemsFile> = {
  '72tuntia-standard': standard72h as unknown as RecommendedItemsFile,
  'minimal-essentials': minimal as unknown as RecommendedItemsFile,
  none: none as unknown as RecommendedItemsFile,
};

/** Default kit ID for new users */
export const DEFAULT_KIT_ID: BuiltInKitId = '72tuntia-standard';

/**
 * Get a built-in kit by ID
 */
export function getBuiltInKit(kitId: BuiltInKitId): RecommendedItemsFile {
  return BUILT_IN_KITS[kitId];
}

/**
 * Get KitInfo for all built-in kits, with name/description resolved for the given language (fallback to English when missing).
 */
export function getBuiltInKitInfos(lang: string): KitInfo[] {
  return Object.entries(BUILT_IN_KITS).map(([id, kit]) => ({
    id: id as BuiltInKitId,
    name: getLocalizedKitMetaString(kit.meta.name, lang),
    description: getLocalizedKitMetaString(kit.meta.description, lang),
    itemCount: kit.items.length,
    isBuiltIn: true,
  }));
}
