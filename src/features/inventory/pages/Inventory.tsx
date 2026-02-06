import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useHousehold } from '@/features/household';
import {
  useInventory,
  FilterBar,
  ItemList,
  ItemForm,
  CategoryStatusSummary,
} from '@/features/inventory';
import { calculateItemStatus } from '@/shared/utils/calculations/itemStatus';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import { useRecommendedItems, TemplateSelector } from '@/features/templates';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import confirmDialogStyles from '@/shared/components/ConfirmDialog.module.css';
import { SideMenu, SideMenuItem } from '@/shared/components/SideMenu';
import {
  createItemId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import type {
  InventoryItem,
  ItemStatus,
  RecommendedItemDefinition,
  StandardCategoryId,
  ProductTemplate,
} from '@/shared/types';
import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';
import { useCategoryStatuses } from '@/features/dashboard/hooks/useCategoryStatuses';
import { useCalculationOptions } from '@/features/dashboard/hooks/useCalculationOptions';
import styles from './Inventory.module.css';

type SortBy = 'name' | 'quantity' | 'expiration';

export interface InventoryProps {
  openAddModal?: boolean;
  selectedCategoryId?: string;
  onCategoryChange?: (categoryId: string | undefined) => void;
}

export function Inventory({
  openAddModal = false,
  selectedCategoryId: controlledCategoryId,
  onCategoryChange,
}: InventoryProps = {}) {
  const { t, i18n } = useTranslation(['common', 'products']);
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    deleteItems,
    disableRecommendedItem,
    disabledCategories,
    disableCategory,
    customCategories,
    customTemplates,
    addCustomTemplate,
  } = useInventory();
  const { household } = useHousehold();
  const { recommendedItems, getItemName } = useRecommendedItems();

  // Use shared hook for category statuses (reuses same calculation as Dashboard)
  const { categoryStatuses } = useCategoryStatuses();
  const calculationOptions = useCalculationOptions();

  // Filter out disabled standard categories and include all custom categories
  const enabledCategories = useMemo(
    () => [
      ...STANDARD_CATEGORIES.filter(
        (category) =>
          !disabledCategories.includes(category.id as StandardCategoryId),
      ),
      ...customCategories, // Custom categories are always enabled
    ],
    [disabledCategories, customCategories],
  );

  // Combine standard and custom categories for the item form
  const allCategories = useMemo(
    () => [...STANDARD_CATEGORIES, ...customCategories],
    [customCategories],
  );

  // Filter out recommended items with 0 quantity (e.g., pet items when pets = 0)
  const applicableRecommendedItems = useMemo(() => {
    return recommendedItems.filter((item) => {
      const qty = calculateRecommendedQuantity(
        item,
        household,
        calculationOptions.childrenMultiplier,
      );
      return qty > 0;
    });
  }, [recommendedItems, household, calculationOptions.childrenMultiplier]);

  // Filter and sort state - use controlled state if provided, otherwise local state
  const [localCategoryId, setLocalCategoryId] = useState<string | undefined>(
    controlledCategoryId,
  );

  // Use controlled value if callback is provided, otherwise use local state
  const selectedCategoryId = onCategoryChange
    ? controlledCategoryId
    : localCategoryId;

  const handleCategoryChange = useCallback(
    (categoryId: string | undefined) => {
      if (onCategoryChange) {
        onCategoryChange(categoryId);
      } else {
        setLocalCategoryId(categoryId);
      }
    },
    [onCategoryChange],
  );

  // Items with 0 quantity (respecting current category filter)
  const zeroQuantityItems = useMemo(() => {
    let result = items.filter((item) => item.quantity === 0);
    if (selectedCategoryId) {
      result = result.filter((item) => item.categoryId === selectedCategoryId);
    }
    return result;
  }, [items, selectedCategoryId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(openAddModal);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(
    undefined,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<
    RecommendedItemDefinition | undefined
  >(undefined);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<
    ProductTemplate | undefined
  >(undefined);

  // Add/Edit form: dirty state and unsaved-changes dialog
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const itemFormRef = useRef<HTMLFormElement>(null);
  const pendingDiscardActionRef = useRef<(() => void) | null>(null);

  // Clear editing item and template selection (shared by form close and custom-item open)
  const resetEditingAndTemplateState = useCallback(() => {
    setEditingItem(undefined);
    setSelectedTemplate(undefined);
    setSelectedCustomTemplate(undefined);
  }, []);

  // Reset add/edit form and modal state (shared by cancel, submit, back)
  const resetAddFormState = useCallback(() => {
    setIsFormDirty(false);
    setShowAddModal(false);
    resetEditingAndTemplateState();
  }, [resetEditingAndTemplateState]);

  // Get category status for selected category from shared hook
  const categoryStatus = useMemo(() => {
    if (!selectedCategoryId) return undefined;
    return categoryStatuses.find((cs) => cs.categoryId === selectedCategoryId);
  }, [selectedCategoryId, categoryStatuses]);

  // Filter and sort items - memoized to prevent unnecessary re-renders
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((item) => item.categoryId === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((item) => {
        const recommendedQuantity = getRecommendedQuantityForItem(
          item,
          household,
          recommendedItems,
          calculationOptions.childrenMultiplier,
        );
        const status = calculateItemStatus(item, recommendedQuantity);
        return status === statusFilter;
      });
    }

    // Sort items
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'expiration':
          if (a.neverExpires && b.neverExpires) return 0;
          if (a.neverExpires) return 1;
          if (b.neverExpires) return -1;
          // Compare date-only strings directly to avoid timezone issues
          // Date-only strings (YYYY-MM-DD) can be compared lexicographically
          return (a.expirationDate || '').localeCompare(b.expirationDate || '');
        default:
          return 0;
      }
    });
  }, [
    items,
    selectedCategoryId,
    searchQuery,
    statusFilter,
    sortBy,
    household,
    recommendedItems,
    calculationOptions.childrenMultiplier,
  ]);

  const handleAddItem = (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
    saveAsTemplate?: boolean,
  ) => {
    addItem(itemData);

    // If user checked "Save as Template", also create a custom template
    if (saveAsTemplate && itemData.name) {
      addCustomTemplate({
        name: itemData.name,
        category: itemData.categoryId,
        defaultUnit: itemData.unit,
        neverExpires: itemData.neverExpires,
        weightGrams: itemData.weightGrams,
        caloriesPerUnit: itemData.caloriesPerUnit,
        requiresWaterLiters: itemData.requiresWaterLiters,
      });
    }

    resetAddFormState();
  };

  const handleUpdateItem = (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editingItem) {
      updateItem(editingItem.id, itemData);
      resetAddFormState();
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (globalThis.confirm(t('inventory.confirmDelete'))) {
      deleteItem(createItemId(itemId));
      resetAddFormState();
    }
  };

  const handleMarkAsEnough = useCallback(
    (itemId: string) => {
      updateItem(createItemId(itemId), { markedAsEnough: true });
    },
    [updateItem],
  );

  const handleEditItem = useCallback(
    (item: InventoryItem) => {
      setEditingItem(item);
      setSelectedCustomTemplate(undefined);
      // If item has a template, set it so weight/calorie calculations work
      if (item.itemType && item.itemType !== 'custom') {
        const template = recommendedItems.find((t) => t.id === item.itemType);
        setSelectedTemplate(template);
      } else {
        setSelectedTemplate(undefined);
      }
      setShowAddModal(true);
    },
    [recommendedItems],
  );

  const handleCopyItem = () => {
    if (editingItem) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...itemData } = editingItem;
      setEditingItem(itemData as InventoryItem);
    }
  };

  const handleSelectTemplate = useCallback(
    (template: RecommendedItemDefinition) => {
      // For custom items (i18nKey starts with 'custom.'), use getItemName; otherwise translate
      const templateName = template.i18nKey.startsWith('custom.')
        ? getItemName(template, i18n.language)
        : t(template.i18nKey.replace('products.', ''), { ns: 'products' });

      // Create draft item from template for form initialization
      // Draft items have empty id/timestamps so form treats them as new items
      const draftItem = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
        {
          name: templateName,
          quantity: createQuantity(0),
        },
      );

      setSelectedTemplate(template);
      setSelectedCustomTemplate(undefined);
      setEditingItem(draftItem);
      setShowTemplateModal(false);
      setShowAddModal(true);
    },
    [household, t, getItemName, i18n.language],
  );

  const handleCancelForm = () => {
    resetAddFormState();
  };

  const handleBackToTemplateSelector = () => {
    resetAddFormState();
    setShowTemplateModal(true);
  };

  const handleRequestClose = useCallback(
    (discardAction: () => void) => {
      if (isFormDirty) {
        pendingDiscardActionRef.current = discardAction;
        setShowUnsavedConfirm(true);
      } else {
        discardAction();
      }
    },
    [isFormDirty],
  );

  const handleUnsavedSave = useCallback(() => {
    setShowUnsavedConfirm(false);
    pendingDiscardActionRef.current = null;
    itemFormRef.current?.requestSubmit();
  }, []);

  const handleUnsavedDiscard = useCallback(() => {
    pendingDiscardActionRef.current?.();
    pendingDiscardActionRef.current = null;
    setShowUnsavedConfirm(false);
  }, []);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedConfirm(false);
    pendingDiscardActionRef.current = null;
  }, []);

  const unsavedDialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (showUnsavedConfirm) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const firstButton = unsavedDialogRef.current?.querySelector('button');
      firstButton?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [showUnsavedConfirm]);

  useEffect(() => {
    if (!showUnsavedConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleUnsavedCancel();
      } else if (e.key === 'Tab' && unsavedDialogRef.current) {
        const focusableElements =
          unsavedDialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showUnsavedConfirm, handleUnsavedCancel]);

  const handleSelectCustomItem = () => {
    setShowTemplateModal(false);
    setShowAddModal(true);
    resetEditingAndTemplateState();
  };

  const handleSelectCustomTemplate = useCallback(
    (template: ProductTemplate) => {
      const draftItem = InventoryItemFactory.createDraftFromCustomTemplate(
        template,
        { quantity: 0 },
      );
      setSelectedTemplate(undefined);
      setSelectedCustomTemplate(template);
      setEditingItem(draftItem);
      setShowTemplateModal(false);
      setShowAddModal(true);
    },
    [],
  );

  // Handler for adding a recommended item to inventory from status summary
  const handleAddRecommendedToInventory = useCallback(
    (itemId: string) => {
      const template = recommendedItems.find((rec) => rec.id === itemId);
      if (template) {
        handleSelectTemplate(template);
      }
    },
    [handleSelectTemplate, recommendedItems],
  );

  // Handler for disabling a recommended item
  const handleDisableRecommendedItem = useCallback(
    (itemId: string) => {
      disableRecommendedItem(createProductTemplateId(itemId));
    },
    [disableRecommendedItem],
  );

  // Handler for disabling a category
  const handleDisableCategory = useCallback(() => {
    if (selectedCategoryId) {
      disableCategory(selectedCategoryId as StandardCategoryId);
      // Clear the selected category after disabling
      handleCategoryChange(undefined);
    }
  }, [selectedCategoryId, disableCategory, handleCategoryChange]);

  // Handler for removing all items with 0 quantity
  const handleRemoveEmptyItems = useCallback(() => {
    if (zeroQuantityItems.length === 0) return;
    if (
      globalThis.confirm(
        t('inventory.confirmRemoveEmpty', { count: zeroQuantityItems.length }),
      )
    ) {
      deleteItems(zeroQuantityItems.map((item) => item.id));
    }
  }, [zeroQuantityItems, deleteItems, t]);

  // Resolver for custom item names in CategoryStatusSummary
  const resolveItemName = useCallback(
    (itemId: string, i18nKey: string): string | undefined => {
      // Only resolve custom items (i18nKey starts with 'custom.')
      if (!i18nKey.startsWith('custom.')) {
        return undefined; // Let the component use translation
      }
      const item = recommendedItems.find((rec) => rec.id === itemId);
      if (item) {
        return getItemName(item, i18n.language);
      }
      return undefined;
    },
    [recommendedItems, getItemName, i18n.language],
  );

  // Convert categories to SideMenu items (only enabled categories)
  const categoryMenuItems: SideMenuItem[] = useMemo(() => {
    const currentLang = i18n.language as 'en' | 'fi';
    return enabledCategories.map((category) => {
      // Custom categories have names object, standard categories use translations
      const label =
        category.names && (category.names[currentLang] || category.names.en)
          ? category.names[currentLang] || category.names.en
          : t(category.id, { ns: 'categories' });
      return {
        id: category.id,
        label,
        icon: category.icon,
      };
    });
  }, [enabledCategories, t, i18n.language]);

  // Memoize the "All Categories" option for SideMenu
  const showAllOption: SideMenuItem = useMemo(
    () => ({
      id: 'all',
      label: t('inventory.allCategories'),
      icon: '📦',
    }),
    [t],
  );

  const handleSideMenuCategoryChange = useCallback(
    (id: string) => {
      // If 'all' is selected, clear the category filter
      handleCategoryChange(id === 'all' ? undefined : id);
    },
    [handleCategoryChange],
  );

  // Use callback ref to get the hamburger container element (triggers re-render when set)
  const [hamburgerContainer, setHamburgerContainer] =
    useState<HTMLDivElement | null>(null);

  return (
    <div className={styles.container} data-testid="page-inventory">
      <header className={styles.header}>
        <h1>{t('navigation.inventory')}</h1>
        <div
          className={styles.hamburgerContainer}
          ref={setHamburgerContainer}
        />
      </header>

      <div className={styles.addItemRow}>
        <Button
          variant="primary"
          onClick={() => setShowTemplateModal(true)}
          data-testid="add-item-button"
        >
          {t('inventory.addFromTemplate')}
        </Button>
        {zeroQuantityItems.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleRemoveEmptyItems}
            data-testid="remove-empty-items-button"
          >
            {t('inventory.removeEmptyItems')}
          </Button>
        )}
      </div>

      <div className={styles.layout}>
        <SideMenu
          items={categoryMenuItems}
          selectedId={selectedCategoryId || 'all'}
          onSelect={handleSideMenuCategoryChange}
          ariaLabel={t('accessibility.categoryNavigation')}
          showAllOption={showAllOption}
          hamburgerContainer={hamburgerContainer}
        />

        <div className={styles.main}>
          <div className={styles.filters}>
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
            />
          </div>

          <div className={styles.content}>
            {selectedCategoryId && categoryStatus && (
              <div className={styles.categoryHeader}>
                <CategoryStatusSummary
                  categoryId={selectedCategoryId}
                  status={categoryStatus.status}
                  completionPercentage={categoryStatus.completionPercentage}
                  totalActual={categoryStatus.totalActual}
                  totalNeeded={categoryStatus.totalNeeded}
                  primaryUnit={categoryStatus.primaryUnit}
                  shortages={categoryStatus.shortages}
                  totalActualCalories={categoryStatus.totalActualCalories}
                  totalNeededCalories={categoryStatus.totalNeededCalories}
                  missingCalories={categoryStatus.missingCalories}
                  drinkingWaterNeeded={categoryStatus.drinkingWaterNeeded}
                  preparationWaterNeeded={categoryStatus.preparationWaterNeeded}
                  onAddToInventory={handleAddRecommendedToInventory}
                  onDisableRecommended={handleDisableRecommendedItem}
                  onMarkAsEnough={handleMarkAsEnough}
                  items={items}
                  resolveItemName={resolveItemName}
                />
                <div className={styles.categoryActions}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleDisableCategory}
                    data-testid="disable-category-button"
                  >
                    {t('inventory.disableCategory')}
                  </Button>
                </div>
              </div>
            )}
            <ItemList items={filteredItems} onItemClick={handleEditItem} />
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => handleRequestClose(handleCancelForm)}
          onBack={
            editingItem?.id
              ? undefined
              : () => handleRequestClose(handleBackToTemplateSelector)
          }
          title={
            editingItem?.id ? t('inventory.editItem') : t('inventory.addItem')
          }
        >
          <ItemForm
            item={editingItem}
            categories={allCategories}
            onSubmit={editingItem?.id ? handleUpdateItem : handleAddItem}
            onCancel={() => handleRequestClose(handleCancelForm)}
            onDirtyChange={setIsFormDirty}
            formRef={itemFormRef}
            defaultCategoryId={selectedCategoryId}
            templateWeightGramsPerUnit={
              selectedTemplate?.weightGramsPerUnit ??
              selectedCustomTemplate?.weightGrams
            }
            templateCaloriesPer100g={
              selectedTemplate?.caloriesPer100g ??
              selectedCustomTemplate?.caloriesPer100g
            }
            templateRequiresWaterLiters={
              selectedTemplate?.requiresWaterLiters ??
              selectedCustomTemplate?.requiresWaterLiters
            }
          />
          {editingItem?.id && (
            <div className={styles.deleteSection}>
              <Button
                variant="secondary"
                onClick={handleCopyItem}
                data-testid="copy-item-button"
              >
                {t('common.copy')}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteItem(editingItem.id)}
                data-testid="delete-item-button"
              >
                {t('common.delete')}
              </Button>
            </div>
          )}
        </Modal>
      )}

      {/* Unsaved changes confirmation (when closing add/edit via X or back with dirty form) */}
      {showUnsavedConfirm &&
        createPortal(
          <div
            className={confirmDialogStyles.overlay}
            role="button"
            tabIndex={0}
            aria-label={t('accessibility.closeModal')}
            onClick={handleUnsavedCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUnsavedCancel();
              }
            }}
            data-testid="unsaved-changes-overlay"
          >
            <div
              ref={unsavedDialogRef}
              className={confirmDialogStyles.dialog}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="unsaved-changes-dialog-title"
              aria-describedby="unsaved-changes-dialog-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="unsaved-changes-dialog-title"
                className={confirmDialogStyles.title}
              >
                {t('inventory.unsavedChanges.title')}
              </h2>
              <p
                id="unsaved-changes-dialog-desc"
                className={confirmDialogStyles.message}
              >
                {t('inventory.unsavedChanges.message')}
              </p>
              <div className={confirmDialogStyles.actions}>
                <Button
                  variant="secondary"
                  onClick={handleUnsavedCancel}
                  type="button"
                  data-testid="unsaved-changes-cancel"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleUnsavedDiscard}
                  type="button"
                  data-testid="unsaved-changes-dont-save"
                >
                  {t('inventory.unsavedChanges.dontSave')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUnsavedSave}
                  type="button"
                  data-testid="unsaved-changes-save"
                >
                  {t('inventory.unsavedChanges.save')}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Template Selector Modal */}
      {showTemplateModal && (
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title={t('inventory.selectTemplate')}
        >
          <TemplateSelector
            templates={applicableRecommendedItems}
            categories={allCategories}
            onSelectTemplate={handleSelectTemplate}
            onSelectCustom={handleSelectCustomItem}
            initialCategoryId={selectedCategoryId || ''}
            customTemplates={customTemplates}
            onSelectCustomTemplate={handleSelectCustomTemplate}
          />
        </Modal>
      )}
    </div>
  );
}
