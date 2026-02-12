import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  RecommendedItemDefinition,
  RecommendedItemsFile,
  ImportedRecommendedItem,
  ImportedCategory,
  LocalizedNames,
  KitId,
  KitInfo,
  UploadedKit,
  Category,
} from '@/shared/types';
import {
  isBuiltInKitId,
  isCustomKitId,
  getCustomKitUuid,
  createCustomKitId,
  createCategoryId,
} from '@/shared/types';
import { getLocalizedKitMetaString } from '@/shared/utils/kitMeta';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '@/shared/utils/storage/localStorage';
import { notifyStorageChange } from '@/shared/hooks/useLocalStorageSync';
import { RecommendedItemsContext } from '../context';
import type { UploadKitResult } from '../context';
import {
  validateRecommendedItemsFile,
  convertToRecommendedItemDefinitions,
} from '@/shared/utils/validation/recommendedItemsValidation';
import type { ValidationResult } from '@/shared/utils/validation/recommendedItemsValidation';
import {
  BUILT_IN_KITS,
  DEFAULT_KIT_ID,
  getBuiltInKit,
  getBuiltInKitInfos,
} from '../kits';

// Store inline names for custom items (items without i18nKey)
// Map from item ID to localized names object
type InlineNames = Map<string, LocalizedNames>;

/** Update a kit's items with a transformer function */
function updateKitItems(
  kit: UploadedKit,
  targetUuid: string,
  transformer: (items: ImportedRecommendedItem[]) => ImportedRecommendedItem[],
): UploadedKit {
  if (kit.id !== targetUuid) return kit;
  return {
    ...kit,
    file: {
      ...kit.file,
      items: transformer(kit.file.items),
    },
  };
}

/** Generate a UUID v4 */
function generateUuid(): string {
  return crypto.randomUUID();
}

/** Convert imported categories from a kit file to Category objects */
function convertImportedCategories(
  categories: ImportedCategory[] | undefined,
  sourceKitId: KitId,
): Category[] {
  if (!categories || categories.length === 0) {
    return [];
  }

  return categories.map((imported) => ({
    id: createCategoryId(imported.id),
    name: imported.names.en || Object.values(imported.names)[0] || imported.id,
    names: imported.names,
    icon: imported.icon,
    isCustom: true,
    descriptions: imported.description,
    sortOrder: imported.sortOrder,
    color: imported.color,
    sourceKitId,
  }));
}

