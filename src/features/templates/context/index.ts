import { createContext } from 'react';
import type {
  RecommendedItemDefinition,
  RecommendedItemsFile,
  ImportedRecommendedItem,
  KitId,
  KitInfo,
} from '@/shared/types';
import type { ValidationResult } from '@/shared/utils/validation/recommendedItemsValidation';

/** Result of uploading a kit, includes kitId on success */
export interface UploadKitResult extends ValidationResult {
  kitId?: KitId;
}

export interface RecommendedItemsContextValue {
  // Active recommended items (from selected kit)
  recommendedItems: RecommendedItemDefinition[];

  // === Kit Selection ===

  /** All available kits (built-in + uploaded custom) */
  availableKits: KitInfo[];

  /** Currently selected kit ID */
  selectedKitId: KitId | null;

  /** Select a different kit */
  selectKit: (kitId: KitId) => void;

  // === Custom Kit Management ===

  /** Upload a new custom kit */
  uploadKit: (file: RecommendedItemsFile) => UploadKitResult;

  /** Delete an uploaded custom kit */
  deleteKit: (kitId: `custom:${string}`) => void;

  // === Kit Editing ===

  /** Update metadata of the current kit (name, description) - only for custom kits */
  updateCurrentKitMeta: (
    updates: Partial<RecommendedItemsFile['meta']>,
  ) => void;

  /** Add a new item to the current kit - only for custom kits */
  addItemToKit: (item: ImportedRecommendedItem) => void;

  /** Update an existing item in the current kit - only for custom kits */
  updateItemInKit: (
    itemId: string,
    updates: Partial<ImportedRecommendedItem>,
  ) => void;

  /** Remove an item from the current kit - only for custom kits */
  removeItemFromKit: (itemId: string) => void;

  // === Export ===

  /** Export the currently selected kit as a file */
  exportRecommendedItems: () => RecommendedItemsFile;

  // === Legacy/Backward Compat ===

  /** @deprecated Use selectedKitId !== null && isCustomKitId(selectedKitId) */
  customRecommendationsInfo: {
    name: string;
    version: string;
    itemCount: number;
  } | null;

  /** @deprecated Use !isBuiltInKitId(selectedKitId) */
  isUsingCustomRecommendations: boolean;

  /** @deprecated Use uploadKit instead */
  importRecommendedItems: (file: RecommendedItemsFile) => ValidationResult;

  /** @deprecated Use selectKit('72tuntia-standard') instead */
  resetToDefaultRecommendations: () => void;

  // Helper to get translated name for an item (language can be any string, falls back to 'en')
  getItemName: (
    item: RecommendedItemDefinition | ImportedRecommendedItem,
    language: string,
  ) => string;
}

export const RecommendedItemsContext = createContext<
  RecommendedItemsContextValue | undefined
>(undefined);
