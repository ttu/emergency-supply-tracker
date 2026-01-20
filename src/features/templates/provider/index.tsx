import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import type {
  RecommendedItemDefinition,
  RecommendedItemsFile,
  ImportedRecommendedItem,
  LocalizedNames,
  KitId,
  KitInfo,
  UploadedKit,
} from '@/shared/types';
import {
  isBuiltInKitId,
  isCustomKitId,
  getCustomKitUuid,
  createCustomKitId,
} from '@/shared/types';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '@/shared/utils/storage/localStorage';
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c: string) => {
      const r = Math.trunc(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
}

export function RecommendedItemsProvider({
  children,
}: {
  children: ReactNode;
}) {
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
  const currentKitFile = useMemo<RecommendedItemsFile | null>(() => {
    if (isBuiltInKitId(selectedKitId)) {
      return getBuiltInKit(selectedKitId);
    }

    if (isCustomKitId(selectedKitId)) {
      const uuid = getCustomKitUuid(selectedKitId);
      const kit = uploadedKits.find((k) => k.id === uuid);
      return kit?.file ?? null;
    }

    return null;
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

  // Build list of all available kits
  const availableKits = useMemo<KitInfo[]>(() => {
    const builtInInfos = getBuiltInKitInfos();
    const customInfos: KitInfo[] = uploadedKits.map((kit) => ({
      id: createCustomKitId(kit.id),
      name: kit.file.meta.name,
      description: kit.file.meta.description,
      itemCount: kit.file.items.length,
      isBuiltIn: false,
      uploadedAt: kit.uploadedAt,
    }));
    return [...builtInInfos, ...customInfos];
  }, [uploadedKits]);

  // Legacy: custom recommendations info (for backward compatibility)
  const customRecommendationsInfo = useMemo(() => {
    if (!isCustomKitId(selectedKitId) || !currentKitFile) {
      return null;
    }
    return {
      name: currentKitFile.meta.name,
      version: currentKitFile.meta.version,
      itemCount: currentKitFile.items.length,
    };
  }, [selectedKitId, currentKitFile]);

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
    // Clear disabled items only when the active kit actually changes (not on unrelated kit uploads)
    if (previousKitIdRef.current !== selectedKitId) {
      data.disabledRecommendedItems = [];
    }
    previousKitIdRef.current = selectedKitId;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [selectedKitId, uploadedKits]);

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
      setUploadedKits((prev) =>
        prev.map((kit) =>
          updateKitItems(kit, uuid, (items) => [...items, item]),
        ),
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
      setUploadedKits((prev) =>
        prev.map((kit) =>
          updateKitItems(kit, uuid, (items) =>
            items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
          ),
        ),
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
      setUploadedKits((prev) =>
        prev.map((kit) =>
          updateKitItems(kit, uuid, (items) =>
            items.filter((i) => i.id !== itemId),
          ),
        ),
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
