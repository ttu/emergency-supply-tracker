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
import styles from './KitEditor.module.css';

export interface KitEditorProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function KitEditor({ isOpen, onClose }: KitEditorProps) {
  const { t, i18n } = useTranslation(['common', 'categories', 'products']);
  const {
    recommendedItems,
    selectedKitId,
    availableKits,
    addItemToKit,
    updateItemInKit,
    removeItemFromKit,
    getItemName,
    exportRecommendedItems,
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

  // Check if current kit is editable (only custom kits can be edited)
  const isEditable = selectedKitId?.startsWith('custom:') ?? false;

  // Get existing IDs for validation
  const existingIds = useMemo(
    () => new Set(recommendedItems.map((item) => item.id)),
    [recommendedItems],
  );

  // Helper to get item display name using context's getItemName
  const getItemDisplayName = useCallback(
    (item: RecommendedItemDefinition): string => {
      return getItemName(item, i18n.language);
    },
    [getItemName, i18n.language],
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
    setIsAddingItem(true);
    setEditingItem(null);
  }, []);

  const handleEditItem = useCallback((item: RecommendedItemDefinition) => {
    setEditingItem(item);
    setIsAddingItem(false);
  }, []);

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
      removeItemFromKit(itemToDelete);
      setItemToDelete(null);
    }
  }, [itemToDelete, removeItemFromKit]);

  const handleCancelDelete = useCallback(() => {
    setItemToDelete(null);
  }, []);

  const itemToDeleteInfo = useMemo(() => {
    if (!itemToDelete) return null;
    return recommendedItems.find((item) => item.id === itemToDelete);
  }, [itemToDelete, recommendedItems]);

  if (!isOpen) {
    return null;
  }

  // Show item editor if editing or adding
  if (editingItem || isAddingItem) {
    // Get the original item from kit file to preserve names/i18nKey
    const kitFile = exportRecommendedItems();
    const originalItem = editingItem
      ? kitFile.items.find((item) => item.id === editingItem.id)
      : undefined;

    // Convert to ImportedRecommendedItem format for editor, preserving original names
    const itemForEditor: ImportedRecommendedItem | undefined = editingItem
      ? {
          id: editingItem.id,
          // Preserve original names/i18nKey from the kit file
          ...(originalItem?.names
            ? { names: originalItem.names }
            : originalItem?.i18nKey
              ? { i18nKey: originalItem.i18nKey }
              : {
                  names: {
                    en: getItemDisplayName(editingItem),
                    fi: getItemDisplayName(editingItem),
                  },
                }),
          category: editingItem.category,
          baseQuantity: editingItem.baseQuantity,
          unit: editingItem.unit,
          scaleWithPeople: editingItem.scaleWithPeople,
          scaleWithDays: editingItem.scaleWithDays,
          requiresFreezer: editingItem.requiresFreezer,
          defaultExpirationMonths: editingItem.defaultExpirationMonths,
          weightGramsPerUnit: editingItem.weightGramsPerUnit,
          caloriesPer100g: editingItem.caloriesPer100g,
        }
      : undefined;

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
            className={styles.searchInput}
            placeholder={t('kitEditor.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="kit-editor-search"
          />
          {isEditable && (
            <Button
              variant="primary"
              onClick={handleAddItem}
              data-testid="kit-editor-add-item"
            >
              {t('kitEditor.addItem')}
            </Button>
          )}
        </div>

        {!isEditable && (
          <div className={styles.notice}>
            <p>{t('kitEditor.builtInNotice')}</p>
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
                    {isEditable && (
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
                    )}
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
