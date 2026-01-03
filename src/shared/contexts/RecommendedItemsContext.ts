import { createContext } from 'react';
import type {
  RecommendedItemDefinition,
  RecommendedItemsFile,
  ImportedRecommendedItem,
} from '@/shared/types';
import type { ValidationResult } from '@/shared/utils/validation/recommendedItemsValidation';

export interface RecommendedItemsContextValue {
  // Active recommended items (built-in or custom)
  recommendedItems: RecommendedItemDefinition[];

  // Custom items metadata (null if using built-in)
  customRecommendationsInfo: {
    name: string;
    version: string;
    itemCount: number;
  } | null;

  // Whether using custom recommendations
  isUsingCustomRecommendations: boolean;

  // Import/export functions
  importRecommendedItems: (file: RecommendedItemsFile) => ValidationResult;
  exportRecommendedItems: () => RecommendedItemsFile;
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