export function RecommendedItemsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { i18n } = useTranslation('common');

  // Initialize both kit states together to avoid stale references
  const [uploadedKits, setUploadedKits] = useState<UploadedKit[]>(() => {
    const data = getAppData();
    return data?.uploadedRecommendationKits ?? [];
  });

  // Selected kit ID - validates against uploaded kits on initial load
  const [selectedKitId, setSelectedKitId] = useState<KitId>(() => {
    const data = getAppData();
    const storedKitId = data?.selectedRecommendationKit ?? DEFAULT_KIT_ID;

    // Validate custom kit still exists (guard against stale selection)
    if (isCustomKitId(storedKitId)) {
      const storedKits = data?.uploadedRecommendationKits ?? [];
      const uuid = getCustomKitUuid(storedKitId);
      const kitExists = storedKits.some((k) => k.id === uuid);
      if (!kitExists) {
        return DEFAULT_KIT_ID;
      }
    }
    return storedKitId;
  });

  // Track whether this is the initial mount to prevent unnecessary localStorage writes
  const isInitialMount = useRef(true);

  // Get current kit file based on selected ID
  const currentKitFile = useMemo<RecommendedItemsFile | undefined>(() => {
    if (isBuiltInKitId(selectedKitId)) {
      return getBuiltInKit(selectedKitId);
    }

    if (isCustomKitId(selectedKitId)) {
      const uuid = getCustomKitUuid(selectedKitId);
      const kit = uploadedKits.find((k) => k.id === uuid);
      return kit?.file;
    }

    return undefined;
  }, [selectedKitId, uploadedKits]);

  // Build inline names map for custom items
  const inlineNames = useMemo<InlineNames>(() => {
    const names = new Map<string, LocalizedNames>();
    if (currentKitFile) {
      for (const item of currentKitFile.items) {
        if (!item.i18nKey && item.names) {
          names.set(item.id, item.names);
        }
      }
    }
    return names;
  }, [currentKitFile]);

  // Convert current kit items to RecommendedItemDefinition format
  const recommendedItems = useMemo<RecommendedItemDefinition[]>(() => {
    if (!currentKitFile) {
      // Fallback to default kit if current is not found
      return convertToRecommendedItemDefinitions(
        BUILT_IN_KITS[DEFAULT_KIT_ID].items,
      );
    }
    return convertToRecommendedItemDefinitions(currentKitFile.items);
  }, [currentKitFile]);

  // Build list of all available kits (name/description from kit file, resolved for current language with English fallback)
  const availableKits = useMemo<KitInfo[]>(() => {
    const lang = i18n?.language ?? 'en';
    const builtInInfos = getBuiltInKitInfos(lang);
    const customInfos: KitInfo[] = uploadedKits.map((kit) => ({
      id: createCustomKitId(kit.id),
      name: getLocalizedKitMetaString(kit.file.meta.name, lang),
      description: getLocalizedKitMetaString(kit.file.meta.description, lang),
      itemCount: kit.file.items.length,
      isBuiltIn: false,
      uploadedAt: kit.uploadedAt,
    }));
    return [...builtInInfos, ...customInfos];
  }, [uploadedKits, i18n?.language]);

  // Legacy: custom recommendations info (for backward compatibility)
  const customRecommendationsInfo = useMemo(() => {
    if (!isCustomKitId(selectedKitId) || !currentKitFile) {
      return undefined;
    }
    return {
      name: getLocalizedKitMetaString(
        currentKitFile.meta.name,
        i18n?.language ?? 'en',
      ),
      version: currentKitFile.meta.version,
      itemCount: currentKitFile.items.length,
    };
  }, [selectedKitId, currentKitFile, i18n?.language]);

  // Guard against stale custom kit selection
  // Note: Stale kit validation is handled during initialization in useState
  const isUsingCustomRecommendations =
    isCustomKitId(selectedKitId) && !!currentKitFile;

  // Track previous kit ID to detect actual kit changes
  const previousKitIdRef = useRef<KitId>(selectedKitId);

  // Save to localStorage when kit selection or uploaded kits change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const data = getAppData() || createDefaultAppData();
    data.selectedRecommendationKit = selectedKitId;
    data.uploadedRecommendationKits = uploadedKits;
    // When the active kit actually changes (not on unrelated kit uploads):
    // - Clear disabled recommended items (IDs may not exist in new kit)
    // - Apply kit's disabledCategories (if any)
    // - Apply kit's custom categories (if any)
    if (previousKitIdRef.current !== selectedKitId) {
      data.disabledRecommendedItems = [];
      // Apply kit's disabledCategories setting (default to empty array if not specified)
      data.disabledCategories = currentKitFile?.disabledCategories ?? [];
      // Apply kit's custom categories (replaces existing custom categories from kits)
      // Keep user-created categories (those without sourceKitId), replace kit-imported ones
      const userCreatedCategories = (data.customCategories || []).filter(
        (c) => !c.sourceKitId,
      );
      const kitCategories = convertImportedCategories(
        currentKitFile?.categories,
        selectedKitId,
      );
      data.customCategories = [...userCreatedCategories, ...kitCategories];
    }
    previousKitIdRef.current = selectedKitId;
    data.lastModified = new Date().toISOString();
    saveAppData(data);

    // Notify other hooks using useLocalStorageSync to refresh their state
    // This ensures InventoryProvider picks up the new categories and disabled categories
    notifyStorageChange();
  }, [selectedKitId, uploadedKits, currentKitFile]);

  // === Kit Selection ===

  const selectKit = useCallback((kitId: KitId) => {
    setSelectedKitId(kitId);
  }, []);

  // === Custom Kit Management ===

  const uploadKit = useCallback(
    (file: RecommendedItemsFile): UploadKitResult => {
      const result = validateRecommendedItemsFile(file);
      if (!result.valid) {
        return result;
      }

      const uuid = generateUuid();
      const newKit: UploadedKit = {
        id: uuid,
        file,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedKits((prev) => [...prev, newKit]);

      return {
        ...result,
        kitId: createCustomKitId(uuid),
      };
    },
    [],
  );

  const deleteKit = useCallback(
    (kitId: `custom:${string}`) => {
      const uuid = getCustomKitUuid(kitId);
      setUploadedKits((prev) => prev.filter((k) => k.id !== uuid));

      // If we're deleting the currently selected kit, switch to default
      if (selectedKitId === kitId) {
        setSelectedKitId(DEFAULT_KIT_ID);
      }
    },
    [selectedKitId],
  );

  const forkBuiltInKit = useCallback((): KitId | undefined => {
    // Only fork if current kit is built-in
    if (!selectedKitId || isCustomKitId(selectedKitId)) {
      return selectedKitId;
    }

    // Get the current built-in kit data
    if (!currentKitFile) {
      return undefined;
    }

    // Create a new custom kit preserving the original name
    // The forkedFrom field indicates this was forked from a built-in kit
    // Display components can add localized suffixes when rendering
    const forkedFile: RecommendedItemsFile = {
      meta: {
        ...currentKitFile.meta,
        createdAt: new Date().toISOString(),
        forkedFrom: selectedKitId,
      },
      items: [...currentKitFile.items],
    };

    // Upload as a new custom kit
    const result = uploadKit(forkedFile);
    if (result.valid && result.kitId) {
      // Auto-select the new forked kit
      setSelectedKitId(result.kitId);
      return result.kitId;
    }

    return undefined;
  }, [selectedKitId, currentKitFile, uploadKit]);

  // === Kit Editing (only for custom kits) ===

  const updateCurrentKitMeta = useCallback(
    (updates: Partial<RecommendedItemsFile['meta']>) => {
      if (!isCustomKitId(selectedKitId)) {
        console.warn('Cannot edit built-in kit metadata');
        return;
      }

      const uuid = getCustomKitUuid(selectedKitId);
      setUploadedKits((prev) =>
        prev.map((kit) =>
          kit.id === uuid
            ? {
                ...kit,
                file: {
                  ...kit.file,
                  meta: { ...kit.file.meta, ...updates },
                },
              }
            : kit,
        ),
      );
    },
    [selectedKitId],
  );

  const addItemToKit = useCallback(
    (item: ImportedRecommendedItem) => {
      if (!isCustomKitId(selectedKitId)) {
        console.warn('Cannot add items to built-in kit');
        return;
      }

      const uuid = getCustomKitUuid(selectedKitId);
      const addItem = (items: ImportedRecommendedItem[]) => [...items, item];
      setUploadedKits((prev) =>
        prev.map((kit) => updateKitItems(kit, uuid, addItem)),
      );
    },
    [selectedKitId],
  );

  const updateItemInKit = useCallback(
    (itemId: string, updates: Partial<ImportedRecommendedItem>) => {
      if (!isCustomKitId(selectedKitId)) {
        console.warn('Cannot edit items in built-in kit');
        return;
      }

      const uuid = getCustomKitUuid(selectedKitId);
      const updateItem = (items: ImportedRecommendedItem[]) =>
        items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
      setUploadedKits((prev) =>
        prev.map((kit) => updateKitItems(kit, uuid, updateItem)),
      );
    },
    [selectedKitId],
  );

  const removeItemFromKit = useCallback(
    (itemId: string) => {
      if (!isCustomKitId(selectedKitId)) {
        console.warn('Cannot remove items from built-in kit');
        return;
      }

      const uuid = getCustomKitUuid(selectedKitId);
      const removeItem = (items: ImportedRecommendedItem[]) =>
        items.filter((i) => i.id !== itemId);
      setUploadedKits((prev) =>
        prev.map((kit) => updateKitItems(kit, uuid, removeItem)),
      );
    },
    [selectedKitId],
  );

  // === Export ===

  const exportRecommendedItems = useCallback((): RecommendedItemsFile => {
    if (currentKitFile) {
      return currentKitFile;
    }

    // Fallback to default kit
    return BUILT_IN_KITS[DEFAULT_KIT_ID];
  }, [currentKitFile]);

  // === Legacy Methods (backward compatibility) ===

  const importRecommendedItems = useCallback(
    (file: RecommendedItemsFile): ValidationResult => {
      const result = uploadKit(file);
      if (result.valid && result.kitId) {
        // Auto-select the imported kit (kitId is already a full KitId)
        setSelectedKitId(result.kitId);
      }
      return result;
    },
    [uploadKit],
  );

  const resetToDefaultRecommendations = useCallback(() => {
    setSelectedKitId(DEFAULT_KIT_ID);
  }, []);

  // === Helper Functions ===

  const getItemName = useCallback(
    (
      item: RecommendedItemDefinition | ImportedRecommendedItem,
      language: string,
    ): string => {
      const importedItem = item as ImportedRecommendedItem;

      // Check if this is a custom item with inline names (from stored state)
      if (inlineNames.has(item.id)) {
        const names = inlineNames.get(item.id)!;
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
        // Current items
        recommendedItems,

        // Kit selection
        availableKits,
        selectedKitId,
        selectKit,

        // Custom kit management
        uploadKit,
        deleteKit,
        forkBuiltInKit,

        // Kit editing
        updateCurrentKitMeta,
        addItemToKit,
        updateItemInKit,
        removeItemFromKit,

        // Export
        exportRecommendedItems,

        // Legacy/backward compat
        customRecommendationsInfo,
        isUsingCustomRecommendations,
        importRecommendedItems,
        resetToDefaultRecommendations,

        // Helper
        getItemName,
      }}
    >
      {children}
    </RecommendedItemsContext.Provider>
  );
}
