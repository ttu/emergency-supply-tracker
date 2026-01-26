import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useRecommendedItems } from '@/features/templates';
import { ItemEditor } from '../ItemEditor';
import { formatBaseQuantity } from '@/shared/utils/formatting/baseQuantity';
import type {
  ImportedRecommendedItem,
  RecommendedItemDefinition,
} from '@/shared/types';
import { isCustomKitId } from '@/shared/types';
import styles from './KitEditor.module.css';

export interface KitEditorProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function KitEditor({ isOpen, onClose }: KitEditorProps) {
  const { t, i18n } = useTranslation([
    'common',
    'categories',
    'products',
    'units',
  ]);
  const {
    recommendedItems,
    selectedKitId,
    availableKits,
    addItemToKit,
    updateItemInKit,
    removeItemFromKit,
    getItemName,
    exportRecommendedItems,
    forkBuiltInKit,
  } = useRecommendedItems();

  const [editingItem, setEditingItem] =
    useState<RecommendedItemDefinition | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current kit info
  const currentKit = useMemo(
    () => availableKits.find((kit) => kit.id === selectedKitId),
    [availableKits, selectedKitId],
  );

  // Check if current kit is a built-in kit (will need forking to edit)
  const isBuiltInKit = selectedKitId != null && !isCustomKitId(selectedKitId);

  // Helper to ensure we have an editable kit (forks built-in if needed)
  const ensureEditableKit = useCallback((): boolean => {
    if (!selectedKitId) return false;
    if (isCustomKitId(selectedKitId)) return true;
    // Fork the built-in kit to create an editable copy
    const newKitId = forkBuiltInKit();
    return newKitId !== null;
  }, [selectedKitId, forkBuiltInKit]);

  // Get existing IDs for validation
  const existingIds = useMemo(
    () => new Set(recommendedItems.map((item) => item.id)),
    [recommendedItems],
  );

