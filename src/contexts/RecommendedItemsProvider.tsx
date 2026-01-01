import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type {
  RecommendedItemDefinition,
  RecommendedItemsFile,
  ImportedRecommendedItem,
  LocalizedNames,
} from '../types';
import { RECOMMENDED_ITEMS } from '../data/recommendedItems';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '../utils/storage/localStorage';
import { RecommendedItemsContext } from './RecommendedItemsContext';
import {
  validateRecommendedItemsFile,
  convertToRecommendedItemDefinitions,
} from '../utils/validation/recommendedItemsValidation';
import type { ValidationResult } from '../utils/validation/recommendedItemsValidation';

// Store inline names for custom items (items without i18nKey)
// Map from item ID to localized names object
type InlineNames = Map<string, LocalizedNames>;

export function RecommendedItemsProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Custom recommended items file (null means using built-in)
  const [customRecommendedItems, setCustomRecommendedItems] =
    useState<RecommendedItemsFile | null>(() => {
      const data = getAppData();
      return data?.customRecommendedItems ?? null;
    });

  // Inline names for custom items (not stored in localStorage, derived from customRecommendedItems)
  const inlineNames = useMemo<InlineNames>(() => {
    const names = new Map<string, LocalizedNames>();
    if (customRecommendedItems) {
      for (const item of customRecommendedItems.items) {
        if (!item.i18nKey && item.names) {
          names.set(item.id, item.names);
        }
      }
    }
    return names;
  }, [customRecommendedItems]);

  // Convert custom items to RecommendedItemDefinition format
  const recommendedItems = useMemo<RecommendedItemDefinition[]>(() => {
    if (!customRecommendedItems) {
      return RECOMMENDED_ITEMS;
    }
    return convertToRecommendedItemDefinitions(customRecommendedItems.items);
  }, [customRecommendedItems]);

  // Custom recommendations info
  const customRecommendationsInfo = useMemo(() => {
    if (!customRecommendedItems) {
      return null;
    }
    return {
      name: customRecommendedItems.meta.name,
      version: customRecommendedItems.meta.version,
      itemCount: customRecommendedItems.items.length,
    };
  }, [customRecommendedItems]);

  const isUsingCustomRecommendations = customRecommendedItems !== null;

  // Save to localStorage when customRecommendedItems changes
  useEffect(() => {
    const data = getAppData() || createDefaultAppData();
    data.customRecommendedItems = customRecommendedItems;
    // Clear disabled items when recommendations change (IDs may no longer exist)
    data.disabledRecommendedItems = [];
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [customRecommendedItems]);

  const importRecommendedItems = useCallback(
    (file: RecommendedItemsFile): ValidationResult => {
      const result = validateRecommendedItemsFile(file);
      if (result.valid) {
        setCustomRecommendedItems(file);
      }
      return result;
    },
    [],
  );

  const exportRecommendedItems = useCallback((): RecommendedItemsFile => {
    if (customRecommendedItems) {
      return customRecommendedItems;
    }

    // Export built-in items as a file
    const items: ImportedRecommendedItem[] = RECOMMENDED_ITEMS.map((item) => ({
      id: item.id,
      i18nKey: item.i18nKey,
      category: item.category,
      baseQuantity: item.baseQuantity,
      unit: item.unit,
      scaleWithPeople: item.scaleWithPeople,
      scaleWithDays: item.scaleWithDays,
      requiresFreezer: item.requiresFreezer,
      defaultExpirationMonths: item.defaultExpirationMonths,
      weightGramsPerUnit: item.weightGramsPerUnit,
      caloriesPer100g: item.caloriesPer100g,
      caloriesPerUnit: item.caloriesPerUnit,
      capacityMah: item.capacityMah,
      capacityWh: item.capacityWh,
      requiresWaterLiters: item.requiresWaterLiters,
    }));

    return {
      meta: {
        name: '72tuntia.fi Standard Kit',
        version: '1.0.0',
        description:
          'Default 72-hour emergency supply recommendations based on 72tuntia.fi guidelines',
        source: 'https://72tuntia.fi',
        createdAt: new Date().toISOString(),
        language: 'en',
      },
      items,
    };
  }, [customRecommendedItems]);

  const resetToDefaultRecommendations = useCallback(() => {
    setCustomRecommendedItems(null);
  }, []);

  const getItemName = useCallback(
    (
      item: RecommendedItemDefinition | ImportedRecommendedItem,
      language: string,
    ): string => {
      // If item has i18nKey that doesn't start with 'custom.', it uses translation system
      // The actual translation lookup happens in components using useTranslation
      // Here we just return the inline name for custom items

      const importedItem = item as ImportedRecommendedItem;

      // Check if this is a custom item with inline names (from stored state)
      if (inlineNames.has(item.id)) {
        const names = inlineNames.get(item.id)!;
        // Try requested language, fall back to English, fall back to first available, fall back to ID
        return (
          names[language] || names.en || Object.values(names)[0] || item.id
        );
      }

      // For items with inline names on the item itself (during import preview)
      if (importedItem.names) {
        const names = importedItem.names;
        return (
          names[language] || names.en || Object.values(names)[0] || item.id
        );
      }

      // For items with i18nKey, return the key (caller should use translation)
      // Strip 'products.' or 'custom.' prefix for display fallback
      const i18nKey = 'i18nKey' in item ? item.i18nKey : undefined;
      if (i18nKey) {
        return i18nKey.replace(/^(products\.|custom\.)/, '');
      }

      return item.id;
    },
    [inlineNames],
  );

  return (
    <RecommendedItemsContext.Provider
      value={{
        recommendedItems,
        customRecommendationsInfo,
        isUsingCustomRecommendations,
        importRecommendedItems,
        exportRecommendedItems,
        resetToDefaultRecommendations,
        getItemName,
      }}
    >
      {children}
    </RecommendedItemsContext.Provider>
  );
}