  // Helper to get item display name using translations for built-in items
  const getItemDisplayName = useCallback(
    (item: RecommendedItemDefinition): string => {
      // For items with i18nKey in the "products." namespace, use translation
      if (item.i18nKey?.startsWith('products.')) {
        // Extract key after "products." prefix to use with namespace
        const key = item.i18nKey.substring('products.'.length);
        return t(key, { ns: 'products' });
      }
      // Fall back to getItemName for custom items or missing keys
      return getItemName(item, i18n.language);
    },
    [getItemName, i18n.language, t],
  );

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return recommendedItems;
    }
    const query = searchQuery.toLowerCase();
    return recommendedItems.filter((item) => {
      const name = getItemDisplayName(item);
      return name.toLowerCase().includes(query);
    });
  }, [recommendedItems, searchQuery, getItemDisplayName]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, typeof filteredItems>,
    );
  }, [filteredItems]);

  const handleAddItem = useCallback(() => {
    if (!ensureEditableKit()) return;
    setIsAddingItem(true);
    setEditingItem(null);
  }, [ensureEditableKit]);

  const handleEditItem = useCallback(
    (item: RecommendedItemDefinition) => {
      if (!ensureEditableKit()) return;
      setEditingItem(item);
      setIsAddingItem(false);
    },
    [ensureEditableKit],
  );

  const handleSaveItem = useCallback(
    (item: ImportedRecommendedItem) => {
      if (isAddingItem) {
        addItemToKit(item);
      } else if (editingItem) {
        updateItemInKit(editingItem.id, item);
      }
      setEditingItem(null);
      setIsAddingItem(false);
    },
    [isAddingItem, editingItem, addItemToKit, updateItemInKit],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
    setIsAddingItem(false);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    setItemToDelete(itemId);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (itemToDelete) {
      if (!ensureEditableKit()) return;
      removeItemFromKit(itemToDelete);
      setItemToDelete(null);
    }
  }, [itemToDelete, removeItemFromKit, ensureEditableKit]);

  const handleCancelDelete = useCallback(() => {
    setItemToDelete(null);
  }, []);

  const itemToDeleteInfo = useMemo(() => {
    if (!itemToDelete) return null;
    return recommendedItems.find((item) => item.id === itemToDelete);
  }, [itemToDelete, recommendedItems]);

  // Helper function to get name/i18nKey for item editor
  const getItemNameOrI18nKey = useCallback(
    (
      originalItem: ImportedRecommendedItem | undefined,
      editingItem: RecommendedItemDefinition,
    ) => {
      // Priority 1: Preserve original item's names if available
      if (originalItem?.names) {
        return { names: originalItem.names };
      }
      // Priority 2: Preserve original item's i18nKey if available
      if (originalItem?.i18nKey) {
        return { i18nKey: originalItem.i18nKey };
      }
      // Priority 3: Preserve editingItem's i18nKey if it exists (for built-in items)
      if (editingItem.i18nKey) {
        return { i18nKey: editingItem.i18nKey };
      }
      // Priority 4: Fallback to display name (for custom items without i18nKey)
      const displayName = getItemDisplayName(editingItem);
      return {
        names: {
          en: displayName,
          fi: displayName,
        },
      };
    },
    [getItemDisplayName],
  );

  // Helper to prepare item for editor
  const prepareItemForEditor = useCallback(():
    | ImportedRecommendedItem
    | undefined => {
    if (!editingItem) return undefined;

    const kitFile = exportRecommendedItems();
    const originalItem = kitFile.items.find(
      (item) => item.id === editingItem.id,
    );

    return {
      id: editingItem.id,
      ...getItemNameOrI18nKey(originalItem, editingItem),
      category: editingItem.category,
      baseQuantity: editingItem.baseQuantity,
      unit: editingItem.unit,
      scaleWithPeople: editingItem.scaleWithPeople,
      scaleWithDays: editingItem.scaleWithDays,
      scaleWithPets: editingItem.scaleWithPets ?? originalItem?.scaleWithPets,
      requiresFreezer: editingItem.requiresFreezer,
      defaultExpirationMonths: editingItem.defaultExpirationMonths,
      weightGramsPerUnit: editingItem.weightGramsPerUnit,
      caloriesPer100g: editingItem.caloriesPer100g,
      capacityMah: editingItem.capacityMah ?? originalItem?.capacityMah,
      capacityWh: editingItem.capacityWh ?? originalItem?.capacityWh,
      requiresWaterLiters:
        editingItem.requiresWaterLiters ?? originalItem?.requiresWaterLiters,
    };
  }, [editingItem, exportRecommendedItems, getItemNameOrI18nKey]);

  // Render item editor modal
  const renderItemEditor = () => {
    const itemForEditor = prepareItemForEditor();

    return (
      <div className={styles.overlay} data-testid="kit-editor-modal">
        <div className={styles.modal}>
          <ItemEditor
            item={itemForEditor}
            onSave={handleSaveItem}
            onCancel={handleCancelEdit}
            existingIds={isAddingItem ? existingIds : new Set()}
          />
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  // Show item editor if editing or adding
  if (editingItem || isAddingItem) {
    return renderItemEditor();
  }

  return (
    <div className={styles.overlay} data-testid="kit-editor-modal">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{t('kitEditor.title')}</h2>
            {currentKit && (
              <p className={styles.subtitle}>
                {currentKit.name} ({recommendedItems.length}{' '}
                {t('kitEditor.items')})
              </p>
            )}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('actions.close')}
            data-testid="kit-editor-close"
          >
            &times;
          </button>
        </div>

        <div className={styles.toolbar}>
          <input
            type="text"
            id="kit-editor-search-input"
            className={styles.searchInput}
            placeholder={t('kitEditor.searchPlaceholder')}
            aria-label={t('kitEditor.searchLabel')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="kit-editor-search"
          />
          <Button
            variant="primary"
            onClick={handleAddItem}
            data-testid="kit-editor-add-item"
          >
            {t('kitEditor.addItem')}
          </Button>
        </div>

        {isBuiltInKit && (
          <div className={styles.notice} data-testid="kit-editor-fork-notice">
            <p>{t('kitEditor.forkNotice')}</p>
          </div>
        )}

        <div className={styles.content}>
          {Object.entries(itemsByCategory).map(([categoryId, items]) => (
            <div key={categoryId} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>
                {t(categoryId, { ns: 'categories' })}
              </h3>
              <ul className={styles.itemList}>
                {items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>
                        {getItemDisplayName(item)}
                      </span>
                      <span className={styles.itemDetails}>
                        {formatBaseQuantity(
                          item.baseQuantity,
                          t(item.unit, { ns: 'units' }),
                          t('kitEditor.baseQuantityRoundingNote', {
                            value: item.baseQuantity,
                          }),
                          true,
                        )}
                        {item.scaleWithPeople && (
                          <span className={styles.tag}>
                            {t('kitEditor.perPerson')}
                          </span>
                        )}
                        {item.scaleWithDays && (
                          <span className={styles.tag}>
                            {t('kitEditor.perDay')}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => handleEditItem(item)}
                        aria-label={t('actions.edit')}
                        data-testid={`edit-item-${item.id}`}
                      >
                        {t('actions.edit')}
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label={t('actions.delete')}
                        data-testid={`delete-item-${item.id}`}
                      >
                        {t('actions.delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              <p>
                {searchQuery
                  ? t('kitEditor.noSearchResults')
                  : t('kitEditor.noItems')}
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            {t('actions.close')}
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!itemToDelete}
          title={t('kitEditor.deleteItem.title')}
          message={t('kitEditor.deleteItem.message', {
            name: itemToDeleteInfo ? getItemDisplayName(itemToDeleteInfo) : '',
          })}
          confirmLabel={t('kitEditor.deleteItem.confirm')}
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
}
